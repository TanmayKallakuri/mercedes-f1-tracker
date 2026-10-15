import { defineTool } from "eve/tools";
import { z } from "zod";
import { nextRace } from "../lib/f1";

export default defineTool({
  description: "Get the next scheduled Grand Prix: name, round, circuit, date and UTC start time, and whether it is a sprint weekend.",
  inputSchema: z.object({}),
  async execute() {
    const race = await nextRace();
    return race ?? { message: "No upcoming race found; the season may be over." };
  },
});
