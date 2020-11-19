import { Content } from './content.model';

export interface Response {
  description?: string;
  content?: {
    'application/json': Content;
  };
}
