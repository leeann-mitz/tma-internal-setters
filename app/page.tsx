import Dashboard from "@/components/Dashboard";
import { getSetterTrendData, getLeaderboardData } from "@/lib/setter-source";
import { getRepQaInsightsData } from "@/lib/setter-qa-source";

export default async function Home() {
  const data = await getSetterTrendData();
  const leaderboard = await getLeaderboardData();
  const repQaInsights = getRepQaInsightsData();
  return <Dashboard data={data} leaderboard={leaderboard} repQaInsights={repQaInsights} />;
}
