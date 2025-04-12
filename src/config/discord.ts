// src/config/discord.ts
import { GatewayIntentBits, Partials } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

export const discordConfig = {
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.DISCORD_CLIENT_ID || '',
  guildId: process.env.GUILD_ID || '',
  channels: {
    verification: process.env.VERIFICATION_CHANNEL_ID || '',
    clips: process.env.CLIPS_CHANNEL_ID || '',
    sendClip: process.env.SEND_CLIP_CHANNEL_ID || '',
    featuredClips: process.env.FEATURED_CLIPS_CHANNEL_ID || '',
    training: process.env.TRAINING_CHANNEL_ID || '',
  },
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember,
  ],
};

