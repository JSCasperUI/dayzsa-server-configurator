import {Activity} from "@casperui/core/app/Activity";
import {R} from "@dz/R";
import {Application} from "@casperui/core/app/Application";
import {LayoutDistributorFragment} from "@dz/flayout/base/LayoutDistributorFragment";
import {BaseConfig} from "@dz/model/BaseConfig";
import {XMLLoader} from "@dz/loader/XMLLoader";
import {Paint} from "@casperui/core/graphics/Paint";
import {FragmentDZAreaFlags} from "@dz/views/areaflags/FragmentDZAreaFlags";


export class MainActivity extends Activity {

    mBaseConfigVM:BaseConfig = new BaseConfig();
    mJoinConfigVM:BaseConfig = new BaseConfig();

    constructor() {
        super();
    }

    async onCreate() {
        let app = (this.getApplicationContext() as Application);
        app.addFontFace("ui",this.getResources().getBufferById(R.fonts.regular).getDataView(),)
        app.addFontFace("ui",this.getResources().getBufferById(R.fonts.medium).getDataView(),{weight:"bold"})
        this.setContentView(R.layout.activityMain)
        let frag = new LayoutDistributorFragment(this,false,-2)

        let dzArea = new FragmentDZAreaFlags(this)
         this.getFragmentManager().replaceFragment(R.id.fragment_main_content, frag)
        frag.inflate({
            type: 1,
            child: [

                {type: 2,l:15,child: [
                        {
                            l:50,
                            type: 0,
                            meta:{type:"module_list"}
                        },{
                            l:50,
                            type: 0,
                            meta:{type:"property"}
                        }
                    ]},
                {type: 0,l:65, meta:{type:"area_map"}},
                {
                    type: 2,
                    l:20,
                    child: [
                        {
                            l:50,
                            type: 0,
                            meta:{type:"property"}
                        },
                        {
                            type: 1,
                            l:50,
                            child: [
                                {type: 0,  meta:{type:"tree"}},
                            ]
                        }
                    ]
                },
            ]
        })


        this.byId(R.id.select_base_dir).setOnClickListener(()=>{
            readJsFilesFromDirectory(this.mBaseConfigVM)
        })
        this.byId(R.id.select_modding_dir).setOnClickListener(()=>{
            readJsFilesFromDirectory(this.mJoinConfigVM)
        })

        let paint = new Paint()
        paint.setStyle(Paint.FILL)

        // let btm = await Bitmap.loadBitmap("./im.png")
        // btm.convertToOffscreenCanvas()
        // let vas = this.byId(R.id.canvas)
        // let canvas = new Canvas(vas)
        // let mx = new Matrix()
        // mx.scale(0.5,0.5)
        // mx.translate(-100,-100)
        // canvas.start()
        // canvas.preTransform(mx)
        // canvas.translate(100,100)
        // canvas.drawRect(new Rect(0,0,50,50),paint)
        // canvas.end()
        // let draw = ()=>{
        //     canvas.resetMatrix()
        //     canvas.clear()
        //     canvas.scale(scale,scale)
        //     canvas.translate(offsetX,offsetY)
        //     canvas.drawRect(new Rect(0,0,50,50),paint)
        // }
        //
        // // let img = await btm.toImage();
        // // (this.byId(R.id.test_image).getElement() as HTMLImageElement).src = img.src
        // let offsetX = 0
        // let offsetY = 0
        // let startX = 0
        // let startY = 0
        // let scale = 1
        // let isDragging = false
        // vas.makeSafeEvent('wheel', (event) => {
        //     event.preventDefault();
        //     const zoomSpeed = 0.1;
        //     const zoom = event.deltaY < 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
        //
        //     const mouseX = (event.offsetX - offsetX) / scale;
        //     const mouseY = (event.offsetY - offsetY) / scale;
        //
        //     scale = Math.min(4,  scale * zoom);
        //
        //     offsetX = event.offsetX - mouseX * scale;
        //     offsetY = event.offsetY - mouseY * scale;
        //
        //     draw();
        // });
        //
        // vas.makeSafeEvent('mousedown', (event) => {
        //     isDragging = true;
        //     startX = event.offsetX - offsetX;
        //     startY = event.offsetY - offsetY;
        //     // canvas.style.cursor = 'grabbing';
        // });
        //
        // vas.makeSafeEvent('mousemove', (event) => {
        //     if (isDragging) {
        //         offsetX = event.offsetX - startX;
        //         offsetY = event.offsetY - startY;
        //         draw();
        //     }
        // });
        //
        // vas.makeSafeEvent('mouseup', () => {
        //     isDragging = false;
        // });
        //
        // vas.makeSafeEvent('mouseleave', () => {
        //     isDragging = false;
        //     // canvas.style.cursor = 'grab';
        // });


    }





    onLayout() {

    }



}
async function readJsFilesFromDirectory(config:BaseConfig) {
    // @ts-ignore
    const dirHandle = await window.showDirectoryPicker();
    let loader = new XMLLoader(config)
    // Проходим по всем файлам и папкам в директории
    for await (const entry of dirHandle.values()) {
        // Проверяем, что это файл и имеет расширение .js
        if (entry.kind === 'file') {
            const file = await entry.getFile();

            await loader.process(file,entry.name)
        }
    }
    console.log(config.mLists)
}

// Запуск функции


