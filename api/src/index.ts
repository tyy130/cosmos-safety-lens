/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/
import 'dotenv/config';
import { createApp } from './server.js';

const port = process.env.PORT ?? 3001;
const app = createApp();
app.listen(port, () => console.log(`API running on :${port}`));
