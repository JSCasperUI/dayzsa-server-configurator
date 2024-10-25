import {MapInfo} from "@dz/dayz/types/MapInfo";
import {ByteBufferOffset} from "@casperui/core/io/ByteBufferOffset";

interface LayerInfo {
    array: Uint32Array
    depth: number
}

export class AreaFlagsFile {
    mBuffer: DataView
    mapWidth = 4096
    mapHeight = 4096
    worldWidth = 256 * 60
    worldHeight = 256 * 60
    mValueFlagsBitLength = 0
    mUsageFlagsBitLength = 0
    mValuesFlagsArray: Uint32Array
    mUsageFlagsArray: Uint32Array
    layers: Array<LayerInfo> = []


    private mFlagsByteSize: number = 0

    getMemorySize(): number {
        return this.mFlagsByteSize
    }

    getLayers(): Array<LayerInfo> {
        return this.layers
    }

    constructor(buf: ArrayBuffer) {
        if (!buf) {
            return
        }
        this.mBuffer = new DataView(buf);
        const mBuf = new ByteBufferOffset(buf, 0, buf.byteLength)
        let area = this.mapWidth * this.mapHeight;
        let offset = 0

        this.mapWidth = mBuf.read32LE()
        this.mapHeight = mBuf.read32LE()
        this.worldWidth = mBuf.read32LE()
        this.worldHeight = mBuf.read32LE()

        while (mBuf.hasRemaining()) {
            let depth = mBuf.read32LE();
            let itemsCount = (area * depth) >> 5
            let array = mBuf.readUInt32Array(itemsCount)

            this.layers.push({
                depth: depth,
                array: array
            })
            this.mFlagsByteSize += itemsCount << 2
        }

        this.mUsageFlagsBitLength = this.mBuffer.getInt32(16, true)
        // let offset = this.mapSize * this.mapSize * this.mUsageFlagsBitLength / 8 + 20
        this.mValueFlagsBitLength = this.mBuffer.getInt32(offset, true)


        let mUsageLength = area * this.mUsageFlagsBitLength >> 5
        let mValuesLength = area * this.mValueFlagsBitLength >> 5


        this.mUsageFlagsArray = new Uint32Array(this.mBuffer.buffer, 20, mUsageLength);
        this.mValuesFlagsArray = new Uint32Array(this.mBuffer.buffer, 24 + (mUsageLength << 2), mValuesLength);


    }
}