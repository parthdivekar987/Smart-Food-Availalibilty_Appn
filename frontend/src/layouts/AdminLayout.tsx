import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Utensils,
  Table as TableIcon,
  ClipboardList,
  LogOut,
  ChefHat,
  ChevronRight,
  User,
  Layers,
  Users,
  Menu as MenuIcon,
  X,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Compass,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore(state => state.logout);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', name: 'Dashboard', icon: <LayoutDashboard size={18} />, exact: true },
    { path: '/admin/menu', name: 'Menu Items', icon: <Utensils size={18} /> },
    { path: '/admin/tables', name: 'Tables & QR', icon: <TableIcon size={18} /> },
    { path: '/admin/orders', name: 'Live Orders', icon: <ClipboardList size={18} /> },
    { path: '/admin/categories', name: 'Categories', icon: <Layers size={18} /> },
    { path: '/admin/users', name: 'Customers', icon: <User size={18} /> },
    { path: '/admin/employees', name: 'Employees', icon: <Users size={18} /> },
  ];

  // Mobile Bottom Dock shortcuts (top 4 essentials + More)
  const bottomDockItems = [
    { path: '/admin', name: 'Dashboard', icon: <LayoutDashboard size={20} />, exact: true },
    { path: '/admin/menu', name: 'Menu', icon: <Utensils size={20} /> },
    { path: '/admin/tables', name: 'Tables', icon: <TableIcon size={20} /> },
    { path: '/admin/orders', name: 'Orders', icon: <ClipboardList size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* ========================================================
          DESKTOP SIDEBAR (Visible on md and larger screens)
          ======================================================== */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 120, damping: 20 }}
        className="hidden md:flex bg-[#0f172a] text-slate-300 flex-col shadow-[10px_0_30px_rgba(0,0,0,0.15)] z-30 relative shrink-0"
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-8 bg-orange-600 text-white p-1 rounded-full shadow-lg z-50 hover:bg-orange-700 transition-colors cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <ChevronRight size={14} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} />
        </button>

        {/* Content Wrapper */}
        <div className="flex flex-col w-full h-full overflow-hidden">
          {/* Brand Logo */}
          <div className={`p-5 flex items-center gap-3 border-b border-white/10 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2.5 rounded-2xl shadow-xl shadow-orange-600/30 text-white min-w-[42px] flex items-center justify-center">
              <ChefHat size={22} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col whitespace-nowrap overflow-hidden">
                <span className="text-lg font-black tracking-tight text-white leading-tight italic">
                  SMART<span className="text-orange-500">FOOD</span>
                </span>
                <span className="text-[9px] font-bold text-orange-400 tracking-[0.25em] uppercase flex items-center gap-1">
                  <ShieldCheck size={10} /> Admin HQ
                </span>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-3 mt-3 space-y-1.5 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) => `
                  flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-xl transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-600/25 font-semibold'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white font-medium'
                  }
                `}
                title={isCollapsed ? item.name : ''}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 z-10">
                      <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-400'} transition-colors`}>
                        {item.icon}
                      </span>
                      {!isCollapsed && <span className="text-xs tracking-wide whitespace-nowrap">{item.name}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronRight
                        size={14}
                        className={`z-10 transition-all duration-200 ${isActive
                          ? 'translate-x-0 opacity-100'
                          : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 text-slate-400'
                        }`}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Profile & Quick Link to 3D Menu */}
          <div className="p-3 border-t border-white/10 bg-slate-950/40">
            {!isCollapsed && (
              <NavLink
                to="/menu"
                className="flex items-center justify-between p-2.5 mb-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-xs font-bold transition-all"
              >
                <span className="flex items-center gap-2">
                  <Compass size={14} /> View 3D Menu
                </span>
                <ExternalLink size={12} />
              </NavLink>
            )}

            <div className={`flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-orange-400 border border-white/10 shadow-inner">
                  <User size={18} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0f172a]" />
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">Administrator</p>
                    <p className="text-[10px] text-slate-400 truncate">Super Admin</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                    title="Logout"
                  >
                    <LogOut size={15} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* ========================================================
          MAIN VIEWPORT & PAGE CONTENT
          ======================================================== */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden">
        {/* MOBILE TOP APP BAR (Futuristic Dark Glass Header) */}
        <header className="md:hidden bg-[#0f172a] text-white border-b border-white/10 px-4 py-3 sticky top-0 z-30 flex flex-col shadow-md shrink-0">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-xl shadow-lg shadow-orange-600/30 text-white">
                <ChefHat size={18} />
              </div>
              <div>
                <div className="flex items-baseline font-black text-sm tracking-tight text-white italic">
                  <span>SMART</span>
                  <span className="text-orange-500">FOOD</span>
                  <span className="text-[9px] not-italic ml-1 font-bold text-gray-400 tracking-wider">ADMIN</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span>SYSTEM ONLINE</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <NavLink
                to="/menu"
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-orange-400 border border-white/10 text-[11px] font-bold flex items-center gap-1 transition-all"
              >
                <Compass size={12} />
                <span>3D Menu</span>
              </NavLink>

              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors cursor-pointer"
                aria-label="Open navigation menu"
              >
                <MenuIcon size={18} />
              </button>
            </div>
          </div>

          {/* Futuristic Horizontal Scrollable Pill Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 pb-1 -mx-2 px-2">
            {menuItems.map((item) => {
              const isActive = item.exact 
                ? location.pathname === item.path 
                : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all duration-200 shrink-0
                    ${isActive
                      ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold shadow-md shadow-orange-600/30 scale-[1.02]'
                      : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white font-medium'
                    }
                  `}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 items-center justify-between px-8 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-gray-800">
              <h2 className="text-base font-black tracking-tight leading-none uppercase">Dashboard Overview</h2>
              <p className="text-[9px] font-bold text-gray-400 tracking-[0.2em] mt-0.5">REAL-TIME RESTAURANT ANALYTICS</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 flex items-center gap-2 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-black text-green-700 tracking-[0.1em]">SYSTEM ONLINE</span>
            </div>
          </div>
        </header>

        {/* Viewport Content - Mobile friendly padding with room for floating dock */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 pb-28 md:pb-8 custom-scrollbar scroll-smooth">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* ========================================================
          FUTURISTIC MOBILE FLOATING BOTTOM DOCK
          ======================================================== */}
      <nav className="md:hidden fixed bottom-3 inset-x-3 z-40 bg-[#0f172a]/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.65)] flex items-center justify-around">
        {bottomDockItems.map((item) => {
          const isActive = item.exact 
            ? location.pathname === item.path 
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={`
                flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 relative
                ${isActive
                  ? 'text-orange-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeAdminDock"
                  className="absolute inset-0 bg-orange-500/15 border border-orange-500/30 rounded-2xl"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <div className="relative z-10">{item.icon}</div>
              <span className="text-[10px] tracking-tight mt-0.5 relative z-10">{item.name}</span>
            </NavLink>
          );
        })}

        {/* More Button to trigger full mobile drawer */}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
        >
          <MenuIcon size={20} />
          <span className="text-[10px] tracking-tight mt-0.5">More</span>
        </button>
      </nav>

      {/* ========================================================
          FUTURISTIC MOBILE SLIDE-OVER DRAWER MODAL
          ======================================================== */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full sm:max-w-md bg-[#0f172a] text-white rounded-t-[32px] sm:rounded-[32px] border border-white/15 p-6 shadow-2xl max-h-[85vh] overflow-y-auto z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2.5 rounded-2xl shadow-lg shadow-orange-600/30 text-white">
                    <ChefHat size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-base italic">SMART<span className="text-orange-500">FOOD</span></h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Admin Control Center</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="py-4 space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Management Modules</p>
                {menuItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) => `
                      flex items-center justify-between p-3 rounded-2xl transition-all
                      ${isActive
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold shadow-lg shadow-orange-600/25'
                        : 'bg-white/5 hover:bg-white/10 text-slate-200'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span>{item.icon}</span>
                      <span className="text-sm font-semibold">{item.name}</span>
                    </div>
                    <ChevronRight size={16} className="text-white/60" />
                  </NavLink>
                ))}
              </div>

              {/* Quick Switch Portals */}
              <div className="pt-2 pb-4 space-y-2 border-t border-white/10">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Operational Portals</p>
                <div className="grid grid-cols-2 gap-2">
                  <NavLink
                    to="/menu"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-xs font-bold flex flex-col gap-1 transition-all"
                  >
                    <Compass size={16} />
                    <span>3D Customer Menu</span>
                  </NavLink>
                  <NavLink
                    to="/waiter"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-bold flex flex-col gap-1 transition-all"
                  >
                    <User size={16} />
                    <span>Waiter Portal</span>
                  </NavLink>
                  <NavLink
                    to="/kitchen"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex flex-col gap-1 transition-all col-span-2"
                  >
                    <Sparkles size={16} />
                    <span>Kitchen Live Display</span>
                  </NavLink>
                </div>
              </div>

              {/* Logout Button */}
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/20 rounded-2xl font-bold text-sm transition-all"
                >
                  <LogOut size={16} />
                  <span>Logout Administrator</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default AdminLayout;