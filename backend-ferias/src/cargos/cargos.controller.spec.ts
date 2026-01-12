import { Test, TestingModule } from '@nestjs/testing';
import { CargosController } from './cargos.controller';

describe('CargosController', () => {
  let controller: CargosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CargosController],
    }).compile();

    controller = module.get<CargosController>(CargosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
