// 1.19.83
import { Block, ItemStack, world, Entity, EntitySpawnEvent, ItemTypes, EntityInventoryComponent } from "@minecraft/server";
import { logerr, prefix, splitNamespace, vectorIsEqual } from "../utils";

export default class Hammer {
    static readonly TAG = prefix("hammer")

    static Registry() {
        world.afterEvents.blockBreak.subscribe(({ block, player, brokenBlockPermutation, dimension }) => {
            // @ts-ignored
            let item: ItemStack = player.getComponent(EntityInventoryComponent.componentId).container.getItem(player.selectedSlot);
            if (item && item.typeId.includes(Hammer.TAG)) {
                let splited = splitNamespace(brokenBlockPermutation.type.id);
                if (splited.isVanilla) {
                    switch (splited.last) {
                        case "cobblestone":
                        case "gravel":
                        case "sand":
                        case "netherrack":
                        case "end_stone":
                            Hammer.onBlockBreaked(splited.last, block);
                            break;
                    }
                }
            }
        })
    }

    static onBlockBreaked(brokenId: string, block: Block) {
        const event = world.afterEvents.entitySpawn.subscribe(({ entity }) => {
            if (entity.typeId != "minecraft:item") return;
            if ((({ x, y, z }) => vectorIsEqual(block.location, { x: x, y: y - 1, z: z })).call(this, entity.location)) {
                Hammer.onItemSpawned(event, entity, brokenId);
            }
        })
    }

    static onItemSpawned(event: (arg: EntitySpawnEvent) => void, entity: Entity, blockId: string) {
        world.afterEvents.entitySpawn.unsubscribe(event);
        // @ts-ignored
        let item: ItemStack = entity.getComponent("item").itemStack;
        if (item.amount == 1) {
            switch (blockId) {
                case "cobblestone":
                    entity.dimension.spawnItem(new ItemStack(ItemTypes.get("gravel"), 1), entity.getHeadLocation());
                    break;
                case "gravel":
                    entity.dimension.spawnItem(new ItemStack(ItemTypes.get("sand"), 1), entity.getHeadLocation());
                    break;
                case "sand":
                    entity.dimension.spawnItem(new ItemStack(ItemTypes.get(prefix("dust")), 1), entity.getHeadLocation());
                    break;
                case "netherrack":
                    entity.dimension.spawnItem(new ItemStack(ItemTypes.get(prefix("crushed_netherrack")), 1), entity.getHeadLocation());
                    break;
                case "end_stone":
                    entity.dimension.spawnItem(new ItemStack(ItemTypes.get(prefix("crushed_end_stone")), 1), entity.getHeadLocation());
                    break;
            }
            entity.kill();
        }
    }
}