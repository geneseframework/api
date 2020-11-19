import { RequestBody } from './requestBody.model';
import { Response } from './response.model';

export interface HttpMethod {
  requestBody?: RequestBody;
  responses?: {
    [key: string]: Response;
  };
  operationId?: string;
  summary?: string;
  description?: string;
}
