import Dashboard from "@/components/Dashboard";
import { getSetterTrendData, getLeaderboardData } from "@/lib/setter-source";

export default async function Home() {
  const data = await getSetterTrendData();
  const leaderboard = await getLeaderboardData();
  return <Dashboard data={data} leaderboard={leaderboard} />;
}
