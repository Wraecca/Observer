import * as dotenv from 'dotenv';
dotenv.config();

export const krakenConfig = {
  apiKey: process.env.KRAKEN_API_KEY || '',
  apiSecret: process.env.KRAKEN_API_SECRET || '',
}; 