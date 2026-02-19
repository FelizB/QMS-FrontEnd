import ActivityFeed from "./Activityfeed";
import ChartSection from "./ChartSection";
import StatsGrid from "./StatsGrid";
import TableSection from "./TableSection";

function MiniDashboard() {
  return (
    <div className="space-y-6">

        {/* Stats Grid */}
        <StatsGrid />

        {/* Chart Section */}
        <ChartSection />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          <div className="xl:col-span-2">
            <TableSection />
          </div>

          <div>
            {/* Activity Feed */}
            <ActivityFeed/>
          </div>
        </div>
     </div>
  );
}

export default MiniDashboard;