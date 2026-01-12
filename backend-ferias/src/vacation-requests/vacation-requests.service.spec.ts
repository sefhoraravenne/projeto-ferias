import { Test, TestingModule } from '@nestjs/testing';
import { VacationRequestsService } from './vacation-requests.service';

describe('VacationRequestsService', () => {
  let service: VacationRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VacationRequestsService],
    }).compile();

    service = module.get<VacationRequestsService>(VacationRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
