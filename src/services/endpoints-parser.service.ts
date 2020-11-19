import { Crud } from '../enums/crud.enum';
import { PrimitiveType } from '../enums/primitiveType.enum';
import { Endpoint } from '../models/endpoint.model';
import { Import } from '../models/import.model';
import { OpenApi } from '../models/openApi.model';
import { Parameter } from '../models/parameter.model';
import { Path } from '../models/path.model';
import { HttpMethod } from '../models/request.model';
import { RequestParameter } from '../models/requestParameter.model';
import { Response } from '../models/response.model';
import { camelize, kebabize, pascalize, literalize, isPrimitive } from './tools.service';
import { GlobalObject } from '../enums/globalObject.enum';
import { NaturalCrud } from '../enums/naturalCrud.enum';
import { isTypeAnArray } from './tools.service';

const path = require('path');

export class EndpointsParser {
    #imports: Import[] = [];
    #endpoints: Endpoint[] = [];
    #alreadyImportedThings: string[] = [];


    constructor(private openApi: OpenApi, private datatypeExtension: string, private datatypesOutput: string, private servicesOutput: string) {
        this.parsePaths();
    }


    /**
     * Get parsed endpoints data from current openApi json
     * @returns {DataType[]}
     */
    get data(): { endpoints: Endpoint[]; imports: Import[] } {
        return {
            imports: this.#imports,
            endpoints: this.#endpoints,
        };
    }


    /**
     * Parse endpoints from each open api path
     * @returns {void}
     */
    parsePaths(): void {
        for (const [path, value] of Object.entries(this.openApi?.paths || {})) {
            const PARAMETERS: Parameter[] = this.getPathParameters(value);
            this.parseEndpoints(path, value, PARAMETERS);
        }
    }


    /**
     * Get all necessary data for each path endpoints
     * @param path the path base uri
     * @param data the open api path data
     * @param parameters the path parameters
     * @returns {void}
     */
    parseEndpoints(path: string, data: Path, parameters: Parameter[]): void {
        for (const [key, value] of Object.entries(data || {})) {
            if (Object.values(Crud).includes(key as Crud)) {
                const method: Crud = this.getCrudMethod(parameters, key);
                const responseType: string = this.getResponseTypeForEndpoint(value);
                const body: Parameter = this.getBody(value);
                this.#endpoints.push({
                    description: value.description,
                    method,
                    path: literalize(path),
                    name: this.getName(path.split('/')[1], method, parameters),
                    parameters: body ? [...parameters, body] : parameters,
                    body,
                    responseType,
                    geneseInstance: this.getGeneseInstance(method, responseType),
                });
            }
        }
    }


    /**
     * Will get the crud method GET or GETALL
     * @param parameters
     * @param key
     */
    getCrudMethod(parameters: Parameter[], key: string): Crud {
        return parameters.length === 0 && key === Crud.GET ? Crud.GETALL : (key as Crud);
    }


    /**
     * Add an import from a type if it is necessary and if there is no duplicate
     * @param type the given type
     * @returns {void}
     */
    addImport(type: string): void {
        const basePath = path.relative(this.servicesOutput, this.datatypesOutput);
        const IMPORT: Import = {importedThings: [type], module: `${basePath}/${kebabize(type)}.${this.datatypeExtension}`};
        const newImports: string[] = IMPORT.importedThings.filter((it: string) => !this.#alreadyImportedThings.includes(it));
        if (newImports.length > 0) {
            IMPORT.importedThings = newImports;
            this.#alreadyImportedThings.push(...newImports);
            this.#imports.push(IMPORT);
        }
    }


    /**
     * Get all parameters from a open api path
     * @param path the given path
     * @returns {Parameter[]}
     */
    getPathParameters(path: Path): Parameter[] {
        return (path.parameters || []).map((param: RequestParameter) => {
            const type: string = this.getTypeFromSchema(param.schema);
            const {name, description} = param;
            return {name, type, description};
        });
    }


    /**
     * Get the parameter body for an endpoint (by get its type) if it is needed
     * @param endpoint the given endpoint
     * @returns {Parameter}
     */
    getBody(endpoint: HttpMethod): Parameter {
        const type: string = this.getTypeFromSchema(endpoint.requestBody?.content['application/json'].schema);
        return endpoint.requestBody
            ? {
                name: 'body',
                type,
                description: endpoint.requestBody?.description,
            }
            : null;
    }


    /**
     * Get the full name for a given endpoint
     * @param path the base uri path
     * @param method the endpoint crud method
     * @param parameters the endpoints parameters
     * @returns {string}
     */
    getName(path: string, method: Crud, parameters: Parameter[]): string {
        const by: string = parameters && parameters.length > 0 ? `-by-${parameters[0].name}` : '';
        return camelize(`${NaturalCrud[method]}-${path}${by}`);
    }


    /**
     * Get the response type as string of an endpoint
     * @param endpoint the given endpoint
     * @returns {string}
     */
    getResponseTypeForEndpoint(endpoint: HttpMethod): string {
        const type: string = Object.values(endpoint.responses)
            .map((res: Response) => this.getTypeFromSchema((res.content || {})['application/json']?.schema))
            .shift();
        return isPrimitive(type) && type !== 'any' ? GlobalObject[type] : type;
    }


    /**
     * Get the type as string from an open api type schema
     * @param schema the open api type schema
     * @returns {string}
     */
    getTypeFromSchema(schema: any = {}): string {

        if (schema.$ref) {
            return this.getTypeFromDataTypeRef(schema.$ref);
        }

        if (isTypeAnArray(schema)) {
            return `${this.getTypeFromSchema(schema.items)}[]`;
        }

        return PrimitiveType[schema.type] || 'any';

    }


    /**
     * Get type from an open api type reference
     * and add it to the imports
     * @param ref the open api type refrence
     * @returns {string}
     */
    getTypeFromDataTypeRef(ref: string = ''): string {
        const TYPE: string = ref.split('/').pop();
        this.addImport(TYPE);
        return TYPE;
    }


    /**
     * Get the genese instance type which differ from reponseType
     * @param method the endpoint crud method
     * @param responseType the endpoint response type
     * @returns {string}
     */
    getGeneseInstance(method: Crud, responseType: string): string {
        const baseResponseType = method === Crud.GETALL ? responseType.split('[')[0] : responseType;
        return isPrimitive(baseResponseType) ? GlobalObject[baseResponseType] : baseResponseType;
    }
}
