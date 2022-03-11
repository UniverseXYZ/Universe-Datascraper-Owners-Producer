import { Module } from '@nestjs/common';
import { EthereumModule } from '../ethereum/ethereum.module';
import { NFTTokenOwnersTaskModule } from '../nft-token-owners-task/nft-token-owners-task.module';
import { SqsProducerService } from './sqs-producer.service';

@Module({
  providers: [SqsProducerService],
  exports: [SqsProducerService],
  imports: [NFTTokenOwnersTaskModule, EthereumModule],
})
export class SqsProducerModule {}
