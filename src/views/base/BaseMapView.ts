import {JFragment} from "@casperui/core/app/JFragment";
import {Canvas} from "@casperui/core/graphics/Canvas";
import {AreaFlagsFile} from "@dz/dayz/types/AreaFlagsFile";
import {Bitmap} from "@casperui/core/graphics/Bitmap";
import {AreaFlagRender} from "@dz/dayz/AreaFlagRender";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";
import {View} from "@casperui/core/view/View";
import {R} from "@dz/R";
import {Paint} from "@casperui/core/graphics/Paint";
import {Rect} from "@casperui/core/graphics/Rect";
import {MainActivity} from "@dz/MainActivity";
import {cordToTile} from "@dz/space/MapUtils";

// 256*60
export interface MapDetails {
    worldWidth: number,
    worldHeight: number,
    mapWidth: number,
    mapHeight: number,scaleFactor:number
}
export interface Point {
    x:number,
    y:number
}

export class BaseMapView extends JFragment {

    private mCanvas: Canvas
    private MAX_ZOOM = 40


    protected isDrawMapImage: boolean = true;


    onCreateView(inflater: BXMLInflater, container: View): View {
        return inflater.inflate(R.layout.area_flags.main);
    }


    private mWidth = 256
    private mHeight = 256
    private mMapBitmap: Bitmap

    private p = new Paint()
    private mTextPaint = new Paint()
    protected mMapRect = new Rect(0, 0, 4096, 4096)

    private mapMove = {
        maxOffsetX: 0,
        maxOffsetY: 0,
        offsetX: -500,
        offsetY: -500,
        worldX:0,
        worldY:0,
        mapX:0,
        mapY:0,
        startX: 0,
        startY: 0,
        scale: 0.3,
        isDragging: false
    }
    private dpi = 1
    private canvasView: View

    private mCordsTextView: View
    private mMap: MapDetails = {
        worldWidth: 256 * 60,
        worldHeight: 256 * 60,
        mapWidth: 4096,
        mapHeight: 4096,
        scaleFactor:4096/(256 * 60)

    }


    private resizeCanvas() {
        let oldWidth = this.mCanvas.getCanvasWidth();
        let oldHeight = this.mCanvas.getCanvasHeight();

        this.canvasView.getElement().style.imageRendering = "pixelated"
        let bRect = this.getFragmentView().getElement().getBoundingClientRect()

        let ww = bRect.width - 1
        let hh = bRect.height - 1;

        this.getFragmentView().byId(R.id.fillContent).setWidth(ww)
        this.getFragmentView().byId(R.id.fillContent).setHeight(hh)

        let newWidth = Math.floor(ww * this.dpi);
        let newHeight = Math.floor(hh * this.dpi);


        const deltaX = (newWidth - oldWidth) / 2;
        const deltaY = (newHeight - oldHeight) / 2;


        this.mCanvas.setCanvasWidth(newWidth);
        this.mCanvas.setCanvasHeight(newHeight);

        this.mapMove.offsetX += deltaX;
        this.mapMove.offsetY += deltaY;

        this.mWidth = newWidth
        this.mHeight = newHeight
        this.onCanvasSizeChange(newWidth, newHeight)
        this.draw()
        // updateNewScale(1)
    }

    onCanvasSizeChange(newWidth: number, newHeight: number) {

    }

    async onCreated() {
        super.onCreated();
        this.mTextPaint.setFillColor("rgba(255,248,248,0.98)")
        this.mTextPaint.setStyle(Paint.FILL)
        this.dpi = window.devicePixelRatio || 1
        this.p.setStyle(Paint.STROKE)
        this.p.setStrokeColor("rgba(255,163,128,0.4)")//7C
        // this.p.setStrokeColor("rgba(255,163,128,0.4)")//7C
        this.p.setStrokeWidth(1)

        this.canvasView = this.byId(R.id.canvas)
        this.mCanvas = new Canvas(this.canvasView)
        let canvas = this.mCanvas

        this.mMapBitmap = await Bitmap.loadBitmap("./map.png")

        this.mCordsTextView = this.byId(R.id.cords)


        const updateNewScale = (zoom) => {
            let w = canvas.getCanvasWidth()
            let h = canvas.getCanvasHeight()

            let maxWH = Math.max(w, h)
            let minZoom = (maxWH - maxWH / 2) / Math.max(this.mMapRect.getWidth(), this.mMapRect.getHeight());

            const centerX = w / 2;
            const centerY = h / 2;
            const mapCenterX = (centerX - this.mapMove.offsetX) / this.mapMove.scale;
            const mapCenterY = (centerY - this.mapMove.offsetY) / this.mapMove.scale;
            this.mapMove.scale = Math.min(this.MAX_ZOOM, Math.max(minZoom, this.mapMove.scale * zoom));
            this.mapMove.offsetX = centerX - mapCenterX * this.mapMove.scale;
            this.mapMove.offsetY = centerY - mapCenterY * this.mapMove.scale;

            this.draw();
        }
        this.onSizeChangeListener((newWidth, newHeight) => {
            this.resizeCanvas()
        });


        this.canvasView.makeSafeEvent('mousemove', (moveEvent) => {

        })
        this.canvasView.makeSafeEvent('wheel', (event) => {
            event.preventDefault();
            const zoomSpeed = 0.1;
            const zoom = event.deltaY < 0 ? 1 + zoomSpeed : 1 - zoomSpeed;

            updateNewScale(zoom)
        });
        this.canvasView.makeSafeEvent('mousedown', (event) => {


            this.mapMove.isDragging = true;
            this.mapMove.startX = event.clientX * this.dpi - this.mapMove.offsetX;
            this.mapMove.startY = event.clientY * this.dpi - this.mapMove.offsetY;

            document.body.style.userSelect = 'none';
            const onMouseUp = () => {
                this.mapMove.isDragging = false;

                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            const onMouseMove = (moveEvent) => {
                if (this.mapMove.isDragging) {
                    this.mapMove.offsetX = moveEvent.clientX * this.dpi - this.mapMove.startX;
                    this.mapMove.offsetY = moveEvent.clientY * this.dpi - this.mapMove.startY;
                    this.draw();
                }
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            // canvas.style.cursor = 'grabbing';
        });


    }



    private clampOffset() {

        const centerX = this.mWidth / 2;
        const centerY = this.mHeight / 2;

        let borderX = centerX
        let borderY = centerY

        let sX = this.mMap.mapWidth * this.mapMove.scale
        let sY = this.mMap.mapHeight * this.mapMove.scale



        const maxOffsetX = this.mWidth - sX - borderX;
        const maxOffsetY = this.mHeight - sY - borderY;


        const scaleFactor = this.mMap.worldWidth / this.mMap.mapWidth;




        this.mapMove.offsetX = Math.min(borderX, Math.max(maxOffsetX, this.mapMove.offsetX));
        this.mapMove.offsetY = Math.min(borderY, Math.max(maxOffsetY, this.mapMove.offsetY));

        const localCenterX = (centerX - this.mapMove.offsetX) / this.mapMove.scale;
        const localCenterY = (centerY - this.mapMove.offsetY) / this.mapMove.scale;

        this.mapMove.mapX = localCenterX;
        this.mapMove.mapY =  localCenterY
        this.mapMove.worldX = localCenterX * scaleFactor;
        this.mapMove.worldY =  this.mMap.worldWidth - (localCenterY * scaleFactor)

    }

    getCanvasCoords(globalX:number,globalY:number):Point{
        let localX = this.mMap.scaleFactor * globalX
        let localY = this.mMap.mapHeight - (this.mMap.scaleFactor * globalY)
        return {x:localX,y:localY}
    }


    printCurrentCoordinates() {
        this.mCordsTextView.setValue(`${this.mapMove.worldX.toFixed(4)}, ${this.mapMove.worldY.toFixed(4)}`)
    }

    protected onDraw(canvas: Canvas) {
    }

    protected draw() {
        this.clampOffset()
        this.printCurrentCoordinates()
        let canvas = this.mCanvas
        this.mCanvas.antiAlias(false)
        this.mCanvas.resetMatrix()
        this.mCanvas.clear()
        this.mCanvas.scale(this.mapMove.scale, this.mapMove.scale)
        this.mCanvas.translate(this.mapMove.offsetX, this.mapMove.offsetY)

        if (this.isDrawMapImage) {
            this.mCanvas.drawBitmap(this.mMapBitmap, this.p, this.mMapRect)
        }

        let h2 = Math.floor(this.mHeight / 2)
        let w2 = Math.floor(this.mWidth / 2)


        this.onDraw(this.mCanvas);





        this.mCanvas.resetMatrix()



        canvas.drawHardLine(0, h2, this.mWidth, h2, this.p)
        canvas.drawHardLine(w2, 0, w2, this.mHeight, this.p)



    }


}