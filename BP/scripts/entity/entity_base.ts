// 1.20.10
import { Entity, Block, world, Vector } from '@minecraft/server'
import { locationToString } from '../utils'

export default class EntityBase {
    public entity: Entity

    constructor(block: Block, entity?: Entity) {
        this.entity = entity
        if (!this.entity) {
            let entities = block.dimension.getEntitiesAtBlockLocation(Vector.add(block.location, Vector.up))
            for (let e of entities) {
                if (block.hasTag(e.typeId)) {
                    this.entity = e
                    break
                }
            }
        }
    }
}