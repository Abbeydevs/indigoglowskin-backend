import { Test, TestingModule } from '@nestjs/testing';
import { SpaServiceController } from './spa-service.controller';

describe('SpaServiceController', () => {
  let controller: SpaServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpaServiceController],
    }).compile();

    controller = module.get<SpaServiceController>(SpaServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
