
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Scale, 
  Users, 
  CreditCard, 
  CircleDollarSign, 
  LineChart, 
  Truck,
  MoreHorizontal
} from 'lucide-react';

const Layout = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Dashboard';
      case '/weigh': return 'ชั่งน้ำหนัก';
      case '/farmers': return 'เกษตรกร';
      case '/payment': return 'การชำระเงิน';
      case '/price': return 'ราคารับซื้อ';
      case '/report': return 'รายงาน';
      case '/vehicles': return 'ยานพาหนะ';
      default: return 'PalmBiz';
    }
  };

  const getPageActions = () => {
    switch (location.pathname) {
      case '/farmers': return (
        <NavLink to="/farmers/new" className="btn-primary flex items-center gap-2 px-4 py-2 text-[11px]">
          <Users size={14} /> <span>เพิ่มเกษตรกร</span>
        </NavLink>
      );
      case '/vehicles': return (
        <NavLink to="/vehicles/new" className="btn-primary flex items-center gap-2 px-4 py-2 text-[11px]">
          <Truck size={14} /> <span>เพิ่มรถ</span>
        </NavLink>
      );
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#000000] p-0 sm:p-2 font-sans text-neutral-200">
      <div className="flex w-full h-full bg-[var(--color-bg-card)] sm:rounded-[1.5rem] overflow-hidden border-0 sm:border sm:border-[var(--color-border-dark)] shadow-2xl relative">
        
        {/* Forest Green Sidebar matching screenshot */}
        <div className="w-[240px] bg-[var(--color-sidebar)] flex flex-col shrink-0 text-white relative z-10 shadow-2xl">
          <div className="px-6 py-8">
            <div className="font-heading font-bold text-[20px] tracking-tight flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                <span className="text-white text-lg">🌿</span>
              </div>
              <div className="flex flex-col">
                <span className="leading-none text-white">PalmBiz</span>
                <span className="text-[10px] text-white/60 font-normal mt-1">ระบบรับซื้อปาล์มน้ำมัน</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-0 py-2 space-y-1 custom-scrollbar">
            <div className="px-6 text-[11px] font-bold text-white/40 uppercase tracking-widest mb-4 mt-4">หน้าหลัก</div>
            <NavLink to="/dashboard" className={({isActive}) => `flex items-center gap-3 px-6 py-3 text-[14px] font-medium transition-all duration-200 group relative ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
              {({isActive}) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />}
                  <LayoutDashboard className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`} /> Dashboard
                </>
              )}
            </NavLink>

            <div className="px-6 text-[11px] font-bold text-white/40 uppercase tracking-widest mb-4 mt-8">ปฏิบัติการ</div>
            <NavLink to="/weigh" className={({isActive}) => `flex items-center gap-3 px-6 py-3 text-[14px] font-medium transition-all duration-200 group relative ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
              {({isActive}) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />}
                  <Scale className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`} /> ชั่งน้ำหนัก
                </>
              )}
            </NavLink>
            <NavLink to="/farmers" className={({isActive}) => `flex items-center gap-3 px-6 py-3 text-[14px] font-medium transition-all duration-200 group relative ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
              {({isActive}) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />}
                  <Users className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`} /> เกษตรกร
                </>
              )}
            </NavLink>
            <NavLink to="/payment" className={({isActive}) => `flex items-center gap-3 px-6 py-3 text-[14px] font-medium transition-all duration-200 group relative ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
              {({isActive}) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />}
                  <CreditCard className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`} /> การชำระเงิน
                </>
              )}
            </NavLink>

            <div className="px-6 text-[11px] font-bold text-white/40 uppercase tracking-widest mb-4 mt-8">จัดการ</div>
            <NavLink to="/price" className={({isActive}) => `flex items-center gap-3 px-6 py-3 text-[14px] font-medium transition-all duration-200 group relative ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
              {({isActive}) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />}
                  <CircleDollarSign className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`} /> ราคารับซื้อ
                </>
              )}
            </NavLink>
            <NavLink to="/report" className={({isActive}) => `flex items-center gap-3 px-6 py-3 text-[14px] font-medium transition-all duration-200 group relative ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
              {({isActive}) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />}
                  <LineChart className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`} /> รายงาน
                </>
              )}
            </NavLink>
            <NavLink to="/vehicles" className={({isActive}) => `flex items-center gap-3 px-6 py-3 text-[14px] font-medium transition-all duration-200 group relative ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
              {({isActive}) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />}
                  <Truck className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`} /> ยานพาหนะ
                </>
              )}
            </NavLink>
          </div>
          
          <div className="p-6 mt-auto">
            <div 
              className="flex items-center gap-3 p-3 rounded-2xl bg-black/20 border border-white/10 hover:bg-black/30 transition-all cursor-pointer group"
              onClick={logout}
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-sm border border-white/10">
                A
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-sm font-bold text-white truncate">Admin</div>
                <div className="text-[10px] text-white/50 truncate">Sign out</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-bg-card)] relative z-0">
          
          {/* Topbar matching wireframe */}
          <div className="h-16 border-b border-[var(--color-border-dark)] bg-transparent flex items-center justify-between px-8 shrink-0 relative z-10">
            <div>
              <h2 className="text-xl font-heading font-semibold text-white">{getPageTitle()}</h2>
              <div className="text-[11px] text-neutral-400 mt-0.5">PalmBiz Dashboard & Analytics</div>
            </div>
            
            <div className="flex items-center gap-4">
              {getPageActions()}
              <div className="h-6 w-[1px] bg-[var(--color-border-dark)] mx-1"></div>
              <button className="w-9 h-9 rounded-full bg-[var(--color-bg-main)] border border-[var(--color-border-dark)] flex items-center justify-center text-neutral-400 hover:text-brand-light hover:border-brand-light/30 transition-all shadow-sm group">
                <MoreHorizontal className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
          
          {/* Page Content */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Layout;
