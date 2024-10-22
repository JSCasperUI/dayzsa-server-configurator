import {MapInfo} from "@dz/dayz/types/MapInfo";

export class AreaFlag {
    mBuffer: DataView
    mapSize = 4096
    worldSize = 256*60
    mValueFlagsBitLength = 0
    mUsageFlagsBitLength = 0
    mValuesFlagsArray: Uint32Array
    mUsageFlagsArray: Uint32Array


    constructor(buf: ArrayBuffer) {
        if (!buf){
            return
        }
        this.mBuffer = new DataView(buf);


        this.mapSize = this.mBuffer.getInt32(0, true)
        this.worldSize = this.mBuffer.getInt32(8, true)
        this.mUsageFlagsBitLength = this.mBuffer.getInt32(16, true)
        let offset = this.mapSize * this.mapSize * this.mUsageFlagsBitLength / 8 + 20
        this.mValueFlagsBitLength = this.mBuffer.getInt32(offset, true)

        let hw = this.mapSize * this.mapSize
        let mUsageLength = hw * this.mUsageFlagsBitLength >> 5
        let mValuesLength = hw * this.mValueFlagsBitLength >> 5


        this.mUsageFlagsArray = new Uint32Array(this.mBuffer.buffer, 20, mUsageLength);
        this.mValuesFlagsArray = new Uint32Array(this.mBuffer.buffer, 24 + (mUsageLength << 2), mValuesLength);


    }
}