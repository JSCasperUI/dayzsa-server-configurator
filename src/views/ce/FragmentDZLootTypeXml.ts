import {JFragment} from "@casperui/core/app/JFragment";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";
import {View} from "@casperui/core/view/View";
import {R} from "@dz/R";
import {MainActivity} from "@dz/MainActivity";
import {CheckBoxBlock} from "@dz/widgets/forms/CheckBoxBlock";
import {BXNodeToHighlightedHtml, BXNodeToXml} from "@dz/space/xml/BXNodeToXml";

export class FragmentDZLootTypeXml extends JFragment {

    static SPLIT_NAME = "FragmentDZLootTypeXml";
    onCreateView(inflater: BXMLInflater, container: View): View {
        return inflater.inflate(R.layout.ce.types.edit.xml_edit);
    }

    private mValueFlagViewMap= new Map<string,CheckBoxBlock>();
    private mUsageFlagsViewMap = new Map<string,CheckBoxBlock>();

    protected onAttachSingle() {
        let edit_name = this.byId(R.id.xml);



        let config = (this.ctx() as MainActivity).mBaseConfigVM

        let sync = (this.ctx() as MainActivity).mSyncSelector





        sync.mLootTypeSelect.observe(this,(item)=>{
            if (!item) return

            edit_name.getElement().innerHTML = BXNodeToHighlightedHtml(item.serialize())




        })




    }

    onCreated() {


    }
}