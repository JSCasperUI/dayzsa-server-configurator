import {Activity} from "@casperui/core/app/Activity";
import {R} from "@dz/R";
import {Application} from "@casperui/core/app/Application";
import {LayoutDistributorFragment} from "@dz/flayout/base/LayoutDistributorFragment";


export class MainActivity extends Activity {

    constructor() {
        super();

    }

    async onCreate() {
        let app = (this.getApplicationContext() as Application);
        app.addFontFace("ui",this.getResources().getBufferById(R.fonts.regular).getDataView(),)
        app.addFontFace("ui",this.getResources().getBufferById(R.fonts.medium).getDataView(),{weight:"bold"})
        this.setContentView(R.layout.activityMain)
        let frag = new LayoutDistributorFragment(this,false,-2)
        this.getFragmentManager().replaceFragment(R.id.fragment_main_content, frag)
        frag.inflate({
            type: 1,
            child: [

                {type: 2,l:15,child: [
                        {
                            l:50,
                            type: 0,
                            meta:{type:"module_list"}
                        },{
                            l:50,
                            type: 0,
                            meta:{type:"property"}
                        }
                    ]},
                {type: 0,l:10, meta:{type:"controller_info"}},
                {type: 0,l:30, meta:{type:"map"}},
                {type: 0,l:25, meta:{type:"cabinets_list"}},
                {
                    type: 2,
                    l:20,
                    child: [
                        {
                            l:50,
                            type: 0,
                            meta:{type:"property"}
                        },
                        {
                            type: 1,
                            l:50,
                            child: [
                                {type: 0,  meta:{type:"tree"}},
                            ]
                        }
                    ]
                },
            ]
        })
    }





    onLayout() {

    }



}

