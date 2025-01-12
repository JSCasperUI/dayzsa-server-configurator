import {ViewModel} from "@casperui/core/live/ViewModel";
import {LiveData} from "@casperui/core/live/LiveData";
import {DZLootType} from "@dz/dayz/xtypes/DZLootType";



export class SyncSelector extends ViewModel {


    mLootTypeSelect = new LiveData<DZLootType|null>(null)
}