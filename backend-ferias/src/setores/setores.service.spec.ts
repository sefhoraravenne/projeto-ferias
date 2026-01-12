import { Test, TestingModule } from '@nestjs/testing';
import { SetoresService } from './setores.service';

describe('SetoresService', () => {
  let service: SetoresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SetoresService],
    }).compile();

    service = module.get<SetoresService>(SetoresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
