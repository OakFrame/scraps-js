import {ScrapVersionedMetadata} from "./ScrapVersionMetadata.interface";

export interface ScrapMetadata {
    id: string;
    name: string;
    alias: string;
    fn: ScrapVersionedMetadata[];
}
