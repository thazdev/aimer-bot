import { Client, Interaction, Events } from "discord.js";
import interactionCreateListener from "./InteractionCreateListener";

export function registerListeners(client: Client) {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    await interactionCreateListener.execute(interaction, client);
  });
}
