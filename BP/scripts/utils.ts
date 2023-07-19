// 1.20.0
import {
    Dimension,
    CommandResult,
    world,
    Player,
    IEntityComponent,
    EntityInventoryComponent,
    Vector3,
    Container,
    system,
    Vector,
    Entity,
    ItemStack
} from '@minecraft/server'

const NAMESPACE = "exnihilo"

function prefix(s: string): string {
    return `${NAMESPACE}:${s}`
}

function locationToString(location: Vector3 | { x: number, y: number, z: number }): string {
    return `${location.x} ${location.y} ${location.z}`
}

function blocksBetween(pos1: Vector3, pos2: Vector3): Vector3[] {
    let positions = [];

    let rangeX = Math.abs(pos2.x - pos1.x)
    let rangeY = Math.abs(pos2.y - pos1.y)
    let rangeZ = Math.abs(pos2.z - pos1.z)

    let minX = Math.min(pos1.x, pos2.x)
    let minY = Math.min(pos1.y, pos2.y)
    let minZ = Math.min(pos1.z, pos2.z)

    for (let x = minX; x <= minX + rangeX; x++) {
        for (let y = minY; y <= minY + rangeY; y++) {
            for (let z = minZ; z <= minZ + rangeZ; z++) {
                positions.push({ x: x, y: y, z: z })
            }
        }
    }

    return positions
}

function getSquarePositions(center: Vector3, distance: number): Vector3[] {
    const positions: Set<string> = new Set()

    positions.add(`${center.x},${center.z}`)

    for (let i = 1; i <= distance; i++) {
        for (let x = -i; x <= i; x++) {
            for (let z = -i; z <= i; z++) {
                positions.add(`${center.x + x},${center.z + z}`)
            }
        }
    }

    return Array.from(positions).map((pos) => {
        const [x, z] = pos.split(',').map(Number)
        return new Vector(x, center.y, z)
    })
}

function playSoundAt(
    soundId: string,
    location: Vector3 | { x: number, y: number, z: number },
    dimension: Dimension,
    options: { volume: number, pitch: number } = { volume: null, pitch: null }): Promise<CommandResult> {
    return dimension.runCommandAsync(`playsound ${soundId} @a ${locationToString(location)} ${notNull(options.volume)} ${notNull(options.pitch)}`)
}

function notNull(value: any, defaultValue: any = ""): any {
    return value !== null ? value : defaultValue
}

function splitNamespace(s: string): { "isVanilla": boolean, "first": string, "last": string } {
    let l = s.split(":")
    return {
        "isVanilla": l[0] == "minecraft",
        "first": l[0],
        "last": l[1]
    };
}

function getEntityInventory({ entity }): Container {
    let inventory: IEntityComponent = entity.getComponent("inventory")
    if (!(inventory instanceof EntityInventoryComponent)) throw new Error("Entity doesn't have inventory")
    return inventory.container
}

function vectorIsEqual(v1: Vector3, v2: Vector3) {
    return v1.x == v2.x && v1.y == v2.y && v1.z == v2.z
}

function logobj(o: Object) {
    Object.getOwnPropertyNames(Object.getPrototypeOf(o)).forEach(v => {
        try { world.sendMessage(`${v}: ${o[v]}`) }
        catch (e) { world.sendMessage(`${v}: ${e}`) }
    })
}

function logerr(e: Error) {
    world.sendMessage(`${e}\n${e.stack}`)
}

function catchf(f) {
    try {
        f()
    } catch (e) {
        system.run(() => logerr(e))
    }
}

function clearInventory({
    entity,
    inventoryContainer,
    slot,
    itemAmount = 1
}: {
    entity: Entity,
    inventoryContainer?: Container,
    slot?: number,
    itemAmount?: number
}): boolean {
    if (inventoryContainer) {
        if (slot == undefined) {
            slot = (entity as Player).selectedSlot
        }
        let item = inventoryContainer.getItem(slot)
        if (!item) return false

        if (item.amount == 1) {
            item = undefined
        } else {
            item.amount -= itemAmount
        }
        try {
            inventoryContainer.setItem(slot, item)
            return true
        } catch {
            return false
        }
    } else if (entity) {
        inventoryContainer = getEntityInventory({ entity: entity })
        return clearInventory({ entity, inventoryContainer, slot, itemAmount })
    }
    return false
}

function getMainhandItem({ entity }: { entity: Entity }): ItemStack {
    let inventoryContainer = getEntityInventory({ entity })
    return inventoryContainer.getItem((entity as Player).selectedSlot) || null
}

export {
    locationToString,
    playSoundAt,
    notNull,
    prefix,
    splitNamespace,
    logobj,
    logerr,
    getEntityInventory,
    vectorIsEqual,
    blocksBetween,
    getSquarePositions,
    catchf,
    clearInventory,
    getMainhandItem
}