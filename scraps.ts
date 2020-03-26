class Scraps {
	kernels:Array<Kernel>;

	constructor() {
		this.kernels = [];
	}

	register(kernel : Kernel) {
		this.kernels.push(kernel);
		return this;
	}

	executeStack(flush:boolean) {
		console.log("EXECUTE STACK");
		this.kernels.forEach(function (k) {
			console.log("kernel");
			k.evaluate(flush);
		});
	}

}

class Sandbox {
	input:string;
	element:HTMLTextAreaElement;
	output_element:HTMLElement;
	output_code:HTMLElement;

	constructor(code:string) {
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
			sandbox.output_element.scrollTop = sandbox.element.scrollTop;
			sandbox.output_element.scrollLeft = sandbox.element.scrollLeft;
			console.log("scrolling", sandbox.element, this);
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
		this.element.onkeyup = function () {
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
		let v = this.input.replace(/&/g, "&amp;").replace(/</g, "&lt;")
			.replace(/>/g, "&gt;") + "\n";
		this.output_code.innerHTML = v;
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
		`;


		return `${build_variables} ${this.input.replace(/;/g, ";")};`;
	}

	getLambda() {
		let args = "kernel";
		return new Function(args, this.getCompiled());
	}

}

class Kernel {
	context : Scraps;
	area_control:HTMLElement;
	area_working:HTMLElement;
	area_render:HTMLElement;
	area_console :HTMLElement;
	sandbox: Sandbox;
	artifacts:any;
	utils : KernelUtils;
	debounce : number;

	constructor(context : Scraps) {
		this.context = context.register(this);
		this.area_control = document.createElement('div');
		this.area_working = document.createElement('div');
		this.area_render = document.createElement('div');
		this.area_console = document.createElement('div');
		this.utils = new KernelUtils(this);
	}

	print(element:HTMLElement) {
		this.area_render.appendChild(element);
	}


	load(element:HTMLElement|Element) {

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

	onlyIfChanges(old:any, n:any) {
		return (old !== n);
	}

	evaluate(flush:boolean) {

		let self = this;
		if (flush) {
			window.clearTimeout(this.debounce);
			this.debounce = null;
		} else {

			window.clearTimeout(this.debounce);
			self.debounce = window.setTimeout(function () {
				self.evaluate(true);
			}, 10);

			return;
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
				}
			} catch (e) {
				if (self.onlyIfChanges(this.area_console.innerHTML, "Runtime Error: " + JSON.stringify(e.message))) {
					this.area_console.innerHTML = "Runtime Error: " + JSON.stringify(e.message);
				}
			}

		} catch (e) {
			if (self.onlyIfChanges(this.area_console.innerHTML, "Compilation Error: " + JSON.stringify(e.message))) {
				this.area_console.innerHTML = "Compilation Error: " + JSON.stringify(e.message);
			}
		}
	}
}


class KernelUtils {
	kernel:Kernel;

	constructor(kernel:Kernel) {
		this.kernel = kernel;
	}

	p(string:string) {
		let el = document.createElement('p');
		el.innerHTML = string;
		return el;
	}

	h1(string:string) {
		let el = document.createElement('h1');
		el.innerHTML = string;
		return el;
	}

	h2(string:string) {
		let el = document.createElement('h2');
		el.innerHTML = string;
		return el;
	}

	h3(string:string) {
		let el = document.createElement('h3');
		el.innerHTML = string;
		return el;
	}
}

let context = new Scraps();
let elements = document.getElementsByClassName('redact-js');
for (let i = 0; i < elements.length; i++) {
	let el = elements[i];
	let kernel = new Kernel(context);
	kernel.load(el);
}
context.executeStack(true);

/* Only needed if you have earlier Scraps with dependencies on scraps further in the stack */
//context.executeStack(false);