import {BXNodeContent} from "@dz/space/xml/XMLTreeContent";

export class BXSerializable {
    private mNode:BXNodeContent
    constructor(bNode:BXNodeContent) {
        this.mNode = bNode
    }

    getNode():BXNodeContent {
        return this.mNode
    }
}