import {TableView} from "@dz/widgets/tableview/TableView";
import {MainActivity} from "@dz/MainActivity";
import {Context} from "@casperui/core/content/Context";
import {ViewTag} from "@casperui/core/view/View";
import {ViewAttributes} from "@casperui/core/view/ViewAttributes";
import {BXNodeContent} from "@dz/space/xml/XMLTreeContent";
import {DZLootType} from "@dz/dayz/xtypes/DZLootType";


export class TypeTable extends TableView {

    constructor(context: Context, tag?: ViewTag, attr?: ViewAttributes) {
        super(context, tag, attr)


        let config = (this.ctx() as MainActivity).mBaseConfigVM;
        let types = config.mTypes
        this.adapter.activationField = "name"
        this.setCellFunction((item:DZLootType, field) => {
            switch (field) {
                case "name":
                    return item.name
                case "quantmin":
                    return item.quantmin
                case "quantmax":
                    return item.quantmax
                case "nominal":
                    return item.nominal
                case "category":
                    if (item.category){
                        return item.category
                    }
                    return ""

            }
        })

    }

    onViewChildInflated() {
        super.onViewChildInflated();
        let headers = ["Name", "Category","Nom","QMn","QMx"]
        let keys = ["name","category", "nominal","quantmin","quantmax"]
        let sizes = [200,100, 50,50,50]

        this.initTable(
            headers,
            keys,
            sizes
        )
    }
}