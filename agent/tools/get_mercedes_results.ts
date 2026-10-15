import { defineTool } from "eve/tools";
import { z } from "zod";
import { mercedesResults } from "../lib/f1";

export default defineTool({
  description:
    "Get race-by-race results for both Mercedes drivers in a season: grid, finishing position, points, status and fastest lap. Use for questions about a specific Grand Prix, a circuit, or Antonelli versus Russell.",
  inputSchema: z.object({
    season: z.string().default("current"),
    round: z.number().int().min(1).max(30).optional().describe("Limit to one round number"),
  }),
  async execute({ season, round }) {
    const races = await mercedesResults(season);
    return round ? races.filter((r) => r.round === round) : races;
  },
});
