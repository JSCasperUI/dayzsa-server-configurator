import {Adapter} from "@casperui/recyclerview/widget/Adapter";
import {ViewHolder} from "@casperui/recyclerview/widget/ViewHolder";
import {View} from "@casperui/core/view/View";
import {BXNode} from "@casperui/core/utils/bxml/BXNode";
import {BXNodeContent} from "@dz/space/xml/XMLTreeContent";
import {TreeNode} from "@dz/adapters/TreeNode";
import {R} from "@dz/R";
import {VisibleFlags} from "@dz/dayz/types/VisibleFlags";
import {AreaFlagHoverEvents} from "@dz/models/BaseConfig";
import {
    DZ_DEFAULT_USAGE_COLORS,
    DZ_DEFAULT_USAGE_COLORS_DEF,
    DZ_DEFAULT_VALUE_COLORS_DEF
} from "@dz/dayz/DZDefaultAreaFlags";
import {ModelAreaFlag} from "@dz/models/ModelAreaFlag";
import {ILiveManager} from "@casperui/core/live/ILiveManager";


class TreeItem extends ViewHolder {

    title: View
    itemIcon: View
    currentIndex = 0
    switcher = false
    showHide: View
    isActive = false
    show_hide_eye: View;
    private isVisible: boolean;

    constructor(view: View, gEvent: (index: number) => void, gVisible: (index: number, isVisible: boolean) => void) {
        super(view);
        this.title = view.byId(R.id.title)
        this.itemIcon = view.byId(R.id.item_icon)
        this.show_hide_eye = view.byId(R.id.show_hide)
        this.currentIndex = 0
        this.switcher = false
        this.isVisible = true
        this.showHide = view.byId(R.id.open_close_icon)
        this.isActive = false

        this.showHide.setOnClickListener((e) => {
            this.expand(!this.switcher)
            gEvent(this.getIndex())
            e.stopPropagation()
        })

        this.show_hide_eye.setOnClickListener((e) => {
            this.setVisibleFlag(!this.isVisible)
            gVisible(this.getIndex(), this.isVisible)
            e.stopPropagation()
        })

    }

    enableEye(isEnabled: boolean) {
        if (isEnabled) {
            this.show_hide_eye.setVisibility(true)
        } else {
            this.show_hide_eye.setVisibility(false)
        }
    }

    activate(value: boolean) {
        if (value !== this.isActive) {
            this.isActive = value;
            if (this.isActive) {
                this.mHolder.addClass("active")
            } else {
                this.mHolder.removeClass("active")
            }
        } else {
        }

    }

    getIndex() {
        return this.currentIndex
    }

    setVisibleSwitch(visible: boolean) {
        if (visible) {
            this.showHide.setOpacity(1)
        } else {
            this.showHide.setOpacity(0)
        }
    }

    setVisibleFlag(visible: boolean) {
        this.isVisible = visible
        if (visible) {
            this.show_hide_eye.setSVGById(R.icons.eye_open)
        } else {
            this.show_hide_eye.setSVGById(R.icons.eye_close)
        }
    }

    expand(value: boolean) {
        this.switcher = value
        if (value) {
            this.showHide.setSVGById(R.icons.arrow_down_tin)
        } else {
            this.showHide.setSVGById(R.icons.arrow_right_tin)
        }
    }

    setIcon(id: number) {
        this.itemIcon.setSVGById(id)
    }
}

const EMPTY = {usageMask: 0, valueMask: 0} as AreaFlagHoverEvents

export class AdapterAreaFlagsItems extends Adapter<TreeItem> {
    private mTreeData: TreeNode;
    private mMapVisible = true
    private mTreeOutput: Array<TreeNode> = [];
    private selectedElement: TreeNode;
    private mVisibleFlags: VisibleFlags = {
        layer0: 0,
        layer1: 0,
        layer2: 0,
        layer3: 0,
        layer4: 0,
    } as VisibleFlags
    private mModelAreaFlag: ModelAreaFlag;

    constructor(modelAreaFlag:ModelAreaFlag,live:ILiveManager) {
        super();
        this.mModelAreaFlag = modelAreaFlag

        modelAreaFlag.mVisibleFlags.observe(live,value => this.updateVisibleFlags(value))
        modelAreaFlag.mMapImageVisible.observe(live,value => {
            this.mMapVisible = value
            this.update()
        })
    }


    private onHoverChange: (area: AreaFlagHoverEvents) => void;


    createViewHolder(parent: View, viewType: number): TreeItem {
        let v = parent.ctx().getInflater().inflate(R.layout.area_flags.tree_element, true)
        let exp = (index) => {
            this.mTreeOutput[index].isExpanded = !this.mTreeOutput[index].isExpanded;
            this.updateOutput()
            this.notifyDataSetChanged()
        }

        let changeVisibleFn = (index, isVisible) => {
            let item = this.mTreeOutput[index]
            item.visibleEvent(isVisible)

            this.mModelAreaFlag.mVisibleFlags.setValue(this.mVisibleFlags)
            this.mModelAreaFlag.mMapImageVisible.setIfChanged(this.mMapVisible)
            this.onHoverChange(EMPTY)
        }

        return new TreeItem(v, exp, changeVisibleFn);
    }

    getItemCount(): number {
        return this.mTreeOutput.length;
    }


    setData(data: BXNodeContent) {
        this.updateData(data)
    }

    private updateData(data: BXNodeContent) {
        if (data.tag === "lists") {
            this.makeTagLists(data)
        }

        this.updateOutput()


    }


    private updateOutput() {
        if (!this.mTreeData) return
        const result = [];

        const traverse = (node: TreeNode) => {
            result.push(node);
            if (node.isExpanded) {
                node.children.forEach(child => traverse(child));
            }
        };
        traverse(this.mTreeData);
        this.mTreeOutput = result
    }

    private makeTagLists(data: BXNodeContent) {

        this.mTreeData = new TreeNode("DayZ Flags map", null, R.icons.ic_params, null, null, null, false)
        this.mTreeData.isExpanded = true

        const uColors = DZ_DEFAULT_USAGE_COLORS_DEF
        const vColors = DZ_DEFAULT_VALUE_COLORS_DEF
        this.mTreeData.addChild(new TreeNode("Image map", null, R.icons.image, (isVisible) => {
            this.mMapVisible = isVisible
        }, ()=>this.mMapVisible,"#38db53" , true))
        const flags = this.mVisibleFlags
        for (const child of data.children) {

            switch (child.tag) {
                case "usageflags": {
                    let treeUsageFlags = new TreeNode("Usage Flags", null, R.icons.ic_usage_flags, (isVisible) => {
                        this.mVisibleFlags.layer0 = isVisible ? 0xFFFFFFFF : 0
                    },                   () => flags.layer0 != 0,null, true)
                    treeUsageFlags.isExpanded = true

                    this.mTreeData.addChild(treeUsageFlags)
                    for (let j = 0; j < child.children.length; j++) {
                        let usage = child.children[j]
                        const mask = (1 << j)
                        let node = new TreeNode(
                            usage.attrs.name as string,
                            null,
                            R.icons.ic_usage_flags,
                            (isVisible) => {
                                flags.layer0 ^= mask
                            },
                            () => (flags.layer0 & mask) != 0,
                            uColors[j % uColors.length],
                            true)

                        node.mFlag.layer = 0
                        node.mFlag.bit = j
                        treeUsageFlags.addChild(node)
                    }
                    break
                }
                case "valueflags": {
                    let nodeValueFlags = new TreeNode("Value Flags", null, R.icons.ic_value_flags, (isVisible) => {
                        this.mVisibleFlags.layer1 = isVisible ? 0xFFFFFFFF : 0
                    }, () => flags.layer1 != 0,null, true)
                    nodeValueFlags.isExpanded = true
                    this.mTreeData.addChild(nodeValueFlags)
                    for (let j = 0; j < child.children.length; j++) {
                        let usage = child.children[j]
                        const mask = (1 << j)
                        let node = new TreeNode(usage.attrs.name as string, null, R.icons.ic_value_flags, (isVisible) => {
                            this.mVisibleFlags.layer1 ^= mask
                        },   () => (flags.layer1 & mask) != 0, vColors[j % vColors.length], true)

                        node.mFlag.layer = 1
                        node.mFlag.bit = j
                        nodeValueFlags.addChild(node)
                    }
                    break
                }
            }


        }
    }

    clickByIndex(index: number) {
        this.selectByIndex(index)
    }

    selectByIndex(index) {
        let newSelectedElement = this.mTreeOutput[index]

        if (this.selectedElement !== newSelectedElement) {
            if (this.selectedElement != null) {
                let oldSelectedElementIndex = this.mTreeOutput.indexOf(this.selectedElement)
                this.selectedElement = newSelectedElement;
                if (oldSelectedElementIndex >= 0) {
                    this.notifyItemChanged(oldSelectedElementIndex)
                }
            } else {
                this.selectedElement = newSelectedElement;
            }

            this.notifyItemChanged(index)
        }


        this.mModelAreaFlag.mFlagMapItemSelected.setValue(this.selectedElement.mFlag)

    }

    setHoverChange(fn: (area: AreaFlagHoverEvents) => void) {
        this.onHoverChange = fn
    }



    onBindViewHolder(holder: TreeItem, position: number): void {
        let o = this.mTreeOutput[position]

        holder.enableEye(o.isSwitchVisible)

        if (o.hasVisible){

            holder.setVisibleFlag(o.hasVisible())
        }else{
            holder.setVisibleFlag(false)
        }



        holder.activate(this.selectedElement === o)
        holder.currentIndex = position
        holder.expand(o.isExpanded)
        holder.setVisibleSwitch(o.children.length > 0)
        if (o.iconId > 0) {
            holder.setIcon(o.iconId)
            holder.itemIcon.getElement().style.color = o.color
        }

        holder.mHolder.getElement().style.paddingLeft = o.level * 20 + 'px'
        holder.title.setTextContent(o.title)

        holder.mHolder.makeSafeEvent("click", () => {

            this.clickByIndex(position)
        })
        holder.show_hide_eye.makeSafeEvent("mouseenter", () => {
            if (this.onHoverChange) {
                // this.onHoverChange(o.flags)
            }
        })
        holder.show_hide_eye.makeSafeEvent("mouseleave", () => {
            if (this.onHoverChange) {
                this.onHoverChange(EMPTY)
            }
        })

    }

    update(){
        this.updateOutput()
        this.notifyDataSetChanged()
    }
    updateVisibleFlags(value: VisibleFlags) {
        this.mVisibleFlags = value
        this.update()
    }
}