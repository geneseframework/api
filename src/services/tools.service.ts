import { PrimitiveType } from '../enums/primitiveType.enum';

/**
 * Transform a string in camelcase
 * @param str the stirng to camelize
 * @returns {string}
 */
export function camelize(str: string): string {
  return str
    .split('-')
    .map((item: string, index: number) => (index ? item.charAt(0).toUpperCase() + item.slice(1).toLowerCase() : item))
    .join('');
}

/**
 * Transform a string in kebabcase
 * @param str the stirng to kebabize
 * @returns {string}
 */
export function kebabize(str: string): string {
  return (str.charAt(0).toLocaleLowerCase() + str.slice(1)).replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Transform a string in pascalcase
 * @param str the stirng to pascalize
 * @returns {string}
 */
export function pascalize(str: string): string {
  const camelized: string = camelize(str);
  return camelized.charAt(0).toUpperCase() + camelized.slice(1);
}

/**
 * Transform a string in stirng literal
 * @param str the string to literalize
 * @returns {string}
 */
export function literalize(str: string): string {
  return str.replace(/\{/g, '${');
}

/**
 * Check if a type is primitive type
 * @param type the type
 * @returns {boolean}
 */
export function isPrimitive(type: string): boolean {
  return Object.keys(PrimitiveType).includes(type);
}

/**
 * Check if the schema is an array and if items exists
 * @param schema 
 * @returns {boolean}
 */
export function isTypeAnArray(schema: any): boolean {
  return schema.type === 'array' && schema.items;
}
