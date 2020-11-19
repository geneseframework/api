import { ApiProperty } from './apiProperty.model';

export interface RequestParameter {
  name?: string;
  description?: string;
  schema?: ApiProperty;
  in?: string;
  required?: boolean;
}
