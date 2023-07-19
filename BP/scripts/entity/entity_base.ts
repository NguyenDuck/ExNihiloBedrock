// 1.20.0
import { Entity, Block } from '@minecraft/server';

export default class EntityBase {
    public entity: Entity;

    constructor(block: Block, entity: Entity = undefined) {
        if (!entity) this.entity = (() => {
            let entities = block.dimension.getEntitiesAtBlockLocation(block.location);
            for (let e of entities) if (e.typeId == block.typeId) return e;
        }).call(this);
        else this.entity = entity;
    }
}