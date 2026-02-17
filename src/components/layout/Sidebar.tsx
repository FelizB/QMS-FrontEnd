import React from 'react'
import { BarChart3, LayoutDashboard, Zap,Users,ShoppingBag, Package, MessageSquare, Calendar, Settings, FileText, ChevronDown } from 'lucide-react'
import Dashboard from '../../pages/Dashboard'


const menuItems = [
  { id: 'dashboard', 
    icon: LayoutDashboard, 
    label:"Dashboard", 
    active:true,
    badge:"New" 
  },
  { id: 'analytics', 
    icon: BarChart3, 
    label: 'Analytics', 
    submenu: [
      { id:"overview", label:"Overview" },
      { id:"reports", label:"Reports" },
      { id:"insights", label:"Insights" }
    ]
  },
  { id: 'users', 
    icon: Users,
    label: 'Users',
    count:"2.4k",
    submenu: [
      { id:"all-users", label:"All Users" },
      { id:"roles", label:"Roles & Permissions" },
      { id:"Activity", label:"Useer Activity" }
    ]
  },
  {
    id: 'ecommerce',
    icon: ShoppingBag,
    label: 'E-commerce',
      submenu: [
        { id:"products", label:"Products" },
        { id:"orders", label:"Orders" },
        { id:"customers", label:"Customers" }
      ]

  },
  {
    id: 'inventory',
    icon: Package,
    label: 'Inventory',
    count:"847",
  },
  {id:"transactions", icon: MessageSquare, label:"Transactions", badge:"12"},
  {id:"Calendar", icon: Calendar, label:"Calendar" },
  {id:"reports", icon: FileText, label:"Reports" },
  {id:"settings", icon: Settings, label:"Settings" }
  
]


export default function Sidebar({collapsed, ontoggle, currentPage, onPageChange}: {collapsed: boolean, ontoggle: () => void, currentPage: string, onPageChange: (page: string) => void}) {
  const [expandedItems, setExpandedMenu] = React.useState(new Set(["analytics"]))
  const toggleExpanded = (itemid:any) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemid)) {
      newExpanded.delete(itemid)
    } else {
      newExpanded.add(itemid)
    }
    setExpandedMenu(newExpanded)
  }



  return (
    <div className={`${collapsed ? "w-20" : "w-72"} transition-all duration-300 ease-in-out bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col relative z-10`}>
      {/* Logo */}
      <div className="p-6 border-b border-slatee-200/50 dark:border-slate-700/50">
        <div className="flex items-center space-x-3">
            <div className='w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex item-center justify-center shadow-lg'>
                <Zap className='w-6 h-6 text-white' />
            </div>
            {/* Conditional Rendering */}
            <div >
              <h1 className='text-xl font-bold text-slate-800 dark:text-white' >
                QMS
              </h1>
              <p className='text-sm text-slate-500 dark:text-slate-400' >
                Admin Panel
                </p>


            </div>
          </div>
        
        </div>

        {/* Navigation will dispaly Dynamic Menus */ }
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
          return(
            <div key={item.id}>
             <button className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 
              ${currentPage === item.id || item.active? ' bg-gradient-to-r from-blue-500 to -purple-600 text-white shadow-lg shadow-blue-500/25' : 
              'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`} onClick={()=>{
                if(item.submenu){
                  toggleExpanded(item.id)
                } else {
                  onPageChange(item.id)
                }
              }}>
              <div className='flex items-center space-x-3'>
                  <item.icon className={'w-5 h-5'}/>

                  {/* Conditional Rendering */}
                  <>
                  {!collapsed && (
                    <>
                      <span className='font-medium ml-2'>{item.label}</span>
                      {item.badge && (
                          <span className='px-2 py-1 text-xs bg-red-500 text-white-rounded-full'>
                        {item.badge}
                      </span>
                      )}
                      {item.count && (
                        <span className='px-2 py-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full'> 
                          {item.count}
                        </span>
                      )}
                      </>  
                   )}
              
                
                  </>
              </div>
              {!collapsed && item.submenu && (
                <ChevronDown className={'w-4 h-4 transition-transform'}/>

              )}
             </button>

             {/*     Sub Menus  */}
             {!collapsed && item.submenu && expandedItems.has(item.id) && (
                <div className='ml-8 mt-2 space-y-1'>
                  {item.submenu.map((subitem)=>{
                    return <button className='w-full text-left p-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 round-lg transition-all'>
                      {subitem.label}
                      </button>
                  })}
                </div>
              )}

            </div> 
          )
        }
        )} 
        </nav>

        {/* User Profile */}
        {!collapsed && (
            <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <img
                  src="https://i.pravatar.cc/300"
                  alt="User"
                  className="w-10 h-10 rounded-full ring-2 ring-blue-500"/>
                  <div className="flex-1 min-w-0">
                    <div className='flex-1 min-w-0'>
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">Feliz B</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        Administrator
                      </p>
                    </div>
                
                  </div>
                </div>
            </div>
        )}


    </div>
  )
}
