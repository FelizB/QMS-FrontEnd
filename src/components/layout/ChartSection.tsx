import RevenueChart from '../layout/RevnueChart';
import SalesChart from './SalesChart';

function ChartSection() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
            <RevenueChart />
        </div>
        <div className='space-y-6'>
            <SalesChart/>
        </div>
       

    </div>
  );
}

export default ChartSection;