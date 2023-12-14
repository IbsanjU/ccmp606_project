
# B2B Retail Management Solution with Smart Contract Integration

## Submitted by:
- [Bharath Kumar Revana](https://github.com/IbsanjU)
- [Divya NavaneethaKannan](https://github.com/divyakn195)

## Instructor:
- [Yongchang He](https://github.com/hyc0812)

## Overview
This project is a B2B Retail Management Solution with Smart Contract Integration. It aims to streamline the retail management process using blockchain technology through smart contract integration.

## Instructions

### Installation
1. Install Python requirements:
   ```bash
   pip install -r requirements.txt
   ```

2. Install npm packages in the root directory:
   ```bash
   npm i
   ```

3. Update the .env file with your API keys and Metamask information:
   ```env
   ALCHEMY_API_KEY=<YOUR_ALCHEMY_API_KEY>
   COINMARKETCAP_API_KEY=<YOUR_COINMARKETCAP_API_KEY>
   METAMASK_ACCOUNT=<YOUR_METAMASK_ACCOUNT>
   METAMASK_PRIVATE_KEY=<YOUR_METAMASK_PRIVATE_KEY>
   DEPLOY_ENV_VAR=FALSE
   ```

### Smart Contract Deployment
- For a new contract deployment, set `DEPLOY_ENV_VAR=TRUE` in the .env file.
   ```env
   DEPLOY_ENV_VAR=TRUE
   ```
   This will generate output files with the ABI for the contract and the contract address.

- Otherwise, if connecting to an existing contract, set `DEPLOY_ENV_VAR=FALSE` in the .env file.
   ```env
   DEPLOY_ENV_VAR=FALSE
   ```
   It will connect to the existing contract from the output folder.

4. To use the ABI in your frontend, run:
   ```bash
   python3 connect_existing_oracle.py
   ```

5. Run the frontend application:
   ```bash
   cd frontend-react
   npm i
   npm start
   ```
