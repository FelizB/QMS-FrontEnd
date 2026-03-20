import React from "react";
import Analyticals from "../components/layout/analytics/Analyticals";
import TableSection from "../components/layout/analytics/TableSection";
import ActivityFeed from "../components/layout/dashboard/Activityfeed";



function AnalyticsOverview (){
    return(
        <div className="space-y-6">
            <div>
                <Analyticals/>
            </div>

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
    )
}

export default AnalyticsOverview;

