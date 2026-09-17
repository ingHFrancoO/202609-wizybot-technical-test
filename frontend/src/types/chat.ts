export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  isError?: boolean;
}

/** Shape of the backend's POST /chat success response. */
export interface ChatApiResponse {
  response: string;
}

/** Shape of a NestJS HttpException / ValidationPipe error body. */
export interface ChatApiErrorBody {
  message: string | string[];
  error?: string;
  statusCode: number;
}
