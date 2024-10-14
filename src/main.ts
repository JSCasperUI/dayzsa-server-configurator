import {Application} from "@casperui/core/app/Application";
import {MainActivity} from "@dz/MainActivity";

export async function JStartFullApp() {

    let  s = new Application()
    await s.startActivity(new MainActivity())

}
window.onload = function(e){
    JStartFullApp()
}
