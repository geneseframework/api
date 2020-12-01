#!/usr/bin/env node

import { DataTypesParser } from './services/datatypes-parser.service';
import { EndpointsParser } from './services/endpoints-parser.service';
import { OpenApi } from './models/openApi.model';
import { HandlebarsService } from './services/handlebars.service';
import { AppType } from './enums/appType.enum';

const fs = require('fs-extra');
const chalk = require('chalk');
const ora = require('ora');

const spinner = ora();

// @ts-ignore
Array.prototype.groupBy = function (key) {
    return this.reduce(function(rv, x) {
        (rv[x[key] || 'any'] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
}

function checkArg(arg: string): string {
    if (arg === 'undefined') return undefined;
    else return arg;
}


async function loadPackage(): Promise<any> {
    return require(`${process.cwd()}/package.json`);
}

async function loadGeneseConfig(): Promise<{api: any}> {
    const geneseConfigPath = `${process.cwd()}/geneseconfig.json`;
    if (fs.existsSync(geneseConfigPath)) {
        return require(`${process.cwd()}/geneseconfig.json`);
    } else {
        return {api: {}};
    }
}

Promise.all([loadPackage(), loadGeneseConfig()])
    .then(([pkg, config]) => {
        const dependencies = Object.keys(pkg.dependencies);

        const appType: AppType = dependencies.includes('@angular/core')
            ? AppType.ANGULAR
            : dependencies.includes('react')
                ? AppType.REACT
                : undefined;

        if (!appType) {
            console.log(chalk.red('This is not an Angular or React application, aborting.'));
            return;
        }

        const ARGS: string[] = process.argv.slice(2);
        const jsonApiPath = checkArg(config.api.jsonApiPath || ARGS[0]) || './genese-api.json';
        const datatypeExtension = checkArg(config.api.datatypeExtension || ARGS[1]) || 'datatype';
        const serviceExtension = checkArg(config.api.serviceExtension || ARGS[2]) || 'service';
        const datatypesOutput = checkArg(config.api.datatypesOutput || ARGS[3]) || './src/genese/datatypes';
        const servicesOutput = checkArg(config.api.servicesOutput || ARGS[4]) || './src/genese/services';
        const splitServices = checkArg(config.api.splitServices?.toString() || ARGS[5] || 'false') === 'true';

        const returnType = AppType.ANGULAR ? 'observable' : 'promise';

        if (!fs.existsSync(jsonApiPath)) {
            console.log(chalk.red('OpenApi file not found.'));
            return;
        }

        let OPEN_API: OpenApi;
        try {
            OPEN_API = JSON.parse(fs.readFileSync(jsonApiPath, 'utf-8'));
        } catch (e) {
            console.log(chalk.red('Invalid OpenApi file.'));
            return;
        }

        spinner.start('API generation');

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
        spinner.succeed();
    })
    .catch((e) => {
        spinner.fail();
        console.log(e)
        console.log(chalk.red('Error while loading json file.'))
    })
