// 1.20.10
import { Block, Entity, ItemStack, world, Player, Vector, system } from "@minecraft/server"
import BlockBase from "./block_base"
import { catchf, clearInventory, getEntityInventory, getMainhandItem, getSquarePositions, logerr, logobj, prefix, splitNamespace } from "../utils"

let globalItems: ItemStack[]

export default class Sieve extends BlockBase {

    static readonly NAMESPACE = prefix("sieve")

    static isSieveBlock(block: Block) {
        return block.hasTag(Sieve.NAMESPACE)
    }

    static Registry() {
        world.afterEvents.itemUseOn.subscribe(({ source, block }) => {
            if (source.isSneaking) return
            if (!Sieve.isSieveBlock(block)) return
            catchf(() => {
                let blocks = getSquarePositions(block.location, 2)
                blocks.forEach(location => {
                    let block = source.dimension.getBlock(location)
                    if (Sieve.isSieveBlock(block)) new Sieve(block).onInteract({ source })
                })
            })
        })

        system.afterEvents.scriptEventReceive.subscribe(({ id, sourceBlock }) => {
            if (id != "exnihilo:sieve_interacted_no_item" || !sourceBlock) return
            if (!Sieve.isSieveBlock(sourceBlock)) return
            catchf(() => {
                let blocks = getSquarePositions(sourceBlock.location, 2)
                blocks.forEach(location => {
                    let block = sourceBlock.dimension.getBlock(location)
                    if (Sieve.isSieveBlock(block)) new Sieve(block).onInteract({})
                })
            })
        }, { namespaces: ["exnihilo"] })

        system.afterEvents.scriptEventReceive.subscribe(({ id, sourceEntity }) => {
            catchf(() => {
                if (id != "exnihilo:sieve_items_loot_completed" || !sourceEntity) return
                let inventory = getEntityInventory({ entity: sourceEntity })
                globalItems = []
                for (let i = 0; i < (inventory.size - inventory.emptySlotsCount); i++) {
                    globalItems.push(inventory.getItem(i))
                }
                sourceEntity.triggerEvent("despawn")
            })
        }, { namespaces: ["exnihilo"] })

        world.afterEvents.playerSpawn.subscribe(({ initialSpawn, player }) => {
            if (!globalItems && initialSpawn) {
                player.dimension.spawnEntity("exnihilo:sieve_items", player.location)
            }
        })
    }

    public onInteract({ source }: { source?: Entity }) {
        let mesh = this.getBlockProperty("mesh_type") as number
        if (!mesh) return
        let stage = this.getBlockProperty("stage") as number
        if (stage > 0) {
            if (stage == 10) {
                let loots = []

                let main_type = this.getBlockProperty("main_type") as number
                let sub_type = this.getBlockProperty("sub_type") as number

                let loot = ""

                switch (main_type) {
                    // none
                    case 0:
                        break
                    // dirt
                    case 1:
                        loot = "dirt"
                        if (sub_type == 1) loot = "coarse_dirt"
                        loots.push(loot)
                        break
                    // gravel
                    case 2:
                        loot = "gravel/" + Math.min(mesh, 4)
                        loots.push(loot)
                        break
                    // leaves
                    case 3:
                        let leaves_type = [
                            "oak", "spruce", "birch", "jungle",
                            "acacia", "dark_oak", "mangrove",
                            "azalea", "azalea_flowered"
                        ]
                        loot = "leaves/" + leaves_type[sub_type]
                        if (mesh > 3) loot += 4
                        else loot += mesh
                        loots.push(loot)
                        loot = "leaves/golden/"
                        if (mesh > 3) loot += 4
                        else loot += mesh
                        loots.push(loot)
                        break
                    // sand
                    case 4:
                        loot = "sand/" + Math.min(mesh, 3)
                        loots.push(loot)
                        break
                    // soul_sand
                    case 5:
                        loot = "soul_sand/" + Math.min(mesh, 3)
                        loots.push(loot)
                        break
                    // crushed_netherrack
                    case 6:
                        loot = "crushed/netherrack/" + Math.min(mesh, 4)
                        loots.push(loot)
                        break
                    // crushed_end_stone
                    case 7:
                        if (mesh < 3) loot = "crushed/end_stone/1"
                        else loot = "crushed/end_stone/" + (mesh - 1)
                        loots.push(loot)
                        break
                    // dust
                    case 8:
                        if (mesh < 3) loot = "dust/1"
                        else loot = "dust/2"
                        loots.push(loot)
                        break
                }

                this.setBlockProperties({
                    main_type: 0,
                    sub_type: 0,
                    stage: 0
                })

                loots.forEach(v => {
                    let entity = this.dimension.spawnEntity(prefix("drop_item_entity"), this.location)
                    entity.runCommandAsync(`loot replace entity @s slot.inventory 0 loot "sieve/${v}"`)
                        .then(() => {
                            let container = getEntityInventory({ entity: entity })
                            for (let i = 0; i < container.size - container.emptySlotsCount; i++) {
                                this.dimension.spawnItem(container.getItem(i), Vector.add(this.location, { x: 0.5, y: 1, z: 0.5 }))
                            }
                        })
                        .finally(() => entity.triggerEvent("despawn"))
                })
            } else {
                this.setBlockProperties({ stage: stage + 1 })
            }
        } else {
            if (!source) return

            ((properties: { [x: string]: string | number | boolean }) => {
                if (!properties) return
                properties["stage"] = 1
                if (this.setBlockProperties(properties)) clearInventory({ entity: source })
            }).call(this, getDataFromItem(getMainhandItem({ entity: source }), mesh))
        }
    }
}

function getDataFromItem(itemStack: ItemStack, mesh_type: number) {
    if (!itemStack) return null
    let itemAccepted = {
        "dirt": [
            "normal",
            "coarse"
        ],
        "gravel": [],
        "leaves": [
            "oak",
            "spruce",
            "birch",
            "jungle",
            "dark_oak",
            "acacia"
        ],
        "sand": [
            "normal",
            "red"
        ],
        "soul_sand": [],
        "crushed_netherrack": [],
        "crushed_end_stone": [],
        "dust": []
    }
    let meshTable = {
        "string": [
            "dirt",
            "gravel",
            "leaves",
            "sand",
            "soul_sand",
            "crushed_netherrack",
            "crushed_end_stone",
            "dust"
        ],
        "flint": [
            "dirt",
            "gravel",
            "leaves",
            "sand",
            "soul_sand",
            "crushed_netherrack",
            "crushed_end_stone",
            "dust"
        ],
        "iron": [
            "dirt",
            "gravel",
            "leaves",
            "sand",
            "soul_sand",
            "crushed_netherrack",
            "crushed_end_stone",
            "dust"
        ],
        "diamond": [
            "dirt",
            "gravel",
            "leaves",
            "sand",
            "soul_sand",
            "crushed_netherrack",
            "crushed_end_stone",
            "dust"
        ],
        "emerald": [
            "dirt",
            "gravel",
            "leaves",
            "sand",
            "soul_sand",
            "crushed_netherrack",
            "crushed_end_stone",
            "dust"
        ],
        "netherite": [
            "dirt",
            "gravel",
            "leaves",
            "sand",
            "soul_sand",
            "crushed_netherrack",
            "crushed_end_stone",
            "dust"
        ]
    }
    let main_type = 0
    let sub_type = 0

    let mesh = meshTable[Object.getOwnPropertyNames(meshTable)[mesh_type - 1]]

    globalItems.forEach((acceptedItem, i1) => {
        if (!acceptedItem.isStackableWith(itemStack)) return
        let i3 = 0
        Object.getOwnPropertyNames(itemAccepted).forEach((name, i2) => {
            let s = splitNamespace(itemStack.typeId)
            if (s.last == name && mesh.includes(name)) {
                main_type = i2 + 1
                sub_type = i1 - i3
            }
            if (i1 >= i3) {
                let l = itemAccepted[name].length
                i3 += Math.max(l, 1)
            }
        })
    })
    return main_type ? { main_type, sub_type } : null
}