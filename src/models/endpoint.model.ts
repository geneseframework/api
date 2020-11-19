import { Crud } from '../enums/crud.enum';
import { Parameter } from './parameter.model';

export interface Endpoint {
  name: string;
  parameters?: Parameter[];
  description?: string;
  responseType?: string;
  geneseInstance?: string;
  body?: Parameter;
  method: Crud;
  path: string;
}
