var Redact = /** @class */ (function () {
    function Redact() {
        var self = this;
        this.kernels = [];
        this.modules = [];
        this.state = new State();
        this.element = document.createElement('input');
        this.element.type = "range";
        this.element.min = "0";
        this.element.max = "0";
        this.element.value = "0";
        this.element.onchange = function () {
            self.getState().setPointer(parseInt(this.value));
            self.executeStack();
        };
        this.element.onmousemove = function () {
            if (parseInt(this.value) !== self.getState().getPointer()) {
                self.getState().setPointer(parseInt(this.value));
                self.executeStack();
            }
        };
        var last = Date.now();
    }
    Redact.prototype.register = function (kernel) {
        this.kernels.push(kernel);
        return this;
    };
    Redact.prototype.executeStack = function () {
        this.kernels.forEach(function (k) {
            k.evaluate();
        });
        console.log(this.getState().props, this.getState().getProps());
        this.element.min = "0";
        this.element.max = (this.getState().getPropsLength() - 1) + "";
        this.element.value = this.getState().getPointer();
    };
    Redact.prototype.getState = function () {
        return this.state;
    };
    Redact.prototype.getElement = function () {
        return this.element;
    };
    return Redact;
}());
var Sandbox = /** @class */ (function () {
    function Sandbox(code) {
        var sandbox = this;
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
            sandbox.output_element.scrollTop = this.scrollTop;
            sandbox.output_element.scrollLeft = this.scrollLeft;
        };
        this.element.onkeydown = function (key) {
            var input = this, selStartPos = input.selectionStart, inputVal = input.value;
            if (key.keyCode === 9) {
                input.value = inputVal.substring(0, selStartPos) + "    " + inputVal.substring(selStartPos, input.value.length);
                input.selectionStart = selStartPos + 4;
                input.selectionEnd = selStartPos + 4;
                key.preventDefault();
            }
            window.setTimeout(function () {
                sandbox.renderCodeHighlighting();
            }, 1);
        };
        this.element.onkeyup = function () {
            context.executeStack();
            window.setTimeout(function () {
                sandbox.renderCodeHighlighting();
            }, 1);
        };
    }
    Sandbox.prototype.renderCodeHighlighting = function () {
        this.element.style.height = "5px";
        this.element.style.height = (this.element.scrollHeight) + "px";
        this.input = this.element.value;
        var v = this.input.replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;") + "\n";
        this.output_code.innerHTML = v;
        Prism.highlightAll();
    };
    Sandbox.prototype.getElement = function () {
        var el = document.createElement('div');
        el.className = 'code';
        el.appendChild(this.element);
        el.appendChild(this.output_element);
        return el;
    };
    Sandbox.prototype.getCompiled = function () {
        var build_variables = "\n\t\tfunction makeIdentifiableProperty(i){\n\t\t\treturn typeof i + (!!i?i.toString():\"unknown\");\n\t\t}\n\t\tlet utils = new KernelUtils(kernel);\n\t\tlet p = utils.p.bind(utils);\n\t\tlet h1 = utils.h1.bind(utils);\n\t\tlet h2 = utils.h2.bind(utils);\n\t\tlet print = kernel.print.bind(kernel)\n\t\t";
        return "let initial = [];\nfor (var prop in window) {\n\tinitial.push(prop);\n\tif (typeof window[prop] !== \"function\" && typeof window[prop] !== \"object\"){\n\twindow[\"_oka_\"+prop] = makeIdentifiableProperty(window[prop]);\n\t}\n}\n\nfor (var prop in context.getState().getDenseProps()){\n    let ind = initial.indexOf(prop);\n    if (ind !== -1){\n        initial.splice(ind,0);\n        this[prop] = context.getState().getDenseProps()[prop];\n    }\n}\n\nconsole.log('incoming dense context',context.getState().getDenseProps());\n\nfunction profile(){\n\tfor (var prop in window) {\n\t\tif (prop.indexOf(\"_oka_\") !== -1){\n\t\n\t\t}else{\n\t\t\tif (typeof window[prop] !== \"function\" && typeof window[prop] !== \"object\"){\n\t\t\t\tif (initial.indexOf(prop) == -1){   \n\t\t\t\tconsole.log('prop', prop);\n\t\t\t\t\tcontext.getState().mutate({[prop]:window[prop]});\n\t\t\t\t}else{\n\t\t\t\t\tif (makeIdentifiableProperty(window[prop]) !== window[\"_oka_\"+prop]){\n\t\t\t\t\t\tcontext.getState().mutate({[prop]:window[prop]});\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n}\n\n" + build_variables + "\n\n" + this.input.replace(/;/g, ";") + ";\n\n";
    };
    Sandbox.prototype.getLambda = function () {
        var args = "kernel";
        return new Function(args, this.getCompiled());
    };
    return Sandbox;
}());
var Kernel = /** @class */ (function () {
    function Kernel(context) {
        this.context = context.register(this);
        this.area_control = document.createElement('div');
        this.area_working = document.createElement('div');
        this.area_render = document.createElement('div');
        this.area_console = document.createElement('div');
        this.utils = new KernelUtils(this);
    }
    Kernel.prototype.print = function (element) {
        this.area_render.appendChild(element);
    };
    Kernel.prototype.load = function (element) {
        this.sandbox = new Sandbox(element.innerHTML);
        element.innerHTML = "";
        var control_bar = document.createElement('div');
        control_bar.className = 'control_bar';
        control_bar.innerText = '';
        this.area_control.appendChild(control_bar);
        this.area_working.appendChild(this.sandbox.getElement());
        element.appendChild(this.area_render);
        element.appendChild(this.area_working);
        element.appendChild(this.area_control);
        element.appendChild(this.area_console);
        this.sandbox.renderCodeHighlighting();
    };
    Kernel.prototype.getSandbox = function () {
        return this.sandbox;
    };
    Kernel.prototype.getArtifacts = function () {
        return this.artifacts;
    };
    Kernel.prototype.onlyIfChanges = function (old, n) {
        return (old !== n);
    };
    Kernel.prototype.evaluate = function (flush) {
        var self = this;
        if (flush) {
            window.clearTimeout(this.debounce);
            this.debounce = null;
        }
        else {
            window.clearTimeout(this.debounce);
            self.debounce = window.setTimeout(function () {
                self.evaluate(true);
                console.log("debounce called");
            }, 10);
            return;
        }
        try {
            var fn = this.getSandbox().getLambda();
            try {
                this.area_console.innerText = '';
                this.area_render.innerHTML = "";
                this.artifacts = fn(this);
                if (this.artifacts !== undefined && JSON.stringify(this.artifacts) !== "{}" && JSON.stringify(this.artifacts) !== "undefined") {
                    if (typeof this.artifacts === 'string' || typeof this.artifacts === 'number') {
                        if (self.onlyIfChanges(this.area_console.innerHTML, this.artifacts)) {
                            this.area_console.innerHTML = this.artifacts;
                        }
                        //this.area_console.innerHTML = "" + this.artifacts;
                    }
                    else {
                        if (self.onlyIfChanges(this.area_console.innerHTML, JSON.stringify(this.artifacts))) {
                            this.area_console.innerHTML = "";
                            jsonView.format(JSON.stringify(this.artifacts), this.area_console);
                        }
                    }
                }
            }
            catch (e) {
                //	this.area_console.className = "error";
                //	this.area_console.innerText = "Runtime Error: " + JSON.stringify(e.message);
                if (self.onlyIfChanges(this.area_console.innerHTML, "Runtime Error: " + JSON.stringify(e.message))) {
                    this.area_console.innerHTML = "Runtime Error: " + JSON.stringify(e.message);
                }
            }
        }
        catch (e) {
            //this.area_console.className = "error";
            //this.area_console.innerText = "Compilation Error: " + JSON.stringify(e.message);
            if (self.onlyIfChanges(this.area_console.innerHTML, "Compilation Error: " + JSON.stringify(e.message))) {
                this.area_console.innerHTML = "Compilation Error: " + JSON.stringify(e.message);
            }
        }
    };
    return Kernel;
}());
var Module = /** @class */ (function () {
    function Module() {
    }
    Module.prototype.load = function () {
    };
    Module.prototype.update = function () {
    };
    Module.prototype.render = function () {
    };
    Module.prototype.unload = function () {
    };
    return Module;
}());
var State = /** @class */ (function () {
    function State() {
        this.props = [{}];
        this.prop_pointer = 0;
        this.handlers = {};
    }
    State.prototype.getProps = function () {
        return this.props[this.prop_pointer];
    };
    State.prototype.getDenseProps = function () {
        var x = {};
        for (var i = 0; i < this.prop_pointer; i++) {
            for (var p in this.props[i]) {
                x[p] = this.props[i][p];
            }
        }
        return x;
    };
    State.prototype.mutate = function (x) {
        var updated = false;
        var _loop_1 = function (p) {
            if (x[p] !== this_1.props[p]) {
                updated = true;
                if (this_1.handlers[p]) {
                    this_1.handlers[p].forEach(function (handler) {
                        handler(x[p]);
                    });
                }
            }
        };
        var this_1 = this;
        for (var p in x) {
            _loop_1(p);
        }
        if (!updated) {
            return;
        }
        var current_props = JSON.parse(JSON.stringify(this.getProps()));
        if (this.prop_pointer === this.getPropsLength() - 1) {
            //this.props.push();
            this.props.splice(this.prop_pointer, 0, Object.assign(current_props, x));
            this.prop_pointer++;
        }
        return this;
    };
    State.prototype.onChange = function (prop, handler) {
        if (!this.handlers[prop]) {
            this.handlers[prop] = [];
        }
        this.handlers[prop].push(handler);
    };
    State.prototype.getPropsLength = function () {
        return this.props.length;
    };
    State.prototype.getPointer = function () {
        return this.prop_pointer;
    };
    State.prototype.setPointer = function (p) {
        this.prop_pointer = Math.min(p, this.props.length);
    };
    return State;
}());
var Instance = /** @class */ (function () {
    function Instance() {
    }
    return Instance;
}());
var KernelUtils = /** @class */ (function () {
    function KernelUtils(kernel) {
        if (!kernel) {
            //kernel.logError();
        }
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
    return KernelUtils;
}());
var context = new Redact();
document.body.appendChild(context.getElement());
var elements2 = document.getElementsByClassName('redact-js');
for (var i = 0; i < elements2.length; i++) {
    var el = elements2[i];
    var kernel = new Kernel(context);
    kernel.load(el);
}
context.executeStack();
