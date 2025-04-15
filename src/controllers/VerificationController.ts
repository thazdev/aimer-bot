import { SetRequired } from "./../../node_modules/type-fest/source/set-required.d";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  Client,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
} from "discord.js";
import { discordConfig } from "../config";

export async function setupVerificationButton(client: Client) {
  const channelId = discordConfig.channels.verification;
  const channel = client.channels.cache.get(channelId) as TextChannel;

  if (!channel || !channel.isTextBased()) {
    console.error(
      "Canal de verificação não encontrado ou não é devidamente de texto!"
    );
    return;
  }
  const messages = await channel.messages.fetch({ limit: 10 });
  const alreadySent = messages.some((msg) =>
    msg.components[0]?.components.some(
      (component) => component.customId === "openVerificationModal"
    )
  );

  if (alreadySent) {
    return;
  }

  const sendVerificationButton = new ButtonBuilder()
    .setCustomId("openVerificationModal")
    .setLabel("📋 Apresentar-se")
    .setStyle(ButtonStyle.Success);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    sendVerificationButton
  );
  await channel.send({
    content: "Teste, clique pra abrir a modal",
    components: [row],
  });
}

export async function handleOpenVerificationModal(
  interaction: ButtonInteraction
) {
  const modal = new ModalBuilder()
    .setCustomId("submitVerificationModal")
    .setTitle("Apresente-se");

  const agentesInput = new TextInputBuilder()
    .setCustomId("agentes")
    .setLabel("Quais seus agentes favoritos?")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const focusInput = new TextInputBuilder()
    .setCustomId("foco")
    .setLabel("Você tem foco em evoluir?")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const peripheralsInput = new TextInputBuilder()
    .setCustomId("perifericos")
    .setLabel("Quais são seus Periféricos? (opcional)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const vodreviewInput = new TextInputBuilder()
    .setCustomId("vod")
    .setLabel("Quer ser analisado em VOD? (opcional)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
    agentesInput
  );
  const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
    focusInput
  );
  const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(
    peripheralsInput
  );
  const row4 = new ActionRowBuilder<TextInputBuilder>().addComponents(
    vodreviewInput
  );

  modal.addComponents(row1, row2, row3, row4);

  await interaction.showModal(modal);
}

export async function handleSubmitVerificationModal(
  interaction: ModalSubmitInteraction,
  client: Client
) {
  await interaction.reply({
    content: "✅ Informações recebidas!",
    ephemeral: true,
  });

  await sendRoleSelector(interaction);
}

export async function sendRoleSelector(interaction: ModalSubmitInteraction) {
  const roleSelect = new StringSelectMenuBuilder()
    .setCustomId("select_roles")
    .setPlaceholder("Escolha suas duas roles")
    .setMinValues(1)
    .setMaxValues(2)
    .addOptions([
      { label: "Duelista", value: "duelista", emoji: "💥" },
      { label: "Iniciador", value: "iniciador", emoji: "🔦" },
      { label: "Controlador", value: "controlador", emoji: "🌫️" },
      { label: "Sentinela", value: "sentinela", emoji: "🛡️" },
      { label: "Flex", value: "flex", emoji: "🎭" },
    ]);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    roleSelect
  );

  await interaction.followUp({
    content: "Agora escolha suas **duas roles principais** abaixo:",
    components: [row],
    ephemeral: true,
  });
}
