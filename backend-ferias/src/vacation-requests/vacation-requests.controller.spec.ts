import { Test, TestingModule } from '@nestjs/testing';
import { VacationRequestsController } from './vacation-requests.controller';

describe('VacationRequestsController', () => {
  let controller: VacationRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VacationRequestsController],
    }).compile();

    controller = module.get<VacationRequestsController>(VacationRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
