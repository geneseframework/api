import * as eol from 'eol';
import * as fs from 'fs-extra';
import * as HBS from 'handlebars';

import { DataType } from '../models/dataType.model';
import { Endpoint } from '../models/endpoint.model';
import { Import } from '../models/import.model';
import { kebabize } from './tools.service';
import { AppType } from '../enums/appType.enum';

export class HandlebarsService {
  constructor(
      private dirname: string,
      private appType: AppType,
      private returnType: string,
      private datatypeExtension,
      private serviceExtension: string,
      private datatypesOutput: string,
      private servicesOutput: string
  ) {
      HBS.registerHelper('isAngular', value => {
          return value === AppType.ANGULAR;
      })
      HBS.registerHelper('isReact', value => {
          return value === AppType.REACT;
      })
      HBS.registerHelper('isPromise', value => {
          return returnType === 'promise';
      })
      HBS.registerHelper('isObservable', value => {
          return returnType === 'observable';
      })
  }

  /**
   * Register a partial hbs template
   * @param partialName the partial name
   * @param fileName the partial file name
   * @returns {void}
   */
  registerPartial(partialName: string, fileName: string): void {
    const partial = eol.auto(fs.readFileSync(`${this.dirname}/templates/${fileName}.hbs`, 'utf-8'));
    HBS.registerPartial(partialName, partial);
  }

  /**
   * Generate a datatype.ts file from a datatype model
   * @param dataType the datatype model
   * @returns {void}
   */
  generateDataType(dataType: DataType): void {
    this.registerPartial('fieldTemplate', 'fields');
    this.registerPartial('importTemplate', 'imports');
    const CONTENT: string = eol.auto(fs.readFileSync(`${this.dirname}/templates/dataTypes.hbs`, 'utf-8'));
    const TEMPLATE: HandlebarsTemplateDelegate<any> = HBS.compile(CONTENT);
    const FILE: string = TEMPLATE(dataType);
    fs.outputFile(`${this.datatypesOutput}/${kebabize(dataType.name)}.${this.datatypeExtension}.ts`, FILE, { encoding: 'utf-8' });
  }

  /**
   * Generate the genese-api.service.ts file from endpoints and imports model
   * @param data the endpoints and imports model
   * @returns {void}
   */
  generateRequestService(data: { endpoints: Endpoint[]; imports: Import[], geneseInstance?: string }): void {
    this.registerPartial('importTemplate', 'imports');
    this.registerPartial('apiCallMethod', `api-call-method-${this.appType}`);
    const CONTENT = eol.auto(fs.readFileSync(this.dirname + `/templates/genese-request-service-${this.appType}.hbs`, 'utf-8'));
    const TEMPLATE = HBS.compile(CONTENT);
    const FILE = TEMPLATE(Object.assign(data, {appType: this.appType, returnType: this.returnType, datatypeExtension: this.datatypeExtension}));
    fs.outputFile(`${this.servicesOutput}/genese-request${data.geneseInstance ? `-${data.geneseInstance}` : ''}${this.serviceExtension ? `.${this.serviceExtension}` : ''}.ts`, FILE, { encoding: 'utf-8' });

    if (this.appType === AppType.REACT) {
        const axiosContent = eol.auto(fs.readFileSync(this.dirname + `/templates/axios.hbs`, 'utf-8'));
        const axiosTemplate = HBS.compile(axiosContent);
        const axiosFile = axiosTemplate({});
        fs.outputFile(`${this.servicesOutput}/axios.ts`, FILE, { encoding: 'utf-8' })
    }
  }
}
