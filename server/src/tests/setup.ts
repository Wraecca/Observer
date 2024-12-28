const dotenv = require('dotenv');
const path = require('path');

// 載入根目錄的 .env 文件
dotenv.config({
  path: path.resolve(__dirname, '../../../.env')
}); 