import {DZType} from "@dz/dayz/xtypes/DZType";
import {BXNodeContent} from "@dz/space/xml/XMLTreeContent";


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



    serialize():BXNodeContent {
        let node = {tag:"type",attrs:{name:this.name},children:[]} as BXNodeContent
        node.children.push({tag:"nominal",text:this.nominal.toString()} as BXNodeContent)
        node.children.push({tag:"lifetime",text:this.lifetime.toString()} as BXNodeContent)
        node.children.push({tag:"restock",text:this.restock.toString()} as BXNodeContent)
        node.children.push({tag:"min",text:this.min.toString()} as BXNodeContent)
        node.children.push({tag:"quantmin",text:this.quantmin.toString()} as BXNodeContent)
        node.children.push({tag:"quantmax",text:this.quantmax.toString()} as BXNodeContent)
        node.children.push({tag:"cost",text:this.cost.toString()} as BXNodeContent)


        node.children.push({tag:"category",text:null,attrs:{name:this.category},children:[]} as BXNodeContent)
        if (this.tag){
            node.children.push({tag:"tag",text:null,attrs:{name:this.tag},children:[]} as BXNodeContent)
        }

        let flags = {}
        for (const flagsKey of Object.keys(this.flags)) {
            flags[flagsKey] = this.flags[flagsKey].toString()
        }
        node.children.push({tag:"flags",text:null,attrs:flags,children:[]} as BXNodeContent)


        for (const val of this.value) {
            node.children.push({tag:"value",text:null,attrs:{name:val},children:[]} as BXNodeContent)
        }
        for (const val of this.usage) {
            node.children.push({tag:"usage",text:null,attrs:{name:val},children:[]} as BXNodeContent)
        }

        return node

    }


}
