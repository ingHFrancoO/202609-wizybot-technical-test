import type { ChatCompletionFunctionTool } from 'openai/resources/chat/completions';

export const SEARCH_PRODUCTS_TOOL_NAME = 'searchProducts';
export const CONVERT_CURRENCIES_TOOL_NAME = 'convertCurrencies';

/**
 * Tool schemas exposed to the OpenAI Chat Completions API via function calling.
 */
export const CHAT_TOOLS: ChatCompletionFunctionTool[] = [
  {
    type: 'function',
    function: {
      name: SEARCH_PRODUCTS_TOOL_NAME,
      description:
        'Search the product catalog for items related to a user query. Returns up to 2 relevant products with their price (in USD), discount and URL.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search terms describing what the user is looking for',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: CONVERT_CURRENCIES_TOOL_NAME,
      description: 'Convert a monetary amount from one currency to another using the latest exchange rate.',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'The amount to convert' },
          from: { type: 'string', description: 'ISO 4217 source currency code, e.g. USD' },
          to: { type: 'string', description: 'ISO 4217 target currency code, e.g. EUR' },
        },
        required: ['amount', 'from', 'to'],
      },
    },
  },
];
