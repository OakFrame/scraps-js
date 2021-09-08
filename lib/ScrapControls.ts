import {Scrap} from "./Scrap";
import {ScrapsEvaluationResponse} from "./ScrapsEvaluationResponse";
import {SCRAPS_EVALUATION_RESULT_TYPE} from "./ScrapsEvaluationResultType.enum";

export class ScrapControls {
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
            let scrap = new Scrap(window['ScrapContext']);
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
