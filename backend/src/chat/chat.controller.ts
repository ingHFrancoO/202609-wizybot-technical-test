import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service.js';
import { ChatRequestDto } from './dto/chat-request.dto.js';
import { ChatResponseDto } from './dto/chat-response.dto.js';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send a query to the Wizybot chatbot' })
  @ApiBody({ type: ChatRequestDto })
  @ApiResponse({ status: 200, type: ChatResponseDto })
  async chat(@Body() chatRequestDto: ChatRequestDto): Promise<ChatResponseDto> {
    const response = await this.chatService.getResponse(chatRequestDto.query);
    return { response };
  }
}
