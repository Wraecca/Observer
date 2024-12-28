import * as dotenv from 'dotenv';

dotenv.config();

export const binanceConfig = {
  apiKey: process.env.BINANCE_API_KEY || '',
  apiSecret: process.env.BINANCE_API_SECRET || '',
  baseUrl: process.env.BINANCE_API_URL || 'https://api.binance.com'
}; 