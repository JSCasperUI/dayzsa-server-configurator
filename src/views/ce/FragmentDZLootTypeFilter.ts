import {JFragment} from "@casperui/core/app/JFragment";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";
import {View} from "@casperui/core/view/View";
import {R} from "@dz/R";
import {MainActivity} from "@dz/MainActivity";
import {CheckBoxBlock} from "@dz/widgets/forms/CheckBoxBlock";

export class FragmentDZLootTypeFilter extends JFragment {

    static SPLIT_NAME = "FragmentDZLootTypeFilter";
    onCreateView(inflater: BXMLInflater, container: View): View {
        return inflater.inflate(R.layout.ce.types.filter);
    }

    private mValueFlagViewMap= new Map<string,CheckBoxBlock>();
    private mUsageFlagsViewMap = new Map<string,CheckBoxBlock>();

    protected onAttachSingle() {
        let edit_name = this.byId(R.id.edit_name);
        let edit_nominal = this.byId(R.id.edit_nominal);
        let edit_lifetime = this.byId(R.id.edit_lifetime);
        let edit_restock = this.byId(R.id.edit_restock);
        let edit_min = this.byId(R.id.edit_min);
        let edit_quantmin = this.byId(R.id.edit_quantmin);
        let edit_quantmax = this.byId(R.id.edit_quantmax);
        let edit_cost = this.byId(R.id.edit_cost);




        let cb_count_in_cargo = this.byId(R.id.cb_count_in_cargo);
        let cb_count_in_hoarder = this.byId(R.id.cb_count_in_hoarder);
        let cb_count_in_map = this.byId(R.id.cb_count_in_map);
        let cb_count_in_player = this.byId(R.id.cb_count_in_player);
        let cb_crafted = this.byId(R.id.cb_crafted);
        let cb_deloot = this.byId(R.id.cb_deloot);


        let block_value_flags = this.byId(R.id.block_value_flags);
        let block_usage_flags = this.byId(R.id.block_usage_flags);
        let block_categories = this.byId(R.id.block_categories);
        let block_tags = this.byId(R.id.block_tags);


        let config = (this.ctx() as MainActivity).mBaseConfigVM

        let sync = (this.ctx() as MainActivity).mSyncSelector



        const inflater = this.getActivity().getLayoutInflater()
        config.mConfigLimitsDefinition.mValueFlags.observe(this,(flags)=> {
            this.mValueFlagViewMap.clear()
            block_value_flags.removeAllViews()
            for (const flag of flags){
                let view = inflater.inflate(R.layout.ce.types.edit.check_input);
                let checkbox = view.byId(R.id.checkbox) as CheckBoxBlock
                checkbox.setTitle(flag.name)
                this.mValueFlagViewMap.set(flag.name,checkbox)
                block_value_flags.addView(view)
            }
        })

        config.mConfigLimitsDefinition.mUsageFlags.observe(this,(flags)=> {
            block_usage_flags.removeAllViews()
            this.mUsageFlagsViewMap.clear()
            for (const flag of flags){
                let view = inflater.inflate(R.layout.ce.types.edit.check_input);
                let checkbox = view.byId(R.id.checkbox) as CheckBoxBlock
                checkbox.setTitle(flag.name)
                this.mUsageFlagsViewMap.set(flag.name,checkbox)
                block_usage_flags.addView(view)
            }
        })
        config.mConfigLimitsDefinition.mCategories.observe(this,(categories)=> {
            block_categories.removeAllViews()
            for (const category of categories){
                let view = inflater.inflate(R.layout.ce.types.edit.check_input);
                let checkbox = view.byId(R.id.checkbox) as CheckBoxBlock
                checkbox.setTitle(category.name)
                block_categories.addView(view)
            }
        })

        config.mConfigLimitsDefinition.mTags.observe(this,(tags)=> {
            block_tags.removeAllViews()

            for (const tag of tags){
                let view = inflater.inflate(R.layout.ce.types.edit.check_input);
                let checkbox = view.byId(R.id.checkbox) as CheckBoxBlock
                checkbox.setTitle(tag.name)
                block_tags.addView(view)
            }
        })




        sync.mLootTypeSelect.observe(this,(item)=>{
            if (!item) return
            edit_name.setSafeValue(item.name)
            edit_nominal.setSafeValue(item.nominal)
            edit_lifetime.setSafeValue(item.lifetime)
            edit_restock.setSafeValue(item.restock)
            edit_min.setSafeValue(item.min)
            edit_quantmin.setSafeValue(item.quantmin)
            edit_quantmax.setSafeValue(item.quantmax)
            edit_cost.setSafeValue(item.cost)


            cb_count_in_hoarder.setBoolValue(item.flags.count_in_hoarder !=0 )
            cb_count_in_cargo.setBoolValue(item.flags.count_in_cargo !=0 )
            cb_count_in_map.setBoolValue(item.flags.count_in_map !=0 )
            cb_count_in_player.setBoolValue(item.flags.count_in_player !=0 )
            cb_crafted.setBoolValue(item.flags.crafted !=0 )
            cb_deloot.setBoolValue(item.flags.deloot !=0 )

            this.mUsageFlagsViewMap.forEach((box,key)=>{
                box.setBoolValue(false)
            })

            this.mValueFlagViewMap.forEach((box,key)=>{
                box.setBoolValue(false)
            })
            item.usage.forEach(usage=>{
                let box = this.mUsageFlagsViewMap.get(usage)
                console.log("usage",usage)
                if (box) box.setBoolValue(true)
            })
            item.value.forEach(usage=>{
                let box = this.mValueFlagViewMap.get(usage)
                if (box) box.setBoolValue(true)
            })



        })




    }

    onCreated() {


    }
}