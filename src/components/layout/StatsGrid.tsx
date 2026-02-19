import { ArrowRight, DollarSign, Eye, ShoppingCart, Users } from "lucide-react";

const stats=[
    {
        title:"Total Sales",
        value:"$24.6k",
        change:"+12.5%",
        trend:"up",
        icon:DollarSign,
        color:"from-emerald-500 to-teal-600",
        bgColor:"bg-emerald-50 dark:bg-emerald-900/20",
        textColor:"text-emerald-600 dark:text-emerald-400"

    },
        {
        title:"Active Users",
        value:"124",
        change:"+8.5%",
        trend:"up",
        icon:Users,
        color:"from-blue-500 to-indigo-600",
        bgColor:"bg-blue-50 dark:bg-blue-900/20",
        textColor:"text-blue-600 dark:text-blue-400"

    },
        {
        title:"Total Orders",
        value:"4,200",
        change:"+15.5%",
        trend:"up",
        icon:ShoppingCart,
        color:"from-purple-500 to-pink-600",
        bgColor:"bg-purple-50 dark:bg-purple-900/20",
        textColor:"text-purple-600 dark:text-purple-400"

    },
            {
        title:"Page Views",
        value:"45,890",
        change:"-5.5%",
        trend:"down",
        icon:Eye,
        color:"from-orange-500 to-red-600",
        bgColor:"bg-orange-50 dark:bg-orange-900/20",
        textColor:"text-orange-600 dark:text-orange-400"

    }
]


function StatsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
             <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-slate-900/20 transition-all duration-300 group" 
             key={index}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                        {stat.title}
                        </p>
                        <p className="text-3xl font-bold text-slate-800 dark:text-white mb-4">
                        {stat.value}
                        </p>
                        <div className="flex items-center space-x-2">
                            {stat.trend === "up" ? (
                                <ArrowRight className={`w-4 h-4 text-green-500 transform -rotate-45`}/>
                            ) : (
                                <ArrowRight className={`w-4 h-4 text-red-500 transform rotate-45`}/>
                            )}
                            <span className={`text-sm font-semibold ${ 
                                stat.trend === "up" ? "text-green-500" : "text-red-500"
                            }`}>
                                {stat.change}
                            </span>
                            <span className="text-sm text-blue-500 dark:text-blue-400">
                                vs Last month
                            </span>
                        </div>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-all duration-300`}>
                    {<stat.icon className={`w-6 h-6 ${stat.textColor}`}/>}
                    </div>
                </div>
                {/* Progressbar */}
                <div className="mt-4 h2 bg-slate-100 dark:bg-slate-800 rouded-full overflow-hidden">
                    <div 
                    className={`w-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-100`} 
                    style={{width: stat.trend === "up"? "75%":"45%"}}>

                    </div>
                    </div> 
                {/* Progressbar */}
                <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-800 rouded-full overflow-hidden">
                    <div 
                    className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-100`} 
                    style={{width: stat.trend === "up" ? "75%" : "45%"}}>
                    </div>
                </div> 
            </div>
        ))}

    </div>
  
        );
    }

export default StatsGrid;