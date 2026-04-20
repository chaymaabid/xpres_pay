import { Test, TestingModule } from '@nestjs/testing';
import { TransactionLedgerService } from './transaction-ledger.service';

describe('TransactionLedgerService', () => {
  let service: TransactionLedgerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionLedgerService],
    }).compile();

    service = module.get<TransactionLedgerService>(TransactionLedgerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
