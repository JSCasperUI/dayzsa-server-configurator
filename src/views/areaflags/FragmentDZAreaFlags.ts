import {JFragment} from "@casperui/core/app/JFragment";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";
import {View} from "@casperui/core/view/View";
import {R} from "@dz/R";
import {Canvas} from "@casperui/core/graphics/Canvas";
import {Bitmap} from "@casperui/core/graphics/Bitmap";
import {Paint} from "@casperui/core/graphics/Paint";
import {Rect} from "@casperui/core/graphics/Rect";
import {MainActivity} from "@dz/MainActivity";
import {AreaFlagsFile} from "@dz/dayz/types/AreaFlagsFile";
import {DZ_DEFAULT_USAGE_COLORS, DZ_DEFAULT_VALUE_COLORS} from "@dz/dayz/DZDefaultAreaFlags";
import {AreaFlagRender} from "@dz/dayz/AreaFlagRender";


function alphaBlend43(src, dest) {
    const da = dest[3];
    if (da === 0) {
        dest[0] = src[0]
        dest[1] = src[1]
        dest[2] = src[2]
        dest[3] = src[3]
        return;
    }
    const sa = src[3];
    if (sa === 255) {
        dest[0] = src[0]
        dest[1] = src[1]
        dest[2] = src[2]
        dest[3] = src[3]
        return;
    }
    const sr = src[0];
    const sg = src[1];
    const sb = src[2];


    const dr = dest[0];
    const dg = dest[1];
    const db = dest[2];
    let rem = da * (255 - sa) >> 8

    dest[0] = (sr * sa + dr * rem) >> 8;
    dest[1] = (sg * sa + dg * rem) >> 8;
    dest[2] = (sb * sa + db * rem) >> 8;
    dest[3] = sa + (rem >> 8);
}




const MAX_ZOOM = 40

export class FragmentDZAreaFlags extends JFragment {

    private mCanvas: Canvas
    private mValueFlags = 0xFF //tiers 8 bit
    private mUsageFlags = 0xFFFFFF// 32 bit


    private mAreaFlags: AreaFlagsFile = new AreaFlagsFile(null)
    private arabit: ImageData;
    private mPreviewBitmap: Bitmap;
    private mPreviewBitmapPixels: ImageData;
    private isDrawMapImage: boolean = true;
    private areaRender: AreaFlagRender;


    onCreateView(inflater: BXMLInflater, container: View): View {
        return inflater.inflate(R.layout.area_flags.main);
    }

    private mMapBitmap: Bitmap

    private p = new Paint()
    private mapRect = new Rect(0, 0, 4096, 4096)

    mapMove = {
        maxOffsetX: 0,
        maxOffsetY: 0,
        offsetX: -500,
        offsetY: -500,
        startX: 0,
        startY: 0,
        scale: 0.3,
        isDragging: false
    }
    private dpi = 1


    private canvasView: View

    private mCordsTextView: View

    private mAreaBitmap: Bitmap = null

    async onCreated() {
        super.onCreated();
        this.dpi = window.devicePixelRatio || 1
        this.p.setStyle(Paint.STROKE)
        this.p.setStrokeColor("rgba(255,163,128,0.4)")//7C
        this.p.setStrokeWidth(1)

        this.canvasView = this.byId(R.id.canvas)
        this.mCanvas = new Canvas(this.canvasView)
        let canvas = this.mCanvas

        this.mMapBitmap = await Bitmap.loadBitmap("./map.png")

        this.mCordsTextView = this.byId(R.id.cords)

        const resize = (newWidth, newHeight) => {
            let oldWidth = this.mCanvas.getWidth();
            let oldHeight = this.mCanvas.getHeight();

            this.canvasView.getElement().style.imageRendering = "pixelated"
            let bRect = this.getFragmentView().getElement().getBoundingClientRect()

            let ww = Math.floor(bRect.width) - 1
            let hh = Math.floor(bRect.height) - 1;


            this.getFragmentView().byId(R.id.fillContent).setWidth(ww)
            this.getFragmentView().byId(R.id.fillContent).setHeight(hh)

            newWidth = Math.floor(ww * this.dpi);
            newHeight = Math.floor(hh * this.dpi);


            const deltaX = (newWidth - oldWidth) / 2;
            const deltaY = (newHeight - oldHeight) / 2;

            (this.canvasView.getElement() as HTMLCanvasElement).width = newWidth;
            (this.canvasView.getElement() as HTMLCanvasElement).height = newHeight;


            this.mapMove.offsetX += deltaX;
            this.mapMove.offsetY += deltaY;

            updateNewScale(1)
        }

        const updateNewScale = (zoom) => {
            let w = canvas.getWidth()
            let h = canvas.getHeight()

            let maxWH = Math.max(w, h)
            let minZoom = (maxWH - maxWH / 2) / 4096;


            // const mouseX = (event.offsetX - this.mapMove.offsetX) / this.mapMove.scale;
            // const mouseY = (event.offsetY - this.mapMove.offsetY) / this.mapMove.scale;
            //  this.mapMove.offsetX = event.offsetX - mouseX * this.mapMove.scale;
            //  this.mapMove.offsetY = event.offsetY - mouseY * this.mapMove.scale;


            const centerX = w / 2;
            const centerY = h / 2;
            const mapCenterX = (centerX - this.mapMove.offsetX) / this.mapMove.scale;
            const mapCenterY = (centerY - this.mapMove.offsetY) / this.mapMove.scale;
            this.mapMove.scale = Math.min(MAX_ZOOM, Math.max(minZoom, this.mapMove.scale * zoom));
            this.mapMove.offsetX = centerX - mapCenterX * this.mapMove.scale;
            this.mapMove.offsetY = centerY - mapCenterY * this.mapMove.scale;

            this.draw();
        }
        this.onSizeChangeListener((newWidth, newHeight) => {
            resize(newWidth, newHeight)
        });



        this.canvasView.makeSafeEvent('mousemove', (moveEvent) => {
            if (this.mAreaBitmap) {
                // this.printAreaFlagsToBitmap(this.mAreaBitmap, 0xFF, 0,new Rect(1900,1900,2000,2000))
                // this.draw()
            }
        })
        this.canvasView.makeSafeEvent('wheel', (event) => {
            event.preventDefault();
            const zoomSpeed = 0.1;
            const zoom = event.deltaY < 0 ? 1 + zoomSpeed : 1 - zoomSpeed;

            updateNewScale(zoom)
        });
        this.canvasView.makeSafeEvent('mousedown', (event) => {

            if (event.ctrlKey) {
                console.log('Ctrl + Mouse Down');
                const onMouseMoveD = (moveEvent) => {
                        const mv = this.mapMove
                        // this.mapMove.offsetX = moveEvent.clientX * this.dpi - this.mapMove.startX;
                        // this.mapMove.offsetY = moveEvent.clientY * this.dpi - this.mapMove.startY;

                        let canvas = this.mCanvas
                        let w = canvas.getWidth();
                        let h = canvas.getHeight();


                    let posX = Math.round(((moveEvent.offsetX * this.dpi) - mv.offsetX)/mv.scale)
                    let posY = Math.round(((moveEvent.offsetY * this.dpi) - mv.offsetY)/mv.scale)
                    // posY = this.mAreaFlags.mapSize - posY

                        console.log(mv.scale,posX,posY)

                    let mw = this.mAreaFlags.mapWidth
                        // if (!this.mAreaBitmap) return
                        // let wSize = this.mAreaFlags.mapSize
                    let radius = 250

                    let clip = new Rect(posX-radius,posY-radius, posX+radius, posY+radius)
                    this.areaRender.drawCircle(posX,posY,radius,this.areaRender.mAreaLayers.layers.getPtr(1),mw,mw,this.areaRender.mAreaLayers.depths.getValue(1),1<<1,0)
                    // this.areaRender.printAreaFlagsToBitmap(this.mValueFlags,this.mUsageFlags,clip)
                    let time = this.areaRender.drawToBitmap([this.mUsageFlags,this.mValueFlags],clip)

                    this.byId(R.id.time).setValue(time.toString())
                        this.mAreaBitmap.setPixelsDitry(this.areaRender.imageData,clip)
                    //
                    //
                    //
                        this.draw();


                };

                const onMouseUpX = () => {

                    document.removeEventListener('mousemove', onMouseMoveD);
                    document.removeEventListener('mouseup', onMouseUpX);
                };

                document.addEventListener('mousemove', onMouseMoveD);
                document.addEventListener('mouseup', onMouseUpX);
                return
                // Ваш код для обработки события
            }

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

        let lvConfig = (this.getActivity() as MainActivity).mBaseConfigVM;
        lvConfig.mAreaFlagBinary.observe(this, value => {
            this.loadAreaFlagData(value)
        })
        lvConfig.mAreaFlagMask.observe(this,value => {
            this.mValueFlags = value.visibleValueFlagsMask
            this.mUsageFlags = value.visibleUsageFlagsMask
            this.isDrawMapImage = value.mapImage
            this.redrawArea()
        })

        lvConfig.mAreaFlagHoverEvent.observe(this,value => {
            if (!this.mPreviewBitmap) return
            this.printAreaFlagsToBitmapPreview(this.mPreviewBitmap,value.valueMask, value.usageMask)
            this.draw()
        })



    }

    clampOffset() {

        let w = this.mCanvas.getWidth()
        let h = this.mCanvas.getHeight()

        let borderX = w / 2
        let borderY = h / 2

        let sX = (this.mapRect.getWidth()) * this.mapMove.scale
        let sY = (this.mapRect.getHeight()) * this.mapMove.scale

        const maxOffsetX = w - sX - borderX;
        const maxOffsetY = h - sY - borderY;
        this.mapMove.offsetX = Math.min(borderX, Math.max(maxOffsetX, this.mapMove.offsetX));
        this.mapMove.offsetY = Math.min(borderY, Math.max(maxOffsetY, this.mapMove.offsetY));
    }

    printCurrentCoordinates() {
        let canvas = this.mCanvas
        let w = canvas.getWidth();
        let h = canvas.getHeight();

        const centerX = w / 2;
        const centerY = h / 2;

        const worldCenterX = (centerX - this.mapMove.offsetX) / this.mapMove.scale;
        const worldCenterY = (centerY - this.mapMove.offsetY) / this.mapMove.scale;

        const scaleFactor = this.mAreaFlags.worldWidth / this.mAreaFlags.mapWidth;
        const worldX = (worldCenterX * scaleFactor).toFixed(4);
        const worldY = (this.mAreaFlags.worldWidth - (worldCenterY * scaleFactor)).toFixed(4);

        this.mCordsTextView.setValue(`${worldX}, ${worldY}`)

    }

    draw() {
        this.clampOffset()
        this.printCurrentCoordinates()
        let canvas = this.mCanvas
        this.mCanvas.antiAlias(false)
        this.mCanvas.resetMatrix()
        this.mCanvas.clear()
        this.mCanvas.scale(this.mapMove.scale, this.mapMove.scale)
        this.mCanvas.translate(this.mapMove.offsetX, this.mapMove.offsetY)

        if (this.isDrawMapImage){
            this.mCanvas.drawBitmap(this.mMapBitmap, this.p, this.mapRect)
        }

        if (this.mAreaBitmap) {
            canvas.drawBitmap(this.mAreaBitmap, this.p, this.mapRect)
        }

        if (this.mPreviewBitmap) {
            // this.mCanvas.scale(4, 4)
            canvas.drawBitmap(this.mPreviewBitmap, this.p, this.mapRect)
            // this.mCanvas.scale(-4, -4)
        }

        let w = canvas.getWidth()
        let h = canvas.getHeight()


        this.mCanvas.resetMatrix()

        let h2 = Math.floor(h / 2)
        let w2 = Math.floor(w / 2)

        canvas.drawHardLine(0, h2, w, h2, this.p)
        canvas.drawHardLine(w2, 0, w2, h, this.p)

    }


    redrawArea(){
        if (!this.mAreaBitmap) return
        let wSize = this.mAreaFlags.mapWidth

        let clip = new Rect(0,0, wSize, wSize)
        // this.areaRender.printAreaFlagsToBitmap(this.mValueFlags,this.mUsageFlags,clip)
        // this.mAreaBitmap.setPixelsDitry(this.areaRender.imageData,clip)
        // this.areaRender.drawToBitmap([this.mUsageFlags,this.mValueFlags],clip)
        let time = this.areaRender.drawToBitmap([this.mUsageFlags,this.mValueFlags],clip)

        this.byId(R.id.time).setValue(time.toString())
        this.mAreaBitmap.setPixelsDitry(this.areaRender.imageData,clip)


        // this.printAreaFlagsToBitmap(this.mAreaBitmap, this.mValueFlags,this.mUsageFlags)
        // this.printAreaFlagsToBitmapPreview(this.mPreviewBitmap, 1,0)
        this.draw()
    }

    async loadAreaFlagData(area: AreaFlagsFile) {
        if (!area) return


        this.areaRender = new AreaFlagRender(this.getContext())
        await this.areaRender.initV2(area)
        this.mAreaFlags = area


        this.mapRect.mRight = this.mAreaFlags.mapWidth
        this.mapRect.mBottom = this.mAreaFlags.mapWidth


        this.arabit = null
        this.mAreaBitmap = Bitmap.createBitmap(this.mAreaFlags.mapWidth, this.mAreaFlags.mapHeight)
        this.mPreviewBitmap = Bitmap.createBitmap(this.mAreaFlags.mapWidth >> 3, this.mAreaFlags.mapHeight>>3)



        // @ts-ignore
        window.flagsRedraw = (a, b) => {
            this.printAreaFlagsToBitmapPreview(this.mPreviewBitmap, a, b)
            this.draw()
        }
        this.redrawArea()

    }

    printAreaFlagsToBitmap(bitmap: Bitmap, valueFlagsMask: number, usageFlagsMask: number, clip?: Rect) {
        let wSize = this.mAreaFlags.mapWidth

        if (!clip) {
            clip = new Rect(0,0, wSize, wSize)
        }
        if (!this.arabit) {
            this.arabit = bitmap.getPixels()
        }

        let pixels = this.arabit.data
        let usageFlagsMaskBitArray = []
        let valueFlagsMaskBitArray = []

        for (let i = 0; i < this.mAreaFlags.mUsageFlagsBitLength; i++) {
            let bit = (1 << i)
            if (usageFlagsMask & bit) {
                const color = DZ_DEFAULT_USAGE_COLORS[i % DZ_DEFAULT_USAGE_COLORS.length];
                usageFlagsMaskBitArray.push({bit, color})
            }
            if (i < this.mAreaFlags.mValueFlagsBitLength) {
                if (valueFlagsMask & bit) {
                    const color = DZ_DEFAULT_VALUE_COLORS[i % DZ_DEFAULT_VALUE_COLORS.length];
                    valueFlagsMaskBitArray.push({bit, color})
                }
            }
        }

        let mUsageData = this.mAreaFlags.mUsageFlagsArray
        let mValuesData = this.mAreaFlags.mValuesFlagsArray;


        let xTime = Date.now()
        const valueBitLength = this.mAreaFlags.mValueFlagsBitLength


        let endianOffset = 32 - valueBitLength
        let mask = (1 << valueBitLength) - 1;
        let blendedColor = [0, 0, 0, 0];
        let pixelIndex = 0


        for (let y = clip.mTop; y < clip.mBottom; y++) {
            const line = (wSize-y-1) * wSize
            const invertLine =  y * wSize

            for (let x = clip.mLeft; x < clip.mRight; x++) {
                const index = line + x;
                const usageFlags = mUsageData[index];
                const bitPosition = index * valueBitLength;
                const valueFlags = (mValuesData[bitPosition >> 5] >> (endianOffset - (bitPosition % 32))) & mask;
                if (usageFlags == 0 && valueFlags == 0) continue

                blendedColor[3] = 0;

                if ((valueFlags & valueFlagsMask) != 0 && valueFlags !== 0 ) {
                    for (let flag = 0; flag < valueFlagsMaskBitArray.length; flag++) {
                        let bc = valueFlagsMaskBitArray[flag]
                        if ((valueFlags & bc.bit) != 0) {
                            alphaBlend43(bc.color, blendedColor);
                        }
                    }
                }

                if (usageFlags !== 0 && (usageFlags & usageFlagsMask) != 0) {
                    for (let flag = 0; flag < usageFlagsMaskBitArray.length; flag++) {
                        let bc = usageFlagsMaskBitArray[flag]
                        if ((usageFlags & bc.bit) != 0) {
                            alphaBlend43(bc.color, blendedColor);
                        }
                    }
                }

                pixelIndex =  (invertLine + x) << 2;
                pixels[pixelIndex] = blendedColor[0];
                pixels[pixelIndex + 1] = blendedColor[1];
                pixels[pixelIndex + 2] = blendedColor[2];
                pixels[pixelIndex + 3] = blendedColor[3];
            }
        }

        this.mAreaBitmap.setPixelsDitry(this.arabit,clip)
        console.log((Date.now() - xTime))
    }
    printAreaFlagsToBitmapPreview(bitmap: Bitmap, valueFlagsMask: number, usageFlagsMask: number, clip?: Rect) {
        const offset = 3
        let wSize = this.mAreaFlags.mapWidth >> offset

        if (!clip) {
            clip = new Rect(0,0, wSize , wSize)
        }
        if (!this.mPreviewBitmapPixels) {
            this.mPreviewBitmapPixels = bitmap.getPixels()
        }

        let pixels = this.mPreviewBitmapPixels.data


        let mUsageData = this.mAreaFlags.mUsageFlagsArray
        let mValuesData = this.mAreaFlags.mValuesFlagsArray;


        const valueBitLength = this.mAreaFlags.mValueFlagsBitLength
        pixels.fill(0)
        if (usageFlagsMask ==0 && valueFlagsMask == 0){
            bitmap.setPixelsDitry(this.mPreviewBitmapPixels,clip)
            return
        }



        let endianOffset = 32 - valueBitLength
        let mask = (1 << valueBitLength) - 1;
        let pixelIndex = 0


        for (let y = clip.mTop; y < clip.mBottom; y++) {
            const line = ((wSize-1-y<<offset) * wSize) << offset
            const invertLine =  y * wSize
            for (let x = clip.mLeft; x < clip.mRight; x++) {


                const index = line + (x<<offset);
                const usageFlags = mUsageData[index];
                const bitPosition = index * valueBitLength;
                const valueFlags = (mValuesData[bitPosition >> 5] >> (endianOffset - (bitPosition % 32))) & mask;
                if (usageFlags == 0 && valueFlags == 0) continue


                if ((valueFlags & valueFlagsMask) != 0 && valueFlags !== 0 || usageFlags !== 0 && (usageFlags & usageFlagsMask) != 0) {
                    pixelIndex = (invertLine + x) << 2;
                    pixels[pixelIndex] = 0xFF;
                    pixels[pixelIndex + 1] = 0xFF;
                    pixels[pixelIndex + 2] = 0xFF;
                    pixels[pixelIndex + 3] = 100;
                }
            }
        }

        bitmap.setPixelsDitry(this.mPreviewBitmapPixels,clip)
    }

}


