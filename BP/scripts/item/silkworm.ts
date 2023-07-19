// 1.20.0
import { MinecraftBlockTypes, Player, world } from "@minecraft/server";
import { getEntityInventory, prefix, splitNamespace } from "../utils";

export default class Silkworm {

    static readonly itemNamespace = prefix("silkworm");

    static Registry() {
        world.afterEvents.itemUseOn.subscribe(({ itemStack, source, block }) => {
            if (itemStack.typeId != Silkworm.itemNamespace) return;
            if (block.isWaterlogged) return;
            let splited = splitNamespace(block.typeId);
            let blockType: string;
            if (splited.isVanilla) {
                switch (splited.last) {
                    case "leaves":
                        blockType = prefix(`infesting_leaves_${block.permutation.getState("old_leaf_type")}`);
                        break;
                    case "leaves2":
                        blockType = prefix(`infesting_leaves_${block.permutation.getState("new_leaf_type")}`);
                        break;
                }
            }
            try {
                if (!blockType) return
                block.setType(MinecraftBlockTypes.get(blockType));
                itemStack.amount -= 1
                if (itemStack.amount == 0) {
                    itemStack = undefined
                }
                getEntityInventory({
                    entity: source
                }).setItem((source as Player).selectedSlot, itemStack)
            } catch { }
        });
    }
}