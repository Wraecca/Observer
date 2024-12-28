import { DebankConfig } from '../types/debank';
import dotenv from 'dotenv';

dotenv.config();

const walletList = process.env.ETH_WALLET_LIST?.split(',') || [];
const chainIds = process.env.ETH_WALLET_CHAIN_ID_LIST?.split(',') || [];
const apiKey = process.env.DEBANK_API_KEY || '';

if (!apiKey || !walletList.length || !chainIds.length) {
  console.warn('DEBANK_API_KEY, ETH_WALLET_LIST, or ETH_WALLET_CHAIN_ID_LIST is missing. DeBank integration will be skipped.');
}

export const debankConfig: DebankConfig | undefined = apiKey && walletList.length && chainIds.length ? {
  apiKey,
  walletList,
  chainIds
} : undefined; 