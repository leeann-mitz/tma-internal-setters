import QaInsightsDashboard from "@/components/qa/QaInsightsDashboard";
import { getTeamQaInsightsData } from "@/lib/setter-qa-source";
import { getSetterTrendData } from "@/lib/setter-source";

export default async function QaInsightsPage() {
  const qaData = getTeamQaInsightsData();
  const trendData = await getSetterTrendData();
  return <QaInsightsDashboard data={qaData} reps={trendData.reps} />;
}
