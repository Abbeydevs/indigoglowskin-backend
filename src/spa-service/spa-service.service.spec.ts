import { Test, TestingModule } from '@nestjs/testing';
import { SpaServiceService } from './spa-service.service';

describe('SpaServiceService', () => {
  let service: SpaServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpaServiceService],
    }).compile();

    service = module.get<SpaServiceService>(SpaServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
