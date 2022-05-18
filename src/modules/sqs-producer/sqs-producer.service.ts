import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Producer } from 'sqs-producer';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { Message, SqsProducerHandler } from './sqs-producer.types';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EthereumService } from '../ethereum/ethereum.service';
import { NFTTokenOwnersTaskService } from '../nft-token-owners-task/nft-token-owners-task.service';
import { Utils } from '../../common/utils';

@Injectable()
export class SqsProducerService implements OnModuleInit, SqsProducerHandler {
  public sqsProducer: Producer;
  private readonly logger = new Logger(SqsProducerService.name);
  private readonly messageNum: number;
  private readonly tokenType: string;
  private isCheckTokenOwnersTaskInProcess = false;
  private checkTokenOwnersTaskSkippingCounter = 0;

  constructor(
    private configService: ConfigService,
    private readonly nftTokenOwnersTaskService: NFTTokenOwnersTaskService,
    private readonly ethereumService: EthereumService,
  ) {
    AWS.config.update({
      region: this.configService.get('aws.region') || 'us-east-1',
      accessKeyId: this.configService.get('aws.accessKeyId') || '',
      secretAccessKey: this.configService.get('aws.secretAccessKey') || '',
    });
    this.messageNum = this.configService.get('queue_config.message_num');
    this.tokenType = this.configService.get('queue_config.token_type');
  }

  public onModuleInit() {
    this.sqsProducer = Producer.create({
      queueUrl: this.configService.get('aws.queueUrl'),
      sqs: new AWS.SQS(),
    });
  }

  /**
   * #1. check if there is any tasks not started yet (isProcessing = false).
   * #2. send to queue.
   * #3. remove it from db.
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  public async checkTokenOwnersTask() {
    if (!this.isCheckTokenOwnersTaskInProcess) {
      this.isCheckTokenOwnersTaskInProcess = true;

      try {
        const unprocessedTasks =
          await this.nftTokenOwnersTaskService.findUnprocessed(
            this.messageNum,
            this.tokenType,
          );

        if (!unprocessedTasks || unprocessedTasks.length === 0) {
          return;
        }

        this.logger.log(
          `[CRON Owners Task] Found ${unprocessedTasks.length} unfinished Owners Tasks. Start processing...`,
        );
        const messages = this.composeMessages(unprocessedTasks);

        const queueResults = await this.sendMessage(messages);

        this.logger.log(
          `[CRON Owners Task] Successfully sent ${queueResults.length} messages for collection`,
        );

        for (const task of unprocessedTasks) {
          await this.nftTokenOwnersTaskService.setTaskInProcessing(
            task.contractAddress,
            task.tokenId,
            task.taskId,
          );
        }
      } catch (e) {
        this.logger.error(
          `[CRON Owners Task] Unexpected error during processing: ${e}`,
        );
      }

      this.isCheckTokenOwnersTaskInProcess = false;
      this.checkTokenOwnersTaskSkippingCounter = 0;
    } else {
      if (
        this.checkTokenOwnersTaskSkippingCounter <
        Number(this.configService.get('skippingCounterLimit'))
      ) {
        this.checkTokenOwnersTaskSkippingCounter++;
        this.logger.log(
          `[CRON Owners Task] Task is in process, skipping (${this.checkTokenOwnersTaskSkippingCounter}) ...`,
        );
      } else {
        // when the counter reaches the limit, restart the pod.
        this.logger.log(
          `[CRON Owners Task] Task skipping counter reached its limit. The process is not responsive, restarting...`,
        );
        Utils.shutdown();
      }
    }
  }

  private composeMessages(unprocessed: any[]) {
    return unprocessed.map((x) => {
      this.logger.log(
        `[CRON Owners Task ${x.contractAddress} - ${x.tokenId} ] Find Unfinished Owners Task. Will be sent...`,
      );
      const body = {
        contractAddress: x.contractAddress,
        tokenId: x.tokenId,
        tokenType: x.tokenType,
        taskId: x.taskId,
      };

      const messageId = uuidv4();
      const message = {
        id: messageId,
        body,
        groupId: `${x.contractAddress}-${x.tokenId.substring(0, 35)}`,
        deduplicationId: messageId,
      };
      return message;
    });
  }

  async sendMessage<T = any>(payload: Message<T> | Message<T>[]) {
    const originalMessages = Array.isArray(payload) ? payload : [payload];
    const messages = originalMessages.map((message) => {
      let body = message.body;
      if (typeof body !== 'string') {
        body = JSON.stringify(body) as any;
      }

      return {
        ...message,
        body,
      };
    });

    return await this.sqsProducer.send(messages as Message[]);
  }
}
