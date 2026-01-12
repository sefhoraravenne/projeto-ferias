import { Module } from '@nestjs/common';
import { VacationRequestsService } from './vacation-requests.service';
import { VacationRequestsController } from './vacation-requests.controller';

@Module({
  providers: [VacationRequestsService],
  controllers: [VacationRequestsController]
})
export class VacationRequestsModule {}
