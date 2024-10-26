import {Context} from "@casperui/core/content/Context";
import {R} from "@dz/R";
import {AreaFlagsFile} from "@dz/dayz/types/AreaFlagsFile";
import {Rect} from "@casperui/core/graphics/Rect";
import {
    DZ_DEFAULT_USAGE_COLORS,
    DZ_DEFAULT_USAGE_COLORS_INT,
    DZ_DEFAULT_VALUE_COLORS_INT
} from "@dz/dayz/DZDefaultAreaFlags";

import {LineAllocator, WPointerArrayOfPointers, WPointerArrayUInt32} from "@dz/dayz/wasm/helper";

type FPrintAreaFlagsToBitmap = (bitmap: number, mValuesData: number, mUsageData: number, valueFlagsMask: number, usageFlagsMask: number, wSize: number, valueBitLength: number, clipLeft: number, clipTop: number, clipRight: number, clipBottom: number) => number

type FDrawCircle = (xc: number, yx: number,radius:number, buffer: number, width: number, height: number, pixelSize: number, bit: number, mode: number) => number
type FDrawFlagBitmap = (
    output: number,layers: number, layersCount: number,layersPixelSizes:number, layersVisibleMasks: number,maxCounts:number,
    layersFlagColors: number, originalWidth: number,  clipLeft: number, clipTop: number, clipRight: number, clipBottom: number) => number


interface AreaLayers {
    count:number
    layers:WPointerArrayOfPointers      // Array<AreaFlagPixels>
    dataLayers:Array<Uint32Array>
    depths:WPointerArrayUInt32          // Array<UInt32>
    masks:WPointerArrayUInt32           // Array<UInt32>
    maxCounts:WPointerArrayUInt32           // Array<UInt32>
    colors:WPointerArrayOfPointers      // Array<Array<UInt32>(32)>
    colorValues:Array<WPointerArrayUInt32>
}

const BITMASK = {
    1:0x01,
    2:0x03,
    4:0xF,
    8:0xFF,
    16:0xFF_FF,
    32:0xFF_FF_FF_FF,
}



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


     mAreaLayers:AreaLayers = {} as AreaLayers

    private mBitmapPointer: number;
    private drawFlagBitmapT: FDrawFlagBitmap;

    constructor(ctx: Context) {
        this.ctx = ctx
    }


    async initV2(flagsFile: AreaFlagsFile){
        this.area = flagsFile

        const bitmapByteSize = (flagsFile.mapWidth * flagsFile.mapHeight) << 2;


        const memorySize =  Math.ceil((flagsFile.getMemorySize() + bitmapByteSize) / (64 * 1024))+24
        const memory = new WebAssembly.Memory({
            initial:memorySize,
            maximum:memorySize+10
        });
        const ll = new LineAllocator(memory,(64 * 1024)*5)




        this.mBitmapPointer = ll.alloc(bitmapByteSize)


        const layers = flagsFile.getLayers()

        this.mAreaLayers.count      = layers.length
        this.mAreaLayers.layers     = ll.newArray(layers.length)
        this.mAreaLayers.depths     = ll.newArrayUInt32(layers.length)
        this.mAreaLayers.masks      = ll.newArrayUInt32(layers.length)
        this.mAreaLayers.maxCounts      = ll.newArrayUInt32(layers.length)

        this.mAreaLayers.colors     = ll.newArray(layers.length)


        this.mAreaLayers.maxCounts.setValue(0,18)
        this.mAreaLayers.maxCounts.setValue(1,5)

        let def_colors = [
            DZ_DEFAULT_USAGE_COLORS_INT,
            DZ_DEFAULT_VALUE_COLORS_INT,
            DZ_DEFAULT_USAGE_COLORS_INT,
            DZ_DEFAULT_VALUE_COLORS_INT
        ]
        this.mAreaLayers.dataLayers = []

        for (let i = 0; i < layers.length; i++) {
            const l = layers[i]
            const layerPointer = ll.alloc(l.array.byteLength)
            let array = ll.getPointerArray(layerPointer,l.array.length)
            array.set(l.array) // copy data to wasm memory
            this.mAreaLayers.dataLayers.push(array)

            this.mAreaLayers.layers.setPtr(i,layerPointer)
            this.mAreaLayers.depths.setValue(i,l.depth)
            this.mAreaLayers.masks.setValue(i,BITMASK[l.depth]) // VISIBLE ALL
            let dColors = def_colors[i]

            let colors = ll.newArrayUInt32(32)
            for (let j = 0; j < 32; j++) {
                colors.setValue(j,dColors[j % dColors.length])
            }

            this.mAreaLayers.colors.setPtr(i,colors.ptr)

        }

        this.imageData = new ImageData(new Uint8ClampedArray(memory.buffer, this.mBitmapPointer, bitmapByteSize), flagsFile.mapWidth, flagsFile.mapHeight);

        let drawMapWasm = this.ctx.getResources().getBufferById(R.wasms.drawMap).getUInt8Array()
        this.wasmInstance = await WebAssembly.instantiate(drawMapWasm, {env: {memory: memory}});

        const exp = this.wasmInstance.instance.exports
        this.mainFunction = exp.printAreaFlagsToBitmap as FPrintAreaFlagsToBitmap;
        this.drawCircle = exp.drawFilledCircle as FDrawCircle
        this.drawFlagBitmap = exp.drawFlagBitmap as FDrawFlagBitmap
        this.drawFlagBitmapT = exp.drawFlagBitmapT as FDrawFlagBitmap




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

    drawToBitmap(masks:Array<number>, clip: Rect):number{
        clip.clipClamp(0,0,this.area.mapWidth,this.area.mapHeight)
        let al = this.mAreaLayers
        let time = Date.now()
        al.masks.setValue(0,masks[0])
        al.masks.setValue(1,masks[1])

        this.drawFlagBitmapT(
            this.mBitmapPointer,
            al.layers.ptr,
            al.count,
            al.depths.ptr,
            al.masks.ptr,
            al.maxCounts.ptr,
            al.colors.ptr,
            this.area.mapWidth,
            clip.mLeft, clip.mTop, clip.mRight, clip.mBottom

        )
        let timeX = Date.now()-time
        console.log("render_time",timeX)
        return timeX
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