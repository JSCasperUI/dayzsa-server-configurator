import {JFragment} from "@casperui/core/app/JFragment";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";
import {View} from "@casperui/core/view/View";
import {R} from "@dz/R";
import {TypeTable} from "@dz/views/tables/TypeTable";
import {MainActivity} from "@dz/MainActivity";


export class FragmentTypeFilteredList extends JFragment {

    static SPLIT_NAME = "FragmentTypeFilteredList";

    onCreateView(inflater: BXMLInflater, container: View): View {
        return inflater.inflate(R.layout.ce.types.filtered_types);
    }

    onCreated() {
        super.onCreated();


    }
    onAttachSingle(){
        let sync = (this.ctx() as MainActivity).mSyncSelector
        let table = this.byId(R.id.table) as TypeTable

        table.getAdapter().setMouseInEvent((idx,module)=>{
            // this.sync.hoverModule.updateAttribute("_id",module._id)
        })

        table.getAdapter().setMouseOutEvent((_id)=>{
            // this.sync.hoverModule.updateAttribute("_id",null)
        })
        table.getAdapter().setSelectEvent((_id,item)=>{
            sync.mLootTypeSelect.setValue(item)
            // this.sync.selectElement.select(_id,SE_TYPES.CABINET,this)
        })
        table.getAdapter().setOnDoubleClickEvent((idx,cab)=>{
            // this.sync.mapGoToLocation.updateAttribute("location",cab.location.coordinates,this)
        })


        let config = (this.getActivity() as MainActivity).mBaseConfigVM;

        // let adapter = new ModulesTableAdapter(this.context,this.allLightModel,this)
        // this.recyclerView.setAdapter(adapter)
        config.mTypes.observe(this,(types)=>{
            console.log("TYPES LOADED",types)
            table.updateData(types)

        })


    }

}