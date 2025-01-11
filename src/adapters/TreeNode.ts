import {AreaFlagHoverEvents} from "@dz/models/BaseConfig";
import {FlagMapItemSelected} from "@dz/models/ModelAreaFlag";

export class TreeNode {

    mFlag:FlagMapItemSelected = {layer:0,bit:0}
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