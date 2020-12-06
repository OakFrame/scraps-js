var ScrapsContext = (function () {
    function ScrapsContext() {
        this.scraps = [];
    }
    ScrapsContext.prototype.register = function (kernel) {
        this.scraps.push(kernel);
        return this;
    };
    ScrapsContext.prototype.executeStack = function (flush) {
        this.scraps.forEach(function (scrap) {
            var result = scrap.evaluate(flush);
            scrap.updateEvaluationResponse(result);
        });
    };
    return ScrapsContext;
}());
var SCRAPS_EVALUATION_RESULT_TYPE;
(function (SCRAPS_EVALUATION_RESULT_TYPE) {
    SCRAPS_EVALUATION_RESULT_TYPE[SCRAPS_EVALUATION_RESULT_TYPE["ARTIFACT"] = 0] = "ARTIFACT";
    SCRAPS_EVALUATION_RESULT_TYPE[SCRAPS_EVALUATION_RESULT_TYPE["EDITING"] = 1] = "EDITING";
    SCRAPS_EVALUATION_RESULT_TYPE[SCRAPS_EVALUATION_RESULT_TYPE["COMPILATION_ERROR"] = 2] = "COMPILATION_ERROR";
    SCRAPS_EVALUATION_RESULT_TYPE[SCRAPS_EVALUATION_RESULT_TYPE["RUNTIME_ERROR"] = 3] = "RUNTIME_ERROR";
})(SCRAPS_EVALUATION_RESULT_TYPE || (SCRAPS_EVALUATION_RESULT_TYPE = {}));
var ScrapsEvaluationResponse = (function () {
    function ScrapsEvaluationResponse(type, data) {
        this.type = type;
        this.data = data;
    }
    return ScrapsEvaluationResponse;
}());
var CodeSandbox = (function () {
    function CodeSandbox(scrap, code) {
        var _this = this;
        var sandbox = this;
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
        this.element.onkeydown = this.element.onpaste = function (event) {
            _this.scrap.clearWarning();
            var input = sandbox.element, selStartPos = input.selectionStart, inputVal = input.value;
            if (event instanceof KeyboardEvent && event.keyCode && event.keyCode === 9) {
                input.value = inputVal.substring(0, selStartPos) + "    " + inputVal.substring(selStartPos, input.value.length);
                input.selectionStart = selStartPos + 4;
                input.selectionEnd = selStartPos + 4;
                event.preventDefault();
            }
            window.setTimeout(function () {
                sandbox.renderCodeHighlighting();
            }, 1);
        };
        this.element.onkeyup = function () {
            _this.scrap.clearWarning();
            _this.scrap.updateEvaluationResponse(new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.EDITING, {}));
            return false;
            context.executeStack(false);
            window.setTimeout(function () {
                sandbox.renderCodeHighlighting();
            }, 1);
        };
    }
    CodeSandbox.prototype.renderCodeHighlighting = function () {
        this.element.style.height = "5px";
        this.element.style.height = (this.element.scrollHeight) + "px";
        this.output_code.style.height = (this.element.scrollHeight) + "px";
        this.input = this.element.value;
        this.output_code.innerHTML = this.input.replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;") + "\n";
        window['Prism'].highlightAll();
    };
    CodeSandbox.prototype.getElement = function () {
        var el = document.createElement('div');
        el.className = 'code';
        el.appendChild(this.element);
        el.appendChild(this.output_element);
        return el;
    };
    CodeSandbox.prototype.getCompiled = function () {
        var build_variables = "\n\t\tfunction makeIdentifiableProperty(i){\n\t\t\treturn typeof i + (!!i?i.toString():\"unknown\");\n\t\t}\n\t\tlet utils = new KernelUtils(kernel);\n\t\tlet p = utils.p.bind(utils);\n\t\tlet h1 = utils.h1.bind(utils);\n\t\tlet h2 = utils.h2.bind(utils);\n\t\tlet print = kernel.print.bind(kernel);\n\t\tlet field = utils.getRenderArea();\n";
        var escaped = this.input.replace(/`/g, "\`");
        var fn = "" + build_variables + escaped.replace(/;/g, ";");
        return fn;
    };
    CodeSandbox.prototype.getLambda = function () {
        var args = "kernel";
        return new Function(args, this.getCompiled());
    };
    return CodeSandbox;
}());
var ScrapControls = (function () {
    function ScrapControls(scrap) {
        this.scrap = scrap;
        this.element = scrap.area_control;
        this.result_type_element = document.createElement("span");
    }
    ScrapControls.prototype.load = function () {
        var _this = this;
        this.result_type_element.innerHTML = '<i class="fas fa-fw fa-ellipsis-h"></i>';
        this.result_type_element.className = 'border-left';
        var evaluate_element = document.createElement("span");
        evaluate_element.innerHTML = '<i class="far fa-fw fa-play-circle"></i> Run';
        evaluate_element.className = "button";
        evaluate_element.onclick = function () {
            var result = _this.scrap.evaluate(true);
            _this.update(result);
        };
        this.element.appendChild(this.result_type_element);
        this.element.appendChild(evaluate_element);
    };
    ScrapControls.prototype.update = function (result) {
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
    };
    return ScrapControls;
}());
var Scrap = (function () {
    function Scrap(context) {
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
    Scrap.prototype.print = function (element) {
        this.area_render.appendChild(element);
    };
    Scrap.prototype.load = function (element) {
        this.sandbox = new CodeSandbox(this, element.innerHTML);
        element.innerHTML = "";
        this.area_working.appendChild(this.warning_line_element);
        this.sandbox.output_element.appendChild(this.warning_position_element);
        this.area_working.appendChild(this.sandbox.getElement());
        this.controls.load();
        element.appendChild(this.area_render);
        element.appendChild(this.area_working);
        element.appendChild(this.area_control);
        element.appendChild(this.area_console);
        this.sandbox.renderCodeHighlighting();
    };
    Scrap.prototype.getSandbox = function () {
        return this.sandbox;
    };
    Scrap.prototype.onlyIfChanges = function (old, n) {
        return (old !== n);
    };
    Scrap.prototype.evaluate = function (flush) {
        var self = this;
        this.clearWarning();
        if (flush) {
            window.clearTimeout(this.debounce);
            this.debounce = null;
        }
        else {
        }
        try {
            var fn = void 0;
            try {
                fn = this.getSandbox().getLambda();
            }
            catch (compilation_error) {
                if (self.onlyIfChanges(this.area_console.innerHTML, compilation_error.name + ": " + (compilation_error.message) + JSON.stringify(compilation_error.message))) {
                    this.area_console.innerHTML = compilation_error.name + ": " + (compilation_error.message);
                    this.area_console.className += ' error';
                }
                return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR, JSON.stringify(compilation_error.message));
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
                    }
                    else {
                        if (self.onlyIfChanges(this.area_console.innerHTML, JSON.stringify(this.artifacts))) {
                            this.area_console.innerHTML = "";
                            window['jsonView'].format(JSON.stringify(this.artifacts), this.area_console);
                        }
                    }
                    return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.ARTIFACT, this.artifacts);
                }
                return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.ARTIFACT, {});
            }
            catch (e) {
                if (self.onlyIfChanges(this.area_console.innerHTML, e.name + ": " + (e.message) + JSON.stringify(e.message))) {
                    this.area_console.innerHTML = e.name + ": " + (e.message);
                    this.area_console.className += ' warn';
                    var err_pos = this.getErrorPositionFromError(e);
                    err_pos[0] -= 13;
                    this.setWarning(SCRAPS_EVALUATION_RESULT_TYPE.RUNTIME_ERROR, err_pos);
                    return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.RUNTIME_ERROR, JSON.stringify(e.message));
                }
            }
        }
        catch (e) {
            if (self.onlyIfChanges(this.area_console.innerHTML, e.name + ": " + (e.message) + JSON.stringify(e.message))) {
                this.area_console.innerHTML = e.name + ": " + (e.message);
                this.area_console.className += ' error';
                var err_pos = this.getErrorPositionFromError(e);
                err_pos[0] -= 13;
                this.setWarning(SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR, err_pos);
                return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR, JSON.stringify(e.message));
            }
        }
    };
    Scrap.prototype.getErrorPositionFromError = function (err) {
        console.log("INCOMING", err, err.stack);
        var caller_line_arr = err.stack.split("\n");
        while (caller_line_arr[0].indexOf("(eval at") == -1 && caller_line_arr.length > 0) {
            caller_line_arr.shift();
        }
        if (caller_line_arr.length === 0) {
            console.error("UNKNOWN ERROR EXCEPTION", err, err.stack);
            return;
        }
        var caller_line = caller_line_arr[0];
        console.log("CALLER LINE", caller_line);
        var check = "<anonymous>:";
        var pre_column = caller_line.indexOf(check);
        var slice = caller_line.slice(check.length + pre_column, caller_line.length - 1).split(":");
        return slice.map(function (v) { return parseFloat(v); });
    };
    Scrap.prototype.setWarning = function (type, error_position) {
        try {
            this.warning_line_element.style.display = "block";
            var err_type = type === SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR ? "error" : "warn";
            this.warning_line_element.className = "warning-line " + err_type;
            this.warning_position_element.className = "warning-position " + err_type;
            var textarea_top = parseFloat(window.getComputedStyle(this.sandbox.element, null).getPropertyValue('padding-top'));
            var textarea_left = parseFloat(window.getComputedStyle(this.sandbox.element, null).getPropertyValue('padding-left'));
            var line_y_em = (error_position[0]) * 1.065;
            this.warning_line_element.style.marginTop = textarea_top + "px";
            this.warning_line_element.style.top = line_y_em + "em";
            this.warning_position_element.style.marginTop = textarea_top + "px";
            this.warning_position_element.style.marginLeft = textarea_left + "px";
            this.warning_position_element.style.top = line_y_em + "em";
            this.warning_position_element.style.left = (error_position[1] - 1) * 0.47 + "em";
        }
        catch (e) {
        }
    };
    Scrap.prototype.clearWarning = function () {
        this.warning_line_element.style.display = "none";
        this.warning_position_element.style.display = "none";
    };
    Scrap.prototype.updateEvaluationResponse = function (response) {
        this.controls.update(response);
    };
    return Scrap;
}());
var KernelUtils = (function () {
    function KernelUtils(kernel) {
        this.kernel = kernel;
    }
    KernelUtils.prototype.p = function (string) {
        var el = document.createElement('p');
        el.innerHTML = string;
        return el;
    };
    KernelUtils.prototype.h1 = function (string) {
        var el = document.createElement('h1');
        el.innerHTML = string;
        return el;
    };
    KernelUtils.prototype.h2 = function (string) {
        var el = document.createElement('h2');
        el.innerHTML = string;
        return el;
    };
    KernelUtils.prototype.h3 = function (string) {
        var el = document.createElement('h3');
        el.innerHTML = string;
        return el;
    };
    KernelUtils.prototype.getRenderArea = function () {
        return this.kernel.area_render;
    };
    return KernelUtils;
}());
var context = new ScrapsContext();
var elements = document.getElementsByClassName('scraps-js');
for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    var scrap = new Scrap(context);
    scrap.load(el);
}
//# sourceMappingURL=scraps.js.map