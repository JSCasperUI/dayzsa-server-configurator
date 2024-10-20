import {ViewHolder} from "@casperui/recyclerview/widget/ViewHolder";
import {View} from "@casperui/core/view/View";
import {Adapter} from "@casperui/recyclerview/widget/Adapter";
import {Context} from "@casperui/core/content/Context";


class DynamicHolder extends ViewHolder {
    cells = []
    isActive = false
    constructor(context) {
        super(new View(context,"trm",{class:"wgt_table_view_row"}));
        this.cells = []
        this.isActive = false
    }
    resizeHolder(sizes){
        this.cells = []
        this.mHolder.removeAllViews()
        for (let i = 0; i < sizes.length; i++) {
            let size = sizes[i]
            let style = `flex-basis: ${size};`
            if (size.endsWith("px"))
                style+="flex-shrink: 0;"
            let view = new View(this.mHolder.context,"div",{style:style})

            this.cells.push(view)
            this.mHolder.addView(view)
        }
    }

    activate(value){
        if (value !== this.isActive) {
            this.isActive = value;
            if (this.isActive){
                this.mHolder.addClass("active")
            }else{
                this.mHolder.removeClass("active")
            }
        }else{
        }

    }

    /**
     * @param index
     * @return {View}
     */
    getCell(index){
        return this.cells[index]
    }
}

export class TableViewAdapter extends Adapter<DynamicHolder> {
    mDouble:any
    mMouseIn:any
    mMouseOut:any

    mMouseMove:any

    mItemSelect:any

    selectedElement:any

    mMouseDown:any

    context:Context
    holders = []
    data = []
    cellNames = []
    cellSizes = []
    cellFunction = null
    activationField = "_id"
    activationsFields = new Map()
    constructor(context) {
        super();
        this.context = context
    }


    setOnDoubleClickEvent(fn){
        this.mDouble = fn
    }
    setMouseInEvent(fn){
        this.mMouseIn = fn
    }
    setMouseOutEvent(fn){
        this.mMouseOut = fn
    }
    setMouseMoveEvent(fn){
        this.mMouseMove = fn
    }
    setSelectEvent(fn){
        this.mItemSelect = fn
    }

    setMouseDownEvent(fn){
        this.mMouseDown = fn
    }


    setCellFunction(fn){
        this.cellFunction = fn
    }

    updateHolders(){
        this.holders.forEach(holder=>holder.resizeHolder(this.cellSizes))
    }

    createViewHolder(parent, viewType) {
        let h = new DynamicHolder(this.context)
        h.resizeHolder(this.cellSizes)
        this.holders.push(h)
        return h;
    }

    setData(data,names,sizes){
        this.data = data
        this.activationsFields.clear()
        for (let i = 0; i < this.data.length; i++) {
            this.activationsFields.set(this.data[i][this.activationField],i)
        }

        this.cellNames = names
        this.cellSizes = sizes

        this.updateHolders()
        this.notifyDataSetChanged()
    }

    getItemCount() {
        return this.data.length;
    }


    selectByField(field){
        let index = this.activationsFields.get(field)
        if (index!=null){
            this.selectByIndex(index)
        }else{
            this.selectedElement = field
        }
    }

    clickByIndex(index){
        let newSelectedElement = this.data[index][this.activationField]
        if (this.selectedElement !== newSelectedElement){
            if (this.mItemSelect) this.mItemSelect(newSelectedElement)
        }
        this.selectByIndex(index)
    }

    selectByIndex(index){
        let selectedId = this.data[index][this.activationField]

        if (this.selectedElement !== selectedId){
            if (this.selectedElement!=null){
                let oldSelectedElementIndex = this.activationsFields.get(this.selectedElement)
                this.selectedElement = selectedId;
                if (oldSelectedElementIndex!==undefined && oldSelectedElementIndex>=0){
                    this.notifyItemChanged(oldSelectedElementIndex)
                }
            }else{
                this.selectedElement = selectedId;
            }

            this.notifyItemChanged(index)
        }

    }



    /**
     * @param {DynamicHolder} holder
     * @param {number} position
     */
    onBindViewHolder(holder, position) {
        for (let i = 0; i < this.cellNames.length; i++) {
            let data
            if (this.cellFunction){
                data = this.cellFunction(this.data[position],this.cellNames[i].key,position)
            }else{
                if (this.cellNames[i].isPath){
                    // data = this.getNestedValue(this.data[position], this.cellNames[i].path);
                }else {
                    data = this.data[position][this.cellNames[i].key]
                }
            }
            holder.getCell(i).setTextContent(data)
        }
        holder.activate(this.data[position][this.activationField] === this.selectedElement)

        holder.mHolder.onMouseClickListener(e=>{
            this.clickByIndex(position)
        })
        holder.mHolder.onMouseOverListener(e=>{
            if (this.mMouseIn) this.mMouseIn(position,this.data[position],e)
        })
        holder.mHolder.onMouseOutListener(e=>{
            if (this.mMouseOut) this.mMouseOut(position,this.data[position],e)
        })
        holder.mHolder.onMouseMoveListener(e=>{
            if (this.mMouseMove) this.mMouseMove(position,this.data[position],e)
        })
        holder.mHolder.onMouseDoubleClickListener(e=>{
            if (this.mDouble) this.mDouble(position,this.data[position],e)
        })
        holder.mHolder.onMouseDownListener(e=>{
            if (this.mMouseDown) this.mMouseDown(position,this.data[position],e)
        })
    }
}