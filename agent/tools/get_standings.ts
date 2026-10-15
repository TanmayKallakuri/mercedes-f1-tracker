import { defineTool } from "eve/tools";
import { z } from "zod";
import { constructorStandings, driverStandings } from "../lib/f1";

export default defineTool({
  description:
    "Get the current Formula 1 constructors' and drivers' championship standings. Mercedes entries are flagged. Use for any question about points, positions, gaps or wins.",
  inputSchema: z.object({
    season: z.string().default("current").describe("Four-digit year, or 'current' for the season in progress"),
  }),
  async execute({ season }) {
    const [c, d] = await Promise.all([constructorStandings(season), driverStandings(season)]);
    return { season: c.season, round: c.round, constructors: c.constructors, drivers: d.drivers };
  },
});
