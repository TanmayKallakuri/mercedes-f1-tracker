import { NextResponse } from "next/server";
import { constructorStandings, driverStandings, nextRace } from "../../../agent/lib/f1";

// The same fetchers that back the agent's get_standings and get_next_race tools, exposed so the
// tracker page can refresh its standings tables without a chat turn.
export const revalidate = 600;

export async function GET() {
  try {
    const [c, d, next] = await Promise.all([constructorStandings(), driverStandings(), nextRace()]);
    return NextResponse.json({ season: c.season, round: c.round, constructors: c.constructors, drivers: d.drivers, next, source: "eve agent tools via api.jolpi.ca" },
      { headers: { "cache-control": "public, s-maxage=600, stale-while-revalidate=3600" } });
  } catch (err) {
    return NextResponse.json({ error: String((err as Error).message ?? err) }, { status: 502 });
  }
}
