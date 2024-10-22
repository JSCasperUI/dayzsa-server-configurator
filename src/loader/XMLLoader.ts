import {BaseConfig} from "@dz/model/BaseConfig";
import {getPathFileName} from "@dz/space/utils";
import {parseXMLString} from "@dz/xml/XMLTreeContent";
import {AreaFlag} from "@dz/dayz/types/AreaFlag";

export class XMLLoader {
    config:BaseConfig
    constructor(config:BaseConfig) {
        this.config = config
    }

    async process(data:File,filePath:string) {
        if (filePath.endsWith(".xml")){
            let name = getPathFileName(filePath)

            let  node = parseXMLString(await data.text())
            let dConfig = this.config.getConfig(node.tag)
            if (dConfig) dConfig.setValue(node)


        }else if (filePath.endsWith(".map")){
            console.log(filePath)
            this.config.mAreaFlagBinary.setValue(new AreaFlag(await data.arrayBuffer()))
        }

    }
}