import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export const bybitConfig = {
  apiKey: process.env.BYBIT_API_KEY || '',
  apiSecret: process.env.BYBIT_API_SECRET || '',
}; 