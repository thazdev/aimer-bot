import { Interaction, Events, Client, ButtonInteraction, ModalSubmitInteraction, ActionRowBuilder, ButtonBuilder, ComponentType, TextChannel } from "discord.js";
import { handleOpenClipModal, handleClipSubmission } from "../controllers/ClipController";
import { voteMap } from "../store/voteMap";
import { handleOpenFindTeamModal, handleTeamSubmission } from "../controllers/TeamController";
import { discordConfig } from "../config";
import { teamRequestStore } from "../store/teamRequestStore";

export default {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction, client: Client) {
        console.log("Interação recebida:", interaction.type);
        if (interaction.isButton()) {
            const buttonInteraction = interaction as ButtonInteraction;
            if (buttonInteraction.customId === "openClipModal") {
                await handleOpenClipModal(buttonInteraction, client);
                return;
            }
            if (interaction.customId === "findTeamButton") {
                await handleOpenFindTeamModal(interaction);
            }
            if (interaction.customId.startsWith("vote_")) {
                const messageId = interaction.message.id;
                const userId = interaction.user.id;
                const voteType = interaction.customId.split("_")[1] as "up" | "down" | "hot";
                if (!voteMap[messageId]) {
                    voteMap[messageId] = {
                        up: new Set(),
                        down: new Set(),
                        hot: new Set(),
                    };
                }
                const alreadyVoted = Object.values(voteMap[messageId]).some((set) => set.has(userId));
                if (alreadyVoted) {
                    await interaction.reply({
                        content: "❌ Você já votou neste clipe.",
                        ephemeral: true,
                    });
                    return;
                }
                voteMap[messageId][voteType].add(userId);
                const updatedButtons = interaction.message.components[0].components.map((component) => {
                    if (component.type === ComponentType.Button) {
                        const id = component.customId;
                        const type = id?.split("_")[1] as "up" | "down" | "hot";
                        const count = voteMap[messageId][type].size;

                        return new ButtonBuilder(component.data)
                            .setLabel(`${count}`)
                            .setEmoji(component.emoji!);
                    }
                    return component;
                });
                await interaction.update({
                    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(updatedButtons as ButtonBuilder[])],
                });

                console.log(`🗳️ ${userId} votou: ${voteType} em ${messageId}`);
            }
        }
        if (interaction.isModalSubmit()) {
            const modalInteraction = interaction as ModalSubmitInteraction;
            if (modalInteraction.customId === "submitClipModal") {
                await handleClipSubmission(modalInteraction, client);
            }
            if (modalInteraction.customId === "submitTeamModal") {
                await handleTeamSubmission(modalInteraction, client);
            }
        }
        if (interaction.isChatInputCommand() && interaction.commandName === "excluir") {
            console.log("Comando /excluir ativado");
            const teamChannelId = discordConfig.channels.findTeam;
            const teamChannel = client.channels.cache.get(teamChannelId) as TextChannel;
            if (!teamChannel) {
                await interaction.reply({
                    content: "❌ Canal de time não encontrado.",
                    ephemeral: true,
                });
                return;
            }
            const messageId = teamRequestStore[interaction.user.id];
            if (!messageId) {
                await interaction.reply({
                    content: "❌ Você não tem um pedido ativo para remover.",
                    ephemeral: true,
                });
                return;
            }
            try {
                const message = await teamChannel.messages.fetch(messageId);
                await message.delete();
                delete teamRequestStore[interaction.user.id];
        
                await interaction.reply({
                    content: "✅ Sua solicitação foi excluída com sucesso.",
                    ephemeral: true,
                });
            } catch (err) {
                console.error("Erro ao deletar mensagem:", err);
                await interaction.reply({
                    content: "⚠️ Não consegui encontrar ou excluir sua solicitação.",
                    ephemeral: true,
                });
            }
        }        
    },
};
