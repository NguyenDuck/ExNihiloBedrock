// 1.20.0
import { MinecraftBlockTypes, Player, world } from "@minecraft/server";
import { getEntityInventory, prefix, splitNamespace } from "../utils";

export default class SporeMycelium {

    static readonly itemNamespace = prefix("spore_mycelium");

    static Registry() {
        world.afterEvents.itemUseOn.subscribe(async ({ itemStack, source, block }) => {
            if (itemStack.typeId != SporeMycelium.itemNamespace) return;
            let splited = splitNamespace(block.typeId);
            let blockType: string;
            if (splited.isVanilla) {
                switch (splited.last) {
                    case "dirt":
                        blockType = "minecraft:mycelium";
                        break;
                }
            }
            itemStack.amount -= 1
            if (itemStack.amount == 0) {
                itemStack = undefined
            }
            getEntityInventory({
                entity: source
            }).setItem((source as Player).selectedSlot, itemStack)
        });
    }
}