import { Interaction, Events, Client, ButtonInteraction, ModalSubmitInteraction, ActionRowBuilder, ButtonBuilder, ComponentType } from "discord.js";
import { handleOpenClipModal, handleClipSubmission } from "../controllers/ClipController";
import { voteMap } from "../store/voteMap";
import { handleOpenVerificationModal, handleSubmitVerificationModal } from "../controllers/VerificationController";
import { handleOpenFindTeamModal, handleTeamSubmission } from "../controllers/TeamController";

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction, client: Client) {
    console.log("📨 Alguma interação foi detectada.");
    if (interaction.isButton()) {
      const buttonInteraction = interaction as ButtonInteraction;
      if (buttonInteraction.customId === "openClipModal") {
        await handleOpenClipModal(buttonInteraction, client);
        return;
      }
      if (buttonInteraction.customId === "openVerificationModal") {
        await handleOpenVerificationModal(buttonInteraction);
        return;
      }
      if (buttonInteraction.customId === "findTeamButton") {
        await handleOpenFindTeamModal(buttonInteraction);
        return;
      }
      if (interaction.customId.startsWith("vote_")) {
        const messageId = interaction.message.id;
        const userId = interaction.user.id;
        const voteType = interaction.customId.split("_")[1] as
          | "up"
          | "down"
          | "hot";
        if (!voteMap[messageId]) {
          voteMap[messageId] = {
            up: new Set(),
            down: new Set(),
            hot: new Set(),
          };
        }
        const alreadyVoted = Object.values(voteMap[messageId]).some((set) =>
          set.has(userId)
        );
        if (alreadyVoted) {
          await interaction.reply({
            content: "❌ Você já votou neste clipe.",
            ephemeral: true,
          });
          return;
        }
        voteMap[messageId][voteType].add(userId);
        const updatedButtons = interaction.message.components[0].components.map(
          (component) => {
            if (component.type === ComponentType.Button) {
              const id = component.customId;
              const type = id?.split("_")[1] as "up" | "down" | "hot";
              const count = voteMap[messageId][type].size;

              return new ButtonBuilder(component.data)
                .setLabel(`${count}`)
                .setEmoji(component.emoji!);
            }
            return component;
          }
        );
        await interaction.update({
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              updatedButtons as ButtonBuilder[]
            ),
          ],
        });

        console.log(`🗳️ ${userId} votou: ${voteType} em ${messageId}`);
      }
    }
    if (interaction.isModalSubmit()) {
      const modalInteraction = interaction as ModalSubmitInteraction;
      if (modalInteraction.customId === "submitClipModal") {
        await handleClipSubmission(modalInteraction, client);
      }
      if (modalInteraction.customId === "submitVerificationModal") {
        await handleSubmitVerificationModal(modalInteraction, client);
      }
      if (modalInteraction.customId === "submitTeamModal") {
        await handleTeamSubmission(modalInteraction, client);
        return;
      }      
    }
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "select_roles") {
        const guild = interaction.guild;
        const userId = interaction.user.id;

        const member = await guild?.members.fetch(userId);
        if (!member) return;

        const roleMap: Record<string, string> = {
          duelista: "1360349833151381554",
          iniciador: "1360349873349591140",
          controlador: "1360349722858229901",
          sentinela: "1360349855733645423",
          flex: "1360349907264733356",
        };

        for (const role of interaction.values) {
          const roleId = roleMap[role];
          if (roleId) {
            await member.roles.add(roleId).catch(console.error);
          }
        }
        await interaction.reply({
          content: "✅ Cargos atribuídos com sucesso!",
          ephemeral: true,
        });
      }
    }
  },
};
