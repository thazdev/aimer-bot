import { Interaction, Events, Client, ButtonInteraction, ModalSubmitInteraction, ActionRowBuilder, ButtonBuilder, ComponentType } from "discord.js";
import { handleOpenClipModal, handleClipSubmission } from "../controllers/ClipController";

const voteMap: Record<
    string,
    { up: Set<string>; down: Set<string>; hot: Set<string> }
> = {};

export default {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction, client: Client) {
        if (interaction.isButton()) {
            const buttonInteraction = interaction as ButtonInteraction;
            if (buttonInteraction.customId === "openClipModal") {
                await handleOpenClipModal(buttonInteraction, client);
                return;
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
                            .setEmoji(component.emoji!); // mantém só o emoji original
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
        }
    },
};
