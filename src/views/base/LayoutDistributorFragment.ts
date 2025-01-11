import {LayoutFragment, SPLIT_TYPE} from "@casperui/layoutfragment/widget/LayoutFragment";
import {RLayoutFragment} from "@casperui/layoutfragment/widget/R";
import {FragmentAreaMenu} from "@dz/views/areaflags/FragmentAreaMenu";
import {FragmentAreaFlags} from "@dz/views/areaflags/FragmentAreaFlags";
import {FragmentTypeFilteredList} from "@dz/views/ce/FragmentTypeFilteredList";


export  class LayoutDistributorFragment extends LayoutFragment {
    constructor(context, isContent,type = SPLIT_TYPE.UNDEF) {
        super(context, isContent,type);


    }

    createInstance(isContent) {
        return new LayoutDistributorFragment(this.mContext, isContent,SPLIT_TYPE.UNDEF);
    }

    onCreateView(inflater, container) {
        if (this.isContentConstructor) {
            return this.ctx().getInflater().inflate(RLayoutFragment.layout.main,true,null,false)
        }
        return super.onCreateView(inflater, container);
    }


    onCreated() {
        super.onCreated();
        if (!this.isContentConstructor) {
            return
        }
        let fragment
        //
        if (this.meta){
            switch (this.meta.type){
                case FragmentAreaFlags.SPLIT_NAME:{
                    fragment = new FragmentAreaFlags(this.getActivity())
                    break
                }
                case FragmentAreaMenu.SPLIT_NAME:{
                    fragment = new FragmentAreaMenu(this.getActivity())
                    break
                }
                case FragmentTypeFilteredList.SPLIT_NAME:{
                    fragment = new FragmentTypeFilteredList(this.getActivity())
                    break
                }
                default:fragment = null
            }
        } else {
            // fragment = new TreeViewFragment(this.getActivity())
        }


        this.getFragmentManager().replaceFragment(RLayoutFragment.id.content, fragment)
        // this.getFragmentManager().pushFragment(1, fragment, this.getFragmentView())

    }


}