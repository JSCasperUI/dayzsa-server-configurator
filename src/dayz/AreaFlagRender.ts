import {Context} from "@casperui/core/content/Context";
import {R} from "@dz/R";
import {AreaFlag} from "@dz/dayz/types/AreaFlag";
import {Bitmap} from "@casperui/core/graphics/Bitmap";
import {Rect} from "@casperui/core/graphics/Rect";


type FPrintAreaFlagsToBitmap = (bitmap: number, mValuesData: number, mUsageData: number, valueFlagsMask: number, usageFlagsMask: number, wSize: number, valueBitLength: number, clipLeft: number, clipTop: number, clipRight: number, clipBottom: number) => void

export class AreaFlagRender {
    private ctx: Context;
    private wasmInstance: WebAssembly.WebAssemblyInstantiatedSource;
    private mValuesData: Uint32Array;
    private mUsageData: Uint32Array;
    imageData: ImageData;
    private bitmap: Uint8Array;
    private func_item: FPrintAreaFlagsToBitmap;
    private wSize: number;
    private area: AreaFlag;

    constructor(ctx: Context) {
        this.ctx = ctx
    }

    async init(area: AreaFlag) {
        this.area = area
        this.wSize = area.mapSize;
        const bitmapSize = (area.mapSize * area.mapSize) << 2;
        const usageByteSize = area.mUsageFlagsArray.length << 2
        const valuesByteSize = area.mValuesFlagsArray.length << 2
        const initialValue =  Math.ceil((bitmapSize + usageByteSize + valuesByteSize) / (64 * 1024))
        console.log("INITITAL",initialValue)
        const memory = new WebAssembly.Memory({
            initial:initialValue,
            maximum:initialValue+32
            });

        this.bitmap = new Uint8Array(memory.buffer, 0, bitmapSize);
        this.mUsageData = new Uint32Array(memory.buffer, bitmapSize, area.mUsageFlagsArray.length);
        this.mValuesData = new Uint32Array(memory.buffer, (bitmapSize + usageByteSize), area.mValuesFlagsArray.length);

        this.mUsageData.set(area.mUsageFlagsArray)
        this.mValuesData.set(area.mValuesFlagsArray)
        this.imageData = new ImageData(new Uint8ClampedArray(memory.buffer, 0, bitmapSize), area.mapSize, area.mapSize);
        let simple_test = this.ctx.getResources().getBufferById(R.example)
        const bytes = new Uint8Array(simple_test.getDataView().buffer, simple_test.getDataView().byteOffset, simple_test.size);

        this.wasmInstance = await WebAssembly.instantiate(bytes, {
            env: {
                memory: memory
            }
        });
        this.func_item = this.wasmInstance.instance.exports.printAreaFlagsToBitmap as FPrintAreaFlagsToBitmap;
    }

    printAreaFlagsToBitmap(valueFlagsMask: number, usageFlagsMask: number, clip: Rect) {
        //(uint8_t* bitmap,
        // uint32_t* mValuesData,
        // uint32_t* mUsageData,
        // uint32_t
        // valueFlagsMask,
        // uint32_t usageFlagsMask,
        // int wSize,
        // int valueBitLength, int clipLeft, int clipTop, int clipRight, int clipBottom)
        let time = Date.now()
        this.func_item(
            this.bitmap.byteOffset,
            this.mValuesData.byteOffset,
            this.mUsageData.byteOffset,
            valueFlagsMask,
            usageFlagsMask,
            this.wSize,
            this.area.mValueFlagsBitLength,
            clip.mLeft, clip.mTop, clip.mRight, clip.mBottom)
        console.log("mytime",Date.now()-time)
    }
}