import {ScrapMetadata} from "./ScrapMetadata.interface";
import {ScrapVersionedMetadata} from "./ScrapVersionMetadata.interface";
import {generateId} from "./ScrapUtils";

export class ScrapCodePackage implements ScrapMetadata {

    alias: string;
    fn: ScrapVersionedMetadata[] = [];
    id: string = generateId();
    name: string = "Untitled Scrap";

    constructor(scrapMetadata?: ScrapMetadata) {
        if (scrapMetadata) {
            this.id = scrapMetadata.id;
            this.name = scrapMetadata.name;
            this.fn = scrapMetadata.fn;
            this.alias = scrapMetadata.alias;
        }
    }

    copy(scrapMetadata: ScrapMetadata) {
        this.id = scrapMetadata.id;
        this.name = scrapMetadata.name;
        this.fn = scrapMetadata.fn;
        this.alias = scrapMetadata.alias;
    }

}
