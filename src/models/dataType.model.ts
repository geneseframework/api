import { Import } from "./import.model";
import { Field } from "./field.model";

export interface DataType {
    name?: string;
    imports?: Import[];
    fields?: Field[]
}