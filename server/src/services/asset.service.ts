import fs from 'fs';
import path from 'path';

interface AssetData {
  Symbol: string;
  Category: string;
}

export class AssetService {
  private readonly filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), 'storage', 'asset.csv');
  }

  async getAssetData(): Promise<AssetData[]> {
    try {
      if (!fs.existsSync(this.filePath)) {
        return [];
      }

      const fileContent = fs.readFileSync(this.filePath, 'utf-8');
      const lines = fileContent.split('\n');
      
      // Skip empty file
      if (lines.length === 0) {
        return [];
      }

      // Get headers
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Parse records
      const records: AssetData[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim());
        records.push({
          Symbol: values[0] || '',
          Category: values[1] || ''
        });
      }

      return records;
    } catch (error) {
      console.error('Error reading asset data:', error);
      return [];
    }
  }

  async saveAssetData(data: AssetData[]): Promise<boolean> {
    try {
      // Create CSV content
      const headers = ['Symbol', 'Category'];
      const rows = data.map(item => [item.Symbol, item.Category]);
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Ensure the storage directory exists
      const storageDir = path.dirname(this.filePath);
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      fs.writeFileSync(this.filePath, csvContent, 'utf-8');
      return true;
    } catch (error) {
      console.error('Error saving asset data:', error);
      return false;
    }
  }
} 