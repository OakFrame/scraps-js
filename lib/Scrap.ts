import {ScrapControls} from "./ScrapControls";
import {ScrapsModal} from "./ScrapsModal";
import {ScrapsEvaluationResponse} from "./ScrapsEvaluationResponse";
import {CodeSandbox} from "./ScrapsCodeSandbox";
import {generateId, validate} from "./ScrapUtils";
import {ScrapsContext} from "./ScrapsContext";
import {ScrapsKernelUtils} from "./ScrapsKernelUtils";
import {SCRAPS_EVALUATION_RESULT_TYPE} from "./ScrapsEvaluationResultType.enum";
import {ScrapCodePackage} from "./ScrapCodePackage";
import {ScrapOptions} from "./ScrapOptions.interface";
import {ScrapVersionedMetadata} from "./ScrapVersionMetadata.interface";

export class Scrap {
    id: string;
    context: ScrapsContext;
    options: ScrapOptions;
    sandbox: CodeSandbox;
    utils: ScrapsKernelUtils;
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

                ScrapsModal.launch(`<input type='text' placeholder="name" id="name"/><br/><div class='scraps-js'></div>`).then((d: any) => {
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
                            ScrapsModal.edit(p_edit[i].item).then((d: any) => {
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

                /*ScrapsModal.launch(`<input type='text' placeholder="name" id="name"/><br/><div class='scraps-js'></div>`).then((d: any) => {
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


                            /*ScrapsModal.edit(p_edit[i].item).then((d: any) => {
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
