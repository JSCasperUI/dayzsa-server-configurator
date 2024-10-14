import {Activity} from "@casperui/core/app/Activity";
import {R} from "@dz/R";
import {Application} from "@casperui/core/app/Application";


export class MainActivity extends Activity {

    constructor() {
        super();

    }

    async onCreate() {
        let app = (this.getApplicationContext() as Application);
        app.addFontFace("ui",this.getResources().getBufferById(R.fonts.regular).getDataView(),)
        app.addFontFace("ui",this.getResources().getBufferById(R.fonts.medium).getDataView(),{weight:"bold"})
        this.setContentView(R.layout.activityMain)
    }





    onLayout() {

    }



}

