#!/usr/bin/env node

import { DataTypesParser } from './services/datatypes-parser.service';
import { EndpointsParser } from './services/endpoints-parser.service';
import { OpenApi } from './models/openApi.model';
import { HandlebarsService } from './services/handlebars.service';
import { AppType } from './enums/appType.enum';

const fs = require('fs-extra');
const chalk = require('chalk');

// @ts-ignore
Array.prototype.groupBy = function (key) {
    return this.reduce(function(rv, x) {
        (rv[x[key] || 'any'] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
}


async function loadPackage(): Promise<any> {
    return import(`${process.cwd()}/package.json`);
}

loadPackage().then(pkg => {
    const dependencies = Object.keys(pkg.dependencies);

    const appType: AppType = dependencies.includes('@angular/core')
        ? AppType.ANGULAR
        : dependencies.includes('react')
            ? AppType.REACT
            : AppType.REACT;

    if (!appType) {
        console.log(chalk.red('This is not an Angular or React application, aborting.'));
        return;
    }

    const ARGS: string[] = process.argv.slice(2);
    const OPEN_API_PATH = ARGS[0] || './genese-api.json';
    const datatypeExtension = ARGS[1] || 'datatype';
    const serviceExtension = ARGS[2] || 'service';
    const datatypesOutput = ARGS[3] || './src/genese/datatypes';
    const servicesOutput = ARGS[4] || './src/genese/services';
    const splitServices = (ARGS[5] || 'false') === 'true';

    const returnType = AppType.ANGULAR ? 'observable' : 'promise';


    if (!fs.existsSync(OPEN_API_PATH)) {
        console.log(chalk.red('OpenApi file not found.'));
        return;
    }

    let OPEN_API: OpenApi;
    try {
        OPEN_API = JSON.parse(fs.readFileSync(OPEN_API_PATH, 'utf-8'));
    } catch (e) {
        console.log(chalk.red('Invalid OpenApi file.'));
        return;
    }

    const DATA_TYPES = new DataTypesParser(OPEN_API, datatypeExtension).data;
    const ENDPOINTS = new EndpointsParser(OPEN_API, datatypeExtension, datatypesOutput, servicesOutput).data;

    const HBS = new HandlebarsService(__dirname, appType, returnType, datatypeExtension, serviceExtension, datatypesOutput, servicesOutput);

    for (const DATA_TYPE of DATA_TYPES) {
        HBS.generateDataType(DATA_TYPE);
    }

    if (splitServices) {
        ENDPOINTS.endpoints.forEach(endpoint => {
            endpoint['basePath'] = endpoint.path.split('/')[1];
        })
        // @ts-ignore
        const SPLIT_ENDPOINTS = Object.entries(ENDPOINTS.endpoints.groupBy('basePath'))
            .map(([k, v]: [string, any[]], i) => {
                return {
                    endpoints: v,
                    imports: ENDPOINTS.imports.filter(imp => {
                        const importedTypes = imp.importedThings;
                        const neededTypes = v.map(endpoint => endpoint.geneseInstance);
                        return importedTypes.some(item => neededTypes.includes(item))
                    }),
                    geneseInstance: k
                };
            })

        SPLIT_ENDPOINTS.forEach(endpoint => {
            HBS.generateRequestService(endpoint);
        })
    } else {
        HBS.generateRequestService(ENDPOINTS);
    }
}).catch(() => {
    console.log(chalk.red('Error while loading package.json file.'))
})

