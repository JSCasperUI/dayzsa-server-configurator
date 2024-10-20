import {View} from "@casperui/core/view/View";
import {TableViewAdapter} from "@dz/widgets/tableview/TableViewAdapter";
import {Context} from "@casperui/core/content/Context";
import {R} from "@dz/R";
import {RecyclerView} from "@casperui/recyclerview/widget/RecyclerView";

export class TableView extends View {
  visibleKeys = []

   sizes:number[] = []
  sort = null
    tableSizes = null
   adapter:TableViewAdapter
    recycler:RecyclerView

    cellFunction = null
    currentSortKey = null;
    currentSortOrder = 1; // 1 = возрастание, -1 = убывание
    constructor(context:Context, tag, attributes) {
        super(context, "tabll",attributes);

        this.adapter = new TableViewAdapter(context)

        this.inflater = context.getInflater()
        // this.inflater.inflate(R.layout.widgets.tableview.main, false, this, true)

        // this.appendAttributes(attributes)

    }

    onViewChildInflated() {
        super.onViewChildInflated();

        this.recycler = this.byId(R.id.list) as RecyclerView
        this.recycler.setAdapter(this.adapter)

    }


    /**
     * @return {TableViewAdapter}
     */
    getAdapter(){
        return this.adapter
    }

    setCellFunction(fn){
        this.cellFunction = fn
        this.adapter.setCellFunction(fn)
    }

    /**@private */
    keyProcessing(keys){
        let nKeys = []
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i]
            if (key.indexOf(".")>0){
                nKeys.push({
                    isPath:true,
                    path:key.split("."),
                    key:key,
                })
            }else{
                nKeys.push({
                    isPath:false,
                    path:key,
                    key:key,
                })
            }
        }
        return nKeys
    }

    onRowHoverEvent(index){

    }


    /**
     * @param {string[]} header - Что будет в заголовке
     * @param {string[]} keys - Ключи в массиве данных
     * @param {number[]} sizes - Зармеры полей (в писелях или 0 то будет в процентах)
     * @param {number[]?} visibleKeys - видимые поля
     * @param {array?} sort - сортировка напр. ["title",-1]
     */

    header:string[]
    keys:string[]
    number:number[]
    selfData:any

    initTable(header, keys, sizes, visibleKeys, sort) {

        this.header = header

        this.keys = this.keyProcessing(keys)
        console.log(this.keys)
        this.visibleKeys = this.keys

        if (visibleKeys){
            this.visibleKeys = Array.isArray(visibleKeys)? this.keyProcessing(visibleKeys):this.keyProcessing([visibleKeys])
        }
        if (sort && Array.isArray(sort)){
            this.sort = sort
        }
        if (sizes && Array.isArray(sizes)){
            this.sizes = sizes
        }

        this.tableSizes = this.calculateColumnSizes(this.sizes,this.keys)

        this.updateHeader()
    }


    updateData(data){
        this.selfData = data.slice()
        if (this.currentSortKey){
            this.sortTable(this.currentSortKey);
            return
        }
        this.updateDataFiltered()

    }

    /**@private */
    updateDataFiltered(){

        this.adapter.setData( this.selfData ,this.keys,this.tableSizes)
    }


    calculateColumnSizes(sizes:number[], visibleKeys:string[]) {
        const totalWidth = 100; // Общая ширина таблицы в процентах
        let fixedWidth = 0; // Общая ширина фиксированных столбцов в пикселях
        let flexibleColumns = 0; // Количество гибких столбцов (0 в sizes)

        // Определение видимых размеров
        visibleKeys.forEach((key, index) => {
            let size = sizes[index];
            if (size > 0) {
                fixedWidth += size;
            } else {
                flexibleColumns++;
            }
        });

        let flexibleColumnWidth = 0;
        if (flexibleColumns > 0) {
            flexibleColumnWidth = (totalWidth - (fixedWidth / window.innerWidth * 100)) / flexibleColumns;
        }

        return visibleKeys.map((key, index) => {
            let size = sizes[index];
            return size > 0 ? `${size}px` : `${flexibleColumnWidth}%`;
        });
    }

    /**@private */
    updateHeader() {
        let header = this.byId(R.id.header)
        header.removeAllViews()
        for (let i = 0; i < this.header.length; i++) {
            let size = this.tableSizes[i]
            let style = `flex-basis: ${size};`
            if (size.endsWith("px"))
                style+="flex-shrink: 0;"
            let view = this.inflater.inflate(R.layout.table.header_item)
            let sortIcon = R.icons.sort;
            if (this.currentSortKey === this.keys[i]) {
                sortIcon = this.currentSortOrder === 1 ? R.icons.sort_up : R.icons.sort_down;
            }
            view.byId(R.id.sort).setSVGById(sortIcon);
            view.byId(R.id.sort).setSVGById(sortIcon)
            view.setParameter("style",style)
            view.byId(R.id.text).setTextContent(this.header[i])
            view.setOnClickListener(()=>{
                this.sortTable(this.keys[i]);
            })
            header.addView(view)
        }

    }
    /**@private */
    sortTable(key) {
        if (this.currentSortKey === key) {
            // Если нажали на уже выбранный столбец — меняем порядок сортировки
            this.currentSortOrder *= -1;
        } else {
            // Если выбрали новый столбец — сортируем по возрастанию
            this.currentSortKey = key;
            this.currentSortOrder = 1;
        }


        if (this.currentSortKey.isPath){
            this.selfData.sort((a, b) => {
                let valueA = this.getNestedValue(a, this.currentSortKey.path);
                let valueB = this.getNestedValue(b, this.currentSortKey.path);
                if (valueA === undefined){
                    valueA = 0
                }
                if (valueB === undefined){
                    valueB = 0
                }

                if (valueA < valueB) return -1 * this.currentSortOrder;
                if (valueA > valueB) return 1 * this.currentSortOrder;
                return 0;
            });
        }else {
            this.selfData.sort((a, b) => {
                if (a[key.path] < b[key.path]) return -1 * this.currentSortOrder;
                if (a[key.path] > b[key.path]) return 1 * this.currentSortOrder;
                return 0;
            });
        }


        this.updateHeader();
        this.updateDataFiltered()
    }
    /**@private */
    getNestedValue(obj, keysArray) {
        return keysArray.reduce((acc, key) => acc && acc[key], obj);
    }

}
