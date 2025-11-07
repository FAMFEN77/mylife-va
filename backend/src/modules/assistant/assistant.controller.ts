import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AssistantService } from './assistant.service';
import { AssistantRequestDto } from './dto/assistant-request.dto';
import { AssistantResponseDto } from './dto/assistant-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('message')
  async handleMessage(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AssistantRequestDto,
  ): Promise<AssistantResponseDto> {
    return this.assistantService.handle(user.sub, dto);
  }
}
