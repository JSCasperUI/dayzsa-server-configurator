import {BXNodeContent} from "@dz/space/xml/XMLTreeContent";

export abstract class DZType {

    private mNode:BXNodeContent

    getNode():BXNodeContent {
        return this.mNode
    }
    setNode(node:BXNodeContent) {
        this.mNode = node
        this.deSerialize()
    }

    abstract serialize()
    abstract deSerialize()



}