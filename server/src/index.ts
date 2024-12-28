import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import balanceRoutes from './routes/balance.routes';
import snapshotRoutes from './routes/snapshot.route';
import tradefiRoutes from './routes/tradefi.route';
import assetRoutes from './routes/asset.route';

// Load environment variables early
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/balance', balanceRoutes);
app.use('/api/snapshot', snapshotRoutes);
app.use('/api/tradefi', tradefiRoutes);
app.use('/api/asset', assetRoutes);

// Basic health check route
app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 