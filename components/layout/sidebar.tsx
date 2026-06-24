"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/types"
import { getHomePathForSession, isRoleHomePath } from "@/lib/roleRoutes"
import { 
  LayoutDashboard, 
  Tractor, 
  Beef, 
  ClipboardList, // <--- Changed this from ClipboardPulse
  UserCog, 
  Users, 
  LogOut, 
  ChevronRight 
} from "lucide-react"

// Define the interface for navigation items
interface NavItem {
  label: string
  href: string
  icon: any
  roles: UserRole[]
}

// Map your original logic to modern icons
const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["superadmin", "owner", "executive-manager"] },
  { label: "Farms", href: "/farms", icon: Tractor, roles: ["superadmin", "owner"] },
  { label: "Animals", href: "/animals", icon: Beef, roles: ["owner", "executive-manager"] },
  // Updated the icon below to ClipboardList
  { label: "Health Records", href: "/health-records", icon: ClipboardList, roles: ["owner", "executive-manager"] },
  { label: "Employees", href: "/manage-employees", icon: UserCog, roles: ["owner"] },
  { label: "User Management", href: "/employees", icon: Users, roles: ["superadmin"] },
]

export function Sidebar() {
  const { user, logout, firebaseSignedIn } = useAuth()
  const pathname = usePathname()

  const homeHref = user ? getHomePathForSession(user, firebaseSignedIn) : "/dashboard"

  const visibleItems = navItems.filter((item) => user && item.roles.includes(user.role))

  return (
    <aside className="w-72 h-screen flex flex-col sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-slate-800 transition-all duration-300">
      
      {/* 1. Logo Section */}
      <div className="h-24 flex items-center px-8 border-b border-gray-100 dark:border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 text-white">
            <Tractor size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
              FarmFlow
            </h1>
            <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Management OS</p>
          </div>
        </div>
      </div>

      {/* 2. Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-xs font-bold text-gray-400/80 uppercase tracking-widest mb-4">Main Menu</p>
        
        {visibleItems.map((item) => {
          const Icon = item.icon
          const href = item.href === "/dashboard" ? homeHref : item.href
          const isActive =
            pathname === href ||
            (item.href === "/dashboard" &&
              user &&
              isRoleHomePath(pathname, user, firebaseSignedIn))

          return (
            <Link
              key={`${item.label}-${href}`}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ease-in-out font-medium text-sm",
                isActive 
                  ? "text-white shadow-xl shadow-emerald-500/25" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-emerald-50/80 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-400"
              )}
            >
              {/* Animated Background for Active State */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl -z-10" />
              )}

              <Icon 
                size={20} 
                strokeWidth={isActive ? 2.5 : 2}
                className={cn(
                  "transition-transform duration-300",
                  isActive ? "scale-105" : "group-hover:scale-110"
                )} 
              />
              
              <span className="flex-1">{item.label}</span>

              {/* Little arrow indicator */}
              {isActive && <ChevronRight size={16} className="opacity-80" />}
            </Link>
          )
        })}
      </nav>

      {/* 3. User Profile Footer */}
      <div className="p-4 m-4 rounded-3xl bg-gradient-to-b from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white dark:ring-slate-800">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate capitalize flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {user?.role?.replace("-", " ") ?? ""}
            </p>
          </div>
        </div>
        
        <button 
          onClick={logout} 
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors border border-red-100 dark:border-red-900/20"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}