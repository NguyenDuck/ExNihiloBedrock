// 1.20.10
import { Block, Entity, ItemStack, ItemTypes, Player, system, Vector, world } from "@minecraft/server";
import BlockEntity from "./block_entity";
import { getEntityInventory, logerr, playSoundAt, prefix, splitNamespace } from "../utils";
import CrucibleEntity from "../entity/crucible";
import BlockBase from "./block_base";

const heatBlocks = {
    minecraft: {
        torch: 1,
        redstone_torch: 1,
        magma: 2,
        shroomlight: 2,
        glowstone: 2,
        lit_smoker: 2,
        lava: 3,
        flowing_lava: 3,
        lit_furnace: 3,
        lit_blast_furnace: 4,
        fire: 4,
        soul_fire: 4,
        campfire: 4,
        soul_campfire: 4
    }
}

const fluidScName = "en:cfc";
const materialScName = "en:cmc";

export default class Crucible extends BlockEntity {
    static readonly NAMESPACE = prefix("crucible");
    static readonly TRIGGER_ID = prefix("crucible_trigger");

    declare public blockEntity: CrucibleEntity;

    static Registry(): void {
        BlockBase.setNonPushable(Crucible.NAMESPACE);

        world.afterEvents.itemUseOn.subscribe(ev => {
            if (ev.source.isSneaking) return;
            let block = ev.block;
            try {
                if (block.hasTag(Crucible.NAMESPACE)) new Crucible(block).onInteract(ev.itemStack, ev.source);
            } catch (e) {
                logerr(e)
            }
        })

        system.afterEvents.scriptEventReceive.subscribe(({ sourceBlock, id, message }) => {
            if (id != Crucible.TRIGGER_ID) return;
            if (!sourceBlock.hasTag(Crucible.NAMESPACE)) return;
            switch (message) {
                case "checkHeatAndTransform":
                    new Crucible(sourceBlock).onMaterialInside();
                    break;
            }
        })
    }

    constructor(block: Block) {
        super(block);
        this.blockEntity = new CrucibleEntity(block);
    }

    public onInteract(item: ItemStack, source: Entity) {
        let itemstack = splitNamespace(item.typeId);

        let success = false;

        if (this.block.hasTag(prefix("fired"))) {
            if (itemstack.isVanilla) {
                switch (itemstack.last) {
                    case "bucket":
                        if (!this.isFluidFull()) return;
                        let playerInventory = getEntityInventory({ entity: source });
                        playerInventory.addItem(new ItemStack(ItemTypes.get("lava_bucket")));
                        this.setEmpty();
                        playSoundAt("bucket.empty_lava", this.block.location, this.dimension);
                        success = true;
                        break;
                    case "obsidian":
                    case "netherrack":
                        if (this.isMaterialExcess()) break;
                        this.addMaterialStage(1000);
                        this.commitSetPermutation();
                        success = true;
                        break;
                    case "cobblestone":
                    case "stone":
                        if (this.isMaterialExcess()) break;
                        this.addMaterialStage(250);
                        this.commitSetPermutation();
                        success = true;
                        break;
                    case "gravel":
                        if (this.isMaterialExcess()) break;
                        this.addMaterialStage(250);
                        this.commitSetPermutation();
                        success = true;
                        break;
                    case "sand":
                        if (this.isMaterialExcess()) break;
                        this.addMaterialStage(100);
                        this.commitSetPermutation();
                        success = true;
                        break;
                }
            } else {
                switch (itemstack.first) {
                    case "exnihilo":
                        switch (itemstack.last) {
                            case "crushed_netherrack":
                            case "crushed_end_stone":
                                if (this.isMaterialExcess()) break;
                                this.addMaterialStage(200);
                                this.commitSetPermutation();
                                success = true;
                                break;
                            case "dust":
                                if (this.isMaterialExcess()) break;
                                this.addMaterialStage(50);
                                this.commitSetPermutation();
                                success = true;
                                break;
                        }
                        break;
                }
            }
        } else {
            if (itemstack.isVanilla) {
                switch (itemstack.last) {
                    case "bucket":
                        if (!this.isFluidFull()) return;
                        let playerInventory = getEntityInventory({ entity: source });
                        playerInventory.addItem(new ItemStack(ItemTypes.get("water_bucket")));
                        this.setEmpty();
                        playSoundAt("bucket.empty_water", this.block.location, this.dimension);
                        success = true;
                        break;
                    case "sapling":
                    case "leaves":
                    case "leaves2":
                    case "mangrove_leaves":
                    case "azalea_leaves":
                    case "azalea_leaves_flowered":
                        if (this.isMaterialExcess()) break;
                        this.addMaterialStage(250);
                        this.commitSetPermutation();
                        playSoundAt(`item.bone_meal.use`, this.location, this.dimension, { volume: 1.0, pitch: 1.2 });
                        success = true;
                        break;
                }
            }
        }

        if (success) {
            item.amount -= 1
            if (item.amount == 0) {
                item = undefined
            }
            getEntityInventory({
                entity: source
            }).setItem((source as Player).selectedSlot, item)
        }
    }

    public onMaterialInside() {
        let block = this.dimension.getBlock(Vector.add(this.location, { x: 0, y: -1, z: 0 }));
        if (!block) return;
        if (!this.isHeatBlock(block)) return;
        let modifier = this.getHeatModifer(block);
        if (!modifier) return;
        this.addFluidStage(this.getMaterialStage() - this.subtractMaterialStage(modifier));
        this.commitSetPermutation();
    }

    public isHeatBlock(block: Block): boolean {
        let ns = splitNamespace(block.typeId);
        return Boolean(heatBlocks[ns.first][ns.last]);
    }

    public getHeatModifer(block: Block): number {
        let ns = splitNamespace(block.typeId);
        return heatBlocks[ns.first][ns.last];
    }

    public isMaterialExcess() {
        return (this.getFluidStage() + this.getMaterialStage()) >= 1000;
    }

    public isFluidFull(): boolean {
        return this.getFluidStage() == 1000;
    }

    public isMaterialFull(): boolean {
        return this.getMaterialStage() == 1000;
    }

    public isFull(): boolean {
        return this.isFluidFull() || this.isMaterialFull();
    }

    public getFluidAlpha(): number {
        // @ts-ignored
        return this.getBlockProperty("fluid_stage_alpha");
    }

    public getFluidBeta(): number {
        // @ts-ignored
        return this.getBlockProperty("fluid_stage_beta");
    }

    public getMaterialAlpha(): number {
        // @ts-ignored
        return this.getBlockProperty("material_stage_alpha");
    }

    public getMaterialBeta(): number {
        // @ts-ignored
        return this.getBlockProperty("material_stage_beta");
    }

    public setEmpty() {
        this.subtractFluidStage(this.getFluidStage());
        this.setBlockProperties({
            fluid_stage_alpha: 0,
            fluid_stage_beta: 0,
            material_stage_alpha: 0,
            material_stage_beta: 0
        });
    }

    public setMaterialStage(n: number) {
        if (n < 0) n = 0;
        n = Math.min(n, 1000);
        try {
            // @ts-ignored
            if (!this.blockEntity.entity.scoreboard.setScore(world.scoreboard.getObjective(materialScName), n)) throw new Error();
        } catch (e) {
            this.blockEntity.entity.runCommandAsync(`scoreboard players set @s ${materialScName} ${n}`);
        }
        this.blockEntity.materialCapacity = n;
        this.setBlockProperties({
            material_stage_alpha: n == 0 ? 0 : (n >> 5) % 8 + 1,
            material_stage_beta: n >> 8
        });
    }

    public setFluidStage(n: number) {
        if (n < 0) n = 0;
        n = Math.min(n, 1000);
        try {
            // @ts-ignored
            if (!this.blockEntity.entity.scoreboard.setScore(world.scoreboard.getObjective(fluidScName), n)) throw new Error();
        } catch (e) {
            this.blockEntity.entity.runCommandAsync(`scoreboard players set @s ${fluidScName} ${n}`);
        }
        this.blockEntity.fluidCapacity = n;
        this.setBlockProperties({
            fluid_stage_alpha: n == 0 ? 0 : (n >> 5) % 8 + 1,
            fluid_stage_beta: n >> 8
        });
    }

    public addFluidStage(n: number) {
        this.setFluidStage(this.getFluidStage() + n);
        return this.getFluidStage();
    }

    public addMaterialStage(n: number) {
        this.setMaterialStage(this.getMaterialStage() + n);
        return this.getMaterialStage();
    }

    public subtractFluidStage(n: number) {
        this.setFluidStage(this.getFluidStage() - n);
        return this.getFluidStage();
    }

    public subtractMaterialStage(n: number) {
        this.setMaterialStage(this.getMaterialStage() - n);
        return this.getMaterialStage();
    }

    public getFluidStage(): number {
        return this.blockEntity.fluidCapacity;
    }

    public getMaterialStage(): number {
        return this.blockEntity.materialCapacity;
    }
}