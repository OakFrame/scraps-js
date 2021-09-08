import { ScrapsModal } from "./lib/ScrapsModal";
import {ScrapControls} from "./lib/ScrapControls";
import {Scrap} from "./lib/Scrap";
import {ScrapsKernelUtils} from "./lib/KernelUtils";
import {ScrapsContext} from "./lib/ScrapsContext";


window.addEventListener('keydown', (event) => {
    console.log('KEYPRESS', event);
    if (event.ctrlKey || event.metaKey) {
        let el;
        switch (String.fromCharCode(event.which).toLowerCase()) {

            case 's':
                event.preventDefault();
                //alert('ctrl-s');
                el = document.getElementById('scraps-save');
                if (el) {
                    el.click();
                }
                break;
            case 'e':
                event.preventDefault();
                el = document.getElementById('scraps-export');
                if (el) {
                    el.click();
                }
                // alert('ctrl-f');
                break;
            case 'g':
                //   event.preventDefault();
                // alert('ctrl-g');
                break;
        }
    }
})


window['kernelUtils'] = new ScrapsKernelUtils();

let scrapsContext:ScrapsContext = new ScrapsContext();
window['ScrapsContext'] = scrapsContext;


let elements = document.getElementsByClassName('scraps-js');
console.log('STARTING SCRAPS', elements);
for (let i = 0; i < elements.length; i++) {
    let el = elements[i];
    let scrap = new Scrap(scrapsContext);
    scrap.load(el);
}
/*
context.executeStack(true);

if (document.getElementById('run')) {
document.getElementById('run').onclick = function () {
context.executeStack(true);
}
}*/

/* Only needed if you have earlier ScrapsContext with dependencies on scraps further in the stack */
//context.executeStack(false);
