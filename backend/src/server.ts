import 'dotenv/config';
import { createApp } from './app.js';
import { parseConfig } from './config.js';

const config = parseConfig(process.env);

createApp().listen(config.PORT, () => {
  console.log(`MindLog API listening on http://localhost:${config.PORT}`);
});
