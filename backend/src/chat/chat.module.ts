import { Module } from '@nestjs/common';
import { CurrencyModule } from '../currency/currency.module.js';
import { ProductsModule } from '../products/products.module.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { ToolExecutorService } from './tools/tool-executor.service.js';

@Module({
  imports: [ProductsModule, CurrencyModule],
  controllers: [ChatController],
  providers: [ChatService, ToolExecutorService],
})
export class ChatModule {}
