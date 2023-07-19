// 1.20.0
import { MinecraftBlockTypes, world } from "@minecraft/server";
import { prefix, splitNamespace } from "../utils";

export default class GrassSeeds {

    static readonly itemNamespace = prefix("seeds_grass");

    static Registry() {
        world.afterEvents.itemUseOn.subscribe(({ itemStack, source, block }) => {
            if (itemStack.typeId != GrassSeeds.itemNamespace) return;
            let splited = splitNamespace(block.typeId);
            let blockType: string;
            if (splited.isVanilla) {
                switch (splited.last) {
                    case "dirt":
                        blockType = "minecraft:grass";
                        break;
                }
            }

            if (blockType) {
                itemStack.amount -= 1
                block.setType(MinecraftBlockTypes.get(blockType));
            }
            // if (blockType) source.runCommandAsync(`clear @s[m=!creative] ${itemStack.typeId} ${itemStack.data} 1`).finally(() => {
            //     block.setType(MinecraftBlockTypes.get(blockType));
            // });
        });
    }
}