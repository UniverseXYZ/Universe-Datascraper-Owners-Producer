# Universe Datascraper Token Owners Producer 

## Description

Given a NFT token owners task (contract address and toke id), this producer sends it to SQS and then consumer will pick it up. 

## Requirements:

- NodeJS version 14+
- NPM

## Required External Service

- AWS SQS
- Infura
- MongoDB

## Primary Third Party Libraries

- NestJS
- Mongoose (MongoDB)
- bbc/sqs-producer (Only applicable for producers)
- bbc/sqs-consumer (Only applicable for consumers)

## DataFlow

### Input Data

The NFT token owners tasks are generated from Transfer Consumer. 

### Data Analysis and Storage

This producer queries database to get new NTF tokens, which get generated from Transfer consumer.

### Output

It sends the token id and contract address as core part of the message.

## MongoDB Collection Usage

This consumer leverage the following data collection in [schema](https://github.com/plugblockchain/Universe-Datascraper-Schema)
- NFT Token Owners Task
