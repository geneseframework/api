import { Content } from './content.model';

export interface RequestBody {
  description?: string;
  required?: boolean;
  content?: {
    'application/json': Content;
  };
}
