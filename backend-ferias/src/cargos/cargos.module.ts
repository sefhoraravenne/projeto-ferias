import { Module } from '@nestjs/common';
import { CargosService } from './cargos.service';
import { CargosController } from './cargos.controller';

@Module({
  providers: [CargosService],
  controllers: [CargosController]
})
export class CargosModule {}
