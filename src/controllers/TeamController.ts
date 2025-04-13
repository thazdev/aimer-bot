import { Client, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, ButtonInteraction, ModalSubmitInteraction, EmbedBuilder } from "discord.js";
import { discordConfig } from "../config";
import { teamRequestStore } from "../store/teamRequestStore";

export async function setupFindTeamButton(client: Client) {
    const channelId = discordConfig.channels.findTeam;
    const channel = client.channels.cache.get(channelId) as TextChannel
    if (!channel) {
        console.error("❌ Canal de procura de time não encontrado.")
        return;
    }
    const findTeamButton = new ButtonBuilder()
        .setCustomId("findTeamButton")
        .setLabel("🔍 Procurando Time")
        .setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(findTeamButton)
    await channel.send({
        content: "Clique no botão abaixo para encontrar seu próximo Duo ou Squad!",
        components: [row],
    });
}

export async function handleOpenFindTeamModal(interaction: ButtonInteraction) {
    const modal = new ModalBuilder()
        .setCustomId("submitTeamModal")
        .setTitle("Procurando Time");

    const eloInput = new TextInputBuilder()
        .setCustomId("elo")
        .setLabel("Qual seu elo?")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const tipoInput = new TextInputBuilder()
        .setCustomId("tipo")
        .setLabel("Está procurando duo ou squad?")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const agentesInput = new TextInputBuilder()
        .setCustomId("agentes")
        .setLabel("Quais agentes principais você joga?")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const horarioInput = new TextInputBuilder()
        .setCustomId("horario")
        .setLabel("Qual horário você joga?")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const contatoInput = new TextInputBuilder()
        .setCustomId("contato")
        .setLabel("Contato (Discord, Insta, etc)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(eloInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(tipoInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(agentesInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(horarioInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(contatoInput),
    );
    await interaction.showModal(modal);
}

export async function handleTeamSubmission(interaction: ModalSubmitInteraction, client: Client) {
    const elo = interaction.fields.getTextInputValue("elo");
    const tipo = interaction.fields.getTextInputValue("tipo");
    const agentes = interaction.fields.getTextInputValue("agentes");
    const horario = interaction.fields.getTextInputValue("horario");
    const contato = interaction.fields.getTextInputValue("contato");

    const embed = new EmbedBuilder()
        .setTitle("🔍 Jogador procurando time!")
        .setColor(0x5865f2)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
            { name: "👤 Jogador", value: `<@${interaction.user.id}>`, inline: true },
            { name: "🏅 Elo", value: elo, inline: true },
            { name: "👥 Procura", value: tipo, inline: true },
            { name: "🎯 Agentes", value: agentes, inline: false },
            { name: "⏰ Horário", value: horario, inline: true },
            { name: "📬 Contato", value: contato, inline: true },
        )
        .setTimestamp();

    const teamChannelId = discordConfig.channels.findTeam;
    const teamChannel = client.channels.cache.get(teamChannelId) as TextChannel;
    if (!teamChannel) {
        console.error("❌ Canal de time não encontrado.");
        return;
    }
    const sentMessage = await teamChannel.send({
        embeds: [embed],
    });
    teamRequestStore[interaction.user.id] = sentMessage.id;
    await interaction.reply({
        content: "✅ Seu pedido foi enviado para o canal!",
        ephemeral: true,
    });
}