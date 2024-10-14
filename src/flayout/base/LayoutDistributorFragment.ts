import {LayoutFragment, SPLIT_TYPE} from "@casperui/layoutfragment/widget/LayoutFragment";
import {RLayoutFragment} from "@casperui/layoutfragment/widget/R";


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
            // switch (this.meta.type){
            //     case "module_list":{
            //         fragment = new ModuleListFragment(this.getActivity())
            //         break
            //     }
            //     case "lamp_list":{
            //         fragment = new LampListFragment(this.getActivity())
            //         break
            //     }
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
            //     default:fragment = new TreeViewFragment(this.getActivity())
            // }
        } else {
            // fragment = new TreeViewFragment(this.getActivity())
        }


        this.getFragmentManager().replaceFragment(RLayoutFragment.id.content, fragment)
        // this.getFragmentManager().pushFragment(1, fragment, this.getFragmentView())

    }


}