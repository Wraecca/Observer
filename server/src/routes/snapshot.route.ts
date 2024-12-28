import { Router } from 'express';
import { SnapshotService } from '../services/snapshot.service';

const router = Router();
const snapshotService = new SnapshotService();

router.get('/list', async (req, res) => {
  try {
    const files = await snapshotService.listSnapshots();
    res.json(files);
  } catch (error) {
    console.error('Failed to list snapshots:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const data = await snapshotService.getLatestSnapshot();
    if (!data) {
      return res.status(404).json({ error: 'No snapshots found' });
    }
    res.json(data);
  } catch (error) {
    console.error('Failed to get latest snapshot:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/check', async (req, res) => {
  try {
    const { filename } = req.query;
    if (typeof filename !== 'string') {
      return res.status(400).json({ error: 'Missing filename' });
    }
    const exists = await snapshotService.checkFileExists(filename);
    res.json({ exists });
  } catch (error) {
    console.error('Failed to check file:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const data = await snapshotService.getSnapshotData(filename);
    if (!data) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }
    res.json(data);
  } catch (error) {
    console.error('Failed to get snapshot:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/save', async (req, res) => {
  try {
    const { filename, data, overwrite } = req.body;
    const filePath = await snapshotService.saveFile(filename, data, overwrite);
    res.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Failed to save snapshot:', error);
    if ((error as Error).message === 'File already exists') {
      res.status(409).json({ error: 'File already exists' });
    } else {
      res.status(400).json({ error: (error as Error).message });
    }
  }
});

export default router; 