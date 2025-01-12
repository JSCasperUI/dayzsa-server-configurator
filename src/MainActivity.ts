import {Activity} from "@casperui/core/app/Activity";
import {R} from "@dz/R";
import {Application} from "@casperui/core/app/Application";
import {LayoutDistributorFragment} from "@dz/views/base/LayoutDistributorFragment";
import {BaseConfig} from "@dz/models/BaseConfig";
import {XMLLoader} from "@dz/loader/XMLLoader";
import {ModelAreaFlag} from "@dz/models/ModelAreaFlag";
import {FragmentAreaMenu} from "@dz/views/areaflags/FragmentAreaMenu";
import {FragmentAreaFlags} from "@dz/views/areaflags/FragmentAreaFlags";
import {FragmentTypeFilteredList} from "@dz/views/ce/FragmentTypeFilteredList";
import {FragmentAreaFlagsSection} from "@dz/views/areaflags/FragmentAreaFlagsSection";
import {FragmentCELootEditSection} from "@dz/views/ce/FragmentCELootEditSection";
import {SyncSelector} from "@dz/models/SyncSelector";


export class MainActivity extends Activity {

    mBaseConfigVM: BaseConfig = new BaseConfig();
    mdAreaFlag = new ModelAreaFlag()

    mJoinConfigVM: BaseConfig = new BaseConfig();


    mSyncSelector = new SyncSelector()
    private layoutFragment: LayoutDistributorFragment;

    constructor() {
        super();
    }

    async onCreate() {
        let app = (this.getApplicationContext() as Application)
        app.addFontFace("ui", this.getResources().getBufferById(R.fonts.regular).getDataView(),)
        app.addFontFace("ui", this.getResources().getBufferById(R.fonts.medium).getDataView(), {weight: "bold"})
        this.setContentView(R.layout.activityMain)



        this.byId(R.id.github_link).setSVGById(R.icons.github)



        this.byId(R.id.select_base_dir).setOnClickListener(() => {
            readJsFilesFromDirectory(this.mBaseConfigVM)
        })
        this.byId(R.id.select_modding_dir).setOnClickListener(() => {
            readJsFilesFromDirectory(this.mJoinConfigVM)
        })



        this.byId(R.id.ce_loot_edit).setOnClickListener(() => {
            this.getFragmentManager().replaceFragment(R.id.fragment_main_content, FragmentCELootEditSection.getInstance(this))
        })
        this.byId(R.id.ce_area_edit).setOnClickListener(() => {
            this.getFragmentManager().replaceFragment(R.id.fragment_main_content, FragmentAreaFlagsSection.getInstance(this))
        })
        this.getFragmentManager().replaceFragment(R.id.fragment_main_content, FragmentCELootEditSection.getInstance(this))
    }


    onLayout() {

    }


}

async function recursiveRead(loader:XMLLoader,config: BaseConfig,dirHandle:any) {
    for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
            const file = await entry.getFile();
            await loader.process(file, entry.name)
        }else if (entry.kind){
            await recursiveRead(loader,config,entry)
        }
    }
}

async function readJsFilesFromDirectory(config: BaseConfig) {
    // @ts-ignore
    const dirHandle = await window.showDirectoryPicker();
    let loader = new XMLLoader(config)
    await recursiveRead(loader,config,dirHandle)

    console.log(config)

}

// Запуск функции


