import {ViewModel} from "@casperui/core/live/ViewModel";
import {LiveData} from "@casperui/core/live/LiveData";
import {VisibleFlags} from "@dz/dayz/types/VisibleFlags";

export interface FlagMapItemSelected {
    layer:number,
    bit:number
}
export enum DRAW_MODE {
    NONE = 0,
    DRAW_CIRCLE,
    DRAW_CLEAR_CIRCLE,
    CLEAR,
}
export class ModelAreaFlag extends ViewModel {

    mVisibleFlags:LiveData<VisibleFlags> = new LiveData<VisibleFlags>({
        layer0:0xFFFFFFFF,
        layer1:0xFFFFFFFF,
        layer2:0xFFFFFFFF,
        layer3:0xFFFFFFFF,
        layer4:0xFFFFFFFF,
    } as VisibleFlags)

    mMapImageVisible:LiveData<boolean> = new LiveData<boolean>(true)

    mFlagMapItemSelected:LiveData<FlagMapItemSelected> = new LiveData<FlagMapItemSelected>({layer:0,bit:0})

    mDrawMode:LiveData<DRAW_MODE> = new LiveData<DRAW_MODE>(DRAW_MODE.NONE)
}