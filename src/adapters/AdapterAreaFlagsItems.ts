import {Adapter} from "@casperui/recyclerview/widget/Adapter";
import {ViewHolder} from "@casperui/recyclerview/widget/ViewHolder";
import {View} from "@casperui/core/view/View";
import {BXNode} from "@casperui/core/utils/bxml/BXNode";
import {BXNodeContent} from "@dz/xml/XMLTreeContent";
import {TreeNode} from "@dz/adapters/TreeNode";
import {R} from "@dz/R";
import {VisibleFlags} from "@dz/dayz/types/VisibleFlags";
import {AreaFlagHoverEvents} from "@dz/model/BaseConfig";
import {
    DZ_DEFAULT_USAGE_COLORS,
    DZ_DEFAULT_USAGE_COLORS_DEF,
    DZ_DEFAULT_VALUE_COLORS_DEF
} from "@dz/dayz/DZDefaultAreaFlags";


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
    private mRawData: BXNodeContent;
    private mTreeData: TreeNode;
    private mTreeOutput: Array<TreeNode> = [];
    private selectedElement: TreeNode;
    private mVisibleFlags: VisibleFlags = {
        visibleValueFlagsMask: 0,
        visibleUsageFlagsMask: 0
    } as VisibleFlags


    private onHoverChange: (area: AreaFlagHoverEvents) => void;
    private onVisibleChange: (area: VisibleFlags) => void;


    createViewHolder(parent: View, viewType: number): TreeItem {
        let v = parent.context.getInflater().inflate(R.layout.area_flags.tree_element, true)
        let exp = (index) => {
            this.mTreeOutput[index].isExpanded = !this.mTreeOutput[index].isExpanded;
            this.updateOutput()
            this.notifyDataSetChanged()
        }

        let changeVisibleFn = (index, isVisible) => {
            let item = this.mTreeOutput[index]
            item.visibleEvent(isVisible)
            if (this.onVisibleChange) this.onVisibleChange(this.mVisibleFlags)
            this.onHoverChange(EMPTY)
        }

        return new TreeItem(v, exp, changeVisibleFn);
    }

    getItemCount(): number {
        return this.mTreeOutput.length;
    }


    setData(data: BXNodeContent) {
        this.mRawData = data
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

        this.mTreeData = new TreeNode("Area Flags", null, R.icons.arrow_down, null, null, null, false)
        this.mTreeData.isExpanded = true

        const uColors = DZ_DEFAULT_USAGE_COLORS_DEF
        const vColors = DZ_DEFAULT_VALUE_COLORS_DEF
        this.mTreeData.addChild(new TreeNode("Image map", null, R.icons.ic_list, (isVisible) => {
            this.mVisibleFlags.mapImage = isVisible
        }, ()=>this.mVisibleFlags.mapImage,null , true))
        const flags = this.mVisibleFlags
        for (const child of data.children) {

            switch (child.tag) {
                case "usageflags": {
                    let treeUsageFlags = new TreeNode("Usage Flags", null, R.icons.ic_usage_flags, (isVisible) => {
                        this.mVisibleFlags.visibleUsageFlagsMask = isVisible ? 0xFFFFFFFF : 0
                    },                   () => flags.visibleUsageFlagsMask != 0,null, true)
                    treeUsageFlags.isExpanded = true

                    this.mTreeData.addChild(treeUsageFlags)
                    for (let j = 0; j < child.children.length; j++) {
                        let usage = child.children[j]
                        const mask = (1 << j)
                        treeUsageFlags.addChild(new TreeNode(
                            usage.attrs.name as string,
                            null,
                            R.icons.ic_usage_flags,
                            (isVisible) => {
                                flags.visibleUsageFlagsMask ^= mask
                            },
                            () => (flags.visibleUsageFlagsMask & mask) != 0,
                            uColors[j % uColors.length],
                            true))
                    }
                    break
                }
                case "valueflags": {
                    let nodeValueFlags = new TreeNode("Value Flags", null, R.icons.ic_value_flags, (isVisible) => {
                        this.mVisibleFlags.visibleValueFlagsMask = isVisible ? 0xFF : 0
                    }, () => flags.visibleValueFlagsMask != 0,null, true)
                    nodeValueFlags.isExpanded = true
                    this.mTreeData.addChild(nodeValueFlags)
                    for (let j = 0; j < child.children.length; j++) {
                        let usage = child.children[j]
                        const mask = (1 << j)
                        nodeValueFlags.addChild(new TreeNode(usage.attrs.name as string, null, R.icons.ic_value_flags, (isVisible) => {
                            this.mVisibleFlags.visibleValueFlagsMask ^= mask
                        },   () => (flags.visibleValueFlagsMask & mask) != 0, vColors[j % vColors.length], true))
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

    }

    setHoverChange(fn: (area: AreaFlagHoverEvents) => void) {
        this.onHoverChange = fn
    }

    setVisibleChange(fn: (area: VisibleFlags) => void) {
        this.onVisibleChange = fn
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

    updateVisibleFlags(value: VisibleFlags) {
        console.log("updateVisibleFlags", value)
        this.mVisibleFlags = value
        this.updateOutput()
        this.notifyDataSetChanged()
    }
}