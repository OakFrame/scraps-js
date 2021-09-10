import {Scrap} from "./Scrap";
import {ScrapsEvaluationResponse} from "./ScrapsEvaluationResponse";
import {SCRAPS_EVALUATION_RESULT_TYPE} from "./ScrapsEvaluationResultType.enum";

export class ScrapsContext {

    scraps: Array<Scrap>;

    constructor() {
        this.scraps = [];
    }

    register(kernel: Scrap) {
        this.scraps.push(kernel);
        return this;
    }

    executeStack(flush: boolean) {
        this.scraps.forEach(async function (scrap) {
            scrap.updateEvaluationResponse(new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.RUNNING, {}));
            const result = await scrap.evaluate(flush);
            scrap.updateEvaluationResponse(result);
        });
    }

}
