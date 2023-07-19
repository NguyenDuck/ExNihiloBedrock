// 1.20.10
import {
    world,
    Block,
    MinecraftBlockTypes,
    ItemStack,
    Entity,
    ItemTypes,
    EntityMarkVariantComponent,
    system,
    Vector,
    Player
} from "@minecraft/server";
import BlockEntity from "./block_entity";
import {
    playSoundAt,
    prefix,
    getEntityInventory,
    splitNamespace,
    logerr,
    clearInventory
} from "../utils";
import BarrelEntity from "../entity/barrel";
import BlockBase from "./block_base";

const scName = "en:bc";

export default class Barrel extends BlockEntity {
    static readonly NAMESPACE = prefix("barrel");

    declare public blockEntity: BarrelEntity;

    static Registry(): void {
        BlockBase.setNonPushable(Barrel.NAMESPACE);

        world.afterEvents.itemUseOn.subscribe(({ source, block, itemStack }) => {
            if (source.isSneaking) return;
            if (block.hasTag(Barrel.NAMESPACE)) new Barrel(block).onInteract(itemStack, source);
        })

        system.runInterval(() => {
            let scoreboard = world.scoreboard.getObjective(scName);
            if (!scoreboard) return;
            scoreboard.getParticipants().forEach(identity => {
                try {
                    let entity = identity.getEntity();
                    (({ x, y, z }) => {
                        let block = entity.dimension.getBlock({ x: x, y: y - 1, z: z });
                        let barrel = new Barrel(block, entity);

                        if (!barrel.isFull()) {
                            if (barrel.isRaining() && barrel.isWaterDropable()) {
                                if (barrel.isEmpty()) {
                                    barrel.setFluidWater();
                                    barrel.addStage(1);
                                } else if (barrel.isFluidWater()) {
                                    barrel.addStage(1);
                                }
                            }
                        }
                    }).call(this, entity.location);
                } catch (e) { }
            })
        }, 2)

        system.afterEvents.scriptEventReceive.subscribe(({ id, message, sourceEntity, sourceBlock }) => {
            if (id != prefix("barrel_trigger")) return;
            try {
                if (sourceEntity) switch (message) {
                    case "transformToDirt":
                        (({ x, y, z }) => {
                            let block = sourceEntity.dimension.getBlock({ x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) });
                            if (!block.hasTag(prefix("barrel"))) return;
                            let barrel = new Barrel(block);
                            barrel.setBlockDirt();
                        }).call(this, sourceEntity.location);
                        break;
                };
                if (sourceBlock) {
                    let barrel = new Barrel(sourceBlock);
                    if (barrel.isFull()) {
                        switch (message) {
                            case "tryTransformWaterToCobblestone":
                                if (barrel.isFluidWater() && barrel.isLavaOnTop()) {
                                    barrel.setBlockCobblestone();
                                    playSoundAt(`random.fizz`, barrel.location, barrel.dimension, { volume: 0.7, pitch: 1.9 });
                                }
                                break;
                            case "tryTransformLavaToObsidian":
                                if (barrel.isFluidLava() && barrel.isWaterOnTop()) {
                                    barrel.setBlockObsidian();
                                    playSoundAt(`random.fizz`, barrel.location, barrel.dimension, { volume: 0.7, pitch: 1.8 });
                                }
                                break;
                        }
                    }
                };
            } catch (e) { logerr(e) }
        }, { namespaces: ["exnihilo"] })
    }

    constructor(block: Block, entity: Entity = undefined) {
        super(block);
        this.blockEntity = new BarrelEntity(block, entity);
    }

    public onInteract(item: ItemStack, source: Entity) {
        if (this.isBlockMode()) {
            this.spawnItemInBlock();
            return;
        }

        if (this.compost(item.typeId)) {
            item.amount -= 1
            if (item.amount == 0) {
                item = undefined
            }
            getEntityInventory({
                entity: source
            }).setItem((source as Player).selectedSlot, item)
        }

        if (this.isCompostingLeaves() && this.isFull()) {
            let entities = this.block.dimension.getEntitiesAtBlockLocation(this.location);
            for (let e of entities) {
                if (e.typeId == prefix(`barrel_composting_waiter`)) return;
            }
            this.block.dimension.spawnEntity(prefix(`barrel_composting_waiter`), this.location);
        }

        if (!this.isComposting()) {
            let itemstack = splitNamespace(item.typeId);
            let callbackList = {
                minecraft: {
                    water_bucket: () => {
                        if (!this.isEmpty()) return;
                        let playerInventory = getEntityInventory({ entity: source });
                        playerInventory.addItem(new ItemStack(ItemTypes.get("bucket")));
                        this.setFluidWater();
                        this.setStage(1000);
                        playSoundAt("bucket.fill_water", this.block.location, this.dimension);
                        return true;
                    },
                    lava_bucket: () => {
                        if (!this.isEmpty()) return;
                        if (this.block.hasTag(prefix("flameable"))) return;
                        let playerInventory = getEntityInventory({ entity: source });
                        playerInventory.addItem(new ItemStack(ItemTypes.get("bucket")));
                        this.setFluidLava();
                        this.setStage(1000);
                        playSoundAt("bucket.fill_lava", this.block.location, this.dimension);
                        return true;
                    },
                    bucket: () => {
                        if (!this.isFluidMode() || !this.isFull()) return;
                        if (this.isFluidWater()) {
                            let playerInventory = getEntityInventory({ entity: source });
                            playerInventory.addItem(new ItemStack(ItemTypes.get("water_bucket")));
                            this.setEmpty();
                            playSoundAt("bucket.empty_water", this.block.location, this.dimension);
                            return true;
                        } else if (this.isFluidLava()) {
                            let playerInventory = getEntityInventory({ entity: source });
                            playerInventory.addItem(new ItemStack(ItemTypes.get("lava_bucket")));
                            this.setEmpty();
                            playSoundAt("bucket.empty_lava", this.block.location, this.dimension);
                            return true;
                        }
                    },
                    redstone: () => {
                        if (this.isFluidLava() && this.isFull()) {
                            this.setBlockNetherrack();
                            playSoundAt(`random.fizz`, this.location, this.dimension, { volume: 0.7, pitch: 2.1 });
                            return true;
                        }
                    },
                    glowstone_dust: () => {
                        if (this.isFluidLava() && this.isFull()) {
                            this.setBlockEndStone();
                            playSoundAt(`random.fizz`, this.location, this.dimension, { volume: 0.7, pitch: 2.1 });
                            return true;
                        }
                    }
                },
                exnihilo: {
                    dust: () => {
                        if (this.isFluidWater() && this.isFull()) {
                            this.setBlockClay();
                            playSoundAt(`dig.sand`, this.location, this.dimension, { volume: 0.5, pitch: 0.7 });
                            return true;
                        }
                    }
                }
            }

            let nscallback = callbackList[itemstack.first]
            if (!nscallback) return
            let callback = nscallback[itemstack.last]
            if (callback && callback.call(this)) clearInventory({ entity: source })
        }
    }

    public compost(item: string): boolean {
        let amount = 0;
        switch (item) {
            case "exnihilo:silkworm":
            case "exnihilo:cooked_silkworm":

            case "minecraft:melon_slice":
            case "minecraft:string":
                amount = 40;
                break;

            case "minecraft:beetroot_seeds":
            case "minecraft:melon_seeds":
            case "minecraft:pumkin_seeds":
            case "minecraft:wheat_seeds":

            case "minecraft:beetroot":
            case "minecraft:wheat":
            case "minecraft:egg":
            case "minecraft:sugar_cane":

            case "minecraft:spider_eye":
                amount = 80;
                break;

            case "exnihilo:spore_mycelium":
            case "exnihilo:spore_nylium_warped":
            case "exnihilo:spore_nylium_crimson":

            case "exnihilo:seeds_grass":
            case "minecraft:tallgrass":

            case "minecraft:brown_mushroom":
            case "minecraft:red_mushroom":

            case "minecraft:cactus":
            case "minecraft:waterlily":
            case "minecraft:apple":
            case "minecraft:rotten_flesh":
            case "minecraft:nether_wart":

            case "minecraft:carrot":
            case "minecraft:potato":
            case "minecraft:sweet_berries":

            case "minecraft:twisting_vines":
            case "minecraft:weeping_vines":
            case "minecraft:vine":

            case "minecraft:crimson_fungus":
            case "minecraft:warped_fungus":

            case "minecraft:red_flower":
            case "minecraft:yellow_flower":
            case "minecraft:wither_rose":
                amount = 100;
                break;

            case "minecraft:sapling":
            case "minecraft:mangrove_propagule":
            case "minecraft:azalea":
            case "minecraft:flowering_azalea":

            case "minecraft:leaves":
            case "minecraft:leaves2":
            case "minecraft:mangrove_leaves":
            case "minecraft:azalea_leaves":
            case "minecraft:azalea_leaves_flowered":
                amount = 125;
                break;

            case "minecraft:baked_potato":

            case "minecraft:cooked_cod":
            case "minecraft:cooked_salmon":

            case "minecraft:cod":
            case "minecraft:salmon":
            case "minecraft:pufferfish":
            case "minecraft:tropical_fish":
                amount = 150;
                break;

            case "minecraft:pumkin_pie":
            case "minecraft:bread":

                amount = 160;
                break;

            case "minecraft:melon_block":
            case "minecraft:pumkin":
            case "minecraft:carved_pumkin":

            case "minecraft:lit_pumkin":
                amount = 166;
                break;

            case "minecraft:cooked_chicken":
            case "minecraft:cooked_mutton":
            case "minecraft:cooked_porkchop":
            case "minecraft:cooked_rabbit":
            case "minecraft:cooked_beef":

            case "minecraft:poisonous_potato":

            case "minecraft:chicken":
            case "minecraft:mutton":
            case "minecraft:porkchop":
            case "minecraft:rabbit":
            case "minecraft:beef":
                amount = 200;
                break;
        }
        if (amount) {
            if (!this.isComposting() && this.isEmpty()) {
                this.setCompostingLeaves();
                this.setStage(0);
            }
            this.addStage(amount);
            return true;
        }
    }

    private completeSetBlockState() {
        if (this.isBlockMode()) this.setBlockProperties({
            stage_alpha: 7,
            stage_beta: 7
        });
        if (this.isEmpty()) this.setBlockProperties({
            stage_alpha: 0,
            stage_beta: 0
        });
        this.commitSetPermutation();
    }

    public setEmpty() {
        this.setBlockProperties({
            mode: 0,
            type: 0
        });

        this.setStage(0);
    }

    public setFluidWater() {
        this.setBlockProperties({
            mode: 1,
            type: 1
        });
    }

    public setFluidLava() {
        this.setBlockProperties({
            mode: 1,
            type: 2
        });
    }

    public setBlockDirt() {
        this.setBlockProperties({
            mode: 2,
            type: 1,
        });

        this.completeSetBlockState();
    }

    public setBlockClay() {
        this.setBlockProperties({
            mode: 2,
            type: 2
        });

        this.completeSetBlockState();
    }

    public setBlockCobblestone() {
        this.setBlockProperties({
            mode: 2,
            type: 3
        });

        this.completeSetBlockState();
    }

    public setBlockObsidian() {
        this.setBlockProperties({
            mode: 2,
            type: 4
        });

        this.completeSetBlockState();
    }

    public setBlockNetherrack() {
        this.setBlockProperties({
            mode: 2,
            type: 5
        });

        this.completeSetBlockState();
    }

    public setBlockEndStone() {
        this.setBlockProperties({
            mode: 2,
            type: 6
        });

        this.completeSetBlockState();
    }

    public setCompostingLeaves() {
        this.setBlockProperties({
            mode: 3,
            type: 1
        });

        this.completeSetBlockState();
    }

    public isEmpty(): boolean {
        return this.hasBlockProperty({
            mode: 0,
            type: 0
        });
    }

    public isFluidWater(): boolean {
        return this.hasBlockProperty({
            mode: 1,
            type: 1
        });
    }

    public isFluidLava(): boolean {
        return this.hasBlockProperty({
            mode: 1,
            type: 2
        });
    }

    public isBlockDirt(): boolean {
        return this.hasBlockProperty({
            mode: 2,
            type: 1
        });
    }

    public isBlockClay(): boolean {
        return this.hasBlockProperty({
            mode: 2,
            type: 2
        });
    }

    public isBlockCobblestone(): boolean {
        return this.hasBlockProperty({
            mode: 2,
            type: 3
        });
    }

    public isBlockObsidian(): boolean {
        return this.hasBlockProperty({
            mode: 2,
            type: 4
        });
    }

    public isBlockNetherrack(): boolean {
        return this.hasBlockProperty({
            mode: 2,
            type: 5
        });
    }

    public isBlockEndStone(): boolean {
        return this.hasBlockProperty({
            mode: 2,
            type: 6
        });
    }

    public isCompostingLeaves(): boolean {
        return this.hasBlockProperty({
            mode: 3,
            type: 1
        });
    }

    public isComposting(): boolean {
        return this.isCompostingLeaves();
    }

    public getStage(): number {
        return this.blockEntity.capacity;
    }

    public setStage(n: number) {
        n = Math.min(n, 1000);

        try {
            this.blockEntity.scoreboard.setScore(this.blockEntity.entity.scoreboardIdentity, n)
        } catch (e) {
            logerr(e)
            this.blockEntity.entity.runCommandAsync(`scoreboard players set @s ${scName} ${n}`)
        }

        this.blockEntity.capacity = n;
        this.setBlockProperties({
            stage_beta: n >> 7,
            stage_alpha: n < 8 ? 0 : Math.floor(((n >> 4) | 1) % 8)
        });

        this.completeSetBlockState();
    }

    public addStage(n: number): number {
        this.setStage(this.blockEntity.capacity + n);
        return this.getStage();
    }

    public subtractStage(n: number): number {
        this.setStage(this.blockEntity.capacity - n);
        return this.getStage();
    }

    public isFull(): boolean {
        return this.getStage() == 1000;
    }

    public isFluidMode(): boolean {
        return this.isFluidWater()
            || this.isFluidLava();
    }

    public isBlockMode(): boolean {
        return this.isBlockDirt()
            || this.isBlockCobblestone()
            || this.isBlockClay()
            || this.isBlockObsidian()
            || this.isBlockNetherrack()
            || this.isBlockEndStone();
    }

    public isRaining(): boolean {
        let c = this.blockEntity.entity.getComponent(EntityMarkVariantComponent.componentId);
        // @ts-ignored
        return Boolean(c.value);
    }

    public isWaterDropable(): boolean {
        if (this.dimension.id == "minecraft:overworld") {
            return (({ x, y, z }) => {
                let blockN = this.dimension.getBlockFromRay({ x: x, y: y, z: z }, Vector.up, { maxDistance: 319 - y });
                return !Boolean(blockN);
            }).call(this, Vector.add(this.block.location, Vector.up));
        }
        return false;
    }

    public spawnItemInBlock() {
        if (this.isBlockDirt()) this.spawnItemsAbove(["dirt"]);
        else if (this.isBlockClay()) this.spawnItemsAbove(["clay"]);
        else if (this.isBlockCobblestone()) this.spawnItemsAbove(["cobblestone"]);
        else if (this.isBlockObsidian()) this.spawnItemsAbove(["obsidian"]);
        else if (this.isBlockNetherrack()) this.spawnItemsAbove(["netherrack"]);
        else if (this.isBlockEndStone()) this.spawnItemsAbove(["end_stone"]);
        this.setEmpty();
    }

    public spawnItemsAbove(items: ItemStack[] | string[]): Entity[] {
        let entities: Entity[] = [];
        for (let item of items) {
            if (typeof item == "string") item = new ItemStack(ItemTypes.get(item));
            let itemEntity = this.dimension.spawnItem(item, Vector.add(this.location, Vector.up));
            entities.push(itemEntity);
        }
        return entities;
    }

    public isWaterOnTop(): Boolean {
        let block: Block = this.dimension.getBlock(Vector.add(this.location, Vector.up));
        return (block.typeId == MinecraftBlockTypes.water.id || block.typeId == MinecraftBlockTypes.flowingWater.id);
    }

    public isLavaOnTop(): Boolean {
        let block: Block = this.dimension.getBlock(Vector.add(this.location, Vector.up));
        return (block.typeId == MinecraftBlockTypes.lava.id || block.typeId == MinecraftBlockTypes.flowingLava.id);
    }

    public transformToObsidian() {
        this.setBlockObsidian()
        if (this.isBlockObsidian()) playSoundAt("random.fizz", this.location, this.dimension, { volume: 0.5, pitch: 2.4 });
    }

    public transformToCobblestone() {
        this.setBlockCobblestone()
        if (this.isBlockCobblestone()) playSoundAt("random.fizz", this.location, this.dimension, { volume: 0.5, pitch: 1.8 });
    }
}