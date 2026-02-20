
import KpiCard from "../layout/cards/KpiCard";


const data =[
       { percentage: 58,
        title: "Total Number Of Main Projects",
        subValue: "10%",
        trendUp: true,
        color: "#3B82F6",         // blue
        sparkData: [12, 18, 15, 22, 28, 30, 26, 34, 40, 38, 42]
      },
      {
        percentage: 64,
        title: "Total Number Of Change Requests",
        subValue: "16%",
        trendUp: true,
        color: "#22C55E",         // green
        sparkData: [20, 22, 26, 23, 28, 35, 40, 38, 45, 44, 48]
      },
      {
        percentage: 60,
        title: "Total Number Of Incidents",
        subValue: "12%",
        trendUp: false,
        color: "#06B6D4",         // cyan
        sparkData: [30, 28, 26, 25, 24, 26, 29, 31, 30, 33, 35]
      }

    
]


function Analyticals (){

    return(
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.map((item,index)=>{
                return(     
                    <KpiCard
                    percentage={item.percentage}
                    title={item.title}
                    subValue={item.subValue}
                    trendUp={item.trendUp}
                    color={item.color}
                    sparkData={item.sparkData}
                    />
                )
            })}
    </div>
    )

}

export default Analyticals;