import {Application} from "@casperui/core/app/Application";
import {MainActivity} from "@dz/MainActivity";
import {WidgetRegistrar} from "@casperui/core/view/inflater/WidgetRegistrar";
import {Context} from "@casperui/core/content/Context";
import {ViewAttributes} from "@casperui/core/view/ViewAttributes";
import {TableView} from "@dz/widgets/tableview/TableView";
import {RecyclerView} from "@casperui/recyclerview/widget/RecyclerView";
import {TypeTable} from "@dz/views/tables/TypeTable";
import {CheckBoxBlock} from "@dz/widgets/forms/CheckBoxBlock";
import {GroupBlock} from "@dz/widgets/forms/GroupBlock";



export async function JStartFullApp() {
    const  application = new Application()
    WidgetRegistrar.register("RecyclerView", (context: Context, tag: string, attributes: ViewAttributes)=> new RecyclerView(context,tag,attributes))
    WidgetRegistrar.register("TableView", (context: Context, tag: string, attributes: ViewAttributes)=> new TableView(context,tag,attributes))
    WidgetRegistrar.register("TypeTable", (context, tag, attributes) => new TypeTable(context, tag, attributes))
    WidgetRegistrar.register("CheckBoxBlock", (context, tag, attributes) => new CheckBoxBlock(context, tag, attributes))
    WidgetRegistrar.register("GroupBlock", (context, tag, attributes) => new GroupBlock(context, tag, attributes))

    await application.startActivity(new MainActivity())

}
window.onload = function(e){
    JStartFullApp()
}
