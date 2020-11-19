import { OpenApi } from '../models/openApi.model';
import { DataType } from '../models/dataType.model';
import { ApiProperty } from '../models/apiProperty.model';
import { Field } from '../models/field.model';
import { Import } from '../models/import.model';
import { PrimitiveType } from '../enums/primitiveType.enum';
import { DefaultValue } from '../enums/defaultValue.enum';
import { kebabize } from './tools.service';
import { isTypeAnArray } from './tools.service'

export class DataTypesParser {
  #dataTypes: DataType[] = [];

  constructor(private openApi: OpenApi, private datatypeExtension: string) {
    this.parseDataTypes();
  }

  /**
   * Get parsed data types from current openApi json
   * @returns {DataType[]}
   */
  get data(): DataType[] {
    return this.#dataTypes;
  }

  /**
   * Parse datatype from each open api property
   * @returns {void}
   */
  parseDataTypes(): void {
    for (const [name, schema] of Object.entries(this.openApi?.components?.schemas || {})) {
      const { fields, imports } = this.getFieldsAndImportsFromSchema(schema);
      this.#dataTypes.push({
        name,
        fields,
        imports,
      });
    }
  }

  /**
   * Get fields and imports from an open api property
   * @param schema the open api property
   * @returns { { fields: Fields[]; imports: Import[] } }
   */
  getFieldsAndImportsFromSchema(schema: ApiProperty = new ApiProperty()): { fields: Field[]; imports: Import[] } {
    const imports: Import[] = [];
    const fields: Field[] = [];
    for (let [name, property] of Object.entries(schema.properties || {})) {
      const type = this.getFieldType(property);
      let defaultValue = this.getDefaultValueFromType(type);
      if (name === 'gnIndexableType') {
        name = '[key: string]';
        defaultValue = null;
      }
      fields.push({ name, type, defaultValue });
      imports.push(this.getImportFromType(type));
    }
    return { imports: imports.filter((i: Import) => i), fields };
  }

  /**
   * Get the type as string for a given api property
   * @param schema the  open api property
   * @returns {string}
   */
  getFieldType(schema: ApiProperty = new ApiProperty()): string {

    if (schema.$ref) {
      return schema.$ref.split('/').pop();
    }

    if (isTypeAnArray(schema)) {
      return `${this.getFieldType(schema.items)}[]`;
    }

    return PrimitiveType[schema.type] || 'any';
  }

  /**
   * Get the default value as string for a type
   * @param type the given type
   * @returns {string}
   */
  getDefaultValueFromType(type: string): string {

    if (type.slice(type.length - 2) === '[]') {
      return `[${this.getDefaultValueFromType(type.slice(0, type.length - 2))}]`;
    }

    if (Object.keys(PrimitiveType).includes(type)) {
      return DefaultValue[type];
    }

    return `new ${type}()`;
  }

  /**
   * Get an import from a type if it is needed
   * @param type the given type
   * @returns {Import}
   */
  getImportFromType(type: string): Import {

    if (type.slice(type.length - 2) === '[]') {
      return this.getImportFromType(type.slice(0, type.length - 2));
    }

    if (!Object.keys(PrimitiveType).includes(type)) {
      return { importedThings: [type], module: `./${kebabize(type)}.${this.datatypeExtension}` };
    }

  }
}
