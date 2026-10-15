// Shared fetchers for the public Jolpica/Ergast F1 API. Used by the agent's tools and by the
// site's /api/live route, so the dashboard and the agent read the same source.
const BASE = "https://api.jolpi.ca/ergast/f1";
const MERCEDES = "mercedes";

async function getJson(path: string) {
  const res = await fetch(`${BASE}/${path}`, { headers: { accept: "application/json" }, next: { revalidate: 600 } } as RequestInit);
  if (!res.ok) throw new Error(`F1 API ${res.status} for ${path}`);
  return res.json();
}

export interface ConstructorRow { position: number; team: string; id: string; points: number; wins: number; mercedes: boolean }
export interface DriverRow { position: number; driver: string; code: string; team: string; points: number; wins: number; mercedes: boolean }

export async function constructorStandings(season = "current") {
  const data = await getJson(`${season}/constructorstandings/`);
  const list = data.MRData.StandingsTable.StandingsLists[0];
  if (!list) return { season, round: 0, constructors: [] as ConstructorRow[] };
  const constructors: ConstructorRow[] = list.ConstructorStandings.map((s: any): ConstructorRow => ({
      position: Number(s.position), team: s.Constructor.name, id: s.Constructor.constructorId,
      points: Number(s.points), wins: Number(s.wins), mercedes: s.Constructor.constructorId === MERCEDES,
    }));
  return { season: list.season as string, round: Number(list.round), constructors };
}

export async function driverStandings(season = "current") {
  const data = await getJson(`${season}/driverstandings/`);
  const list = data.MRData.StandingsTable.StandingsLists[0];
  if (!list) return { season, round: 0, drivers: [] as DriverRow[] };
  const drivers: DriverRow[] = list.DriverStandings.map((s: any): DriverRow => ({
      position: Number(s.position), driver: `${s.Driver.givenName} ${s.Driver.familyName}`, code: s.Driver.code,
      team: s.Constructors[0]?.name ?? "", points: Number(s.points), wins: Number(s.wins),
      mercedes: s.Constructors.some((c: any) => c.constructorId === MERCEDES),
    }));
  return { season: list.season as string, round: Number(list.round), drivers };
}

export async function mercedesResults(season = "current", limit = 60) {
  const data = await getJson(`${season}/constructors/${MERCEDES}/results/?limit=${limit}`);
  return (data.MRData.RaceTable.Races as any[]).map((race) => ({
    round: Number(race.round), race: race.raceName, date: race.date, circuit: race.Circuit.circuitName,
    results: (race.Results as any[]).map((r) => ({
      driver: r.Driver.familyName, grid: Number(r.grid), finish: r.positionText as string,
      points: Number(r.points), status: r.status as string, fastestLap: r.FastestLap?.rank === "1",
    })),
  }));
}

export async function nextRace() {
  const data = await getJson(`current/next/`);
  const race = data.MRData.RaceTable.Races[0];
  if (!race) return null;
  return {
    season: race.season as string, round: Number(race.round), name: race.raceName as string,
    circuit: race.Circuit.circuitName as string, locality: race.Circuit.Location.locality as string,
    country: race.Circuit.Location.country as string, date: race.date as string, timeUtc: (race.time as string | undefined) ?? null,
    sprintWeekend: Boolean(race.Sprint),
  };
}
