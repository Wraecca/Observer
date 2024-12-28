import * as fs from 'fs';
import * as path from 'path';
import { SnapshotService } from '../services/snapshot.service';

describe('SnapshotService', () => {
  let snapshotService: SnapshotService;
  const testDir = path.join(__dirname, '../__test_snapshots__');

  beforeEach(() => {
    // 使用測試目錄初始化服務
    snapshotService = new SnapshotService(testDir);
  });

  afterEach(() => {
    // 清理測試目錄
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('checkFileExists', () => {
    it('should throw error if filename is empty', async () => {
      await expect(snapshotService.checkFileExists('')).rejects.toThrow('Filename is required');
    });

    it('should return false for non-existent file', async () => {
      const exists = await snapshotService.checkFileExists('non-existent');
      expect(exists).toBe(false);
    });

    it('should return true for existing file', async () => {
      const filename = 'test-file';
      const filePath = snapshotService.getFilePath(filename);
      fs.writeFileSync(filePath, 'test data');

      const exists = await snapshotService.checkFileExists(filename);
      expect(exists).toBe(true);
    });
  });

  describe('saveFile', () => {
    it('should throw error if filename is empty', async () => {
      await expect(snapshotService.saveFile('', 'data')).rejects.toThrow('Filename is required');
    });

    it('should throw error if data is empty', async () => {
      await expect(snapshotService.saveFile('test', '')).rejects.toThrow('Data is required');
    });

    it('should save file successfully', async () => {
      const filename = 'test-file';
      const data = 'test data';

      const filePath = await snapshotService.saveFile(filename, data);
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe(data);
    });

    it('should throw error if file exists and overwrite is false', async () => {
      const filename = 'test-file';
      const data = 'test data';

      await snapshotService.saveFile(filename, data);
      await expect(snapshotService.saveFile(filename, data)).rejects.toThrow('File already exists');
    });

    it('should overwrite existing file if overwrite is true', async () => {
      const filename = 'test-file';
      const originalData = 'original data';
      const newData = 'new data';

      await snapshotService.saveFile(filename, originalData);
      const filePath = await snapshotService.saveFile(filename, newData, true);

      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe(newData);
    });
  });
}); 