import { CoinMarketCapConfig } from '../types/coinmarketcap';
import * as dotenv from 'dotenv';

dotenv.config();

export const coinmarketcapConfig: CoinMarketCapConfig = {
  apiKey: process.env.COINMARKETCAP_API_KEY || ''
}; 