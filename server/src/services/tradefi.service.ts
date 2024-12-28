import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { promisify } from 'util';

interface TradefiData {
  Symbol: string;
  Price: string;
  Exchange: string;
  Type: string;
  Amount: string;
}

export class TradefiService {
  private readonly tradefiFilePath: string;

  constructor() {
    this.tradefiFilePath = path.resolve(process.cwd(), 'storage', 'tradefi.csv');
  }

  async getTradefiData(): Promise<TradefiData[]> {
    if (!fs.existsSync(this.tradefiFilePath)) {
      return [];
    }

    const fileContent = await promisify(fs.readFile)(this.tradefiFilePath, 'utf-8');
    return new Promise<TradefiData[]>((resolve, reject) => {
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (error: Error | undefined, data: TradefiData[]) => {
        if (error) reject(error);
        else resolve(data);
      });
    });
  }
} 