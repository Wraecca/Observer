import * as fs from 'fs';
import * as path from 'path';

interface CsvData {
  Symbol: string;
  Price: string;
  Exchange: string;
  Type: string;
  Amount: string;
}

export class SnapshotService {
  private snapshotDir: string;

  constructor(baseDir: string = path.join(__dirname, '../../../snapshots')) {
    this.snapshotDir = baseDir;
    this.ensureSnapshotDirExists();
  }

  private ensureSnapshotDirExists(): void {
    if (!fs.existsSync(this.snapshotDir)) {
      fs.mkdirSync(this.snapshotDir, { recursive: true });
    }
  }

  private isValidDateFormat(filename: string): boolean {
    // 檢查是否符合 yyyy-mm-dd.csv 格式
    const pattern = /^\d{4}-\d{2}-\d{2}\.csv$/;
    return pattern.test(filename);
  }

  private parseCsvContent(content: string): CsvData[] {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        return headers.reduce((obj: any, header, index) => {
          obj[header] = values[index];
          return obj;
        }, {});
      });
  }

  public getFilePath(filename: string): string {
    return path.join(this.snapshotDir, `${filename}.csv`);
  }

  public async listSnapshots(): Promise<string[]> {
    const files = fs.readdirSync(this.snapshotDir);
    return files
      .filter(file => this.isValidDateFormat(file))
      .map(file => file.replace('.csv', ''))
      .sort((a, b) => b.localeCompare(a)); // 按日期降序排序
  }

  public async getLatestSnapshot(): Promise<CsvData[] | null> {
    const files = await this.listSnapshots();
    if (files.length === 0) return null;
    
    const latestFile = files[0];
    return this.getSnapshotData(latestFile);
  }

  public async getSnapshotData(filename: string): Promise<CsvData[] | null> {
    const filePath = this.getFilePath(filename);
    if (!fs.existsSync(filePath)) return null;

    const content = fs.readFileSync(filePath, 'utf-8');
    return this.parseCsvContent(content);
  }

  public async checkFileExists(filename: string): Promise<boolean> {
    if (!filename) {
      throw new Error('Filename is required');
    }
    return fs.existsSync(this.getFilePath(filename));
  }

  public async saveFile(filename: string, data: string, overwrite: boolean = false): Promise<string> {
    if (!filename) {
      throw new Error('Filename is required');
    }
    if (!data) {
      throw new Error('Data is required');
    }

    const filePath = this.getFilePath(filename);
    
    if (fs.existsSync(filePath) && !overwrite) {
      throw new Error('File already exists');
    }

    fs.writeFileSync(filePath, data);
    return filePath;
  }
} 