import express from 'express';
import { AssetService } from '../services/asset.service';

const router = express.Router();
const assetService = new AssetService();

router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const data = await assetService.getAssetData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching asset data:', error);
    res.status(500).json({ error: 'Failed to fetch asset data' });
  }
});

router.post('/save', async (req: express.Request, res: express.Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const success = await assetService.saveAssetData(data);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to save asset data' });
    }
  } catch (error) {
    console.error('Error saving asset data:', error);
    res.status(500).json({ error: 'Failed to save asset data' });
  }
});

export default router; 