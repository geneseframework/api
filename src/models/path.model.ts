import { HttpMethod } from './request.model';
import { RequestParameter } from './requestParameter.model';

export interface Path {
    summary?: string;
    description?: string;
    get?: HttpMethod;
    post?: HttpMethod;
    put?: HttpMethod;
    delete?: HttpMethod;
    parameters: RequestParameter[];
}