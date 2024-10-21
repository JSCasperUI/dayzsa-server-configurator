import {JFragment} from "@casperui/core/app/JFragment";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";
import {View} from "@casperui/core/view/View";
import {R} from "@dz/R";
import {Canvas} from "@casperui/core/graphics/Canvas";
import {Bitmap} from "@casperui/core/graphics/Bitmap";
import {Paint} from "@casperui/core/graphics/Paint";
import {Rect} from "@casperui/core/graphics/Rect";
import {MainActivity} from "@dz/MainActivity";
import {AreaFlag} from "@dz/dayz/types/AreaFlag";
import {DZ_DEFAULT_USAGE_COLORS, DZ_DEFAULT_VALUE_COLORS} from "@dz/dayz/DZDefaultAreaFlags";
import {FastBlend} from "@dz/dayz/FBlend";


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


    let rem = da * (255 - sa) / 255
    // const rem = ((da * invSa + 128) * 257) >> 16;
    dest[3] =  sa + (rem >> 8);
    dest[0] = (sr * sa + dr * rem + 127) >> 8;
    dest[1] = (sg * sa + dg * rem + 127) >> 8;
    dest[2] = (sb * sa + db * rem + 127) >> 8;

}


function alphaBlend3(src, dest) {

    // const [sr, sg, sb, sa] = src;
    // const [dr, dg, db, da] = dest;
    const da = dest[3];
    if (da === 0) {
        return src;
    }
    const sa = src[3];
    if (sa === 255) {
        return src;
    }

    const sr = src[0];
    const sg = src[1];
    const sb = src[2];


    const dr = dest[0];
    const dg = dest[1];
    const db = dest[2];


    if (da === 0) {
        return src;
    }
    if (sa === 0) {
        return dest;
    }


    const invSa = 255 - sa;
    const outA = sa + ((da * invSa + 127) >> 8);

    const outR = (sr * sa + dr * da * invSa / 255 + 127) >> 8;
    const outG = (sg * sa + dg * da * invSa / 255 + 127) >> 8;
    const outB = (sb * sa + db * da * invSa / 255 + 127) >> 8;

    return [outR, outG, outB, outA];
}


const MAX_ZOOM = 40

export class FragmentDZAreaFlags extends JFragment {

    private mCanvas: Canvas
    private mValueFlags = 0xFF //tiers 8 bit
    private mUsageFlags = 0xFFFFFF// 32 bit

    private mWorldSize = 15360
    private mMapSize = 4096

    private mAreaFlags: AreaFlag = null
    private arabit: ImageData;


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

    private mAreaBitmap = Bitmap.createBitmap(0, 0)

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


        (this.getActivity() as MainActivity).mBaseConfigVM.mAreaFlagBinary.observe(this, value => {
            this.loadAreaFlagData(value)
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

        const scaleFactor = this.mWorldSize / this.mMapSize;
        const worldX = (worldCenterX * scaleFactor).toFixed(4);
        const worldY = (this.mWorldSize - (worldCenterY * scaleFactor)).toFixed(4);

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

        this.mCanvas.drawBitmap(this.mMapBitmap, this.p, this.mapRect)
        if (this.mAreaBitmap) {
            canvas.drawBitmap(this.mAreaBitmap, this.p, this.mapRect)
        }


        let w = canvas.getWidth()
        let h = canvas.getHeight()


        this.mCanvas.resetMatrix()

        let h2 = Math.floor(h / 2)
        let w2 = Math.floor(w / 2)

        canvas.drawHardLine(0, h2, w, h2, this.p)
        canvas.drawHardLine(w2, 0, w2, h, this.p)

    }


    loadAreaFlagData(area: AreaFlag) {
        if (!area) return

        this.mAreaFlags = area

        this.mMapSize = area.mMapInfo.mapSize
        this.mapRect.mRight = this.mMapSize
        this.mapRect.mBottom = this.mMapSize

        this.mWorldSize = area.mMapInfo.worldSize
        this.arabit = null
        this.mAreaBitmap = Bitmap.createBitmap(this.mMapSize, this.mMapSize)


        // @ts-ignore
        window.flagsRedraw = (a, b) => {
            this.printAreaFlagsToBitmap(this.mAreaBitmap, a, b)
            this.draw()
        }
        this.printAreaFlagsToBitmap(this.mAreaBitmap, 0xFF, 0)
        this.draw()

    }

    printAreaFlagsToBitmap(bitmap: Bitmap, valueFlagsMask: number, usageFlagsMask: number) {
        let wSize = this.mMapSize

        if (!this.arabit) {
            this.arabit = bitmap.getPixels()
        }

        let pixels = this.arabit.data
        let usageFlagsMaskBitArray = []
        let valueFlagsMaskBitArray = []

        for (let i = 0; i < 32; i++) {
            let bit = (1 << i)
            if (usageFlagsMask & bit) {
                const color = DZ_DEFAULT_USAGE_COLORS[i % DZ_DEFAULT_USAGE_COLORS.length];
                usageFlagsMaskBitArray.push({bit, color})
            }
            if (i < 8) {
                if (valueFlagsMask & bit) {
                    const color = DZ_DEFAULT_VALUE_COLORS[i % DZ_DEFAULT_VALUE_COLORS.length];
                    valueFlagsMaskBitArray.push({bit, color})
                }
            }
        }


        let hw = wSize * wSize
        let mUsageLength = (hw * this.mAreaFlags.mMapInfo.flagsBitLength) / 32
        let mValuesLength = (hw * this.mAreaFlags.mMapInfo.valueBitLength) / 32


        let mUsageData = new Uint32Array(this.mAreaFlags.mBuffer.buffer, 20, mUsageLength);
        let mValuesData = new Uint32Array(this.mAreaFlags.mBuffer.buffer, 24 + (mUsageLength * 4), mValuesLength);

        let xTime = Date.now()
        const valueBitLength = this.mAreaFlags.mMapInfo.valueBitLength


        let revOffset = 32-valueBitLength
        let mask = (1 << valueBitLength) - 1;
        let blendedColor = [0, 0, 0, 0];
            for (let y = 0; y < wSize; y++) {
                const yWSize = y * wSize
                const pixelRowIndex = (wSize * (wSize - 1 - y)) << 2;
                for (let x = 0; x < wSize; x++) {
                    const index = yWSize + x;
                    const usageFlags = mUsageData[index];
                    const bitPosition = index * valueBitLength;
                    const valueFlags = (mValuesData[bitPosition >> 5] >> (revOffset - (bitPosition % 32))) & mask;
                    if (usageFlags == 0 && valueFlags == 0) continue
                    blendedColor = [0, 0, 0, 0];
                    if (valueFlags !== 0 && (valueFlags & valueFlagsMask) != 0) {
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
                                // blendedColor = alphaBlend3(bc.color, blendedColor);
                                alphaBlend43(bc.color, blendedColor);

                            }
                        }
                    }

                    const pixelIndex = pixelRowIndex + (x << 2);
                    pixels[pixelIndex] = blendedColor[0];
                    pixels[pixelIndex + 1] = blendedColor[1];
                    pixels[pixelIndex + 2] = blendedColor[2];
                    pixels[pixelIndex + 3] = blendedColor[3];
                }
            }

        console.log((Date.now() - xTime))
        this.mAreaBitmap.setPixels(this.arabit)
    }


}

function getPixDataX(dataArray, bitLength, pixelIndex) {
    const bitsPerByte = 8;
    const bitPosition = pixelIndex * bitLength;
    const byteIndex = Math.floor(bitPosition / bitsPerByte);
    const bitOffset = bitPosition % bitsPerByte;

    // Извлекаем текущий байт
    let currentByte = dataArray[byteIndex];

    // Количество доступных бит в текущем байте
    let bitsAvailable = bitsPerByte - bitOffset;

    let result;

    if (bitsAvailable >= bitLength) {
        // Все биты находятся в текущем байте
        result = (currentByte >> bitOffset) & ((1 << bitLength) - 1);
    } else {
        // Биты разбросаны между текущим и следующим байтом
        let nextByte = dataArray[byteIndex + 1] || 0; // Защита от выхода за пределы массива
        let combinedBytes = (nextByte << 8) | currentByte; // Объединяем байты
        result = (combinedBytes >> bitOffset) & ((1 << bitLength) - 1);
    }

    return result;
}