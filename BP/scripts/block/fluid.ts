// 	// 1.19.83
// import BlockBase from "./block_base";
// import {
//     playSoundAt,
//     prefix,
//     getEntityInventory,
//     splitNamespace,
//     logerr,
//     logobj,
//     locationToString
// } from "../utils";
// import { BlockPermutation, Direction, MinecraftBlockTypes, system, Vector3, world } from "@minecraft/server";

// export default class Fluid extends BlockBase {
//     static NAMESPACE: string = prefix(`fluid_test`);

//     static Registry() {
//         var globalQueue = {};

//         function blockRegistered(location: Vector3) {
//             return Boolean(globalQueue[locationToString(location)]);
//         }

//         function set(location: Vector3, value: number) {
//             globalQueue[locationToString(location)] = value;
//         }

//         function del(location: Vector3) {
//             delete globalQueue[locationToString(location)];
//         }

//         system.events.scriptEventReceive.subscribe(({ id, message, sourceBlock }) => {
//             if (id != prefix(`fluid_trigger`)) return;
//             if (!sourceBlock) return;
//             if (message != `fluidFlow`) return;
//             if (!sourceBlock.hasTag(prefix(`fluid`))) return;
//             // if (sourceBlock.typeId != prefix(`fluid_test`)) return;

//             for (let i = 8; i > 1; i--) {
//                 if (sourceBlock.hasTag(prefix(`fluid_stage_${i}`))) {
//                     let o = sourceBlock.location;
//                     let nl: Vector3 = { x: o.x, y: o.y, z: o.z - 1 },
//                         sl: Vector3 = { x: o.x, y: o.y, z: o.z + 1 },
//                         el: Vector3 = { x: o.x + 1, y: o.y, z: o.z },
//                         wl: Vector3 = { x: o.x - 1, y: o.y, z: o.z },
//                         dl: Vector3 = { x: o.x, y: o.y - 1, z: o.z };

//                     if (blockRegistered(nl)) {
//                         if (!(sourceBlock.dimension.getBlock(nl).isAir())) del(nl);
//                     } else {
//                         if (sourceBlock.dimension.getBlock(nl).isAir()) {
//                             set(nl, system.runTimeout(() => {
//                                 sourceBlock.dimension.runCommandAsync(`setblock ${locationToString(nl)} ${prefix(`fluid_sub_${i - 1}`)} ["${prefix(`direction`)}": 0]`)
//                                 del(nl);
//                             }, 4));
//                         }
//                     }

//                     if (blockRegistered(sl)) {
//                         if (!(sourceBlock.dimension.getBlock(sl).isAir())) del(sl);
//                     } else {
//                         if (sourceBlock.dimension.getBlock(sl).isAir()) {
//                             set(sl, system.runTimeout(() => {
//                                 sourceBlock.dimension.runCommandAsync(`setblock ${locationToString(sl)} ${prefix(`fluid_sub_${i - 1}`)} ["${prefix(`direction`)}": 2]`)
//                                 del(sl);
//                             }, 4));
//                         }
//                     }

//                     if (blockRegistered(el)) {
//                         if (!(sourceBlock.dimension.getBlock(el).isAir())) del(el);
//                     } else {
//                         if (sourceBlock.dimension.getBlock(el).isAir()) {
//                             set(el, system.runTimeout(() => {
//                                 sourceBlock.dimension.runCommandAsync(`setblock ${locationToString(el)} ${prefix(`fluid_sub_${i - 1}`)} ["${prefix(`direction`)}": 3]`)
//                                 del(el);
//                             }, 4));
//                         }
//                     }

//                     if (blockRegistered(wl)) {
//                         if (!(sourceBlock.dimension.getBlock(wl).isAir())) del(wl);
//                     } else {
//                         if (sourceBlock.dimension.getBlock(wl).isAir()) {
//                             set(wl, system.runTimeout(() => {
//                                 sourceBlock.dimension.runCommandAsync(`setblock ${locationToString(wl)} ${prefix(`fluid_sub_${i - 1}`)} ["${prefix(`direction`)}": 1]`)
//                                 del(wl);
//                             }, 4));
//                         }
//                     }

//                     if (blockRegistered(dl)) {
//                         if (!(sourceBlock.dimension.getBlock(dl).isAir())) del(dl);
//                     } else {
//                         if (sourceBlock.dimension.getBlock(dl).isAir()) {
//                             set(dl, system.runTimeout(() => {
//                                 sourceBlock.dimension.runCommandAsync(`setblock ${locationToString(dl)} ${prefix(`fluid_sub_7`)}`)
//                                 del(dl);
//                             }, 4));
//                         }
//                     }
//                     break;
//                 }
//             }
//         })
//     }
// }