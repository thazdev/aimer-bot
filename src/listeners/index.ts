import { Client, Events, Interaction } from "discord.js";
import interactionCreateListener from "./InteractionCreateListener";
import messageCreateListener from "./MessageCreateListener";

export function registerListeners(client: Client) {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    await interactionCreateListener.execute(interaction, client);
  });

  client.on(Events.MessageCreate, (...args) =>
    messageCreateListener.execute(...args, client)
  );
}
