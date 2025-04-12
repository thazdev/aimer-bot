import { Client, Events, Message, TextChannel } from "discord.js";
import { voteMap } from "../store/voteMap";
import { discordConfig } from "../config";
import { clipStore } from "../store/clipStore";

export default {
  name: Events.MessageCreate,
  async execute(message: Message, client: Client) {
    if (message.author.bot) return;
    if (message.content === "!destaques") {
      const destaqueChannel = client.channels.cache.get(discordConfig.channels.featuredClips) as TextChannel;
      if (!destaqueChannel) {
        console.error("Canal de destaques não encontrado.");
        return;
      }
      const entries = Object.entries(voteMap);
      const top = entries
        .filter(([_, votos]) => votos.hot.size > 0)
        .sort((a, b) => b[1].hot.size - a[1].hot.size)
        .slice(0, 3);
      if (top.length === 0) {
        await message.reply("Nenhum clipe teve votos suficientes para destaque.");
        return;
      }
      const [messageId, votos] = top[0]; 
      const clipsChannelId = discordConfig.channels.clips;
      const clipsChannel = client.channels.cache.get(clipsChannelId) as TextChannel;
      try {
        const originalMessage = await clipsChannel.messages.fetch(messageId);
        const userId = clipStore[messageId]?.userId;

        await destaqueChannel.send({
          content: `🌟 **Clipe mais votado da semana!** (${votos.hot.size} 🔥)\nAutor: <@${userId ?? "Desconhecido"}>`,
          embeds: originalMessage.embeds,
          files: [...originalMessage.attachments.values()],
        });
      } catch (err) {
        console.error(`Erro ao reenviar destaque ${messageId}:`, err);
      }
      await message.reply("✅ Painel de destaques enviado!");
    }
  },
};
