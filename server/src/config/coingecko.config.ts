import { CoinGeckoConfig } from '../types/coingecko';
import dotenv from 'dotenv';

dotenv.config();

export const coingeckoConfig: CoinGeckoConfig = {
  apiKey: process.env.COINGECKO_API_KEY
}; 