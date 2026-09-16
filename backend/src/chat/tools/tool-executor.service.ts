import { Injectable, Logger } from '@nestjs/common';
import type { ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';
import { CurrencyService } from '../../currency/currency.service.js';
import { ProductsService } from '../../products/products.service.js';
import { CONVERT_CURRENCIES_TOOL_NAME, SEARCH_PRODUCTS_TOOL_NAME } from './tool-definitions.js';

/**
 * Dispatches a tool call requested by the model to the matching service and
 * serializes the result back to a string, ready to be sent back to the LLM
 * as a `role: 'tool'` message. Errors are never thrown from here: they are
 * turned into an `{ error }` payload so the model can react gracefully
 * instead of the whole chat request failing.
 */
@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly currencyService: CurrencyService,
  ) {}

  async execute(toolCall: ChatCompletionMessageToolCall): Promise<string> {
    if (toolCall.type !== 'function') {
      return JSON.stringify({ error: `Unsupported tool call type: ${toolCall.type}` });
    }

    try {
      const args: unknown = JSON.parse(toolCall.function.arguments);
      console.log('args', args);

      console.log('toolCall.function.name', toolCall.function.name);
      
      switch (toolCall.function.name) {
        case SEARCH_PRODUCTS_TOOL_NAME: {
          const { query } = args as { query: string };
          const results = await this.productsService.search(query);
          return JSON.stringify(results);
        }
        case CONVERT_CURRENCIES_TOOL_NAME: {
          const { amount, from, to } = args as { amount: number; from: string; to: string };
          const result = await this.currencyService.convert(amount, from, to);
          return JSON.stringify(result);
        }
        default:
          return JSON.stringify({ error: `Unknown tool: ${toolCall.function.name}` });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tool execution failed';
      this.logger.warn(`Tool "${toolCall.function.name}" failed: ${message}`);
      return JSON.stringify({ error: message });
    }
  }
}
