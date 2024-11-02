import {View} from "@casperui/core/view/View";
import {JFragment} from "@casperui/core/app/JFragment";
import {Context} from "@casperui/core/content/Context";
import {LiveDataConfig} from "@casperui/core/live/LiveDataConfig";
const START_RANGE = 100000
export const SPLIT_TYPE = {
    INFLATE:-2,
    UNDEF:-1,
    CONTENT:0,
    HORIZONTAL:1,
    VERTICAL:2
}
interface ISplitAreaContainer {
    mSplitContainerLiveData?:LiveDataConfig<any>
}
export abstract class LayoutFragment extends JFragment {


    isContentConstructor:boolean = false;
    isContentFragment = true
    containerIndex = START_RANGE
    mType:number
    elements = []
    contentFragment = null
    mSplitContainerLiveData:LiveDataConfig<any>
    meta:any = {}
    private isActiveSplitArea: boolean;
    private removeInjection?: () => void;
    private onSplitEvent?: () => void;
    private injectSplit?: () => void;
    constructor(context:Context,isContent,type = SPLIT_TYPE.UNDEF) {
        super(context);
        this.isContentConstructor = isContent
        this.isContentFragment = true
        this.containerIndex = START_RANGE
        this.mType = type
        this.elements = []
        this.contentFragment = null;


        let appContext = context.getApplicationContext() as ISplitAreaContainer;
        if (!appContext.mSplitContainerLiveData) {
            appContext.mSplitContainerLiveData = new LiveDataConfig({isSplitEnabled: false, type: -1})
        }

        this.mSplitContainerLiveData = appContext.mSplitContainerLiveData
        appContext.mSplitContainerLiveData.observe(this, (value) => {
            if (this.isType(SPLIT_TYPE.CONTENT)) {
                if (value.config.isSplitEnabled) {
                    this.activateSplitArea(value.config.type)
                } else {
                    this.deactivateSplitArea()
                }
            }
        })
    }

    onCreateView(inflater, container) {
        return new View(this.mContext,"div",{"class":"split-container"});
    }

    onCreated() {
        this.setType(this.mType)
        if (this.mType !== SPLIT_TYPE.INFLATE) {

            if (!this.isContentConstructor) {
                if (this.isType(SPLIT_TYPE.UNDEF)) {
                    this.contentFragment = this.createInstance(true)
                    this.getFragmentManager().pushFragment(START_RANGE, this.contentFragment, this.getFragmentView())
                }
            } else {
                this.setType(SPLIT_TYPE.CONTENT)
            }
        }

        // this.getFragmentView().node.addEventListener("dblclick", (event) => {
        //     // this.split50x50_horizontal()
        //     console.log("CLIASDASDASD")
        //     let type = SPLIT_TYPE.HORIZONTAL
        //     if (event.ctrlKey){
        //         type = SPLIT_TYPE.VERTICAL
        //     }
        //     this.mSplitContainerLiveData.updateObject({isSplitEnabled: true, type: type})
        // });

    }
    onAttach() {}
    onDetach() {}


    /**
     * @param {number} splitType
     * @param {number} splitPosition
     */
    splitArea(splitType,splitPosition){
        console.log("splitPosition:",splitPosition)
        if (this.elements.length > 0){
            let lastElement = this.elements[this.elements.length-1]
            let divider = new View(this.ctx(), "div", {"class": "divider"})
            let right = lastElement.createInstance(true)
            this.elements.push(right)
            this.getFragmentView().addView(divider)
            this.addResizeFunctionality(divider,SPLIT_TYPE.HORIZONTAL === this.mType)
            this.getFragmentManager().pushFragment(START_RANGE+this.elements.length,right,this.getFragmentView())
        }else{

            let parent = this.getParentFragment()
            if (parent && parent instanceof LayoutFragment &&  (parent.isType(splitType) || parent.isType(SPLIT_TYPE.UNDEF))){
                parent.splitArea(splitType,splitPosition)
            }else if (this.contentFragment) {

                let divider = new View(this.ctx(), "div", {class: "divider"})
                this.setType(splitType)
                // this.getFragmentManager().dropFragment(START_RANGE,this.getFragmentView()) //TODO FIX

                let left = this.contentFragment
                let right = this.contentFragment.createInstance(true)
                this.elements.push(left)
                this.elements.push(right)
                this.getFragmentManager().pushFragment(START_RANGE,left,this.getFragmentView())
                this.getFragmentView().addView(divider)

                this.addResizeFunctionality(divider,SPLIT_TYPE.HORIZONTAL === splitType)
                this.getFragmentManager().pushFragment(START_RANGE+1,right,this.getFragmentView())
            }else{

                (this.getParentFragment() as LayoutFragment) .swapChild(this,splitType,splitPosition)

            }
        }
    }

    pushContainer(fragment){
        if (this.elements.length>0) {
            let divider = new View(this.ctx(), "div", {class: "divider"})
            this.getFragmentView().addView(divider)
            this.addResizeFunctionality(divider,SPLIT_TYPE.HORIZONTAL === this.mType)
        }
        this.elements.push(fragment)
        this.getFragmentManager().pushFragment(START_RANGE+this.elements.length,fragment,this.getFragmentView())
    }

    swapChild(childFragment,type,position){
        let container = this.createInstance(false)
        container.mType = type
        container.startCreatingView()
        container.onCreated()
        this.elements[this.elements.indexOf(childFragment)] = container


        this.getFragmentManager().swapInContainer(childFragment,container,this.getFragmentView())

        let right = childFragment.createInstance(true)
        container.pushContainer(childFragment)
        container.pushContainer(right)
    }


    inflate(json:any){
        this.mType = json.type
        this.inflateRecursive(this,json,true)
    }


    inflateRecursive(container:LayoutFragment,json:any,root:boolean){

        if (json.child){
            let newContainer
            if (root){
                newContainer = this
            }else{
                newContainer = this.createInstance(false)
            }

            if (!newContainer.isFragmentCreated()){
                newContainer.mType = json.type
                newContainer.startCreatingView()
                newContainer.onCreated()
            }else{
                newContainer.setType(json.type)
            }

            if (json.l){
                newContainer.getFragmentView().getElement().style.flexBasis = `${json.l}%`;
            }
            if (!root)
                container.pushContainer(newContainer)
            for (let i = 0; i < json.child.length; i++) {
                this.inflateRecursive(newContainer,json.child[i],false)
            }

        }else{
            let instance = this.createInstance(true)
            instance.meta = json.meta
            instance.mType = 0
            instance.startCreatingView()
            instance.onCreated()
            if (json.l){
                instance.getFragmentView().getElement().style.flexBasis = `${json.l}%`;
            }
            container.pushContainer(instance)

            // instance.node.style.flexBasis = `${json.child[i].l}%`;

        }





    }



    abstract createInstance(isContent:boolean):LayoutFragment


    /** @param {number} type */
    setType(type){
        this.mType = type
        let view = this.getFragmentView()
        switch (type){
            case SPLIT_TYPE.CONTENT : {
                view.removeClass("split-container")
                view.removeClass("vertical")
                view.removeClass("horizontal")
                view.addClass("split-container-area")
                break
            }
            case SPLIT_TYPE.HORIZONTAL : {
                view.addClass("split-container")
                view.removeClass("split-container-area")
                view.swapClass("vertical", "horizontal")

                break
            }
            case SPLIT_TYPE.VERTICAL : {
                view.addClass("split-container")
                view.removeClass("split-container-area")
                view.swapClass("horizontal", "vertical")
                break
            }
        }
    }


    /**
     * @param {number} type
     * @return {boolean}
     */
    isType(type){
        return type === this.mType
    }



    activateSplitArea(type) {
        if (this.isActiveSplitArea) return;

        // if (!this.isContentArea) return

        this.isActiveSplitArea = true;

        let isHorizontalActivation = type === SPLIT_TYPE.HORIZONTAL
        let sClass = "split_h"

        if (isHorizontalActivation) {
            sClass = "split_v"
        }

        console.log("activateSplitArea")
        let splitView = new View(this.ctx(), "div", {class: sClass})
        let v = this.getFragmentView()
        this.removeInjection = () => {
            v.mNode.removeEventListener('mousemove', mouseMoveHandler);
            v.removeView(splitView)
        }

        this.injectSplit = () => {
            console.log("injectSplit")
            v.mNode.addEventListener('mousemove', mouseMoveHandler);
            v.addView(splitView)
            // document.removeEventListener('mouseup', stopResize);
        };
        const rect = v.getElement().getBoundingClientRect();
        let lastLocalX = 0
        let lastLocalY = 0
        const mouseMoveHandler = (e) => {

            lastLocalX = e.clientX - rect.left;
            lastLocalY = e.clientY - rect.top;
            if (isHorizontalActivation) {
                splitView.getElement().style.left = `${lastLocalX}px`;
                splitView.getElement().style.top = `0`;

            } else {
                splitView.getElement().style.left = `0`;
                splitView.getElement().style.top = `${lastLocalY}px`;

            }
        }

        this.onSplitEvent = () => {
            this.removeInjection()
            this.deactivateSplitArea()
            let type = this.mSplitContainerLiveData.getValue().config.type
            this.mSplitContainerLiveData.updateAttribute("isSplitEnabled",false)
            let positionAtContainer = type === SPLIT_TYPE.HORIZONTAL?lastLocalX:lastLocalY
            this.splitArea(type,positionAtContainer)
        }

        v.mNode.addEventListener("mouseenter", this.injectSplit)
        v.mNode.addEventListener("mouseleave", this.removeInjection)
        v.mNode.addEventListener("click", this.onSplitEvent)
        if (v.getElement().matches(':hover')) {
            this.injectSplit()

        }
    }

    deactivateSplitArea() {

        if (this.isActiveSplitArea) {
            let v = this.getFragmentView()
            this.isActiveSplitArea = false
            if (this.injectSplit) {

                v.mNode.removeEventListener("click", this.onSplitEvent)
                v.mNode.removeEventListener("mouseenter", this.injectSplit)
                v.mNode.removeEventListener("mouseleave", this.removeInjection)
                this.injectSplit = null
                this.removeInjection = null
            }
        }


    }

    addResizeFunctionality(divider, isX = true) {
        let isResizing = false;
        let startX;
        let initialWidths = [];
        let containerWidth = 0
        let maxWidth = 0
        let leftWith = 0
        let left = null
        let right = null


        let vars = {
            clientX: "clientX",
            offsetWidth: "offsetWidth",
            cursor: 'col-resize'
        }

        if (!isX) {
            vars.clientX = "clientY"
            vars.offsetWidth = "offsetHeight"
            vars.cursor = "row-resize"
        }
        let v = this.getFragmentView()
        divider.getElement().addEventListener('mousedown', (e) => {
            e.preventDefault();
            isResizing = true;
            startX = e[vars.clientX];

            initialWidths = this.elements.map(child => child.getFragmentView().getElement()[vars.offsetWidth]);

            containerWidth = v.mNode[vars.offsetWidth] - (this.elements.length - 1) * 3;
            // const previousNode = divider.node.previousElementSibling;
            // const nextNode = divider.node.nextElementSibling;

            let idx = v.indexView(divider)

            left = v.getChildren()[idx - 1]
            right = v.getChildren()[idx + 1]

            const leftIndex = this.elements.findIndex((object) => object.getFragmentView() === left);
            const rightIndex = leftIndex+1;

            maxWidth = initialWidths[leftIndex] + initialWidths[rightIndex];
            leftWith = initialWidths[leftIndex]
            document.documentElement.style.cursor = vars.cursor;
            document.body.style.pointerEvents = 'none';
            document.addEventListener('mousemove', resizeHandler);
            document.addEventListener('mouseup', stopResize);
        });

        const resizeHandler = (e) => {
            if (!isResizing) return;

            let dx = e[vars.clientX] - startX;

            let newLeftWidth = Math.max(Math.min(leftWith + dx, maxWidth - 25), 25)
            let newRightWidth = maxWidth - newLeftWidth;

            let leftWidthPercent = (newLeftWidth / containerWidth) * 100;
            let rightWidthPercent = (newRightWidth / containerWidth) * 100;


            left.getElement().style.flexBasis = `${leftWidthPercent}%`;
            right.getElement().style.flexBasis = `${rightWidthPercent}%`;
        };

        const stopResize = () => {
            isResizing = false;
            document.documentElement.style.cursor = ''
            document.body.style.pointerEvents = 'auto';
            document.removeEventListener('mousemove', resizeHandler);
            document.removeEventListener('mouseup', stopResize);
        };
    }

}