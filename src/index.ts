import { Client } from 'discord.js';
import { discordConfig } from './config';
import { setupSendClipButton } from './controllers/ClipController';
import { registerListeners } from "./listeners";

const client = new Client({
  intents: discordConfig.intents,
  partials: discordConfig.partials,
});

client.once('ready', async () => {
  console.log(`✅ Bot logado como ${client.user?.tag}`);
  registerListeners(client);
  await setupSendClipButton(client)
});

client.login(discordConfig.token);
