import { ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel, Client, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonInteraction, ModalSubmitInteraction, Message, Collection } from "discord.js";
import { discordConfig } from "../config";
import { clipStore } from "../store/clipStore";

export async function setupSendClipButton(client: Client) {
    const channelId = discordConfig.channels.sendClip;
    const channel = client.channels.cache.get(channelId) as TextChannel;
    if (!channel) {
        console.error("Canal de envio de clipes não encontrado.");
        return;
    }
    const sendClipButton = new ButtonBuilder()
        .setCustomId("openClipModal")
        .setLabel("📤 Enviar clipe")
        .setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(sendClipButton);
    await channel.send({
        content: "Clique no botão abaixo para enviar seu clipe!",
        components: [row],
    });
}

export async function handleOpenClipModal(interaction: ButtonInteraction, client: Client) {
    const modal = new ModalBuilder()
        .setCustomId("submitClipModal")
        .setTitle("Enviar clipe");

    const agenteInput = new TextInputBuilder()
        .setCustomId("agente")
        .setLabel("Agente usado")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const sensiInput = new TextInputBuilder()
        .setCustomId("sensi")
        .setLabel("Sensibilidade")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const mouseInput = new TextInputBuilder()
        .setCustomId("mouse")
        .setLabel("Mouse usado")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const mapaInput = new TextInputBuilder()
        .setCustomId("mapa")
        .setLabel("Mapa")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(agenteInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(sensiInput);
    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(mouseInput);
    const row4 = new ActionRowBuilder<TextInputBuilder>().addComponents(mapaInput);

    modal.addComponents(row1, row2, row3, row4);

    await interaction.showModal(modal);
}

export async function handleClipSubmission(interaction: ModalSubmitInteraction, client: Client) {
    const agente = interaction.fields.getTextInputValue("agente");
    const sensi = interaction.fields.getTextInputValue("sensi");
    const mouse = interaction.fields.getTextInputValue("mouse");
    const mapa = interaction.fields.getTextInputValue("mapa");
    await interaction.reply({
        content: "✅ Informações recebidas! Agora envie o clipe (vídeo ou link) aqui abaixo.",
        ephemeral: true,
    });
    const filter = (msg: Message) => msg.author.id === interaction.user.id;
    const channel = interaction.channel as TextChannel;
    const collector = channel.createMessageCollector({
        filter,
        time: 60000,
        max: 1,
    })
    collector.on("collect", async (msg: Message) => {
        const clipChannelId = discordConfig.channels.clips;
        const clipChannel = client.channels.cache.get(clipChannelId) as TextChannel;
        if (!clipChannel) {
            console.error("Canal de clipes não encontrado.");
            return;
        }
        const content = `🎬 Novo clipe enviado por <@${interaction.user.id}>!`;
        const thumbnailUrl = extractThumbnailFromLink(msg.content);
        const voteButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`vote_up_${interaction.id}`)
                .setEmoji("👍")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`vote_down_${interaction.id}`)
                .setEmoji("👎")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`vote_hot_${interaction.id}`)
                .setEmoji("🔥")
                .setStyle(ButtonStyle.Primary)
        );
        const sentMessage = await clipChannel.send({
            content,
            embeds: [
              {
                title: "Informações do Clipe",
                color: getAgentColor(agente),
                author: {
                  name: interaction.user.username,
                  icon_url: interaction.user.displayAvatarURL(),
                },
                fields: [
                  { name: "Agente", value: agente, inline: true },
                  { name: "Sensibilidade", value: sensi, inline: true },
                  { name: "Mouse", value: mouse, inline: true },
                  { name: "Mapa", value: mapa, inline: true },
                ],
                ...(msg.content.includes("http") && {
                  description: `[🔗 Ver clipe](${msg.content})`,
                }),
                ...(thumbnailUrl && {
                  thumbnail: { url: thumbnailUrl },
                }),
                timestamp: new Date().toISOString(),
              },
            ],
            files: msg.attachments.size > 0 ? [...msg.attachments.values()] : [],
            components: [voteButtons],
          });
          clipStore[sentMessage.id] = {
            userId: interaction.user.id,
          };
        await msg.delete().catch(console.error);
    });
    collector.on("end", (collected) => {
        if (collected.size === 0) {
            interaction.followUp({
                content: "⏰ Tempo esgotado. Você não enviou o clipe.",
                ephemeral: true,
            });
        }
    });
}

function getAgentColor(agente: string): number {
    const colors: Record<string, number> = {
        jett: 0x00bfff,
        phoenix: 0xff8c00,
        omen: 0x551a8b,
        viper: 0x2e8b57,
        fade: 0x4b0082,
        raze: 0xff4500,
        killjoy: 0xffd700,
        chamber: 0xf5f5f5,
        neon: 0x00ffff,
        cypher: 0x808080,
    };

    const key = agente.toLowerCase().trim();
    return colors[key] ?? 0x2b2d31;
}

function extractThumbnailFromLink(link: string): string | null {
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = link.match(youtubeRegex);
    if (match && match[1]) {
        return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
    return null;
}

