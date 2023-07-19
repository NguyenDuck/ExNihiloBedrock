import { MinecraftBlockTypes, system, Vector, Vector3 } from "@minecraft/server";
import { prefix } from "../utils";
import BlockBase from "./block_base";


export default class InfestingLeaves extends BlockBase {
    static Registry() {
        system.afterEvents.scriptEventReceive.subscribe(({ id, sourceBlock }) => {
            if (id != prefix("infesting_leaves_spread")) return
            system.run(() => {
                let up = new InfestingLeaves((sourceBlock.dimension.getBlock(Vector.add(sourceBlock.location, Vector.up))))
                if (up.hasBlockProperty({
                    old_leaf_type: "oak",
                    persistent_bit: false
                })) {
                    up.block.setType(MinecraftBlockTypes.get(prefix("infesting_oak")))
                }
            })
        })
    }
}