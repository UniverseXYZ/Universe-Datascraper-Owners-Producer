import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  NFTTokenOwnersTask,
  NFTTokenOwnersTaskDocument,
} from './schemas/nft-token-owners-task.schema';

@Injectable()
export class NFTTokenOwnersTaskService {
  private readonly logger = new Logger(NFTTokenOwnersTaskService.name);
  constructor(
    @InjectModel(NFTTokenOwnersTask.name)
    private readonly nftTokenOwnersTaskModel: Model<NFTTokenOwnersTaskDocument>,
  ) {}

  public async findUnprocessed(amount: number, tokenType: string) {
    const query: any = {}
    
    query['isProcessing'] =  { $in: [null, false] };
    if (tokenType !== 'both') {
        query['tokenType'] = tokenType; 
    }
    
    return await this.nftTokenOwnersTaskModel
      .find(
        query,
        {},
        { sort: { priority: -1, createdAt: -1 } },
      )
      .limit(amount || 1);
  }

  async setTaskInProcessing(
    contractAddress: string,
    tokenId: string,
    taskId: string,
  ) {
    this.logger.log(
      `Set task contract: ${contractAddress} - tokenId: ${tokenId} - taskId: ${taskId} in processing`,
    );
    await this.nftTokenOwnersTaskModel.findOneAndUpdate(
      { contractAddress, tokenId, taskId },
      { isProcessing: true, sentAt: new Date() },
    );
  }
}
