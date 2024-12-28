import * as dotenv from 'dotenv';

dotenv.config();

export const bitfinexConfig = {
  apiKey: process.env.BITFINEX_API_KEY || '',
  apiSecret: process.env.BITFINEX_API_SECRET || '',
}; 