import {DZType} from "@dz/dayz/xtypes/DZType";


export class DZCategory extends DZType {
    name: string = "DZ Category";

    constructor(name?: string) {
        super();
        this.name = name;
    }

    deSerialize() {
        this.name = this.getNode().attrs.name as string
    }

    serialize() {

        this.getNode().attrs.name = this.name;

    }
}