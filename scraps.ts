const Parser = require("acorn");

function validate(code) {
    return (Parser.parse(code, {ecmaVersion: 2020, allowReturnOutsideFunction: true}));
}

function generateIdPart() {
    return (parseInt(`${10000 + Math.floor(Math.random() * 89999)}`)).toString(16);
}

function generateId(len = 4) {
    let r = [];
    for (let i = 0; i < len; i++) {
        r.push(generateIdPart())
    }
    return r.join('-');
}

export interface ScrapVersionedMetadata {
    fn: string;
    version: string;
}

export interface ScrapMetadata {
    id: string;
    name: string;
    alias: string;
    fn: ScrapVersionedMetadata[];
}

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

export class ScrapCodePackage implements ScrapMetadata {

    alias: string;
    fn: ScrapVersionedMetadata[] = [];
    id: string = generateId();
    name: string = "Untitled Scrap";

    constructor(scrapMetadata?: ScrapMetadata) {
        if (scrapMetadata) {
            this.id = scrapMetadata.id;
            this.name = scrapMetadata.name;
            this.fn = scrapMetadata.fn;
            this.alias = scrapMetadata.alias;
        }
    }

    copy(scrapMetadata: ScrapMetadata) {
        this.id = scrapMetadata.id;
        this.name = scrapMetadata.name;
        this.fn = scrapMetadata.fn;
        this.alias = scrapMetadata.alias;
    }

}


export class Modal {
    static launch = (d) => {
        return new Promise((res, rej) => {

            let m = document.createElement('div');
            m.innerHTML = `
            <div class='inner'><textarea id="content" style="height: 220px;width: 100%;"></textarea>
            <div class="controls"><span class="button primary" id="add">Add</span> <span class="button" style="float:right;" id="cancel">Cancel</span></div></div>
            `;
            m.className = "scraps modal flex align-center";


            document.body.appendChild(m);
            let el = document.getElementById('content');
            /*let scrap = new Scrap(context);
            scrap.load(el);*/

            document.getElementById('add').onclick = () => {
                let v = ((<HTMLTextAreaElement>el).value);
                console.log(v);
                res(JSON.parse(v));
                document.body.removeChild(m);

            }
            document.getElementById('cancel').onclick = () => {

                document.body.removeChild(m);
                rej()
            }


        });
    }

    static edit = (d) => {
        return new Promise((res, rej) => {

            console.log('EDITING LIB', d);

            let m = document.createElement('div');

            let v = JSON.stringify(window['kernelUtils'].cached[d], null, "\t").replace(/</g, "&lt;")
                .replace(/>/g, "&gt;") + "\n";
            m.innerHTML = `
            <div class='inner'><textarea id="content" style="height: 220px;width: 100%;">${v}</textarea>
            <div class="controls"><span class="button primary" id="save">Save</span> <span class="button error" id="delete">Delete</span> <span class="button" id="cancel" style="float:right;">Cancel</span> </div></div>
            `;
            m.className = "scraps modal flex align-center";


            document.body.appendChild(m);
            let el = document.getElementById('content');
            /*let scrap = new Scrap(context);
            scrap.load(el);*/

            document.getElementById('save').onclick = () => {
                let v = ((<HTMLTextAreaElement>el).value);
                // console.log(v);
                res(JSON.parse(v));
                console.log('SAVING', d)
                document.body.removeChild(m);

            }
            document.getElementById('cancel').onclick = () => {

                document.body.removeChild(m);
                rej()
            }


        });
    }
}

class ScrapsContext {

    scraps: Array<Scrap>;

    constructor() {
        this.scraps = [];
    }

    register(kernel: Scrap) {
        this.scraps.push(kernel);
        return this;
    }

    executeStack(flush: boolean) {
        this.scraps.forEach(async function (scrap) {
            const result = await scrap.evaluate(flush);
            scrap.updateEvaluationResponse(result);
        });
    }

}

function mobileCheck() {
    let check = 0;
    (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = 1;
    })(navigator.userAgent || navigator.vendor || window['opera']);
    return check;
}

enum SCRAPS_EVALUATION_RESULT_TYPE {
    ARTIFACT = 0,
    EDITING = 1,
    COMPILATION_ERROR = 2,
    RUNTIME_ERROR = 3
}

class ScrapsEvaluationResponse {
    type: SCRAPS_EVALUATION_RESULT_TYPE;
    data: any;

    constructor(type: SCRAPS_EVALUATION_RESULT_TYPE, data: any) {
        this.type = type;
        this.data = data;
    }
}

class CodeSandbox {
    input: string;
    element: HTMLTextAreaElement;
    output_element: HTMLElement;
    output_code: HTMLElement;
    scrap: Scrap;
    window_scroll: (number | null);
    inner_scroll: (number | null);
    window_lines;
    intervals;
    ran_deps;

    loadCode(code) {
        this.input = code.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
        this.element.value = this.input;
    }

    constructor(scrap: Scrap, code: string) {
        let sandbox = this;
        this.scrap = scrap;
        this.ran_deps = {};


        // this.input = code.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");


        if (this.scrap.options.session) {
            console.log('SESSION', this.scrap.options.session);
            let v = window.localStorage.getItem('scraps-js-autosave-' + this.scrap.options.session);
            if (v && v.length >= 1) {
                this.input = window.localStorage.getItem('scraps-js-autosave-' + this.scrap.options.session)
            }
        }

        this.element = document.createElement('textarea');

        this.loadCode(code);


        this.element.className = "code-input";
        this.element.value = this.input;
        this.element.style.width = "100%";
        //this.element.rows = 8;
        this.element.spellcheck = false;
        // this.element.style.height = "auto";
        this.intervals = [];

        this.output_element = document.createElement('pre');
        this.output_element.className = "code-output";
        this.output_code = document.createElement('code');
        this.output_code.className = "language-javascript";
        this.output_element.appendChild(this.output_code);

        console.log('MY ELEMENT', this.scrap.container_element);

        let has_inner = false;

        (<HTMLElement>this.scrap.container_element.parentNode).onscroll = (ev) => {
            //    sandbox.output_code.scrollTop = sandbox.element.scrollTop;
            //    sandbox.output_code.scrollLeft = sandbox.element.scrollLeft;
            console.log('set INNER??', (<HTMLElement>this.scrap.container_element.parentNode).scrollTop);
            this.inner_scroll = (<HTMLElement>this.scrap.container_element.parentNode).scrollTop;
        };

        document.body.onscroll = (ev) => {
            //    sandbox.output_code.scrollTop = sandbox.element.scrollTop;
            //    sandbox.output_code.scrollLeft = sandbox.element.scrollLeft;
            console.log('set SCROLL??', document.body.scrollTop);
            this.window_scroll = document.body.scrollTop;
        };


        // @ts-ignore
        this.element.onkeydown = this.element.onpaste = (event: (Event | KeyboardEvent)) => {

            console.log('ak', this.inner_scroll, this.window_scroll);
            //if (!this.window_scroll) {
            //     this.window_scroll = window.scrollY
            //     console.log('window scroll', this.window_scroll);
            // }

            this.scrap.clearWarning();
            // console.log((<HTMLTextAreaElement>event.srcElement).value);
            var input = sandbox.element,
                selStartPos = input.selectionStart,
                inputVal = input.value;

            if (event instanceof KeyboardEvent && event.keyCode && event.keyCode === 9) {
                input.value = inputVal.substring(0, selStartPos) + "    " + inputVal.substring(selStartPos, input.value.length);
                input.selectionStart = selStartPos + 4;
                input.selectionEnd = selStartPos + 4;
                event.preventDefault();
            }

            if (this.scrap.options.session) {
                window.localStorage.setItem('scraps-js-autosave-' + this.scrap.options.session, input.value);
            }

            if (mobileCheck() === 0) {
                window.setTimeout(function () {
                    sandbox.renderCodeHighlighting();
                }, 1);
            }
            //sandbox.renderCodeHighlighting();
            this.scrap.updateEvaluationResponse(new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.EDITING, {}));

        };
        this.element.oninput = () => {
            console.log('bk', this.inner_scroll, this.window_scroll);
            this.scrap.clearWarning();
            if (this.scrap.options.session) {
                window.localStorage.setItem('scraps-js-autosave-' + this.scrap.options.session, this.element.value);
            }
            if (mobileCheck() === 1) {
                sandbox.renderCodeHighlighting();
            }
            // this.scrap.clearWarning();
            //  this.scrap.updateEvaluationResponse(new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.EDITING, {}));
            // window.setTimeout(function () {
            //  sandbox.renderCodeHighlighting();
            // }, 1);
            // if (document.getElementById('run')) {
            return false;
            // }
            context.executeStack(false);
        };
        this.element.onkeyup = () => {
            console.log('ck', this.inner_scroll, this.window_scroll);
        };
    }

    fixHeight() {
        console.log('fix height', this.inner_scroll, this.window_scroll);
        let lines = this.element.value.split(/\r*\n/).length;
        if (lines !== this.window_lines/* && !this.scrap.options.fixedSize*/) {
            console.log('NOT FIXED', document.body.scrollTop);
            let pnode = (<HTMLElement>this.scrap.container_element.parentNode);
            if (!pnode.scrollTop) {
                pnode = document.body;
                this.window_scroll = document.body.scrollTop;
                this.inner_scroll = null;
            }
            const p = this.inner_scroll || window.scrollY || this.window_scroll;
            this.window_lines = lines;
            this.element.style.minHeight = "5px";
            //if ((this.element.scrollHeight) !== parseFloat(this.element.style.height)) {
            this.element.style.minHeight = (this.element.scrollHeight) + "px";
            this.output_code.style.minHeight = (this.element.scrollHeight) + "px";
            //window.scrollTo(0, this.window_scroll);
            console.log('CHECKING SCROLL', pnode, p, this.window_scroll);
            pnode.scrollTop = p;
            /*   window.scrollTo({
                   top: this.window_scroll,
                   left: 0,
                   behavior: 'auto'
               });*/

            //window.scrollTo(0, scrollY);
        }
    }

    renderCodeHighlighting() {
        this.fixHeight();
        //this.window_scroll = null;
        // }
        //  window.setTimeout(function(){

        //},1)
        //window.scrollTo(0, scrollY);

        this.input = this.element.value;
        this.output_code.innerHTML = this.input.replace(/</g, "&lt;")
            .replace(/>/g, "&gt;") + "\n";

//        let t: number;
        //      t = Date.now();
        // @ts-ignore
        window['Prism'].highlightElement(this.output_code, false, () => {
        });
    }

    getElement() {
        let el = document.createElement('div');
        el.className = 'code';
        el.appendChild(this.element);
        el.appendChild(this.output_element);
        return el;
    }

    getCompiled(aa = false) {
        let libraries = '';
        for (let prop in window['kernelUtils'].cached) {
            //   let item = window['kernelUtils'].cached[prop];
            libraries += `${window['kernelUtils'].cached[prop].fn[window['kernelUtils'].cached[prop].using_version || 0].fn};`;
        }
        //   console.log(libraries);
        let build_variables = `
		function makeIdentifiableProperty(i){
			return typeof i + (!!i?i.toString():"unknown");
		}${libraries}
		if (window['kernelUtils']){Scrap = kernelUtils; Scrap.use_scrap_context(scrap);}
		
`;

        for (let prop of this.intervals) {
            console.log("CLEARING INTERVAL", prop);
            // @ts-ignore
            window.clearInterval(window[prop]);

        }
        this.intervals = [];

        //let matched_es6_classes = this.input.match(/class ([a-zA-Z]+)/)
        let escaped = this.input.replace(/`/g, "\`")
            /* .replace(/class ([a-zA-Z0-9_]+)/g, function (m) {
                 let classname = m.match(/class ([a-zA-Z0-9_]+)/)[1];
                 return `window.${classname} = class ${classname}`;
             })
             .replace(/function ([a-zA-Z0-9_]+)/g, function (m) {
                 let classname = m.match(/function ([a-zA-Z0-9_]+)/)[1];
                 return `window.${classname} = function ${classname}`;
             })*/
            .replace(/window\.setInterval/g, (m) => {
                let interval_name = `_scraps_interval_` + ((Math.random() * 1000) | 0) + ((Math.random() * 1000) | 0) + ((Math.random() * 1000) | 0);
                this.intervals.push(interval_name);
                //  console.log("WATCHING INTERVAL", interval_name);
                return `window.${interval_name} = window.setInterval`;
            });

        let depth = 20;
        while ((escaped.indexOf('@import ') !== -1 || escaped.indexOf('@depends ') !== -1) && depth-- > 0) {
            for (let prop in window['kernelUtils'].projects) {
                let item = window['kernelUtils'].projects[prop];
                let check = `@import ${item.alias}`;
                if (escaped.indexOf(check) !== -1) {
                    escaped = escaped.replace(check, `(()=>{${item.fn[item.using_version || 0].fn}})()`);
                    //  console.log('REPACES', `@import ${item.alias}`, item);
                }
            }

            for (let prop in window['kernelUtils'].projects) {
                let item = window['kernelUtils'].projects[prop];
                let fn = '';
                let check = `@depends ${item.alias}`
                if (escaped.indexOf(check) !== -1 && !this.ran_deps[prop]) {
                    fn = item.fn[item.using_version || 0].fn;
                    this.ran_deps[prop] = true;
                    //   console.log('RAND DEPS', `@depends ${item.alias}`, item);
                }
                //  escaped = escaped.replace(check, fn);
                escaped = escaped.replace(check, `(()=>{${fn}})()`);


            }
        }

//        if (aa){
        escaped = ` ${escaped}`;
        //      }

        const fn = `const _____ = async function (){${build_variables}${escaped} }; return _____();`;

        return fn;
    }

    getLambda(aa = false) {
        let args = "scrap";
        let AsyncFunction = Object.getPrototypeOf(async function () {
        }).constructor;
        return AsyncFunction(args, this.getCompiled(aa));
    }

}

interface ScrapOptions {
    autorun: boolean;
    session: boolean | string;
    fixedSize: boolean;
    launched: boolean;
}

class ScrapControls {
    element: HTMLElement;
    scrap: Scrap;
    result_type_element: HTMLElement;
    last_result_state: SCRAPS_EVALUATION_RESULT_TYPE;

    constructor(scrap: Scrap) {
        this.scrap = scrap;
        this.element = scrap.area_control;
        this.result_type_element = document.createElement("div");
    }

    async load() {

        this.result_type_element.innerHTML = '<i class="fas fa-fw fa-ellipsis-h"></i>&ZeroWidthSpace;';
        this.result_type_element.className = 'button border-left';


        let menu = document.createElement('div');
        menu.innerHTML = ``;
        menu.className = "hidden-menu hidden";
        menu.id = "scrap-hidden-" + this.scrap.id;

        let expand = document.createElement('div');
        expand.className = "button";
        expand.innerText = "Expand Full IDE";


        if (!this.scrap.options.fixedSize) {
            menu.appendChild(expand);
        }

        let evaluate_element = document.createElement("div");
        evaluate_element.innerHTML = '<i class="far fa-fw fa-play-circle"></i> Run';
        evaluate_element.className = "button";


        evaluate_element.onclick = async () => {
            const result = await this.scrap.evaluate(true);
            this.update(result);
        }


        let run_on_start_element = document.createElement("span");

        run_on_start_element.innerHTML = `<i class="far fa-fw fa-${this.scrap.options.autorun ? 'check-square' : 'square'}"></i> Auto-run on Load`;
        run_on_start_element.className = "button";

        run_on_start_element.onclick = () => {
            this.scrap.options.autorun = !this.scrap.options.autorun;
            run_on_start_element.innerHTML = `<i class="far fa-fw fa-${this.scrap.options.autorun ? 'check-square' : 'square'}"></i> Auto-run on Load`;
        }

        this.element.appendChild(menu);
        this.element.appendChild(this.result_type_element);
        this.element.appendChild(evaluate_element);


        expand.onclick = async () => {


            console.log('BUILD FULL SCRAPS LIST');
            console.log('BUILD FULL SCRAPS LIST');

            if (this.scrap.options.fixedSize) {
                let d = document.querySelector('.modal')[0];
                if (d) {
                    d.parentNode.removeChild(d);
                    return;
                }
            }

            let m = document.createElement('div');
            m.className = "modal";

            let code = '';
            code = this.scrap.getSandbox().input.replace(/</g, "&lt;")
                .replace(/>/g, "&gt;") + "\n";

            console.log('CODE INPUT', code);


            m.innerHTML = `<div class="wrapper scraps">
    <div class="one">
        <div class="section controls"><div class="button errorable" id="return"><i class="fas fa-fw fa-angle-left"></i> Close</div>
            <div class="button ghost"><i class="fas fa-fw fa-scroll"></i> Scraps</div> <div class="button"><i class="fas fa-fw fa-list-ul"></i> Structure</div> <div class="button"><i class="fas fa-fw fa-list-ul"></i> Project</div> <div class="button"><i class="fas fa-fw fa-list-ul"></i> Project</div>
        </div>
        <div class="section controls"><div class="" id="area_control"></div>        </div>

        <div class="section controls"><div class="" id="area_cached">
            <div class="section top controls"><span class="button ghost"><i class="fas fa-fw fa-layer-group"></i> Available Libraries</span><span id="library_add" class="button" style="float:right;"><i class="fas fa-fw fa-plus"></i> Add Library</span></div>
        </div>        </div>
    </div>
    <div class="two">
            <div id='scraps-js-modal' class="scraps-js" data-fixed="true" data-launched="true">${code}</div>
    </div>
    <div class="three">
        <div class="section controls"><span class="button ghost"><i class="fas fa-fw fa-layer-group"></i> Return Buffer</span></div>
        <div class="controls scraps" id="area_artifacts"></div>

    </div>
    <div class="four"><div class="section controls"><span class="button ghost"><i class="fas fa-fw fa-layer-group"></i> Render Buffer</span></div>
    <div id="area_display"></div></div>
    <div class="five"></div>
    <div class="six" style="text-align: right;">
        <div class="controls"><a href="https://oakframe.org" class="button"><i class="fas fa-fw fa-bezier-curve"></i> Built by OakFrame</a></div>
    </div>
</div>`;

            // let el = document.createElement('div');
            // el.className = 'scraps-js';
            // el.setAttribute('data-fixed',"true");

            // m.appendChild(el);
            document.body.appendChild(m);

            let el = document.getElementById('scraps-js-modal');
            let scrap = new Scrap(context);
            scrap.load(el);

            let ret = document.getElementById('return');
            ret.onclick = () => {
                // CLOSE MODAL

                let d = document.querySelector('.modal');
                console.log("CLOSE MODAL", d);
                if (d) {
                    d.parentNode.removeChild(d);
                    return;
                }
            };


        }

        console.log("setupi", this.result_type_element)
        this.result_type_element.onclick = () => {
            let c = document.getElementById("scrap-hidden-" + this.scrap.id);
            if (c) {

                if (c.className.indexOf(' hidden') != -1) {
                    c.className = c.className.replace(" hidden", "");
                } else {
                    c.className += " hidden";
                }

            }
        }

        if (this.scrap.options.autorun) {
            const result = await this.scrap.evaluate(true);
            this.update(result);
        }
        if (this.scrap.options.fixedSize) {
            this.element.appendChild(run_on_start_element);
        }
    }

    update(result: ScrapsEvaluationResponse) {
        if (this.last_result_state === result.type) {
            return;
        }
        this.result_type_element.className = 'button border-left';
        this.last_result_state = result.type;
        let zero_width_space = "&ZeroWidthSpace;";
        switch (result.type) {
            case SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR:
                this.result_type_element.innerHTML = '<i class="fas fa-fw fa-bug"></i>' + zero_width_space;
                this.result_type_element.className += ' error';
                break;

            case SCRAPS_EVALUATION_RESULT_TYPE.RUNTIME_ERROR:
                this.result_type_element.innerHTML = '<i class="fas fa-fw fa-bug"></i>' + zero_width_space;
                this.result_type_element.className += ' warn';
                break;

            case SCRAPS_EVALUATION_RESULT_TYPE.ARTIFACT:
                this.result_type_element.innerHTML = '<i class="fas fa-fw fa-check"></i>' + zero_width_space;
                this.result_type_element.className += ' success';
                break;

            case SCRAPS_EVALUATION_RESULT_TYPE.EDITING:
                this.result_type_element.innerHTML = '<i class="fas fa-fw fa-ellipsis-h"></i>' + zero_width_space;

                break;
        }
    }
}

class Scrap {
    id: string;
    context: ScrapsContext;
    options: ScrapOptions;
    sandbox: CodeSandbox;
    utils: KernelUtils;
    controls: ScrapControls;
    container_element: HTMLElement | Element;
    area_control: HTMLElement;
    area_working: HTMLElement;
    area_display: HTMLElement;
    area_console: HTMLElement;
    area_project: HTMLElement;
    area_cached: HTMLElement;
    artifacts: any;
    debounce: number;
    warning_line_element: HTMLElement;
    warning_position_element: HTMLElement;
    scrap_package: ScrapCodePackage;

    loadScrapPackage(p) {
        this.scrap_package = p;
        this.getSandbox().ran_deps[p.alias] = false;
        this.getSandbox().loadCode((p.fn.length >= 1) ? (p.fn[0].fn) : (""));
        this.clearWarning();
        this.getSandbox().renderCodeHighlighting();
    }

    constructor(context: ScrapsContext) {
        this.id = generateId();

        this.scrap_package = new ScrapCodePackage();

        this.context = context.register(this);
        this.options = {
            autorun: false,
            session: false,
            fixedSize: false,
            launched: false
        };
        this.area_control = document.createElement('div');
        this.area_control.className = "controls";
        this.area_working = document.createElement('div');
        this.area_working.className = "working";
        this.area_display = document.createElement('div');
        this.area_display.className = "display";
        this.area_console = document.createElement('div');
        this.area_console.className = "artifacts";
        this.area_project = document.createElement('div');
        this.area_project.className = "project";

        this.area_cached = document.createElement('div');
        this.area_cached.className = "cached";

        let area_cached_add = document.getElementById('library_add');
        let area_project_add = document.getElementById('scrap_add');

        console.log('LOADING SCRAP', this);

        if (area_cached_add) {
            let area_cached_list = document.getElementById('library_cached_list')
            if (!area_cached_list) {
                area_cached_list = document.createElement('ul');
                this.area_cached.appendChild(area_cached_list);
            }
            area_cached_list.innerHTML = '';
            area_cached_list.id = 'library_cached_list';

            area_cached_add.onclick = function () {

                Modal.launch(`<input type='text' placeholder="name" id="name"/><br/><div class='scraps-js'></div>`).then((d: any) => {
                    window['kernelUtils'].cached[d.alias] = d;
                    window.localStorage.setItem('scraps-js-cached-libs', JSON.stringify(window['kernelUtils'].cached));
                    console.log('d', d);
                    cached_area_update();
                    console.log('SCRIPT ADDED');
                }).catch(() => {
                    console.log('no script added');
                });
            }


            let cached_area_update = () => {
                let saved = window.localStorage.getItem('scraps-js-cached-libs');
                if (saved && saved.length > 1) {
                    window['kernelUtils'].cached = JSON.parse(saved);
                }

                area_cached_list.innerHTML = '';
                let len = 0;
                let p_edit = [];
                for (let prop in window['kernelUtils'].cached) {

                    let item = window['kernelUtils'].cached[prop];
                    console.log('item', item);
                    let li = document.createElement('li');

                    let b1 = document.createElement('input');
                    b1.className = "button-like";
                    b1.value = item.name;
                    b1.onchange = () => {
                        window['kernelUtils'].cached[prop].name = b1.value;
                        if (this.scrap_package.id == window['kernelUtils'].cached[prop].id) {
                            this.scrap_package.name = window['kernelUtils'].cached[prop].name;
                        }
                        this.saveLocals();
                    }
                    let b2 = document.createElement('span');
                    b2.innerHTML = ` <span class="button-like"><strong>v</strong>${item.version || item.fn[0].version}</span> <em>as</em> `;

                    let b3 = document.createElement('span');
                    b3.className = "button-like primary";
                    b3.innerText = item.alias;
                    b3.style.maxWidth = "25%";
                    /* b3.onchange = ()=>{
                         window['kernelUtils'].cached[prop].alias = b3.value;
                         this.saveLocals();
                     }*/

                    let b4 = document.createElement('span');
                    b4.className = "button-like";
                    b4.innerText = item.name;

                    /* for (let i=0;i<item.fn.length;i++){
                         let o = document.createElement('option');
                         o.value = "0";
                         o.innerText = `${item.fn[i].version}`;
                         b4.appendChild(o);
                     }

                     b4.onchange = ()=>{
                         window['kernelUtils'].cached[prop].using_version = parseInt(b4.value);
                         this.saveLocals();
                     }*/

                    li.appendChild(b1);
                    //li.appendChild(b4);
                    li.appendChild(b2);
                    li.appendChild(b3);


                    let line_controls = document.createElement('div');
                    line_controls.className = "controls right";
                    line_controls.style.float = "right";

                    let edit = document.createElement('span');
                    edit.id = `library-edit-${len}`;
                    edit.className = `button`;
                    edit.innerHTML = `<i class="far fa-fw fa-edit"></i>`;

                    p_edit[len] = {element: edit, item: prop};

                    li.appendChild(line_controls);
                    line_controls.appendChild(edit);

                    area_cached_list.appendChild(li);
                    len++;
                }
                if (len == 0) {
                    let li = document.createElement('li');
                    li.innerText = `No loaded libraries`;
                    area_cached_list.appendChild(li);
                } else {

                    for (let i = 0; i < len; i++) {
                        console.log("SHOULD EDIT", window['kernelUtils'].cached, 'library-edit-' + i, p_edit[i]);
                        p_edit[i].element.onclick = () => {
                            Modal.edit(p_edit[i].item).then((d: any) => {
                                window['kernelUtils'].cached[d.alias] = d;
                                this.saveLocals();
                                console.log('EDITED', d);
                                cached_area_update();
                                console.log('SCRIPT EDITED');
                            }).catch(() => {
                                console.log('no script added');
                            });
                        };
                    }
                }


            }
            cached_area_update();

        }

        if (area_project_add) {
            let area_projects_list = document.getElementById('library_project_list')
            if (!area_projects_list) {
                area_projects_list = document.createElement('ul');
                this.area_project.appendChild(area_projects_list);
            }
            area_projects_list.innerHTML = '';
            area_projects_list.id = 'library_project_list';

            console.log('area project add', area_projects_list, this.area_project);

            area_project_add.onclick = () => {

                let sc = new ScrapCodePackage();
                this.loadScrapPackage(sc);

                /*Modal.launch(`<input type='text' placeholder="name" id="name"/><br/><div class='scraps-js'></div>`).then((d: any) => {
                    window['kernelUtils'].projects[d.alias] = d;
                    window.localStorage.setItem('scraps-js-cached-libs', JSON.stringify(window['kernelUtils'].projects));
                    console.log('d', d);
                    project_area_update();
                    console.log('SCRIPT ADDED');
                }).catch(() => {
                    console.log('no script added');
                });*/
            }


            let project_area_update = () => {
                let saved = window.localStorage.getItem('scraps-js-projects-libs');
                if (saved && saved.length > 1) {
                    window['kernelUtils'].projects = JSON.parse(saved);
                }

                area_projects_list.innerHTML = '';
                let len = 0;
                let p_edit = [];
                for (let prop in window['kernelUtils'].projects) {

                    let item = window['kernelUtils'].projects[prop];
                    console.log('item', item);
                    let li = document.createElement('li');
                    li.className = "listable";

                    let b1 = document.createElement('input');
                    b1.className = "button-like";
                    b1.value = item.name;
                    b1.onchange = () => {
                        window['kernelUtils'].projects[prop].name = b1.value;
                        if (this.scrap_package.id == window['kernelUtils'].projects[prop].id) {
                            this.scrap_package.name = window['kernelUtils'].projects[prop].name;
                        }
                        this.saveLocals();
                    }
                    let b2 = document.createElement('span');
                    b2.innerHTML = ` <span class="button-like"><strong>v</strong>${item.version || item.fn[0].version}</span> <em>as</em> `;

                    let b3 = document.createElement('input');
                    b3.className = "button-like primary";
                    b3.value = item.alias;
                    b3.style.maxWidth = "25%";
                    b3.onchange = () => {
                        window['kernelUtils'].projects[prop].alias = b3.value;
                        if (this.scrap_package.id == window['kernelUtils'].projects[prop].id) {
                            this.scrap_package.alias = window['kernelUtils'].projects[prop].alias;
                        }
                        this.saveLocals();
                    }

                    li.appendChild(b1);
                    li.appendChild(b2);
                    li.appendChild(b3);


                    let line_controls = document.createElement('div');
                    line_controls.className = "controls right";
                    line_controls.style.float = "right";

                    let edit = document.createElement('span');
                    edit.id = `project-edit-${len}`;
                    edit.className = `button`;
                    edit.innerHTML = `<i class="far fa-fw fa-edit"></i>&ZeroWidthSpace;`;


                    let runner = document.createElement('span');
                    runner.id = `project-run-${len}`;
                    runner.className = `button`;
                    runner.innerHTML = `<i class="far fa-fw fa-play-circle"></i>&ZeroWidthSpace;`;

                    p_edit[len] = {element: edit, item: prop, runner: runner};

                    li.appendChild(line_controls);
                    line_controls.appendChild(edit);
                    line_controls.appendChild(runner);

                    area_projects_list.appendChild(li);
                    len++;
                }
                if (len == 0) {
                    let li = document.createElement('li');
                    li.innerText = `No loaded Scraps`;
                    area_projects_list.appendChild(li);
                } else {

                    for (let i = 0; i < len; i++) {
                        console.log("SHOULD EDIT", window['kernelUtils'].projects, 'project-edit-' + i, p_edit[i]);

                        p_edit[i].runner.onclick = (event) => {

                            event.preventDefault();
                            event.stopPropagation();

                            const current_package = this.scrap_package;
                            this.scrap_package = window['kernelUtils'].projects[p_edit[i].item];
                            console.log('RUN THIS CODE ', this.scrap_package, "SHOULD UPDATE CODE");
                            this.loadScrapPackage(this.scrap_package);
                            this.evaluate(false);
                            this.scrap_package = current_package;
                            this.loadScrapPackage(this.scrap_package);


                        };

                        p_edit[i].element.onclick = () => {

                            this.scrap_package = window['kernelUtils'].projects[p_edit[i].item];
                            //console.log('YOU SHOULD NOW CHANGE TO THIS SCRAP',p_edit[i].item);


                            console.log('CURRENT ', this.scrap_package, "SHOULD UPDATE CODE",
                                this.scrap_package.fn[0].fn);

                            this.loadScrapPackage(this.scrap_package);


                            /*Modal.edit(p_edit[i].item).then((d: any) => {
                                window['kernelUtils'].proejcts[d.alias] = d;
                                window.localStorage.setItem('scraps-js-cached-libs', JSON.stringify(window['kernelUtils'].projects));
                                console.log('EDITED', d);
                                project_area_update();
                                console.log('SCRIPT EDITED');
                            }).catch(() => {
                                console.log('no script added');
                            });*/
                        };
                    }
                }


            }
            project_area_update();

            let save_btn = document.getElementById('scraps-save');
            if (save_btn) {

                save_btn.onclick = () => {
                    let v = (this.scrap_package.fn.length >= 1) ? (this.scrap_package.fn[0].version) : "0.0.0";
                    let vs = v.split('.');

                    let scraphistorymeta: ScrapVersionedMetadata = {
                        fn: this.getSandbox().input,
                        version: [vs[0], vs[1], parseInt(vs[2]) + 1].join(".")
                    }

                    this.scrap_package.fn.unshift(scraphistorymeta);
                    let sc = new ScrapCodePackage(this.scrap_package);
                    window['kernelUtils'].projects[this.scrap_package.id] = sc;
                    this.saveLocals()

                    console.log('saving scrap', v, scraphistorymeta, this.scrap_package, window['kernelUtils'].projects);

                    project_area_update();
                }
            }

            let export_btn = document.getElementById('scraps-export');
            if (export_btn) {

                export_btn.onclick = () => {
                    /*let v = (this.scrap_package.fn.length >= 1) ? (this.scrap_package.fn[0].version) : "0.0.0";
                    let vs = v.split('.');

                    let scraphistorymeta: ScrapVersionedMetadata = {
                        fn: this.getSandbox().input,
                        version: [vs[0], vs[1], parseInt(vs[2]) + 1].join(".")
                    }

                    this.scrap_package.fn.unshift(scraphistorymeta);
                    let sc = new ScrapCodePackage(this.scrap_package);
                    window['kernelUtils'].projects[this.scrap_package.id] = sc;
                    this.saveLocals();*/
                    console.log('exporting SCRAP', this.scrap_package, window['kernelUtils'].projects);


                    /*var newWindow = window.open();
                    newWindow.document.write(`<body></body>`);
                        console.log('WRITING', newWindow);
                    newWindow.onload = ()=>{
                        newWindow.document.write(`<script>${this.getSandbox().getCompiled()}</script>`);

                    }*/
                    const winHtml = `<!DOCTYPE html>
    <html>
        <head>
            <title>Scraps Export Execution Context</title>
            <style>body, html {padding:0;margin:0;height:100%;width:100%;}</style>
        </head>
       
        <body>
        </body>
        <script>
      const Scrap = {
           p :(string)=>{
        let el = document.createElement('p');
        el.innerHTML = string;
        return el;
    },

    h1:(string)=> {
        let el = document.createElement('h1');
        el.innerHTML = string;
        return el;
    },

    h2:(string)=> {
        let el = document.createElement('h2');
        el.innerHTML = string;
        return el;
    },

    h3:(string)=> {
        let el = document.createElement('h3');
        el.innerHTML = string;
        return el;
    },

    print:(element)=> {
        
        if (element instanceof HTMLElement) {
            document.body.appendChild(element);
        } else {
            let d = document.createElement("div");
            d.innerHTML = element.toString();
            document.body.appendChild(d);
        }
    },

    html:(str)=> {
        let el = document.createElement('div');
        el.innerHTML = str;
        return el;
    },

    div:(capture)=> {
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
    },

    elements:(capture, fn)=> {
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
        }
</script>
        <script>(()=>{${this.getSandbox().getCompiled()}})();</script>
    </html>`;

                    const winUrl = URL.createObjectURL(
                        new Blob([winHtml], {type: "text/html"})
                    );

                    const win = window.open(
                        winUrl,
                        "win",
                        `width=800,height=400`
                    );
                    // newWindow.window.close();

                    //this.getSandbox().getCompiled();


                }
            }

        }


        this.warning_line_element = document.createElement('div');
        this.warning_line_element.className = "warning-line";
        this.warning_position_element = document.createElement('div');
        this.warning_position_element.className = "warning-position";

        this.controls = new ScrapControls(this);


// this.utils = new KernelUtils(this);
    }

    saveLocals() {
        window.localStorage.setItem('scraps-js-projects-libs', JSON.stringify(window['kernelUtils'].projects));
        window.localStorage.setItem('scraps-js-cached-libs', JSON.stringify(window['kernelUtils'].cached));
    }

    print(element: HTMLElement | any) {
        if (element instanceof HTMLElement) {
            this.area_display.appendChild(element);
        } else {
            let d = document.createElement("div");
            d.innerHTML = element.toString();
            this.area_display.appendChild(d);
        }
    }

    load(element: HTMLElement | Element) {

        // element.className = "scraps-js-initialized";

        this.container_element = element;
        this.options.autorun = element.getAttribute("data-autorun") !== null;
        this.options.session = element.getAttribute("data-session") !== null ? element.getAttribute("data-session") : false;
        this.options.fixedSize = element.getAttribute("data-fixed") !== null;
        this.options.launched = element.getAttribute("data-launched") !== null;

        console.log("LOAD FIRST", element, this.options);

        if (this.options.fixedSize) {
            element.classList.add("scraps-js-fixed");
        }

        this.sandbox = new CodeSandbox(this, element.innerHTML);
        element.innerHTML = "";

        this.area_working.appendChild(this.warning_line_element)

        this.area_working.appendChild(this.sandbox.getElement());
        this.controls.load();

        let e = document.getElementById("area_display") || element;
// e.innerHTML = '';
        e.appendChild(this.area_display);
        element.appendChild(this.area_working);

        e = (document.getElementById("area_control") || element)
// e.innerHTML = '';
        e.appendChild(this.area_control);

        e = (document.getElementById("area_artifacts") || element)
//e.innerHTML = '';
        e.appendChild(this.area_console);

        if (document.getElementById("area_projects")) {
            (document.getElementById("area_projects") || element).appendChild(this.area_project);
        }

        if (document.getElementById("area_cached")) {
            (document.getElementById("area_cached") || element).appendChild(this.area_cached);
        }

        this.sandbox.renderCodeHighlighting();
    }

    getSandbox() {
        return this.sandbox;
    }

    onlyIfChanges(old: any, n: any) {
        return (old !== n);
    }

    async evaluate(flush: boolean) {

        let self = this;

        let lh = 7;
        this.clearWarning();

        if (flush) {
            window.clearTimeout(this.debounce);
            this.debounce = null;
        } else {

//   window.clearTimeout(this.debounce);
//   self.debounce = window.setTimeout(function () {
//      self.evaluate(true);
//  }, 10);

//  return;
        }


        try {
            let fn;

            fn = this.getSandbox().getLambda();
            console.log('BEFORE', fn);

            try {
                this.area_console.innerText = '';
                this.area_console.className = 'artifacts';
                this.area_display.innerHTML = "";
                fn = this.getSandbox().getLambda(true);
                console.log('AFTER', fn);
                this.artifacts = await fn(this);

                if (this.artifacts !== undefined && JSON.stringify(this.artifacts) !== "undefined") {
                    if (typeof this.artifacts === 'string' || typeof this.artifacts === 'number') {
                        if (self.onlyIfChanges(this.area_console.innerHTML, this.artifacts)) {
                            this.area_console.innerHTML = this.artifacts.toString();
                        }
                    } else if (typeof this.artifacts === 'boolean') {
                        if (self.onlyIfChanges(this.area_console.innerHTML, this.artifacts)) {
                            this.area_console.innerHTML = this.artifacts ? "true" : "false";
                        }
                    } else if (this.artifacts instanceof HTMLElement) {
                        this.area_display.appendChild(this.artifacts);
                    } else {
                        if (self.onlyIfChanges(this.area_console.innerHTML, JSON.stringify(this.artifacts))) {
                            this.area_console.innerHTML = "";
                            // @ts-ignore
                            window['jsonView'].format(JSON.stringify(this.artifacts), this.area_console);
                        }
                    }
                    return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.ARTIFACT, this.artifacts);
                }
                return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.ARTIFACT, {});
            } catch (e) {
                console.log("RUNTIME ERROR");
                if (self.onlyIfChanges(this.area_console.innerHTML, e.name + ": " + (e.message) + JSON.stringify(e.message))) {
                    this.area_console.innerHTML = e.name + ": " + (e.message);
                    this.area_console.className += ' warn';
                    let err_pos = this.getErrorPositionFromError(e);
                    err_pos[0] -= lh + 2;

                    let error_width = 1;
                    if (e.message.indexOf("is not defined") !== -1) {
                        error_width = e.message.split(" ")[0].length;
                    }

                    this.setWarning(SCRAPS_EVALUATION_RESULT_TYPE.RUNTIME_ERROR, err_pos, error_width);
                    return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.RUNTIME_ERROR, JSON.stringify(e.message));
                }
            }

        } catch (e) {
            console.log("COMPILE FAILED")
            try {
                const f = this.getSandbox().getCompiled();
                console.log('CODE TO TEST', f);
                validate(f);
            } catch (e) {
                console.log("VAIDATE FAILED")
                //  let  fn =  this.getSandbox().getLambda();
                //   console.error( fn(this));
                var regExp = /\(([^)]+)\)/;
                var matches = regExp.exec(e.message);
                let validation_error_position = matches[1].split(":").map((v) => {
                    return parseInt(v);
                });
                validation_error_position[0] -= lh;
                validation_error_position[1] += 1;

                if (e.message.indexOf("expected token") !== -1) {
                    //validation_error_position[1]--;
                }

                let error_message = e.message.split("(")[0];

                if (self.onlyIfChanges(this.area_console.innerHTML, e.name + ": " + (error_message))) {
                    this.area_console.innerHTML = e.name + ": " + (error_message);
                    this.area_console.className += ' error';
                }

                this.setWarning(SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR, validation_error_position);
                return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR, e.name);
            }
            console.log("UNKNOWN ERROR, DEFAULT TO BROWSER ERROR")
            if (self.onlyIfChanges(this.area_console.innerHTML, e.name + ": " + (e.message) + JSON.stringify(e.message))) {
                this.area_console.innerHTML = e.name + ": " + (e.message);
                this.area_console.className += ' error';
                let err_pos = this.getErrorPositionFromError(e);
                err_pos[0] -= lh + 2;
                this.setWarning(SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR, err_pos);
                return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR, JSON.stringify(e.message));
            }
        }
        this.area_cached.innerHTML = JSON.stringify(this.utils.cached);
    }

    getErrorPositionFromError(err: Error) {
        let caller_line_arr = err.stack.split("\n");

        let slice;
        if (caller_line_arr[0]) {
            while (caller_line_arr[0].indexOf("(eval at") == -1 && caller_line_arr.length > 0) {
                caller_line_arr.shift();
            }
            if (caller_line_arr.length === 0) {
                console.error("UNKNOWN ERROR EXCEPTION", err, err.stack);
                return;
            }

            const caller_line = caller_line_arr[0];

            let check = "<anonymous>:";
            let pre_column = caller_line.indexOf(check);
            slice = caller_line.slice(check.length + pre_column, caller_line.length - 1).split(":");
        } else {
            console.log(err.message, err.stack);
        }


        return slice.map((v: string) => {
            return parseFloat(v);
        });
    }

    setWarning(type: SCRAPS_EVALUATION_RESULT_TYPE, error_position: number[], error_width = 1) {
        try {

            this.sandbox.output_code.insertBefore(this.warning_position_element, this.sandbox.output_code.firstChild);

            this.warning_line_element.style.display = "block";
            this.warning_position_element.style.display = "block";

            let err_type = type === SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR ? "error" : "warn";

            this.warning_line_element.className = `warning-line ${err_type}`;
            this.warning_position_element.className = `warning-position ${err_type}`;

            let textarea_top = parseFloat(window.getComputedStyle(this.sandbox.element, null).getPropertyValue('padding-top'));
            let textarea_left = parseFloat(window.getComputedStyle(this.sandbox.element, null).getPropertyValue('padding-left'));

            let line_y_em = (error_position[0]) * 1.065;

            this.warning_line_element.style.marginTop = `${textarea_top}px`;
            this.warning_line_element.style.top = `${line_y_em}em`;

            this.warning_position_element.style.marginTop = `${textarea_top}px`;
            this.warning_position_element.style.marginLeft = `${textarea_left}px`;
            this.warning_position_element.style.top = `${line_y_em}em`;
            this.warning_position_element.style.width = `${error_width * 0.84}ch`;
            this.warning_position_element.style.left = `${(error_position[1] - 1) * 0.465}em`;
        } catch (e) {

        }
    }

    clearWarning() {
        this.warning_line_element.style.display = "none";
        this.warning_position_element.style.display = "none";
    }

    updateEvaluationResponse(response: ScrapsEvaluationResponse) {
        this.controls.update(response);
    }
}


class KernelUtils {
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

window['kernelUtils'] = new KernelUtils();

let context = new ScrapsContext();
window['ScrapsContext'] = context;


let elements = document.getElementsByClassName('scraps-js');
console.log('STARTING SCRAPS', elements);
for (let i = 0; i < elements.length; i++) {
    let el = elements[i];
    let scrap = new Scrap(context);
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
