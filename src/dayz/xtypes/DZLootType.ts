import {DZType} from "@dz/dayz/xtypes/DZType";


export class DZLootType extends DZType {
    name: string
    nominal: number
    lifetime: number
    restock: number
    min: number
    quantmin: number
    quantmax: number
    cost: number
    tag: string
    flags: {
        count_in_cargo: number,
        count_in_hoarder: number,
        count_in_map: number,
        count_in_player: number,
        crafted: number,
        deloot: number
    } = {
        count_in_cargo: 0,
        count_in_hoarder: 0,
        count_in_map: 0,
        count_in_player: 0,
        crafted: 0,
        deloot: 0
    }

    category: string
    usage: string[] = []
    value: string[] = []

    deSerialize() {
        let node = this.getNode()
        this.name = node.attrs.name

        for (const itm of node.children) {
            switch (itm.tag) {
                case "nominal":
                case "lifetime":
                case "restock":
                case "min":
                case "quantmin":
                case "quantmax":
                case "cost": {
                    this[itm.tag] = parseInt(itm.text);
                    break;
                }

                case "category":
                case "tag": {
                    this[itm.tag] = itm.attrs.name;
                    break;
                }

                case "value":
                case "usage": {
                    this[itm.tag].push(itm.attrs.name);
                    break;
                }
                case "flags": {

                    for (const attrsKey in itm.attrs) {
                        this.flags[attrsKey] = parseInt(itm.attrs[attrsKey])
                    }
                    break;
                }
                default:{
                    console.log("EA",itm)
                }
            }
        }

    }

    serialize() {

    }


}
