import {BaseConfig} from "@dz/models/BaseConfig";
import {getPathFileName} from "@dz/space/utils";
import {parseXMLString} from "@dz/space/xml/XMLTreeContent";
import {AreaFlagsFile} from "@dz/dayz/types/AreaFlagsFile";

export class XMLLoader {
    config:BaseConfig
    constructor(config:BaseConfig) {
        this.config = config
    }

    async process(data:File,filePath:string) {
        if (filePath.endsWith(".xml")){
            let name = getPathFileName(filePath)
            let  node = parseXMLString(await data.text())

            this.config.putData(node,node.tag)

        }else if (filePath.endsWith(".map")){
            console.log(filePath)
            this.config.mAreaFlagBinary.setValue(new AreaFlagsFile(await data.arrayBuffer()))
        }

    }
}