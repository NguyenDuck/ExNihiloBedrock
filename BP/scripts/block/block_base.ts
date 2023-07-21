// 1.20.0
import { Block, Vector3, BlockPermutation, Dimension, world, Vector } from "@minecraft/server";
import { logerr, prefix, splitNamespace } from "../utils";

export default class BlockBase {
    public block: Block
    public location: Vector3
    public dimension: Dimension
    public permutation: BlockPermutation

    public isVanilla: boolean

    constructor(block: Block) {
        this.block = block
        this.location = this.block.location
        this.dimension = this.block.dimension
        this.permutation = this.block.permutation
        this.isVanilla = splitNamespace(this.block.typeId).isVanilla
    }

    public static setNonPushable(identifier: string) {
        return world.beforeEvents.pistonActivate.subscribe(arg => {
            for (let location of arg.piston.getAttachedBlocks()) {
                let block = arg.block.dimension.getBlock(location).typeId
                if (block == identifier || block.includes(identifier)) {
                    arg.cancel = true
                    return
                }
            }
        })
    }

    public getLocationAbove(): Vector3 {
        return Vector.add(this.location, Vector.up)
    }

    public getBlockState(name: string): string | number | boolean | undefined {
        return this.permutation.getState(this.isVanilla ? name : prefix(name))
    }

    public setBlockState(name: string, value: string | number | boolean) {
        try {
            this.permutation = this.permutation.withState((this.isVanilla ? name : prefix(name)), value)
            return true
        } catch (e) {
            logerr(e)
            return false
        }
    }

    public commitSetPermutation() {
        try {
            this.block.setPermutation(this.permutation)
            return true
        } catch (e) {
            logerr(e)
            return false
        }
    }

    public setBlockStates(states: { [name: string]: string | number | boolean }) {
        for (let state in states) this.setBlockState(state, states[state])
        return this.commitSetPermutation()
    }

    public hasBlockState(name: string, value: string | number | boolean): boolean {
        return this.getBlockState(name) === value
    }

    public hasBlockStates(states: { [name: string]: string | number | boolean }): boolean {
        for (let name in states) {
            if (this.isVanilla) name = prefix(name)
            if (!this.hasBlockState(name, states[name])) return false
        }
        return true
    }
}