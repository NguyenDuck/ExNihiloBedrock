// 1.20.0
import { Block, Vector3, BlockPermutation, Dimension, world } from "@minecraft/server";
import { logerr, prefix } from "../utils";

export default class BlockBase {
    public block: Block;
    public location: Vector3;
    public dimension: Dimension;
    public permutation: BlockPermutation;

    constructor(block: Block) {
        this.block = block;
        this.location = this.block.location;
        this.dimension = this.block.dimension;
        this.permutation = this.block.permutation;
    }

    public static setNonPushable(identifier: string) {
        return world.beforeEvents.pistonActivate.subscribe(arg => {
            for (let location of arg.piston.getAttachedBlocks()) {
                let block = arg.block.dimension.getBlock(location).typeId;
                if (block == identifier || block.includes(identifier)) {
                    arg.cancel = true;
                    return;
                }
            }
        })
    }

    public getLocationAbove(): Vector3 {
        return { x: this.location.x, y: this.location.y + 1, z: this.location.z };
    }

    public getBlockProperty(name: string): string | number | boolean {
        if (!name.includes(":")) name = prefix(name);
        return this.permutation.getState(name);
    }

    public setBlockProperty(name: string, value: string | number | boolean) {
        if (!name.includes(":")) name = prefix(name);
        try {
            this.permutation = this.permutation.withState(name, value);
            return true
        } catch (e) {
            logerr(e)
            return false
        }
    }

    public commitSetPermutation() {
        try {
            this.block.setPermutation(this.permutation);
            return true
        } catch (e) {
            logerr(e)
            return false
        }
    }

    public setBlockProperties(properties: { [name: string]: string | number | boolean }) {
        for (let name in properties) {
            this.setBlockProperty(name, properties[name]);
        }

        return this.commitSetPermutation();
    }

    public hasBlockProperty(properties: { [name: string]: string | number | boolean }): boolean {
        for (let name in properties) {
            let matchValue = properties[name];
            if (!name.includes(":")) name = prefix(name);
            let value = this.getBlockProperty(name);
            if (value == null || value != matchValue) return false;
        }
        return true;
    }

    public getBlockState(state: string) {
        return this.permutation.getState(state)
    }

    public hasBlockState(states: { [name: string]: string | number | boolean }) {
        for (let state in states) {
            let matchVal = states[state]
            let value = this.getBlockState(state)
            if (value == null || value != matchVal) return false
        }
        return true
    }
}