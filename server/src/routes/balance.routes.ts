import { Router } from 'express';
import { ExchangeService } from '../services/exchange.service';
import { OkxService } from '../services/okx.service';
import { BinanceService } from '../services/binance.service';
import { BybitService } from '../services/bybit.service';
import { KrakenService } from '../services/kraken.service';
import { BitfinexService } from '../services/bitfinex.service';
import { okxConfig } from '../config/okx.config';
import { binanceConfig } from '../config/binance.config';
import { bybitConfig } from '../config/bybit.config';
import { krakenConfig } from '../config/kraken.config';
import { bitfinexConfig } from '../config/bitfinex.config';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const exchangeService = new ExchangeService(
      new OkxService(okxConfig),
      new BinanceService(binanceConfig),
      new BybitService(bybitConfig),
      new KrakenService(krakenConfig),
      new BitfinexService(bitfinexConfig)
    );
    const balances = await exchangeService.getAllBalances();
    res.json(balances);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

export default router; 