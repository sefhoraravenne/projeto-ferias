import { Test, TestingModule } from '@nestjs/testing';
import { SetoresController } from './setores.controller';

describe('SetoresController', () => {
  let controller: SetoresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SetoresController],
    }).compile();

    controller = module.get<SetoresController>(SetoresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
