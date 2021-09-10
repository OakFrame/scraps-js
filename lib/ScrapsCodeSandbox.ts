import {Scrap} from "./Scrap";
import {ScrapsEvaluationResponse} from "./ScrapsEvaluationResponse";
import {SCRAPS_EVALUATION_RESULT_TYPE} from "./ScrapsEvaluationResultType.enum";
import {mobileCheck, setCaretPosition} from "./ScrapUtils";

export class CodeSandbox {
    input: string;
    element: HTMLTextAreaElement;
    output_element: HTMLElement;
    output_code: HTMLElement;
    scrap: Scrap;
    window_scroll: (number | null);
    inner_scroll: (number | null);
    window_lines = -1;
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
            this.inner_scroll = (<HTMLElement>this.scrap.container_element.parentNode).scrollTop;
        };

        document.body.onscroll = (ev) => {
            //    sandbox.output_code.scrollTop = sandbox.element.scrollTop;
            //    sandbox.output_code.scrollLeft = sandbox.element.scrollLeft;
            this.window_scroll = document.body.scrollTop;
        };


        // @ts-ignore
        this.element.onkeydown = this.element.onpaste = (event:any) => {


            //console.log('KEYPRESS', event);
            if (event.ctrlKey || event.metaKey) {
                let el;
                switch (String.fromCharCode(event.which).toLowerCase()) {

                    case 'd':
                        event.preventDefault();
                        //alert('ctrl-s');
                        //el = document.getElementById('scraps-save');
                        //if (el) {
                         //   el.click();
                        //}
                        let selection_start = this.element.selectionStart;
                        var textLines = this.element.value.substr(0, selection_start).split("\n");
                        var allLines = this.element.value.split("\n");
                        var currentLineNumber = textLines.length;
                        var currentColumnIndex = textLines[textLines.length-1].length;

                        console.log('SHOULD DUPLICATE LINE',allLines[currentLineNumber-1],selection_start, currentLineNumber, currentColumnIndex, textLines);

                        let code = this.element.value;
                        let new_code;
                        new_code = [allLines.slice(0,currentLineNumber).join("\n"),"\n",allLines[currentLineNumber-1],"\n",allLines.slice(currentLineNumber,allLines.length).join("\n")].join("")
                        // textLines.join();

                        this.loadCode(new_code);
                        this.renderCodeHighlighting();

                        setCaretPosition(this.element,selection_start+(allLines[currentLineNumber-1].length+1));

                        return;
                        break;
                }
            }

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
        };
        this.element.onkeyup = () => {
            //console.log('ck', this.inner_scroll, this.window_scroll);
        };


    }

    fixHeight() {
        console.log('fix height', this.inner_scroll, this.window_scroll);
        let lines = this.element.value.split(/\r*\n/).length;
        if (lines !== this.window_lines/* && !this.scrap.options.fixedSize*/) {
          //  console.log('NOT FIXED', document.body.scrollTop);
            let pnode = (<HTMLElement>this.scrap.container_element.parentNode);
            if (!pnode.scrollTop) {
                pnode = document.body;
                this.window_scroll = document.body.scrollTop;
                this.inner_scroll = null;
            }
            const p = this.inner_scroll || window.scrollY || this.window_scroll;
            this.window_lines = lines;
            this.element.style.height = "5px";
            this.element.style.minHeight = "5px";
            //if ((this.element.scrollHeight) !== parseFloat(this.element.style.height)) {
            let sh = Math.max(this.element.scrollHeight,this.scrap.container_element.scrollHeight);
            this.element.style.minHeight = (sh) + "px";
            this.output_code.style.minHeight = (sh) + "px";
            this.element.style.height = "auto";
            //window.scrollTo(0, this.window_scroll);
           // console.log('CHECKING SCROLL',sh, pnode, p, this.window_scroll);
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
                if (escaped.indexOf(check) !== -1) {
                    fn = item.fn[item.using_version || 0].fn;
                    this.ran_deps[prop] = true;
                    //   console.log('RAND DEPS', `@depends ${item.alias}`, item);
                }
                //  escaped = escaped.replace(check, fn);
                escaped = escaped.replace(check, `${fn}`);
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
