export class ApiProperty {
    description?: string;
    type?: string;
    $ref?: string;
    properties?: {
        [key: string]: ApiProperty;
    } = {};
    items?: ApiProperty
    example?: any;
    required?: string[];
}