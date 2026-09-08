import 'dotenv/config';
import { createApp } from './app.js';
import { parseConfig } from './config.js';
import { OpenAISummarizer } from './ai/openaiEntrySummarizer.js';
import OpenAI from 'openai';

const config = parseConfig(process.env);
const summarizer = new OpenAISummarizer(
  new OpenAI({
    apiKey: config.OPENAI_API_KEY,
    timeout: 30_000,
    maxRetries: 2,
  }),
  'gpt-4o-mini',
);

createApp({ summarizer }).listen(config.PORT, () => {
  console.log(`MindLog API listening on http://localhost:${config.PORT}`);
});
