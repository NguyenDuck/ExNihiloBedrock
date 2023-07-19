// 1.20.0
import * as blockImporter from './block/importer'
import * as entityImporter from './entity/importer'
import * as itemImporter from './item/importer'

([...itemImporter.default, ...blockImporter.default, ...entityImporter.default]).forEach(o => o.Registry());