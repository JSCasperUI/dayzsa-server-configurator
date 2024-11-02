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

type FDrawCircle = (xc: number, yx: number,radius:number, buffer: number, width: number, height: number, bit: number, mode: number) => number
type FDrawFlagBitmap = (
    output: number,layers: number, layersCount: number,layersPixelSizes:number, layersVisibleMasks: number,
    maxCounts:number,layersFlagColors: number, originalWidth: number,originalHeight: number,
    clipLeft: number, clipTop: number, clipRight: number, clipBottom: number) => number


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
    private mContext: Context;
    private mWasmInstance: WebAssembly.WebAssemblyInstantiatedSource;
    private mImageData: ImageData;
    private mArea: AreaFlagsFile;
    private mDrawCircle: FDrawCircle;
    private mDrawFlagBitmap: FDrawFlagBitmap;


    private mAreaLayers:AreaLayers = {} as AreaLayers

    private mBitmapPointer: number;

    constructor(ctx: Context) {
        this.mContext = ctx
    }

    getImageData(): ImageData {
        return this.mImageData
    }

    setMaxFlagsCountOnLayer(layer:number,count:number):void{
        this.mAreaLayers.maxCounts.setValue(layer,count)
    }


    async initV2(flagsFile: AreaFlagsFile){
        this.mArea = flagsFile

        const bitmapByteSize = (flagsFile.mMapWidth * flagsFile.mMapHeight) << 2;


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
        this.mAreaLayers.maxCounts  = ll.newArrayUInt32(layers.length)

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

        this.mImageData = new ImageData(new Uint8ClampedArray(memory.buffer, this.mBitmapPointer, bitmapByteSize), flagsFile.mMapWidth, flagsFile.mMapHeight);

        const codeWasm = this.mContext.getResources().getBufferById(R.wasms.drawMap).getUInt8Array()
        this.mWasmInstance = await WebAssembly.instantiate(codeWasm, {env: {memory: memory}});

        const exports = this.mWasmInstance.instance.exports

        this.mDrawCircle = exports.drawFilledCircle as FDrawCircle
        this.mDrawFlagBitmap = exports.drawFlagBitmap as FDrawFlagBitmap

    }



    drawCircle(x:number, y:number,radius:number,layer:number,flag:number,mode:number):void{
        this.mDrawCircle(
            x,y,radius,this.mAreaLayers.layers.getPtr(layer),
            this.mArea.mMapWidth,this.mArea.mMapHeight,
            (1 << flag),mode
        )
    }

    drawToBitmap(masks:Array<number>, clip: Rect):number{
        clip.clipClamp(0,0,this.mArea.mMapWidth,this.mArea.mMapHeight)
        let al = this.mAreaLayers
        let time = Date.now()
        al.masks.setValue(0,masks[0])
        al.masks.setValue(1,masks[1])

        this.mDrawFlagBitmap(
            this.mBitmapPointer,
            al.layers.ptr,
            al.count,
            al.depths.ptr,
            al.masks.ptr,
            al.maxCounts.ptr,
            al.colors.ptr,
            this.mArea.mMapWidth,
            this.mArea.mMapHeight,
            clip.mLeft, clip.mTop, clip.mRight, clip.mBottom

        )
        let timeX = Date.now()-time
        console.log("render_time",timeX)
        return timeX
    }

}