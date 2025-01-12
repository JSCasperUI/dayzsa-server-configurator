import {ViewModel} from "@casperui/core/live/ViewModel";
import {LiveData} from "@casperui/core/live/LiveData";
import {BXNodeContent} from "@dz/space/xml/XMLTreeContent";
import {DZCategory} from "@dz/dayz/xtypes/definition/DZCategory";
import {DZTag} from "@dz/dayz/xtypes/definition/DZTag";
import {DZUsageFlag} from "@dz/dayz/xtypes/definition/DZUsageFlag";
import {DZValueFlag} from "@dz/dayz/xtypes/definition/DZValueFlag";


const EMPTY = {} as BXNodeContent

export class ConfigLimitsDefinition extends ViewModel {



    mCategories= new LiveData<Array<DZCategory>>([])
    mTags= new LiveData<Array<DZTag>>([])
    mUsageFlags = new LiveData<Array<DZUsageFlag>>([])
    mValueFlags = new LiveData<Array<DZValueFlag>>([])




    deserialize(content: BXNodeContent){


        for (const child of content.children) {
            for (const item of child.children) {
                switch (item.tag){
                    case "category":{
                        let o = new DZCategory()
                        o.setNode(item)
                        this.mCategories.getValue().push(o)
                        break
                    }
                    case "tag":{
                        let o = new DZTag()
                        o.setNode(item)
                        this.mTags.getValue().push(o)
                        break
                    }
                    case "usage":{
                        let o = new DZUsageFlag()
                        o.setNode(item)
                        this.mUsageFlags.getValue().push(o)
                        break
                    }
                    case "value":{
                        let o = new DZValueFlag()
                        o.setNode(item)
                        this.mValueFlags.getValue().push(o)
                    }

                }

            }

        }

        this.mCategories.update()
        this.mTags.update()
        this.mUsageFlags.update()
        this.mValueFlags.update()


    }

}