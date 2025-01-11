import {BaseMapView} from "@dz/views/base/BaseMapView";
import {Canvas} from "@casperui/core/graphics/Canvas";
import {MainActivity} from "@dz/MainActivity";
import {AreaFlagsFile} from "@dz/dayz/types/AreaFlagsFile";
import {AreaFlagRender} from "@dz/dayz/AreaFlagRender";
import {Bitmap} from "@casperui/core/graphics/Bitmap";
import {Rect} from "@casperui/core/graphics/Rect";
import {R} from "@dz/R";
import {DRAW_MODE, ModelAreaFlag} from "@dz/models/ModelAreaFlag";
import {VisibleFlags} from "@dz/dayz/types/VisibleFlags";
import {Context} from "@casperui/core/content/Context";
import {View} from "@casperui/core/view/View";
import {Paint} from "@casperui/core/graphics/Paint";
import {DZ_DEFAULT_USAGE_COLORS_DEF, DZ_DEFAULT_VALUE_COLORS_DEF} from "@dz/dayz/DZDefaultAreaFlags";


export class FragmentAreaFlags extends BaseMapView {
    static SPLIT_NAME  = "area_map";



    private mAreaRender: AreaFlagRender;
    private mAreaFlagsFile: AreaFlagsFile;
    private mAreaBitmap: Bitmap;
    private mVisibleFlags:VisibleFlags;
    private mModelAreaFlag: ModelAreaFlag;
    private toolsView: View;
    private mCursorX: number;
    private mCursorY: number;
    private paintDrawCursor = new Paint(Paint.FILL)
    private mPenRadius = 100



    constructor(context:Context) {
        super(context);
        this.mModelAreaFlag = (this.getActivity() as MainActivity).mdAreaFlag;

        this.mVisibleFlags = this.mModelAreaFlag.mVisibleFlags.getValue()

        this.toolsView = this.ctx().getInflater().inflate(R.layout.area_flags.tools)



    }


    initTools(){
        let isCtrlPressed = false
        let views = this.toolsView.byIds([R.id.none,R.id.pen_circle,R.id.pen_circle_clear,R.id.pen_clear])
        let modes =  [DRAW_MODE.NONE,DRAW_MODE.DRAW_CIRCLE,DRAW_MODE.DRAW_CLEAR_CIRCLE,DRAW_MODE.CLEAR]
        let icons =  [R.icons.hand,R.icons.brush,R.icons.brush_clear,R.icons.eraser,R.icons.brush]

        const clearActive = (exclude:View) =>{
            for (const view of views) {
                if (view!=exclude){
                    view.deactivate()
                }
            }
        }
        views.forEach((view:View,index)=>{
            view.setSVGById(icons[index])
            view.vEvent(View.CLICK,()=>{
                this.mModelAreaFlag.mDrawMode.setValue(modes[index])
            })
        })
        let lColors = [DZ_DEFAULT_USAGE_COLORS_DEF,DZ_DEFAULT_VALUE_COLORS_DEF]
        this.mModelAreaFlag.mFlagMapItemSelected.observe(this,value => {
            let colors = lColors[value.layer]
            this.paintDrawCursor.setFillColor(colors[value.bit % colors.length])
            this.draw()
        })


        const move = (moveEvent) => {
            const mv = this.mapMove
            if (mv.isDragging) return
            this.mCursorX = Math.round(((moveEvent.offsetX * this.dpi) - mv.offsetX)/mv.scale)
            this.mCursorY = Math.round(((moveEvent.offsetY * this.dpi) - mv.offsetY)/mv.scale)

            this.draw();
        };
        this.mModelAreaFlag.mDrawMode.observe(this,value => {
            let view = views[modes.indexOf(value)]
            view.activate()
            clearActive(view)
            this.setLeftMouseDrag(value == DRAW_MODE.NONE)
            this.canvasView.getElement().removeEventListener('mousemove', move);
            if (value != DRAW_MODE.NONE){
                this.canvasView.getStyle().cursor = `${this.ctx().getResources().getSvgUrlBase64(R.icons.cursor_brush)},auto`
                //
                this.canvasView.getElement().addEventListener('mousemove', move);
            }
            this.draw();
        })

        let tmpRadius = this.mPenRadius
        const changePenSize = (moveEvent) => {
            const mv = this.mapMove
            if (mv.isDragging) return

            if (isCtrlPressed) {

                let deltaY = moveEvent.movementY * -1; // Получаем смещение по Y
               if (tmpRadius < 10){
                    deltaY = Math.sign(deltaY)*0.25
                }

                tmpRadius += deltaY ; // Подобранный множитель для изменения чувствительности
                tmpRadius = Math.min(Math.max(1, tmpRadius),400) // Ограничение на минимальный радиус


                this.mPenRadius = Math.ceil(tmpRadius)
            }


            this.draw();
        };

        document.addEventListener("keydown", (event) => {

            if (event.key === "Control" && !isCtrlPressed) {
                isCtrlPressed = true;
                console.log("isCtrlPressed",isCtrlPressed)
                document.body.requestPointerLock(); // Блокируем курсор
                document.body.style.cursor = "ns-resize"; // Изменяем курсор на вертикальный
                document.addEventListener("mousemove",changePenSize)
            }
        });

// При отпускании Ctrl
        document.addEventListener("keyup", (event) => {
            if (event.key === "Control" && isCtrlPressed) {
                isCtrlPressed = false;
                document.exitPointerLock(); // Разблокируем курсор
                document.body.style.cursor = "default"; // Возвращаем курсор по умолчанию
                document.removeEventListener("mousemove",changePenSize)
            }
        });
    }

    async onCreated(): Promise<void> {
        await super.onCreated();

        this.initTools()
        // this.paintDrawCursor.setFillColor("rgba(123,174,213,0.33)")
        this.byId(R.id.fillContent).addView(this.toolsView)

        let lvConfig = (this.getActivity() as MainActivity).mBaseConfigVM;

        lvConfig.mAreaFlagBinary.observe(this, value => {
            this.loadAreaFlagData(value)
        })
        this.mModelAreaFlag.mVisibleFlags.observe(this,value => {
            this.mVisibleFlags = value
            this.redrawArea()
        })

        this.mModelAreaFlag.mMapImageVisible.observe(this,value => {
            this.isDrawMapImage = value
            this.draw()
        })

    }

    onMouseDown(event: UIEvent) {
        let mode = this.mModelAreaFlag.mDrawMode.getValue()
        if (mode == DRAW_MODE.NONE || !this.mAreaBitmap) return


        const onMouseMoveD = (moveEvent) => {

            let posX = Math.round(this.mCursorX)
            let posY = Math.round(this.mCursorY)

            let radius = this.mPenRadius
            let selected = this.mModelAreaFlag.mFlagMapItemSelected.getValue()
            let clip = new Rect(posX - radius,posY - radius, posX+radius, posY+radius)
            this.mAreaRender.drawCircle(posX,posY,radius,selected.layer,selected.bit,mode)
            // this.areaRender.printAreaFlagsToBitmap(this.mValueFlags,this.mUsageFlags,clip)
            this.mAreaRender.drawToBitmap([this.mVisibleFlags.layer0,this.mVisibleFlags.layer1],clip)
            this.mAreaBitmap.setPixelsDitry(this.mAreaRender.getImageData(),clip)
            this.draw();


        };
        onMouseMoveD(event)

        const onMouseUpX = () => {
            document.removeEventListener('mousemove', onMouseMoveD);
            document.removeEventListener('mouseup', onMouseUpX);
        };

        document.addEventListener('mousemove', onMouseMoveD);
        document.addEventListener('mouseup', onMouseUpX);

    }

    async loadAreaFlagData(area: AreaFlagsFile) {
        if (!area) return


        this.mAreaRender = new AreaFlagRender(this.ctx())
        await this.mAreaRender.initV2(area)
        this.mAreaFlagsFile = area


        // this.mapRect.mRight = this.mAreaFlags.mMapWidth
        // this.mapRect.mBottom = this.mAreaFlags.mMapWidth


        this.mAreaBitmap = Bitmap.createBitmap(this.mAreaFlagsFile.mMapWidth, this.mAreaFlagsFile.mMapHeight)


        this.redrawArea()

    }

    redrawArea(){
        if (!this.mAreaBitmap) return
        let width = this.mAreaFlagsFile.mMapWidth
        let height = this.mAreaFlagsFile.mMapHeight

        let clip = new Rect(0,0, width, height)
        // this.areaRender.printAreaFlagsToBitmap(this.mValueFlags,this.mUsageFlags,clip)
        // this.mAreaBitmap.setPixelsDitry(this.areaRender.imageData,clip)
        // this.areaRender.drawToBitmap([this.mUsageFlags,this.mValueFlags],clip)
        let time = this.mAreaRender.drawToBitmap([this.mVisibleFlags.layer0,this.mVisibleFlags.layer1],clip)

        this.mAreaBitmap.setPixelsDitry(this.mAreaRender.getImageData(),clip)


        // this.printAreaFlagsToBitmap(this.mAreaBitmap, this.mValueFlags,this.mUsageFlags)
        // this.printAreaFlagsToBitmapPreview(this.mPreviewBitmap, 1,0)
        this.draw()
    }


    protected onDraw(canvas: Canvas) {
        if (this.mAreaBitmap)
        canvas.drawBitmap(this.mAreaBitmap,null,this.mMapRect)
        let mode = this.mModelAreaFlag.mDrawMode.getValue()
        let x = Math.round(this.mCursorX)
        let y = Math.round(this.mCursorY)
        if (mode != DRAW_MODE.NONE){
            if (this.mPenRadius > 3){
                canvas.drawEllipse(x,y,this.mPenRadius,this.mPenRadius,this.paintDrawCursor)
            }else{
                canvas.drawRectC(x,y,x+this.mPenRadius,y+this.mPenRadius,this.paintDrawCursor)
            }

        }


    }
}