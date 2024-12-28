import * as dotenv from 'dotenv';

dotenv.config();

export const okxConfig = {
  apiKey: process.env.OKX_API_KEY || '',
  apiSecret: process.env.OKX_API_SECRET || '',
  passphrase: process.env.OKX_PASSPHRASE || '',
  baseUrl: process.env.OKX_API_URL || 'https://www.okx.com'
}; 