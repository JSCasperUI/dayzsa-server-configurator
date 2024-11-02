import {BaseMapView} from "@dz/views/base/BaseMapView";
import {Canvas} from "@casperui/core/graphics/Canvas";
import {MainActivity} from "@dz/MainActivity";
import {AreaFlagsFile} from "@dz/dayz/types/AreaFlagsFile";
import {AreaFlagRender} from "@dz/dayz/AreaFlagRender";
import {Bitmap} from "@casperui/core/graphics/Bitmap";
import {Rect} from "@casperui/core/graphics/Rect";
import {R} from "@dz/R";


export class FragmentAreaFlags extends BaseMapView {
    private mAreaRender: AreaFlagRender;
    private mAreaFlagsFile: AreaFlagsFile;
    private mAreaBitmap: Bitmap;
    private mValueFlags: number = 0;
    private mUsageFlags: number = 0;


    async onCreated(): Promise<void> {
        await super.onCreated();

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
            // if (!this.mPreviewBitmap) return
            // this.printAreaFlagsToBitmapPreview(this.mPreviewBitmap,value.valueMask, value.usageMask)
            // this.draw()
        })

    }

    async loadAreaFlagData(area: AreaFlagsFile) {
        if (!area) return


        this.mAreaRender = new AreaFlagRender(this.ctx())
        await this.mAreaRender.initV2(area)
        this.mAreaFlagsFile = area


        // this.mapRect.mRight = this.mAreaFlags.mMapWidth
        // this.mapRect.mBottom = this.mAreaFlags.mMapWidth


        this.mAreaBitmap = Bitmap.createBitmap(this.mAreaFlagsFile.mMapWidth, this.mAreaFlagsFile.mMapHeight)


        this.redrawArea()

    }

    redrawArea(){
        if (!this.mAreaBitmap) return
        let width = this.mAreaFlagsFile.mMapWidth
        let height = this.mAreaFlagsFile.mMapHeight

        let clip = new Rect(0,0, width, height)
        // this.areaRender.printAreaFlagsToBitmap(this.mValueFlags,this.mUsageFlags,clip)
        // this.mAreaBitmap.setPixelsDitry(this.areaRender.imageData,clip)
        // this.areaRender.drawToBitmap([this.mUsageFlags,this.mValueFlags],clip)
        let time = this.mAreaRender.drawToBitmap([this.mUsageFlags,this.mValueFlags],clip)

        this.byId(R.id.time).setValue(time.toString())
        this.mAreaBitmap.setPixelsDitry(this.mAreaRender.getImageData(),clip)


        // this.printAreaFlagsToBitmap(this.mAreaBitmap, this.mValueFlags,this.mUsageFlags)
        // this.printAreaFlagsToBitmapPreview(this.mPreviewBitmap, 1,0)
        this.draw()
    }

    protected onDraw(canvas: Canvas) {
        if (this.mAreaBitmap)
        canvas.drawBitmap(this.mAreaBitmap,null,this.mMapRect)

    }
}