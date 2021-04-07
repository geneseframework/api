<p align="center">
    <img src="https://raw.githubusercontent.com/geneseframework/mapper/develop/docs/logo-genese-150x150.png" alt="genese logo">
</p>

# @genese/api [![npm version](https://badge.fury.io/js/%40genese%2Fapi.svg)](https://badge.fury.io/js/%40genese%2Fapi)

`@genese/api` is a code generator for Angular and React apps.

Create you OpenApi file and launch `@genese/api` : all your DTOs and data-services will be automatically generated ! Moreover, all these data-services will use and return highly typed objects corresponding to the schemas included in you OpenApi file.

Less code, less tests, less bugs, less waste of time.

## Why use @genese/api ?

This module is a powerful tool which will improve your productivity in building web apps.

`@genese/api` is the Genese module used for Angular and React applications, which will save your time and help you to code applications much faster. With `@genese/api`, all your data-services and all your DTOs will be automatically generated ! No more html requests, no more mappers, no more tests of mappers...  Genese replaces the http requests located in your services, and replaces too the mappers used to format data coming from backend into typed objects.

Moreover, `@genese/api` uses under the hood the core of the Genese framework : [genese-mapper](https://www.npmjs.com/package/genese-mapper). Returning typed objects from your data-services to your components is fundamental : if you do not, your component could receive incorrect data from the backend, and your application would crash automatically. That's why the mappers are so important. Unfortunately, writing mappers is long and fastidious. More, you need to write unit tests for your mappers, and add some mock values to be able to do these tests. Idem for your http requests, which should be tested with some tools like HttMock. That's why writing data-services is so long and fastidious.

`@genese/api` calls the http requests for you, and uses a Generic mapper which will send you back objects automatically typed !

 * ***DTOs***

 No need to write any data-model or DTO : `@genese/api` will create them automatically (using your OpenApi file)
 * ***DATA-SERVICES***

 No need to write any data-service. No HTML requests, no mappers : `@genese/api` will create them for you (using your OpenApi file)
 * ***GET requests***

 You will be sure that the objects received from your GET requests have correct type (under the hood, genese-mapper maps all your data)
 * ***PUT and POST requests***

 You will be sure to send correctly typed objects in your POST or PUT requests (with auto-completion in your preferred IDE)

 For more information about OpenApi specifications : [Swagger official website](https://swagger.io/specification/)
