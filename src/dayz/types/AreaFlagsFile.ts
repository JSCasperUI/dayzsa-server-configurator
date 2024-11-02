import {ByteBufferOffset} from "@casperui/core/io/ByteBufferOffset";

interface LayerInfo {
    array: Uint32Array
    depth: number
}

export class AreaFlagsFile {
    mMapWidth = 4096
    mMapHeight = 4096
    mWorldWidth = 256 * 60
    mWorldHeight = 256 * 60
    mValueFlagsBitLength = 0
    mUsageFlagsBitLength = 0
    mValuesFlagsArray: Uint32Array
    mUsageFlagsArray: Uint32Array
    mLayers: Array<LayerInfo> = []


    private mFlagsByteSize: number = 0

    getMemorySize(): number {
        return this.mFlagsByteSize
    }

    getLayers(): Array<LayerInfo> {
        return this.mLayers
    }

    constructor(buf: ArrayBuffer) {
        if (!buf) {
            return
        }
        const buffer = new ByteBufferOffset(buf, 0, buf.byteLength)
        const area = this.mMapWidth * this.mMapHeight;

        this.mMapWidth = buffer.read32LE()
        this.mMapHeight = buffer.read32LE()
        this.mWorldWidth = buffer.read32LE()
        this.mWorldHeight = buffer.read32LE()

        while (buffer.hasRemaining()) {
            let depth = buffer.read32LE();
            let itemsCount = (area * depth) >> 5
            let array = buffer.readUInt32Array(itemsCount)

            if (depth != 32){ // convert to 32 bit depth
                let endianOffset = 32 - depth
                let mask = ((1 << depth) - 1)
                let shiftAmount = Math.log2(depth)

                let newArray = new Uint32Array(this.mMapWidth * this.mMapHeight)
                for (let y = 0; y < this.mMapHeight; y++) {
                    let line = y * this.mMapWidth
                    for (let x = 0; x < this.mMapWidth; x++) {
                        let index =  line + x;
                        let bitPosition = index << shiftAmount
                        const arrayIndex = bitPosition >> 5;
                        let offset = (endianOffset - (bitPosition % 32))
                        let value = (array[arrayIndex] >> (endianOffset - (bitPosition % 32))) & mask

                        newArray[index] = value
                    }
                }
                depth = 32
                itemsCount = (area * depth) >> 5
                array = newArray
            }

            this.mLayers.push({
                depth: depth,
                array: array
            })
            this.mFlagsByteSize += itemsCount << 2
        }

    }
}