import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { AppConfig } from '../config/configuration.js';
import { ToolExecutorService } from './tools/tool-executor.service.js';
import { CHAT_TOOLS } from './tools/tool-definitions.js';

const MAX_TOOL_CALL_ITERATIONS = 5;

const SYSTEM_PROMPT = `You are Wizybot, an AI shopping assistant for an online store.
- Use the searchProducts tool whenever the user is looking for a product, gift idea, or asks about a product's price.
- All product prices are in USD unless stated otherwise.
- Use the convertCurrencies tool whenever the user asks for a price or amount in a different currency, chaining it after searchProducts when needed.
- Keep answers short, friendly and directly address the user's question.`;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(
    configService: ConfigService<AppConfig, true>,
    private readonly toolExecutorService: ToolExecutorService,
  ) {
    const { apiKey, model } = configService.get('openai', { infer: true });
    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }

  /**
   * Runs the OpenAI function-calling loop for a single user query: repeatedly
   * calls the model, executes any requested tool calls, feeds the results
   * back, until the model returns a final text answer (or the iteration
   * budget runs out, in which case a safe fallback message is returned).
   */
  async getResponse(userQuery: string): Promise<string> {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userQuery },
    ];

    for (let iteration = 0; iteration < MAX_TOOL_CALL_ITERATIONS; iteration++) {
      const completion = await this.callModel(messages);

      const choice = completion.choices[0];
      const message = choice.message;

      if (!message.tool_calls || message.tool_calls.length === 0) {
        return message.content ?? '';
      }

      messages.push(message);

      for (const toolCall of message.tool_calls) {
        const result = await this.toolExecutorService.execute(toolCall);
        messages.push({ role: 'tool', tool_call_id: toolCall.id, content: result });
      }
    }

    this.logger.warn(`Reached max tool call iterations for query: "${userQuery}"`);
    return "I'm sorry, I couldn't complete that request. Could you rephrase it?";
  }

  private async callModel(messages: ChatCompletionMessageParam[]) {
    try {
      return await this.openai.chat.completions.create({
        model: this.model,
        messages,
        tools: CHAT_TOOLS,
        tool_choice: 'auto',
      });
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        this.logger.error(`OpenAI API error (${error.status}): ${error.message}`);
        throw new BadGatewayException(`The chatbot is temporarily unavailable: ${error.message}`);
      }
      throw error;
    }
  }
}
