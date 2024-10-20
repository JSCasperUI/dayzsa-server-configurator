import {MapInfo} from "@dz/dayz/types/MapInfo";

export class AreaFlag {
    mBuffer:DataView
    mMapInfo:MapInfo = {
        mapSize:0,
        worldSize:0,
        valueBitLength:0,
        flagsBitLength:0
    }

    constructor(buf:ArrayBuffer) {
        this.mBuffer = new DataView(buf);


        this.mMapInfo.mapSize = this.mBuffer.getInt32(0,true)
        this.mMapInfo.worldSize = this.mBuffer.getInt32(8,true)
        this.mMapInfo.flagsBitLength = this.mBuffer.getInt32(16,true)
        let offset = this.mMapInfo.mapSize * this.mMapInfo.mapSize * this.mMapInfo.flagsBitLength/8 + 20
        this.mMapInfo.valueBitLength = this.mBuffer.getInt32(offset,true)

    }
}