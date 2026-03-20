import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  SquaresFour, 
  Package, 
  Tag, 
  Receipt, 
  Ticket, 
  SignOut, 
  List, 
  X,
  UserCircle,
  Storefront,
  Users,
  ChartBar,
  CaretDown,
  CaretUp,
  Shield,
  House,
  CaretDoubleLeft,
  CaretDoubleRight
} from 'phosphor-react';

import { AuthContext } from '../context/AuthContext';

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState({ 'E-Commerce': true, 'Showcase': true });
  const { user, logout: authLogout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const menuGroups = [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard', icon: <SquaresFour size={20} weight="bold" />, path: '/admin' },
        { name: 'Analytics', icon: <ChartBar size={20} weight="bold" />, path: '/admin/analytics' },
        { name: 'Sales Report', icon: <Receipt size={20} weight="bold" />, path: '/admin/reports/sales' },
      ]
    },
    {
      title: 'Management',
      items: [
        { name: 'User Management', icon: <Users size={20} weight="bold" />, path: '/admin/users' },
      ]
    },
    {
      title: 'E-Commerce',
      items: [
        { name: 'Products', icon: <Package size={20} weight="bold" />, path: '/admin/products' },
        { name: 'Categories', icon: <Tag size={20} weight="bold" />, path: '/admin/categories' },
        { name: 'Orders', icon: <Receipt size={20} weight="bold" />, path: '/admin/orders' },
        { name: 'Discount Management', icon: <Ticket size={20} weight="bold" />, path: '/admin/vouchers' },
      ]
    }
  ];

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const toggleGroup = (title) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex font-sans">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 bg-gray-50/50 backdrop-blur-xl border-r border-gray-100 z-50 transform transition-all duration-300 ease-in-out lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        ${isSidebarCollapsed ? 'w-24' : 'w-72'}
      `}>
        <div className="h-full flex flex-col p-6">
          {/* Sidebar Header (Logo) */}
          <div className="pb-4 flex items-center justify-between">
            <Link to="/admin" className={`flex items-center gap-3 transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 scale-0 w-0 overflow-hidden' : 'opacity-100 scale-100'}`}>
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 transition-transform hover:scale-105 active:scale-95 duration-300">
                <Storefront size={22} weight="fill" className="text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900 whitespace-nowrap">Go-Commerce</span>
            </Link>
            
            {/* Desktop Collapse Toggle */}
            <button 
              className="hidden lg:flex p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-400 hover:text-indigo-600 border border-transparent hover:border-gray-100"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? <CaretDoubleRight size={20} weight="bold" /> : <CaretDoubleLeft size={20} weight="bold" />}
            </button>

            <button className="lg:hidden p-2 hover:bg-gray-50 rounded-xl transition-colors" onClick={() => setIsSidebarOpen(false)}>
              <X size={24} weight="bold" className="text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-6 overflow-y-auto no-scrollbar">
            {menuGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                {group.title !== 'Main' && !isSidebarCollapsed && (
                  <div 
                    className="px-5 py-3 flex items-center justify-between cursor-pointer group/title"
                    onClick={() => toggleGroup(group.title)}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 group-hover/title:text-indigo-600 transition-colors">
                      {group.title}
                    </span>
                    {openGroups[group.title] ? <CaretUp size={12} weight="bold" className="text-gray-300" /> : <CaretDown size={12} weight="bold" className="text-gray-300" />}
                  </div>
                )}
                
                {(!group.title || openGroups[group.title] || group.title === 'Main' || isSidebarCollapsed) && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                    {group.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`
                          flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-300 group relative
                          ${isActive(item.path) 
                            ? 'bg-indigo-50 text-indigo-600' 
                            : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600 border border-transparent'}
                          ${isSidebarCollapsed ? 'justify-center px-0' : ''}
                        `}
                        title={isSidebarCollapsed ? item.name : ''}
                      >
                        <div className={`transition-all duration-300 ${isActive(item.path) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'}`}>
                          {item.icon}
                        </div>
                        {!isSidebarCollapsed && (
                          <span className={`text-[13px] tracking-tight ${isActive(item.path) ? 'font-semibold' : 'font-medium'}`}>
                            {item.name}
                          </span>
                        )}
                        {isActive(item.path) && !isSidebarCollapsed && (
                          <div className="absolute left-0 w-1 h-5 bg-indigo-600 rounded-r-full" />
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer (User Info) */}
          <div className="mt-auto p-4 space-y-4">
            {/* User Profile Info */}
            <div className={`p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50 transition-all duration-300 ${isSidebarCollapsed ? 'px-1' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold shadow-sm border-2 border-white">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'AD'}
                </div>
                {!isSidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-[9px] font-semibold text-gray-400 truncate tracking-tight">{user?.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Logout Button */}
            <div className={`px-2 transition-all duration-300 ${isSidebarCollapsed ? 'px-0 flex justify-center' : ''}`}>
              <button
                onClick={handleLogout}
                className={`flex items-center gap-4 py-2.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all duration-300 group font-bold text-[13px] ${isSidebarCollapsed ? 'px-0 justify-center w-10' : 'px-4 w-full'}`}
                title={isSidebarCollapsed ? 'Logout' : ''}
              >
                <div className="transition-transform group-hover:rotate-12 flex-shrink-0">
                  <SignOut size={20} weight="bold" />
                </div>
                {!isSidebarCollapsed && <span>Logout</span>}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-24' : 'lg:ml-72'}`}>
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 lg:px-12 sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <button 
              className="lg:hidden p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-95 text-gray-600 shadow-sm border border-gray-100"
              onClick={() => setIsSidebarOpen(true)}
            >
              <List size={22} weight="bold" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Section</h2>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                {location.pathname === '/admin' ? 'Dashboard' : 
                 menuGroups.flatMap(g => g.items).find(item => item.path === location.pathname)?.name || 'Admin'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Visit Store Shortcut */}
            <Link 
              to="/" 
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-600 hover:text-indigo-600 border border-gray-100 rounded-full text-[13px] font-bold transition-all hover:shadow-sm group"
            >
              <House size={18} weight="bold" className="group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Visit Store</span>
            </Link>

            {/* Admin Session Info */}
            <div className="flex items-center gap-3 p-1.5 pl-4 pr-1.5 bg-gray-50/50 border border-gray-100 rounded-full hover:shadow-sm transition-all cursor-pointer group">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">Admin Session</span>
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm border border-gray-100 group-hover:scale-105 transition-transform">
                <Shield size={18} weight="fill" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f8fafc] p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
