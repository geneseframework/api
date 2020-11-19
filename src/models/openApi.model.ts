import { ApiProperty } from './apiProperty.model';
import { Path } from './path.model';

export interface OpenApi {
  openapi: string;
  info: {
    title: string;
    version: string;
    decription: string;
  };
  paths: {
    [key: string]: Path;
  };
  components: {
    schemas: {
      [key: string]: ApiProperty;
    };
  };
}
