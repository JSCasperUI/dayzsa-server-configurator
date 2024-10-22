import {LayoutFragment, SPLIT_TYPE} from "@casperui/layoutfragment/widget/LayoutFragment";
import {RLayoutFragment} from "@casperui/layoutfragment/widget/R";
import {FragmentDZAreaFlags} from "@dz/views/areaflags/FragmentDZAreaFlags";
import {FragmentAreaMenu} from "@dz/views/areaflags/FragmentAreaMenu";


export  class LayoutDistributorFragment extends LayoutFragment {
    constructor(context, isContent,type = SPLIT_TYPE.UNDEF) {
        super(context, isContent,type);


    }

    createInstance(isContent) {
        return new LayoutDistributorFragment(this.mContext, isContent,SPLIT_TYPE.UNDEF);
    }

    onCreateView(inflater, container) {
        if (this.isContentConstructor) {
            return this.getContext().getInflater().inflate(RLayoutFragment.layout.main,true,null,false)
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
                case "area_map":{
                    fragment = new FragmentDZAreaFlags(this.getActivity())
                    break
                }
                case "area_menu":{
                    fragment = new FragmentAreaMenu(this.getActivity())
                    break
                }
            //     case "lamp_models":{
            //         fragment = new LampModelsListFragment(this.getActivity())
            //         break
            //     }
            //     case "cabinets_list":{
            //         fragment = new CabinetsListFragment(this.getActivity())
            //         break
            //     }
            //     case "controller_info":{
            //         fragment = new ControllerInfoFragment(this.getActivity())
            //         break
            //     }
            //
            //
            //
            //     case "property":{
            //
            //         fragment = new PropertyFragment(this.getActivity());
            //         break
            //     }
            //     case "tree":{
            //         fragment = new TreeViewFragment(this.getActivity())
            //         break
            //     }
            //     case "map":{
            //         fragment = new MapFragment(this.getActivity())
            //         break
            //     }
            //     case "socket_maker":{
            //         fragment = new SocketMakerFragment(this.getActivity())
            //         break
            //     }
                default:fragment = null
            }
        } else {
            // fragment = new TreeViewFragment(this.getActivity())
        }


        this.getFragmentManager().replaceFragment(RLayoutFragment.id.content, fragment)
        // this.getFragmentManager().pushFragment(1, fragment, this.getFragmentView())

    }


}