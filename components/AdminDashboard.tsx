'use client';

import NetworkMonitor from './NetworkMonitor'; 
import { FaChartPie, FaFolderOpen, FaNetworkWired, FaSignOutAlt, FaThumbtack } from 'react-icons/fa';

interface AdminDashboardProps {
  handleLogout: () => void;
  adminMenu: string;
  setAdminMenu: (menu: string) => void;
  mediaAssets: any[];
  pinnedFileIds: string[];
  togglePin: (id: string) => void;
  isLoading: boolean;
  monitoredServers: any[];
  setMonitoredServers: (servers: any[]) => void;
}

export default function AdminDashboard({ handleLogout, adminMenu, setAdminMenu, mediaAssets, pinnedFileIds, togglePin, isLoading, monitoredServers, setMonitoredServers }: AdminDashboardProps) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 text-slate-800 font-sans">
      
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20 shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold tracking-tight">Pstar9<span className="text-orange-500">Admin</span></h1>
          <p className="text-slate-400 text-xs mt-1">Superuser Dashboard</p>
        </div>
        
        <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <button onClick={() => setAdminMenu('tampilan_dashboard')} className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${adminMenu === 'tampilan_dashboard' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
            <FaChartPie /> Tampilan Dashboard
          </button>
          <button onClick={() => setAdminMenu('manajemen_file')} className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${adminMenu === 'manajemen_file' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
            <FaFolderOpen /> Manajemen File
          </button>
          <button onClick={() => setAdminMenu('network_monitor')} className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${adminMenu === 'network_monitor' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
            <FaNetworkWired /> Network Config & NOC
          </button>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2">
            <FaSignOutAlt /> Keluar Admin
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-10 relative bg-[#F9FAFB] w-full">
        
        {adminMenu === 'tampilan_dashboard' && (
          <div className="max-w-5xl animate-in fade-in">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Tampilan Publik</h2>
            <p className="text-gray-500 mb-8">Pratinjau konten yang dilihat pengunjung website.</p>
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <FaFolderOpen className="text-orange-500 text-2xl"/> File Ter-Pin (Maks 3)
              </h3>
              {mediaAssets.filter(asset => pinnedFileIds.includes(asset.id)).length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400">Belum ada file yang di-pin.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mediaAssets.filter(asset => pinnedFileIds.includes(asset.id)).slice(0, 3).map((asset) => (
                      <div key={asset.id} className="group bg-gray-50 rounded-2xl border border-gray-100 shadow-inner overflow-hidden flex flex-col relative h-36">
                        <img src={asset.thumbnail} alt={asset.title} className="w-full h-full object-cover" onError={(e) => { (e.target as any).src = 'https://placehold.co/400x400/f3f4f6/9ca3af?text=File'; }}/>
                      </div>
                    ))}
                  </div>
              )}
            </div>
          </div>
        )}

        {adminMenu === 'manajemen_file' && (
          <div className="max-w-5xl animate-in fade-in">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Manajemen Pin File</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediaAssets.map((asset) => {
                const isPinned = pinnedFileIds.includes(asset.id);
                return (
                  <div key={asset.id} className={`group bg-white rounded-2xl border overflow-hidden relative ${isPinned ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'}`}>
                    <button onClick={() => togglePin(asset.id)} className={`absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 ${isPinned ? 'bg-orange-500 text-white' : 'bg-white/90 text-gray-600'}`}>
                      <FaThumbtack /> {isPinned ? 'Dipin' : 'Pin'}
                    </button>
                    <div className="h-40 bg-gray-100"><img src={asset.thumbnail} className="w-full h-full object-cover" alt="file"/></div>
                    <div className="p-4"><h3 className="font-bold text-sm truncate">{asset.title}</h3></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RENDER NETWORK MONITOR DALAM MODE ADMIN */}
        {adminMenu === 'network_monitor' && (
          <div className="animate-in fade-in pb-10 -m-4 md:-m-10"> 
             <NetworkMonitor 
                isAdmin={true} 
                monitoredServers={monitoredServers} 
                setMonitoredServers={setMonitoredServers} 
             />
          </div>
        )}
      </main>
    </div>
  );
}