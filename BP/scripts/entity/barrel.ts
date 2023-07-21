// 1.20.10
import { Block, Entity, ScoreboardIdentity, ScoreboardObjective, world } from "@minecraft/server"
import { prefix, logerr } from "../utils"
import EntityBase from "./entity_base"

const scName = "en:bc"

export default class BarrelEntity extends EntityBase {
    static readonly NAMESPACE = prefix("barrel")

    public scoreboard: ScoreboardObjective = world.scoreboard.getObjective(scName)
    public capacity: number

    static Registry(): void {
        world.afterEvents.entitySpawn.subscribe(({ entity }) => {
            if (entity.typeId != BarrelEntity.NAMESPACE) return
            if (entity.scoreboardIdentity) return
            if (!world.scoreboard.getObjective(scName)) {
                world.scoreboard.addObjective(scName, scName)
            }
            entity.runCommandAsync(`scoreboard players set @s ${scName} 0`)
        })
    }

    constructor(block: Block, entity?: Entity) {
        super(block, entity)
        try {
            if (!this.scoreboard) this.scoreboard = world.scoreboard.addObjective(scName, scName)
            if (!this.entity) return
            let eScoreboard: ScoreboardIdentity = this.entity.scoreboardIdentity
            if (eScoreboard) {
                this.capacity = this.scoreboard.getScore(eScoreboard)
            }
        } catch (e) { logerr(e) }
    }
}