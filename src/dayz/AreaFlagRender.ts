import {Context} from "@casperui/core/content/Context";
import {R} from "@dz/R";
import {AreaFlagsFile} from "@dz/dayz/types/AreaFlagsFile";
import {Bitmap} from "@casperui/core/graphics/Bitmap";
import {Rect} from "@casperui/core/graphics/Rect";
import {
    DZ_DEFAULT_USAGE_COLORS,
    DZ_DEFAULT_USAGE_COLORS_INT,
    DZ_DEFAULT_VALUE_COLORS_INT
} from "@dz/dayz/DZDefaultAreaFlags";
import {LineAllocator} from "@dz/dayz/wasm/helper";

function leToBe32(value) {
    return ((value & 0x000000FF) << 24) |  // Младший байт перемещаем на старшую позицию
        ((value & 0x0000FF00) << 8)  |  // Второй байт перемещаем влево на 8 бит
        ((value & 0x00FF0000) >> 8)  |  // Третий байт перемещаем вправо на 8 бит
        ((value & 0xFF000000) >>> 24);  // Старший байт перемещаем на младшую позицию
}
type FPrintAreaFlagsToBitmap = (bitmap: number, mValuesData: number, mUsageData: number, valueFlagsMask: number, usageFlagsMask: number, wSize: number, valueBitLength: number, clipLeft: number, clipTop: number, clipRight: number, clipBottom: number) => number

type FDrawCircle = (xc: number, yx: number,radius:number, buffer: number, width: number, height: number, pixelSize: number, bit: number, mode: number) => number
type FDrawFlagBitmap = (
    output: number,layers: number, layersCount: number,layersPixelSizes:number, layersVisibleMasks: number,

    layersFlagColors: number, originalWidth: number,  clipLeft: number, clipTop: number, clipRight: number, clipBottom: number) => number




export class AreaFlagRender {
    private ctx: Context;
    private wasmInstance: WebAssembly.WebAssemblyInstantiatedSource;
     mValuesData: Uint32Array;
    private mUsageData: Uint32Array;
    imageData: ImageData;
    private bitmap: Uint8Array;
    private mainFunction: FPrintAreaFlagsToBitmap;
    private wSize: number;
    private area: AreaFlagsFile;
    drawCircle: FDrawCircle;
    drawFlagBitmap: FDrawFlagBitmap;



    private mBitmapPointer: number;
    private mLayersPointer: number
    private mLayersDepthPointer: number
    private mLayersColorsPointer: number

    constructor(ctx: Context) {
        this.ctx = ctx
    }


    async initV2(flagsFile: AreaFlagsFile){
        const memorySize =  Math.ceil(flagsFile.getMemorySize() / (64 * 1024))+16
        const memory = new WebAssembly.Memory({
            initial:memorySize,
            maximum:memorySize+10
        });
        const ll = new LineAllocator(memory,(64 * 1024)*5)

        const bitmapByteSize = (flagsFile.mapWidth * flagsFile.mapHeight) << 2;


        this.mBitmapPointer = ll.alloc(bitmapByteSize)


        const layers = flagsFile.getLayers()


        this.mLayersPointer = ll.alloc(layers.length * 4)
        this.mLayersDepthPointer = ll.alloc(layers.length * 4)
        this.mLayersColorsPointer = ll.alloc(layers.length * 4)




        for (let i = 0; i < layers.length; i++) {
            const l = layers[i]

        }



    }


    async init(area: AreaFlagsFile) {
        this.area = area
        this.wSize = area.mapWidth;
        const bitmapSize = (area.mapWidth * area.mapWidth) << 2;
        const usageByteSize = area.mUsageFlagsArray.length << 2
        const valuesByteSize = area.mValuesFlagsArray.length << 2
        const initialValue =  Math.ceil((bitmapSize + usageByteSize + valuesByteSize) / (64 * 1024))+64

        const memory = new WebAssembly.Memory({
            initial:initialValue+32,
            maximum:initialValue+64
            });
        let offset = (64 * 1024)*32
        this.bitmap = new Uint8Array(memory.buffer, offset, bitmapSize); offset+=bitmapSize;

        this.mUsageData = new Uint32Array(memory.buffer, offset, area.mUsageFlagsArray.length); offset+=usageByteSize;

        const valuesPTR = offset
        this.mValuesData = new Uint32Array(memory.buffer, offset, area.mValuesFlagsArray.length);offset+=valuesByteSize;

        const valColorsPtr = offset
        const usColorsPtr = offset + (5*4)


        const valColors = new Uint32Array(memory.buffer, valColorsPtr, 5);
        const usColors = new Uint32Array(memory.buffer, usColorsPtr, 16);

        for (let i = 0; i < valColors.length; i++) {
            valColors[i] = DZ_DEFAULT_VALUE_COLORS_INT[i]
        }
        for (let i = 0; i < usColors.length; i++) {
            usColors[i] = DZ_DEFAULT_USAGE_COLORS_INT[i]
        }

        if (initialValue*(64*1024)<usColorsPtr){
            console.log("EEEEEEEEEEEEEEEEE")
        }

        this.mUsageData.set(area.mUsageFlagsArray)
        this.mValuesData.set(area.mValuesFlagsArray)
        this.imageData = new ImageData(new Uint8ClampedArray(memory.buffer,  this.bitmap.byteOffset, bitmapSize), area.mapWidth, area.mapWidth);


        let drawMapWasm = this.ctx.getResources().getBufferById(R.wasms.drawMap).getUInt8Array()
        this.wasmInstance = await WebAssembly.instantiate(drawMapWasm, {
            env: {
                memory: memory
            }
        });
        const exp = this.wasmInstance.instance.exports
        this.mainFunction = exp.printAreaFlagsToBitmap as FPrintAreaFlagsToBitmap;
        // @ts-ignore
        exp.setColors(valColorsPtr,usColorsPtr)
        this.drawCircle = exp.drawFilledCircle as FDrawCircle
        this.drawFlagBitmap = exp.drawFlagBitmap as FDrawFlagBitmap



        // @ts-ignore
        window.TADAM = ()=>{
            let time = Date.now()
            // @ts-ignore
            exp.drawFilledCircle(2048,2048,500,valuesPTR,area.mapWidth,area.mapWidth,4,1<<1,0);
            console.log("drawFilledCircle",Date.now()-time)
        }





    }

    printAreaFlagsToBitmap(valueFlagsMask: number, usageFlagsMask: number, clip: Rect) {


        clip.clipClamp(0,0,this.area.mapWidth,this.area.mapWidth)
        let time = Date.now()
        let result = this.mainFunction(
            this.bitmap.byteOffset,
            this.mValuesData.byteOffset,
            this.mUsageData.byteOffset,
            valueFlagsMask,
            usageFlagsMask,
            this.wSize,
            this.area.mValueFlagsBitLength,
            clip.mLeft, clip.mTop, clip.mRight, clip.mBottom)
        console.log("result",result,"mytime",Date.now()-time)
    }
}