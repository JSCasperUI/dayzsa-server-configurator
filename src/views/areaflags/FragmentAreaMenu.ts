import {JFragment} from "@casperui/core/app/JFragment";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";
import {View} from "@casperui/core/view/View";
import {R} from "@dz/R";
import {RecyclerView} from "@casperui/recyclerview/widget/RecyclerView";
import {AdapterAreaFlagsItems} from "@dz/adapters/AdapterAreaFlagsItems";
import {MainActivity} from "@dz/MainActivity";

export class FragmentAreaMenu extends JFragment {
    private mAdapter: AdapterAreaFlagsItems;
    onCreateView(inflater: BXMLInflater, container: View): View {
        return inflater.inflate(R.layout.area_flags.fragment_area_flag_menu);
    }

    onCreated() {
        super.onCreated();
        let list = this.byId(R.id.treeList) as RecyclerView
        this.mAdapter = new AdapterAreaFlagsItems();
        list.setAdapter(this.mAdapter)
    }
    protected onAttachSingle() {
        super.onAttachSingle();

        let config = (this.getActivity() as MainActivity).mBaseConfigVM;
        config.mAreaFlagMask.observe(this,value => {
            this.mAdapter.updateVisibleFlags(value)
        })
        this.mAdapter.setVisibleChange(visibleFlags => {
            config.mAreaFlagMask.setValue(visibleFlags)
        })

        this.mAdapter.setHoverChange(area => {
            config.mAreaFlagHoverEvent.setValue(area)
        })

        config.mLists.observe(this,value => {
            this.mAdapter.setData(value)
            this.mAdapter.notifyDataSetChanged()
        })


    }



}