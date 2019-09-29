class Redact {
	kernels;
	modules;
	state;
	element;

	constructor() {
		let self = this;
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
		let last = Date.now();
	}

	register(kernel) {
		this.kernels.push(kernel);
		return this;
	}

	executeStack() {
		this.kernels.forEach(function (k) {
			k.evaluate();
		});
		console.log(this.getState().props, this.getState().getProps());
		this.element.min = "0";
		this.element.max = (this.getState().getPropsLength() - 1) + "";
		this.element.value = this.getState().getPointer();

	}

	getState() {
		return this.state;
	}

	getElement() {
		return this.element;
	}

}

class Sandbox {
	input;
	element;
	output_element;
	output_code;

	constructor(code) {
		let sandbox = this;
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
			var input = this,
				selStartPos = input.selectionStart,
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
		this.element.onkeyup = function () {
			context.executeStack();
			window.setTimeout(function () {
				sandbox.renderCodeHighlighting();
			}, 1);
		};
	}

	renderCodeHighlighting() {
		this.element.style.height = "5px";
		this.element.style.height = (this.element.scrollHeight) + "px";
		this.input = this.element.value;
		let v = this.input.replace(/&/g, "&amp;").replace(/</g, "&lt;")
			.replace(/>/g, "&gt;") + "\n";
		this.output_code.innerHTML = v;
		Prism.highlightAll();
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
		`;


		return `let initial = [];
for (var prop in window) {
	initial.push(prop);
	if (typeof window[prop] !== "function" && typeof window[prop] !== "object"){
	window["_oka_"+prop] = makeIdentifiableProperty(window[prop]);
	}
}

for (var prop in context.getState().getDenseProps()){
    let ind = initial.indexOf(prop);
    if (ind !== -1){
        initial.splice(ind,0);
        this[prop] = context.getState().getDenseProps()[prop];
    }
}

console.log('incoming dense context',context.getState().getDenseProps());

function profile(){
	for (var prop in window) {
		if (prop.indexOf("_oka_") !== -1){
	
		}else{
			if (typeof window[prop] !== "function" && typeof window[prop] !== "object"){
				if (initial.indexOf(prop) == -1){   
				console.log('prop', prop);
					context.getState().mutate({[prop]:window[prop]});
				}else{
					if (makeIdentifiableProperty(window[prop]) !== window["_oka_"+prop]){
						context.getState().mutate({[prop]:window[prop]});
					}
				}
			}
		}
	}
}

${build_variables}

${this.input.replace(/;/g, ";")};

`;
	}

	getLambda() {
		let args = "kernel";
		return new Function(args, this.getCompiled());
	}

}

class Kernel {
	context;
	area_control;
	area_working;
	area_render;
	area_console;
	sandbox;
	artifacts;
	utils;
	debounce;

	constructor(context) {
		this.context = context.register(this);
		this.area_control = document.createElement('div');
		this.area_working = document.createElement('div');
		this.area_render = document.createElement('div');
		this.area_console = document.createElement('div');
		this.utils = new KernelUtils(this);
	}

	print(element) {
		this.area_render.appendChild(element);
	}


	load(element) {

		this.sandbox = new Sandbox(element.innerHTML);
		element.innerHTML = "";

		let control_bar = document.createElement('div');
		control_bar.className = 'control_bar';
		control_bar.innerText = '';
		this.area_control.appendChild(control_bar);

		this.area_working.appendChild(this.sandbox.getElement());

		element.appendChild(this.area_render);
		element.appendChild(this.area_working);
		element.appendChild(this.area_control);
		element.appendChild(this.area_console);

		this.sandbox.renderCodeHighlighting();
	}

	getSandbox() {
		return this.sandbox;
	}

	getArtifacts() {
		return this.artifacts;
	}

	onlyIfChanges(old, n) {
		return (old !== n);
	}


	evaluate(flush) {

		let self = this;
		if (flush) {
			window.clearTimeout(this.debounce);
			this.debounce = null;
		} else {

			window.clearTimeout(this.debounce);
			self.debounce = window.setTimeout(function () {
				self.evaluate(true);
				console.log("debounce called");
			}, 10);

			return
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
							this.area_console.innerHTML = this.artifacts;
						}
						//this.area_console.innerHTML = "" + this.artifacts;
					} else {
						if (self.onlyIfChanges(this.area_console.innerHTML, JSON.stringify(this.artifacts))) {
							this.area_console.innerHTML = "";
							jsonView.format(JSON.stringify(this.artifacts), this.area_console);

						}
					}
				}
			} catch (e) {
				//	this.area_console.className = "error";
				//	this.area_console.innerText = "Runtime Error: " + JSON.stringify(e.message);
				if (self.onlyIfChanges(this.area_console.innerHTML, "Runtime Error: " + JSON.stringify(e.message))) {
					this.area_console.innerHTML = "Runtime Error: " + JSON.stringify(e.message);
				}
			}

		} catch (e) {
			//this.area_console.className = "error";
			//this.area_console.innerText = "Compilation Error: " + JSON.stringify(e.message);
			if (self.onlyIfChanges(this.area_console.innerHTML, "Compilation Error: " + JSON.stringify(e.message))) {
				this.area_console.innerHTML = "Compilation Error: " + JSON.stringify(e.message);
			}
		}
	}
}

class Module {

	constructor() {

	}

	load() {

	}

	update() {

	}

	render() {

	}

	unload() {

	}
}

class State {
	props;
	prop_pointer;
	handlers;

	constructor() {
		this.props = [{}];
		this.prop_pointer = 0;
		this.handlers = {};
	}

	getProps() {
		return this.props[this.prop_pointer];
	}

	getDenseProps() {
		let x = {};
		for (var i = 0; i < this.prop_pointer; i++) {
			for (var p in this.props[i]) {
				x[p] = this.props[i][p];
			}
		}
		return x;
	}

	mutate(x) {
		let updated = false;
		for (let p in x) {
			if (x[p] !== this.props[p]) {
				updated = true;
				if (this.handlers[p]) {
					this.handlers[p].forEach(function (handler) {
						handler(x[p]);
					});
				}
			}
		}

		if (!updated) {
			return;
		}

		let current_props = JSON.parse(JSON.stringify(this.getProps()));
		if (this.prop_pointer === this.getPropsLength() - 1) {
			//this.props.push();
			this.props.splice(this.prop_pointer, 0, Object.assign(current_props, x));
			this.prop_pointer++;
		}
		return this;
	}

	onChange(prop, handler) {
		if (!this.handlers[prop]) {
			this.handlers[prop] = [];
		}
		this.handlers[prop].push(handler);
	}

	getPropsLength() {
		return this.props.length;
	}

	getPointer() {
		return this.prop_pointer;
	}

	setPointer(p) {
		this.prop_pointer = Math.min(p, this.props.length);
	}
}

class Instance {
	constructor() {

	}

}


class KernelUtils {
	kernel;

	constructor(kernel) {
		if (!kernel) {
			//kernel.logError();
		}
		this.kernel = kernel;
	}

	p(string) {
		let el = document.createElement('p');
		el.innerHTML = string;
		return el;
	}

	h1(string) {
		let el = document.createElement('h1');
		el.innerHTML = string;
		return el;
	}

	h2(string) {
		let el = document.createElement('h2');
		el.innerHTML = string;
		return el;
	}

	h3(string) {
		let el = document.createElement('h3');
		el.innerHTML = string;
		return el;
	}
}

let context = new Redact();
//document.body.appendChild(context.getElement());
let elements2 = document.getElementsByClassName('redact-js');
for (let i = 0; i < elements2.length; i++) {
	let el = elements2[i];
	let kernel = new Kernel(context);
	kernel.load(el);
}
context.executeStack();