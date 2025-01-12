import {JFragment} from "@casperui/core/app/JFragment";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";
import {View} from "@casperui/core/view/View";
import {R} from "@dz/R";
import {LayoutDistributorFragment} from "@dz/views/base/LayoutDistributorFragment";
import {Context} from "@casperui/core/content/Context";
import {FragmentTypeFilteredList} from "@dz/views/ce/FragmentTypeFilteredList";

export class FragmentCELootEditSection extends JFragment {

    private static instance: FragmentCELootEditSection;

    static getInstance(context:Context): FragmentCELootEditSection {
        if (!FragmentCELootEditSection.instance){
            FragmentCELootEditSection.instance = new FragmentCELootEditSection(context)
        }
        return FragmentCELootEditSection.instance
    }

    onCreateView(inflater: BXMLInflater, container: View): View {
        return inflater.inflate(R.layout.sections.ce_loot_edit);
    }

    protected onAttachSingle() {
        super.onAttachSingle();
        let layoutFragment = new LayoutDistributorFragment(this.ctx(), false, -2)
        this.getFragmentManager().replaceFragment(R.id.container, layoutFragment)
        layoutFragment.inflate({
            type: 1,
            child: [
                {
                    l: 35,
                    type: 0,
                    meta: {type: FragmentTypeFilteredList.SPLIT_NAME}
                },
                {type: 0, l: 65, meta: {type: "sdfgsdfg"}}
            ]
        })
    }
}
