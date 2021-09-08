import {Scrap} from "./Scrap";

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
            const result = await scrap.evaluate(flush);
            scrap.updateEvaluationResponse(result);
        });
    }

}
