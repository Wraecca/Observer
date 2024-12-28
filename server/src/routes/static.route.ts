import { Router } from 'express';
import { TradefiService } from '../services/tradefi.service';

const router = Router();
const tradefiService = new TradefiService();

router.get('/', async (req, res) => {
  try {
    const data = await tradefiService.getTradefiData();
    res.json(data);
  } catch (error) {
    console.error('Failed to get tradefi data:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router; 