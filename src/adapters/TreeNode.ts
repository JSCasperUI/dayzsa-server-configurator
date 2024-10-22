import {AreaFlagHoverEvents} from "@dz/model/BaseConfig";

export class TreeNode {

    title:string;
    visibleEvent:(isVisible:boolean)=>void
    mObject:any
    children = [];
    level = 0;
    iconId:number;
    isExpanded = false;
    parent:TreeNode = null;
     color: string;
     isSwitchVisible: boolean;
     hasVisible: () => boolean;
    constructor(title:string,obj:any, iconId = -1,visibleEvent:(isVisible:boolean)=>void,hasVisible:()=>boolean,color:string,isSwitchVisible:boolean) {
        this.title = title;
        this.hasVisible = hasVisible
        this.isSwitchVisible = isSwitchVisible
        if (color){
            this.color = color
            if (color.indexOf("rgba")>-1){
                let tmp= color.split(",")
                tmp[3] = "1)"
                this.color = tmp.join(",")
            }
        }

        this.visibleEvent = visibleEvent
        this.mObject = obj
        this.children = [];
        this.level = 0;
        this.iconId = iconId;
        this.isExpanded = false;
        this.parent = null;
    }

    addChild(node:TreeNode) {
        node.level = this.level + 1;
        node.parent = this
        this.children.push(node);
    }

    toggle() {
        this.isExpanded = !this.isExpanded;
    }
}