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
        this.scraps.forEach(function (scrap) {
            const result = scrap.evaluate(flush);
            scrap.updateEvaluationResponse(result);
        });
    }

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

    constructor(scrap: Scrap, code: string) {
        let sandbox = this;
        this.scrap = scrap;
        this.input = code;
        this.element = document.createElement('textarea');
        this.element.className = "code-input-";
        this.element.value = code;
        this.element.style.width = "100%";
        this.element.rows = 8;
        this.element.spellcheck = false;

        this.output_element = document.createElement('pre');
        this.output_element.className = "code-output-";
        this.output_code = document.createElement('code');
        this.output_code.className = "language-javascript";
        this.output_element.appendChild(this.output_code);

        this.element.onscroll = function () {
            sandbox.output_element.scrollTop = sandbox.element.scrollTop;
            sandbox.output_element.scrollLeft = sandbox.element.scrollLeft;
        };

        // @ts-ignore
        this.element.onkeydown = this.element.onpaste =  (event:(Event|KeyboardEvent)) =>{

            this.scrap.clearWarning();

            var input = sandbox.element, selStartPos = input.selectionStart,
                inputVal = input.value;

            if (event instanceof KeyboardEvent && event.keyCode && event.keyCode === 9) {
                input.value = inputVal.substring(0, selStartPos) + "    " + inputVal.substring(selStartPos, input.value.length);
                input.selectionStart = selStartPos + 4;
                input.selectionEnd = selStartPos + 4;
                event.preventDefault();
            }

            window.setTimeout(function () {
                sandbox.renderCodeHighlighting();
            }, 1)

        };
        this.element.onkeyup = () => {
            this.scrap.clearWarning();
            this.scrap.updateEvaluationResponse(new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.EDITING, {}));
            // if (document.getElementById('run')) {
            return false;
            // }
            context.executeStack(false);
            window.setTimeout(function () {
                sandbox.renderCodeHighlighting();
            }, 1);
        };
    }

    renderCodeHighlighting() {
        this.element.style.height = "5px";
        this.element.style.height = (this.element.scrollHeight) + "px";
        this.output_code.style.height = (this.element.scrollHeight) + "px";
        this.input = this.element.value;
        this.output_code.innerHTML = this.input.replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;") + "\n";
        // @ts-ignore
        window['Prism'].highlightAll();
    }

    getElement() {
        let el = document.createElement('div');
        el.className = 'code';
        el.appendChild(this.element);
        el.appendChild(this.output_element);
        return el;
    }

    getCompiled() {
        let build_variables = `
		function makeIdentifiableProperty(i){
			return typeof i + (!!i?i.toString():"unknown");
		}
		let utils = new KernelUtils(kernel);
		let p = utils.p.bind(utils);
		let h1 = utils.h1.bind(utils);
		let h2 = utils.h2.bind(utils);
		let print = kernel.print.bind(kernel);
		let field = utils.getRenderArea();
`;

        let escaped = this.input.replace(/`/g, "\`");

        const fn = `${build_variables}${escaped.replace(/;/g, ";")}`;


        return fn;
    }

    getLambda() {
        let args = "kernel";
        return new Function(args, this.getCompiled());
    }

}

class ScrapControls {
    element: HTMLElement;
    scrap: Scrap;
    result_type_element: HTMLElement;
    last_result_state: SCRAPS_EVALUATION_RESULT_TYPE;

    constructor(scrap: Scrap) {
        this.scrap = scrap;
        this.element = scrap.area_control;
        this.result_type_element = document.createElement("span");
    }

    load() {

        this.result_type_element.innerHTML = '<i class="fas fa-fw fa-ellipsis-h"></i>';
        this.result_type_element.className = 'border-left';

        let evaluate_element = document.createElement("span");
        evaluate_element.innerHTML = '<i class="far fa-fw fa-play-circle"></i> Run';
        evaluate_element.className = "button";

        evaluate_element.onclick = () => {
            const result = this.scrap.evaluate(true);
            this.update(result);
        }

        this.element.appendChild(this.result_type_element);
        this.element.appendChild(evaluate_element);
    }

    update(result: ScrapsEvaluationResponse) {
        if (this.last_result_state === result.type) {
            return;
        }
        this.result_type_element.className = 'border-left';
        this.last_result_state = result.type;
        switch (result.type) {
            case SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR:
                this.result_type_element.innerHTML = '<i class="fas fa-fw fa-bug"></i>';
                this.result_type_element.className += ' error';
                break;

            case SCRAPS_EVALUATION_RESULT_TYPE.RUNTIME_ERROR:
                this.result_type_element.innerHTML = '<i class="fas fa-fw fa-bug"></i>';
                this.result_type_element.className += ' warn';
                break;

            case SCRAPS_EVALUATION_RESULT_TYPE.ARTIFACT:
                this.result_type_element.innerHTML = '<i class="fas fa-fw fa-check"></i>';
                this.result_type_element.className += ' success';
                break;

            case SCRAPS_EVALUATION_RESULT_TYPE.EDITING:
                this.result_type_element.innerHTML = '<i class="fas fa-fw fa-ellipsis-h"></i>';

                break;
        }
    }
}

class Scrap {
    context: ScrapsContext;
    area_control: HTMLElement;
    area_working: HTMLElement;
    area_render: HTMLElement;
    area_console: HTMLElement;
    sandbox: CodeSandbox;
    artifacts: any;
    utils: KernelUtils;
    debounce: number;
    controls: ScrapControls;
    warning_line_element: HTMLElement;
    warning_position_element: HTMLElement;

    constructor(context: ScrapsContext) {
        this.context = context.register(this);
        this.area_control = document.createElement('div');
        this.area_control.className = "controls";
        this.area_working = document.createElement('div');
        this.area_working.className = "working";
        this.area_render = document.createElement('div');
        this.area_render.className = "display";
        this.area_console = document.createElement('div');
        this.area_console.className = "artifacts";

        this.warning_line_element = document.createElement('div');
        this.warning_line_element.className = "warning-line";
        this.warning_position_element = document.createElement('div');
        this.warning_position_element.className = "warning-position";

        this.controls = new ScrapControls(this);
        this.utils = new KernelUtils(this);
    }

    print(element: HTMLElement) {
        this.area_render.appendChild(element);
    }

    load(element: HTMLElement | Element) {

        this.sandbox = new CodeSandbox(this, element.innerHTML);
        element.innerHTML = "";

        this.area_working.appendChild(this.warning_line_element)
        this.sandbox.output_element.appendChild(this.warning_position_element);
        this.area_working.appendChild(this.sandbox.getElement());
        this.controls.load();

        element.appendChild(this.area_render);
        element.appendChild(this.area_working);
        element.appendChild(this.area_control);
        element.appendChild(this.area_console);


        this.sandbox.renderCodeHighlighting();
    }

    getSandbox() {
        return this.sandbox;
    }

    onlyIfChanges(old: any, n: any) {
        return (old !== n);
    }

    evaluate(flush: boolean) {

        let self = this;
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
            try {
                fn = this.getSandbox().getLambda();
            }catch(compilation_error){

                if (self.onlyIfChanges(this.area_console.innerHTML, compilation_error.name + ": " + (compilation_error.message) + JSON.stringify(compilation_error.message))) {
                    this.area_console.innerHTML = compilation_error.name + ": " + (compilation_error.message);
                    this.area_console.className += ' error';
                   // this.setWarning(SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR, err_pos);
                }
                return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR, JSON.stringify(compilation_error.message));

            //    console.log("FAIL COMPILE", fail_compile.stack);
              /*  try {
                    const compiled = "try {"+this.sandbox.getCompiled()+"}catch(e){console.log('INERNAL CATCH', e);}";
                    eval(   compiled);
                }catch(compilation_error){
                    console.error("COMPIULATION EERR", compilation_error.message);
                    let err_pos = this.getErrorPositionFromError(compilation_error);
                    console.log("COMPILATION ERROR POS",err_pos);

                    if (self.onlyIfChanges(this.area_console.innerHTML, compilation_error.name + ": " + (compilation_error.message) + JSON.stringify(compilation_error.message))) {
                        this.area_console.innerHTML = compilation_error.name + ": " + (compilation_error.message);
                        this.area_console.className += ' error';
                        this.setWarning(SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR, err_pos);
                    }
                    return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR, JSON.stringify(compilation_error.message));
               }*/

            }
            try {
                this.area_console.innerText = '';
                this.area_console.className = 'artifacts';
                this.area_render.innerHTML = "";

                this.artifacts = fn(this);
                if (this.artifacts !== undefined && JSON.stringify(this.artifacts) !== "{}" && JSON.stringify(this.artifacts) !== "undefined") {
                    if (typeof this.artifacts === 'string' || typeof this.artifacts === 'number') {
                        if (self.onlyIfChanges(this.area_console.innerHTML, this.artifacts)) {
                            this.area_console.innerHTML = this.artifacts.toString();
                        }
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
                if (self.onlyIfChanges(this.area_console.innerHTML, e.name + ": " + (e.message) + JSON.stringify(e.message))) {
                    this.area_console.innerHTML = e.name + ": " + (e.message);
                    this.area_console.className += ' warn';
                    let err_pos = this.getErrorPositionFromError(e);err_pos[0]-=13;
                    this.setWarning(SCRAPS_EVALUATION_RESULT_TYPE.RUNTIME_ERROR, err_pos);
                    return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.RUNTIME_ERROR, JSON.stringify(e.message));
                }
            }

        } catch (e) {
            if (self.onlyIfChanges(this.area_console.innerHTML, e.name + ": " + (e.message) + JSON.stringify(e.message))) {
                this.area_console.innerHTML = e.name + ": " + (e.message);
                this.area_console.className += ' error';
                let err_pos = this.getErrorPositionFromError(e);err_pos[0]-=13;
                this.setWarning(SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR, err_pos);
                return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR, JSON.stringify(e.message));
            }
        }
    }

    getErrorPositionFromError(err:Error){
        console.log("INCOMING",err, err.stack);
        let caller_line_arr = err.stack.split("\n");
        while (caller_line_arr[0].indexOf("(eval at") == -1 && caller_line_arr.length > 0){
            caller_line_arr.shift();
        }

        if (caller_line_arr.length === 0){
            console.error("UNKNOWN ERROR EXCEPTION", err, err.stack);
            return;
        }

        const caller_line = caller_line_arr[0];
        console.log("CALLER LINE", caller_line);

        let check = "<anonymous>:";
        let pre_column = caller_line.indexOf(check);
        let slice = caller_line.slice(check.length + pre_column, caller_line.length - 1).split(":");
        return slice.map((v:string)=>{return parseFloat(v);});
    }

    setWarning(type: SCRAPS_EVALUATION_RESULT_TYPE, error_position:number[]) {
        try {
            this.warning_line_element.style.display = "block";
           // this.warning_position_element.style.display = "block";

            let err_type = type===SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR?"error":"warn";

            this.warning_line_element.className = `warning-line ${err_type}`;
            this.warning_position_element.className = `warning-position ${err_type}`;

            let textarea_top = parseFloat(window.getComputedStyle(this.sandbox.element, null).getPropertyValue('padding-top'));
            let textarea_left = parseFloat(window.getComputedStyle(this.sandbox.element, null).getPropertyValue('padding-left'));

            let line_y_em = (error_position[0])*1.065;

            this.warning_line_element.style.marginTop = `${textarea_top}px`;
            this.warning_line_element.style.top = `${line_y_em}em`;

            this.warning_position_element.style.marginTop = `${textarea_top}px`;
            this.warning_position_element.style.marginLeft = `${textarea_left}px`;
            this.warning_position_element.style.top = `${line_y_em}em`;
            this.warning_position_element.style.left = `${(error_position[1]-1)*0.47}em`;
        }catch(e){

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
    kernel: Scrap;

    constructor(kernel: Scrap) {
        this.kernel = kernel;
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

    getRenderArea() {
        return this.kernel.area_render;
    }
}

let context = new ScrapsContext();
let elements = document.getElementsByClassName('scraps-js');
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