import MonthlyTrendsChart from './MonthlyTrend';
import SalesChart from './ProjectStatusChart';


function ChartSection() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
            <MonthlyTrendsChart />
        </div>
        <div className='space-y-6'>
            <SalesChart/>
        </div>
       

    </div>
  );
}

export default ChartSection;