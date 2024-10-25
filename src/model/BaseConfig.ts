import {ViewModel} from "@casperui/core/live/ViewModel";
import {LiveData} from "@casperui/core/live/LiveData";
import {BXNodeContent} from "@dz/xml/XMLTreeContent";
import {DZConfigTypes} from "@dz/dayz/DZConfigTypes";
import {MapInfo} from "@dz/dayz/types/MapInfo";
import {AreaFlagsFile} from "@dz/dayz/types/AreaFlagsFile";
import {VisibleFlags} from "@dz/dayz/types/VisibleFlags";

export interface AreaFlagHoverEvents {
    valueMask:number
    usageMask:number
}

const EMPTY = {} as BXNodeContent
export class BaseConfig extends ViewModel {

    mAreaFlagBinary:LiveData<AreaFlagsFile> = new LiveData<AreaFlagsFile>(null)
    mAreaFlagMask:LiveData<VisibleFlags> = new LiveData<VisibleFlags>({
        visibleValueFlagsMask:0xFF,
        visibleUsageFlagsMask:0xFFFFFFFF,
        mapImage:true,
    } as VisibleFlags)

    mAreaFlagHoverEvent:LiveData<AreaFlagHoverEvents> = new LiveData<AreaFlagHoverEvents>({
        valueMask:0,
        usageMask:0
    } as AreaFlagHoverEvents)





    // db
    mEconomy:LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)
    mEvents:LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)
    mMessages:LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)
    mTypes:LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)


    // env
    mTerritoryType:LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)


    /** cfgeconomycore.xml */
    mEconomyCore:LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)

    /** cfgenvironment.xml */
    mEnv:LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)

    /** cfgeventgroups.xml */
    mEventGroupDef:LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)

    /** cfgeventspawns.xml */
    mEventPosDef:LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)

    /** cfgignorelist.xml */
    mIgnore:LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)


    //cfglimitsdefinition.xml
    mLists:LiveData<BXNodeContent> = new LiveData<BXNodeContent>(EMPTY)


    getConfig(codeName:string):LiveData<BXNodeContent>{
        switch (codeName){
            case DZConfigTypes.TYPES: return this.mTypes
            case DZConfigTypes.ECONOMY: return this.mEconomy
            case DZConfigTypes.EVENTS: return this.mEvents
            case DZConfigTypes.MESSAGES: return this.mMessages
            case DZConfigTypes.LISTS: return this.mLists
        }
        return null
    }

}