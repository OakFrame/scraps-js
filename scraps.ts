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

        this.element.onkeydown = function (key) {

            var input = sandbox.element, selStartPos = input.selectionStart,
                inputVal = input.value;

            if (key.keyCode === 9) {
                input.value = inputVal.substring(0, selStartPos) + "    " + inputVal.substring(selStartPos, input.value.length);
                input.selectionStart = selStartPos + 4;
                input.selectionEnd = selStartPos + 4;
                key.preventDefault();
            }

            window.setTimeout(function () {
                sandbox.renderCodeHighlighting();
            }, 1)

        };
        this.element.onkeyup = () => {
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
		let print = kernel.print.bind(kernel)
		let field = utils.getRenderArea();
		`;


        return `${build_variables} ${this.input.replace(/;/g, ";")};`;
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
    last_result_state:SCRAPS_EVALUATION_RESULT_TYPE;

    constructor(scrap: Scrap) {
        this.scrap = scrap;
        this.element = scrap.area_control;
        this.result_type_element = document.createElement("span");
    }

    load() {

        this.result_type_element.innerHTML = '<i class="fas fa-fw fa-ellipsis-h"></i> ';

        let evaluate_element = document.createElement("button");
        evaluate_element.innerHTML = '<i class="fas fa-fw fa-play"></i> Run';

        evaluate_element.onclick = () => {
            const result = this.scrap.evaluate(true);
            this.update(result);
        }

        this.element.appendChild(this.result_type_element);
        this.element.appendChild(evaluate_element);
    }

    update(result: ScrapsEvaluationResponse) {
        if (this.last_result_state === result.type){
            return;
        }
        this.last_result_state = result.type;
        switch (result.type) {
            case SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR :
                this.result_type_element.innerHTML = '<i class="fas fa-fw fa-bug"></i> ';
                break;

            case SCRAPS_EVALUATION_RESULT_TYPE.RUNTIME_ERROR :
                this.result_type_element.innerHTML = '<i class="fas fa-fw fa-bug"></i> ';
                break;

            case SCRAPS_EVALUATION_RESULT_TYPE.ARTIFACT :
                this.result_type_element.innerHTML = '<i class="fas fa-fw fa-check"></i> ';
                break;

            case SCRAPS_EVALUATION_RESULT_TYPE.EDITING :
                this.result_type_element.innerHTML = '<i class="fas fa-fw fa-ellipsis-h"></i> ';
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

    constructor(context: ScrapsContext) {
        this.context = context.register(this);
        this.area_control = document.createElement('div');
        this.area_working = document.createElement('div');
        this.area_render = document.createElement('div');
        this.area_console = document.createElement('div');
        this.controls = new ScrapControls(this);
        this.utils = new KernelUtils(this);
    }

    print(element: HTMLElement) {
        this.area_render.appendChild(element);
    }

    load(element: HTMLElement | Element) {

        this.sandbox = new CodeSandbox(this, element.innerHTML);
        element.innerHTML = "";

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
            let fn = this.getSandbox().getLambda();
            try {
                this.area_console.innerText = '';
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
                if (self.onlyIfChanges(this.area_console.innerHTML, "Runtime Error: " + JSON.stringify(e.message))) {
                    this.area_console.innerHTML = "Runtime Error: " + JSON.stringify(e.message);
                    return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.RUNTIME_ERROR, JSON.stringify(e.message));
                }
            }

        } catch (e) {
            if (self.onlyIfChanges(this.area_console.innerHTML, "Compilation Error: " + JSON.stringify(e.message))) {
                this.area_console.innerHTML = "Compilation Error: " + JSON.stringify(e.message);
                return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR, JSON.stringify(e.message));
            }
        }
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