import {JFragment} from "@casperui/core/app/JFragment";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";
import {View} from "@casperui/core/view/View";
import {R} from "@dz/R";
import {LayoutDistributorFragment} from "@dz/views/base/LayoutDistributorFragment";
import {Context} from "@casperui/core/content/Context";

export class FragmentAreaFlagsSection extends JFragment {

    private static instance: FragmentAreaFlagsSection;

    static getInstance(context: Context): FragmentAreaFlagsSection {
        if (!FragmentAreaFlagsSection.instance) {
            FragmentAreaFlagsSection.instance = new FragmentAreaFlagsSection(context)
        }
        return FragmentAreaFlagsSection.instance
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
                    l: 15,
                    type: 0,
                    meta: {type: "area_menu"}
                },
                {type: 0, l: 65, meta: {type: "area_map"}},
                {
                    type: 2,
                    l: 20,
                    child: [
                        {
                            l: 50,
                            type: 0,
                            meta: {type: "property"}
                        },
                        {
                            type: 1,
                            l: 50,
                            child: [
                                {type: 0, meta: {type: "tree"}},
                            ]
                        }
                    ]
                },
            ]
        })
    }
}
