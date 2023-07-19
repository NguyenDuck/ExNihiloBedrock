// 1.20.0
import { EntityInventoryComponent, ItemStack, MinecraftBlockTypes, world } from "@minecraft/server";
import { prefix, splitNamespace } from "../utils";

export default class Crook {
    static readonly TAG = prefix("crook")

    static Registry() {
        world.afterEvents.blockBreak.subscribe(({ block, player, brokenBlockPermutation }) => {
            // @ts-ignored
            let item: ItemStack = player.getComponent(EntityInventoryComponent.componentId).container.getItem(player.selectedSlot);
            if (item && item.typeId.includes(Crook.TAG)) {
                let splited = splitNamespace(brokenBlockPermutation.type.id);
                if (splited.isVanilla) {
                    switch (splited.last) {
                        case "leaves":
                            // @ts-ignored
                            block.setType(MinecraftBlockTypes.get(prefix(`crook_${brokenBlockPermutation.getProperty("old_leaf_type").value}_leaves`)))
                            break;
                        case "leaves2":
                            // @ts-ignored
                            block.setType(MinecraftBlockTypes.get(prefix(`crook_${brokenBlockPermutation.getProperty("new_leaf_type").value}_leaves`)))
                            break;
                        case "mangrove_leaves":
                            block.setType(MinecraftBlockTypes.get(prefix(`crook_mangrove_leaves`)))
                            break;
                        case "azalea_leaves":
                            block.setType(MinecraftBlockTypes.get(prefix(`crook_azalea_leaves`)))
                            break;
                        case "azalea_leaves_flowered":
                            block.setType(MinecraftBlockTypes.get(prefix(`crook_azalea_flowered_leaves`)))
                            break;
                    }
                } else {
                    if (splited.last.includes("infested_leaves")) {
                        block.setType(MinecraftBlockTypes.get(prefix(`crook_infested_leaves`)))
                    }
                }
            }
        })
    }
}