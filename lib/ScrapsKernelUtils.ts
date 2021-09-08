import {Scrap} from "./Scrap";

export class ScrapsKernelUtils {
    scrap: Scrap;
    cached: {};
    projects: {};

    constructor(scrap?: Scrap) {
        this.scrap = scrap;
        this.cached = {};
        this.projects = {};//ScrapMetadata
    }

    use_scrap_context(scrap) {
        this.scrap = scrap;
    }

    p(string: string) {
        let el = document.createElement('p');
        el.innerHTML = string;
        return el;
    }

    h1(string: string) {
        let el = document.createElement('h1');
        el.innerHTML = string;
        return el;
    }

    h2(string: string) {
        let el = document.createElement('h2');
        el.innerHTML = string;
        return el;
    }

    h3(string: string) {
        let el = document.createElement('h3');
        el.innerHTML = string;
        return el;
    }

    print(el) {
        this.scrap.print(el);
    }

    html(str: any) {
        let el = document.createElement('div');
        el.innerHTML = str;
        return el;
    }

    div(capture: any) {
        let el = document.createElement('div');
        if (capture.id) {
            el.id = capture.id;
        }
        if (capture.innerHTML) {
            el.innerHTML = capture.innerHTML;
        }
        if (capture.class) {
            el.className = capture.class;
        }
        return el.outerHTML;
    }

    elements(capture: any, fn: any) {
        if (capture.id && document.getElementById(capture.id)) {
            fn(document.getElementById(capture.id));
        }
        if (capture.class && document.getElementsByClassName(capture.class).length) {
            let items = document.getElementsByClassName(capture.class);
            for (let i = 0; i < items.length; i++) {
                fn(items[i]);
            }
        }
    }

    async import(url) {
//  if (!this.cached[url]) {
//     this.cached[url] = fetch(url);
// }
        return this.cached[url];
    }

    getRenderArea() {
        return this.scrap.area_display;
    }
}
