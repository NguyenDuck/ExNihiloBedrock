// 1.20.10
import { Block, MinecraftBlockTypes, system, Vector, Vector3, world } from "@minecraft/server";
import { catchf, logobj, prefix } from "../utils";
import BlockBase from "./block_base";

export default class InfestingLeaves extends BlockBase {

    static isInfestable(block: Block) {
        return block.typeId == "minecraft:leaves" || block.typeId == "minecraft:leaves2"
    }

    static Registry() {
        system.afterEvents.scriptEventReceive.subscribe(({ id, sourceBlock }) => {
            if (id != prefix("infesting_leaves_spread") || !sourceBlock) return
            system.run(() => {
                let block = new InfestingLeaves(sourceBlock)
                block.transform(Vector.up)
                block.transform(Vector.down)
                block.transform(Vector.forward)
                block.transform(Vector.back)
                block.transform(Vector.left)
                block.transform(Vector.right)
            })

        }, { namespaces: ["exnihilo"] })
    }

    transform(side: Vector3) {
        let block = new InfestingLeaves(this.block.dimension.getBlock(Vector.add(this.location, side)))
        if (!InfestingLeaves.isInfestable(block.block)) return

        let p = block.permutation.getState("old_leaf_type")
        if (!p) p = block.permutation.getState("new_leaf_type")

        block.setType((p as string))
    }

    setType(type: string) {
        if (this.hasBlockState({
            old_leaf_type: type,
            persistent_bit: false
        }) || this.hasBlockState({
            new_leaf_type: type,
            persistent_bit: false
        })) {
            this.block.setType(MinecraftBlockTypes.get(prefix("infesting_leaves_" + type)))
        }
    }
}