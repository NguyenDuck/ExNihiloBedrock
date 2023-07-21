// 1.20.10
import { Block, Entity } from "@minecraft/server"
import EntityBase from "../entity/entity_base"
import BlockBase from "./block_base"

export default class BlockEntity extends BlockBase {
    public blockEntity: EntityBase
    public entity: Entity

    constructor(block: Block) {
        super(block)
        this.blockEntity = new EntityBase(block)
        this.entity = this.blockEntity.entity
    }
}