import { defineTool } from "eve/tools";
import { z } from "zod";
import { constructorStandings, driverStandings } from "../lib/f1";

const TOTAL_ROUNDS_2026 = 23;
// 2026 sprint weekends: China, Miami, Canada, Great Britain, Netherlands, Singapore (rounds 2, 4, 5, 9, 12, 17)
const SPRINT_ROUNDS_2026 = new Set([2, 4, 5, 9, 12, 17]);

export default defineTool({
  description:
    "Compute championship clinch math from live standings: points still available, the lead, whether the leader can clinch at the next round, and what margin is needed. Works for the constructors' title or the drivers' title.",
  inputSchema: z.object({
    championship: z.enum(["constructors", "drivers"]).default("constructors"),
  }),
  async execute({ championship }) {
    const [c, d] = await Promise.all([constructorStandings(), driverStandings()]);
    const round = c.round;
    const rows = championship === "constructors"
      ? c.constructors.map((r) => ({ name: r.team, points: r.points }))
      : d.drivers.map((r) => ({ name: r.driver, points: r.points }));
    const perRoundMax = championship === "constructors" ? 43 : 25;
    const perSprintMax = championship === "constructors" ? 15 : 8;
    let remaining = 0;
    for (let r = round + 1; r <= TOTAL_ROUNDS_2026; r++) remaining += perRoundMax + (SPRINT_ROUNDS_2026.has(r) ? perSprintMax : 0);
    const [leader, second] = rows;
    const lead = leader.points - second.points;
    const roundsLeft = TOTAL_ROUNDS_2026 - round;
    // Clinch at round k when lead after k exceeds the points still available afterwards.
    let earliest: { round: number; marginNeeded: number } | null = null;
    let availAfter = remaining;
    for (let k = round + 1; k <= TOTAL_ROUNDS_2026; k++) {
      const thisRound = perRoundMax + (SPRINT_ROUNDS_2026.has(k) ? perSprintMax : 0);
      availAfter -= thisRound;
      const need = Math.max(0, availAfter + 1 - lead);
      const maxSwing = (k - round) * perRoundMax;
      if (need <= maxSwing) { earliest = { round: k, marginNeeded: need }; break; }
    }
    return {
      championship, afterRound: round, roundsLeft, pointsRemaining: remaining,
      leader: leader.name, leaderPoints: leader.points, chaser: second.name, chaserPoints: second.points, lead,
      alreadyClinched: lead > remaining,
      earliestClinch: earliest,
      stillInContention: rows.filter((r) => r.points + remaining >= leader.points).map((r) => r.name),
    };
  },
});
