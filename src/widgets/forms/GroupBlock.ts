import {View, ViewTag} from "@casperui/core/view/View";
import {Context} from "@casperui/core/content/Context";
import {ViewAttributes} from "@casperui/core/view/ViewAttributes";
import {R} from "@dz/R";

export class GroupBlock extends View {

    private content:View
    private isInflated: boolean = false;

    constructor(context:Context,tag?:ViewTag,attr?:ViewAttributes) {
        super(context,"div",attr)
        this.inflateSelf(R.layout.widgets.group_block.main,true)
        this.isInflated = true

        if (attr && attr["title"]) {
            this.byId(R.id.title).setTextContent(attr["title"] as string)
            delete attr["title"]
        }

        this.appendAttributes(attr)
        let header_block = this.byId(R.id.header_block)
        this.content = this.byId(R.id.content)

        let showHide = this.byId(R.id.open_close_icon)

        showHide.setSVGById(R.icons.arrow_down_tin)
        let switcher = false

        const ctnt = this.content
        let handler = function () {
            switcher = !switcher
            if (switcher) {
                ctnt.addClass("hide")
                showHide.setSVGById(R.icons.arrow_right_tin)
            } else {
                showHide.setSVGById(R.icons.arrow_down_tin)
                ctnt.removeClass("hide")
            }
        }
        // if (options.hide){
        //     switcher = false
        //     handler()
        // }
        header_block.setOnClickListener(handler)


    }

    removeView(content: View) {
        this.content.removeView(content)
    }

    removeAllViews() {
        this.content.removeAllViews()
    }

    addView(view: View, index?: number) {
        if (this.isInflated){
            this.content.addView(view,index)
        }else{
            super.addView(view,index)
        }
    }
}