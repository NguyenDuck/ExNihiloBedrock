// 1.20.0
import { Block, Entity, ScoreboardIdentity, ScoreboardObjective, world } from "@minecraft/server";
import { prefix, logobj } from "../utils";
import EntityBase from "./entity_base";

const fluidScName = "en:cfc";
const materialScName = "en:cmc";

export default class CrucibleEntity extends EntityBase {
    static readonly NAMESPACE = prefix("crucible");

    public readonly fluidSc: ScoreboardObjective = world.scoreboard.getObjective(fluidScName);
    public readonly materialSc: ScoreboardObjective = world.scoreboard.getObjective(materialScName);
    public fluidCapacity: number;
    public materialCapacity: number;

    static Registry(): void {
        world.afterEvents.entitySpawn.subscribe((arg) => {
            let entity = arg.entity;
            if (entity.typeId != CrucibleEntity.NAMESPACE) return;
            if (!world.scoreboard.getObjective(fluidScName)) world.scoreboard.addObjective(fluidScName, fluidScName);
            if (!world.scoreboard.getObjective(materialScName)) world.scoreboard.addObjective(materialScName, materialScName);
            if (entity.scoreboardIdentity) return;
            entity.runCommandAsync(`scoreboard players set @s ${fluidScName} 0`);
            entity.runCommandAsync(`scoreboard players set @s ${materialScName} 0`);
        })
    }

    constructor(block: Block, entity: Entity = undefined) {
        super(block, entity);
        try {
            if (!this.fluidSc) this.fluidSc = world.scoreboard.addObjective(fluidScName, fluidScName);
            if (!this.materialSc) this.materialSc = world.scoreboard.addObjective(materialScName, materialScName);
            let eScoreboard: ScoreboardIdentity = this.entity.scoreboardIdentity;
            if (eScoreboard) {
                this.fluidCapacity = this.fluidSc.getScore(eScoreboard);
                this.materialCapacity = this.materialSc.getScore(eScoreboard);
            }
        } catch (e) {
            // world.say(e + "\n" + e.stack)
        }
    }
}