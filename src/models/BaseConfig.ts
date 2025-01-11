import {ViewModel} from "@casperui/core/live/ViewModel";
import {LiveData} from "@casperui/core/live/LiveData";
import {BXNodeContent} from "@dz/space/xml/XMLTreeContent";
import {DZConfigTypes} from "@dz/dayz/DZConfigTypes";
import {MapInfo} from "@dz/dayz/types/MapInfo";
import {AreaFlagsFile} from "@dz/dayz/types/AreaFlagsFile";
import {VisibleFlags} from "@dz/dayz/types/VisibleFlags";
import {DZLootType} from "@dz/dayz/xtypes/DZLootType";

export interface AreaFlagHoverEvents {
    valueMask: number
    usageMask: number
}

const EMPTY = {} as BXNodeContent

export class BaseConfig extends ViewModel {

    mAreaFlagBinary: LiveData<AreaFlagsFile> = new LiveData<AreaFlagsFile>(null)


    // db
    mEconomy: LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)
    mEvents: LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)
    mMessages: LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)


    mTypes: LiveData<Array<DZLootType>> = new LiveData<Array<DZLootType>>([])


    // env
    mTerritoryType: LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)


    /** cfgeconomycore.xml */
    mEconomyCore: LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)

    /** cfgenvironment.xml */
    mEnv: LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)

    /** cfgeventgroups.xml */
    mEventGroupDef: LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)

    /** cfgeventspawns.xml */
    mEventPosDef: LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)

    /** cfgignorelist.xml */
    mIgnore: LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)


    //cfglimitsdefinition.xml
    mLists: LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)


    putData(content: BXNodeContent, codeName: string) {
        switch (codeName) {
            case DZConfigTypes.TYPES:
                return this.inflateTypes(content)
            case DZConfigTypes.ECONOMY:
                return this.mEconomy.setValue(content)
            case DZConfigTypes.EVENTS:
                return this.mEvents.setValue(content)
            case DZConfigTypes.MESSAGES:
                return this.mMessages.setValue(content)
            case DZConfigTypes.LISTS:
                return this.mLists.setValue(content)
        }
        return null
    }


    inflateTypes(content: BXNodeContent) {
        let array:Array<DZLootType> = []
        for (let i = 0; i < content.children.length; i++) {
            const type = new DZLootType()
            type.setNode(content.children[i])
            array.push(type)
        }

        this.mTypes.setValue(array)
    }

}