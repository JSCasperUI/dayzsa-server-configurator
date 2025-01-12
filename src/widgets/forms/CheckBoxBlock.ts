import {View, ViewTag} from "@casperui/core/view/View";
import {Context} from "@casperui/core/content/Context";
import {ViewAttributes} from "@casperui/core/view/ViewAttributes";
import {R} from "@dz/R";

export class CheckBoxBlock extends View {
    private icon: View;

    private mIsChecked = false
    constructor(context:Context,tag?:ViewTag,attr?:ViewAttributes) {
        super(context,"div",attr)
        this.inflateSelf(R.layout.widgets.checkbox.main,true)


        if (attr && attr["title"]) {
            this.setTitle(attr["title"] as string)
            delete attr["title"]
        }

        this.appendAttributes(attr)
        this.icon = this.byId(R.id.icon)
        this.setOnClickListener(()=>{
            this.setBoolValue(!this.isChecked())
        })
        this.setBoolValue(false)
    }

    setTitle(text:string) {
        this.byId(R.id.title).setTextContent(text)
    }
    isChecked(): boolean {
        return this.mIsChecked;
    }
    setBoolValue(value: boolean) {
        this.mIsChecked = value
        if (value){
            this.icon.setSVGById(R.icons.swith_on)
        }else{
            this.icon.setSVGById(R.icons.swith_off)

        }

    }
}