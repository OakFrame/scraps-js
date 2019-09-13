class Context {
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

	constructor(code) {
		let sandbox = this;
		this.input = code;
		this.element = document.createElement('textarea');
		this.element.value = code;
		this.element.style.width = "100%";
		this.element.rows = 8;

		this.element.onkeyup = function () {
			sandbox.input = this.value;
			console.log('UPDATED CODE', sandbox.input);
			context.executeStack();
		};
	}

	getElement() {
		return this.element;
	}

	getCompiled() {

		let build_variables = `
		function makeIdentifiableProperty(i){
			return typeof i + (!!i?i.toString():"unknown");
		}
		let utils = new KernelUtils(kernel);
		let p = utils.p.bind(utils);
		let h1 = utils.h1.bind(utils);
		let h2 = utils.h2.bind(utils);`;

		return `let initial = [];
for (var prop in window) {
	initial.push(prop);
	if (typeof window[prop] !== "function" && typeof window[prop] !== "object"){
	window["_oka_"+prop] = makeIdentifiableProperty(window[prop]);
	}
}

for (var prop in context.getState().getProps()){
    let ind = initial.indexOf(prop);
    if (ind !== -1){
        initial.splice(ind,0);
        this[prop] = context.getState().getProps()[prop];
    }
}

console.log('incoming context',context.getState().getProps());

${build_variables}

${this.input};
let output = {};
for (var prop in window) {

	if (prop.indexOf("_oka_") !== -1){
	//	delete window[prop];
	}else{
	
		if (typeof window[prop] !== "function" && typeof window[prop] !== "object"){

		if (initial.indexOf(prop) == -1){
		//	console.log('new props',prop, window[prop]);
			context.getState().mutate({[prop]:window[prop]});
		}else{
		//	console.log(prop,makeIdentifiableProperty(window[prop]), window["_oka_"+prop]);
			if (makeIdentifiableProperty(window[prop]) !== window["_oka_"+prop]){
			//console.log('existing prop, but different:',prop, window[prop],window["_oka_"+prop]);
			context.getState().mutate({[prop]:window[prop]});
			}
		}
		
		}
	}

}`;
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

	load(element) {

		this.sandbox = new Sandbox(element.innerHTML);
		element.innerHTML = "";

		let control_bar = document.createElement('div');
		control_bar.className = 'control_bar';
		control_bar.innerText = 'this is the control bar';
		this.area_control.appendChild(control_bar);

		this.area_working.appendChild(this.sandbox.getElement());

		element.appendChild(this.area_render);
		element.appendChild(this.area_working);
		element.appendChild(this.area_control);
		element.appendChild(this.area_console);
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
			}, 400);

			return
		}

		console.log('EVALUATING');

		//this.area_console.innerHTML = "";
		this.area_render.innerHTML = "";
		//this.area_console.className = "";
		try {
			let fn = this.getSandbox().getLambda();
			try {
				this.artifacts = fn(this);
				if (this.artifacts !== undefined && JSON.stringify(this.artifacts) !== "{}" && JSON.stringify(this.artifacts) !== "undefined") {
					if (typeof this.artifacts === 'string' || typeof this.artifacts === 'number') {
						if (self.onlyIfChanges(this.area_console.innerHTML, this.artifacts)) {
							this.area_console.innerHTML = this.artifacts;
						}
						//this.area_console.innerHTML = "" + this.artifacts;
					} else {
						if (self.onlyIfChanges(this.area_console.innerHTML, JSON.stringify(this.artifacts))) {
							this.area_console.innerHTML = JSON.stringify(this.artifacts);
						}
						//self.onlyIfChanges(this.area_console.innerHTML, JSON.stringify(this.artifacts));
						//window['jsonView'].format(JSON.stringify(out), self.console_area_element);
						//	this.area_console.innerHTML = "" + JSON.stringify(this.artifacts);
					}
				}
			} catch (e) {
				//	this.area_console.className = "error";
				//	this.area_console.innerText = "Runtime Error: " + JSON.stringify(e.message);
			}

		} catch (e) {
			//this.area_console.className = "error";
			//this.area_console.innerText = "Compilation Error: " + JSON.stringify(e.message);
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

	constructor() {
		this.props = [{}];
		this.prop_pointer = 0;
		this.handlers = {};
	}

	getProps() {
		return this.props[this.prop_pointer];
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

		//if (this.prop_pointer === this.getPropsLength()-1) {
		//this.props.push();
		this.props.splice(this.prop_pointer, 0, Object.assign(current_props, x));
		this.prop_pointer++;
		//}
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
	constructor(kernel) {
		if (!kernel) {
			//kernel.logError();
		}
		this.kernel = kernel;
	}

	p(string) {
		this.kernel.area_render.innerHTML += "<p>" + string + "</p>";
	}

	h1(string) {
		console.log(this, this.kernel, 'H1');
		this.kernel.area_render.innerHTML += "<h1>" + string + "</h1>";
	}

	h2(string) {
		this.kernel.area_render.innerHTML += "<h2>" + string + "</h2>";
	}
}

let context = new Context();
document.body.appendChild(context.getElement());
let elements2 = document.getElementsByClassName('oakframe');
for (let i = 0; i < elements2.length; i++) {
	let el = elements2[i];
	let kernel = new Kernel(context);
	kernel.load(el);
}
context.executeStack();