export default () => ({
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  port: process.env.PORT,
  app_env: process.env.APP_ENV,
  ethereum_network: process.env.ETHEREUM_NETWORK,
  session_secret: process.env.SESSION_SECRET,
  skippingCounterLimit: process.env.SKIPPING_COUNTER_LIMIT,
  infura: {
    project_id: process.env.INFURA_PROJECT_ID,
    project_secret: process.env.INFURA_PROJECT_SECRET,
  },
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    queueUrl: process.env.AWS_QUEUE_URL,
  },
  etherscan_api_key: process.env.ETHERSCAN_API_KEY,
  queue_config: {
    block_interval: process.env.BLOCKS_INTERVAL,
    message_num: process.env.MESSAGES_PER_PROCESS,
    end_block: process.env.END_BLOCK,
    token_type: process.env.TOKEN_TYPE,
  },
});
