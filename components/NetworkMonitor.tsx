'use client';

import { useState, useEffect, useRef } from 'react';
// DI SINI LETAK PERBAIKANNYA: Menambahkan FaNetworkWired ke dalam daftar import
import { FaGlobe, FaServer, FaTachometerAlt, FaWater, FaTerminal, FaSpinner, FaExchangeAlt, FaDownload, FaUpload, FaWifi, FaPlus, FaTrash, FaCheckCircle, FaExclamationTriangle, FaArrowRight, FaShieldAlt, FaHistory, FaCheck, FaNetworkWired } from 'react-icons/fa';

interface NetworkMonitorProps {
  isAdmin: boolean;
  monitoredServers: any[];
  setMonitoredServers: (servers: any[]) => void;
}

// --- MOCK DATA UNTUK FITUR PUBLIK ---
const uptimeHistory = Array.from({ length: 60 }).map((_, i) => {
  const rand = Math.random();
  if (rand > 0.98) return 'down';
  if (rand > 0.93) return 'degraded';
  return 'up';
});

const incidentLogs = [
  { date: '17 Apr 2026', time: '14:30', title: 'Peningkatan Latensi Indihome', status: 'Resolved', desc: 'Terdapat gangguan rute dari ISP yang menyebabkan ping naik. Telah normal kembali.' },
  { date: '15 Apr 2026', time: '02:15', title: 'Maintenance Router Core', status: 'Completed', desc: 'Pembaruan firmware pada mikrotik utama. Downtime 5 menit.' },
  { date: '10 Apr 2026', time: '09:00', title: 'Server NAS Tidak Dapat Diakses', status: 'Resolved', desc: 'Kabel LAN kendor di rak server. Tim teknis sudah memperbaikinya.' },
];

export default function NetworkMonitor({ isAdmin, monitoredServers, setMonitoredServers }: NetworkMonitorProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isScanning, setIsScanning] = useState(false);
  
  const [isSpeedtesting, setIsSpeedtesting] = useState(false);
  const [testPhase, setTestPhase] = useState(''); 
  const [speedResult, setSpeedResult] = useState<{ ping: number, download: number, upload: number } | null>(null);

  const [newServerName, setNewServerName] = useState('');
  const [newServerIp, setNewServerIp] = useState('');

  // STATE TRAFIK PER-IP
  const [serverLoads, setServerLoads] = useState<Record<string, number>>({});
  // STATE GLOBAL PING
  const [globalPing, setGlobalPing] = useState(12);

  // Animasi Grafik Per-IP & Global Ping
  useEffect(() => {
    const interval = setInterval(() => {
      // Update Global Ping (Simulasi 10-25ms)
      setGlobalPing(Math.floor(Math.random() * 15) + 10);

      // Update Grafik Trafik
      setServerLoads(prev => {
        const newLoads: Record<string, number> = {};
        monitoredServers.forEach(server => {
          if (server.status === 'Putus' || server.status === 'Memuat...') {
            newLoads[server.id] = 0; 
          } else {
            const oldLoad = prev[server.id] || Math.floor(Math.random() * 40) + 20;
            let newLoad = oldLoad + (Math.floor(Math.random() * 30) - 15);
            if (newLoad < 5) newLoad = Math.floor(Math.random() * 15) + 5;
            if (newLoad > 95) newLoad = 95;
            newLoads[server.id] = newLoad;
          }
        });
        return newLoads;
      });
    }, 1500); 
    return () => clearInterval(interval);
  }, [monitoredServers]);

  // Auto-Ping Background Process
  const serversRef = useRef(monitoredServers);
  useEffect(() => { serversRef.current = monitoredServers; }, [monitoredServers]);

  useEffect(() => {
    const pingSemuaServer = async () => {
       const updatedServers = await Promise.all(serversRef.current.map(async (server) => {
           try {
               const res = await fetch('/api/ping', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ ip: server.ip }) });
               const data = await res.json();
               if (!data.success || data.status === 'Offline') return { ...server, status: 'Putus', latency: 0 };
               
               const latency = parseInt(data.time) || 0;
               let statusText = 'Lancar';
               if (latency > 100) statusText = 'Looping'; 
               
               return { ...server, status: statusText, latency };
           } catch(e) { return { ...server, status: 'Putus', latency: 0 }; }
       }));
       setMonitoredServers(updatedServers);
    };

    pingSemuaServer(); 
    const interval = setInterval(pingSemuaServer, 5000); 
    return () => clearInterval(interval);
  }, [setMonitoredServers]);

  const handleAddServer = () => {
    if (!newServerName || !newServerIp) return;
    if (monitoredServers.length >= 10) return alert("Maksimal 10 Server!");
    setMonitoredServers([...monitoredServers, { id: Date.now().toString(), name: newServerName, ip: newServerIp, status: 'Memuat...', latency: 0 }]);
    setNewServerName(''); setNewServerIp('');
  };

  const handleRemoveServer = (id: string) => setMonitoredServers(monitoredServers.filter(s => s.id !== id));

  const handleSpeedtest = async () => {
    setIsSpeedtesting(true); setSpeedResult(null);
    try {
      setTestPhase('Mengukur Latency (Ping)...');
      const pingStart = performance.now(); await fetch(`/api/speedtest?ping=true&t=${Date.now()}`); 
      const pingResult = Math.round(performance.now() - pingStart);

      setTestPhase('Menguji Kecepatan Unduhan (Download)...');
      const dlStart = performance.now(); const dlRes = await fetch(`/api/speedtest?download=true&t=${Date.now()}`); const dlBlob = await dlRes.blob();
      const downloadMbps = ((dlBlob.size * 8) / ((performance.now() - dlStart) / 1000) / 1000000).toFixed(2);

      setTestPhase('Menguji Kecepatan Unggahan (Upload)...');
      const ulBlob = new Blob([new Uint8Array(2 * 1024 * 1024)], { type: 'application/octet-stream' });
      const ulStart = performance.now(); await fetch('/api/speedtest', { method: 'POST', body: ulBlob });
      const uploadMbps = ((ulBlob.size * 8) / ((performance.now() - ulStart) / 1000) / 1000000).toFixed(2);

      setSpeedResult({ ping: pingResult, download: parseFloat(downloadMbps), upload: parseFloat(uploadMbps) });
    } catch (error) { alert("Gagal melakukan tes jaringan."); } finally { setIsSpeedtesting(false); setTestPhase(''); }
  };

  // KOMPONEN GRAFIK PER-IP
  const TrafficGraphPerIP = () => (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden min-h-[250px] flex flex-col">
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h4 className="font-bold text-white flex items-center gap-2"><FaWater className="text-blue-400"/> Live Traffic Per-IP</h4>
        <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>Real-time
        </span>
      </div>
      {monitoredServers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 relative z-10">Belum ada server yang dikonfigurasi.</div>
      ) : (
        <div className="flex-1 flex gap-2 md:gap-4 justify-around items-end relative z-10 w-full overflow-x-auto pb-2">
          {monitoredServers.map(server => {
            const load = serverLoads[server.id] || 0;
            const isDown = server.status === 'Putus';
            return (
              <div key={server.id} className="flex flex-col items-center justify-end h-full flex-1 min-w-[60px] md:min-w-[80px]">
                <span className={`text-[10px] md:text-xs font-mono mb-2 ${isDown ? 'text-red-500' : 'text-blue-300'}`}>{isDown ? 'OFF' : `${load} Mbps`}</span>
                <div className="w-full max-w-[50px] bg-slate-800/50 rounded-t-lg h-32 relative flex items-end justify-center overflow-hidden border-b-2 border-slate-700">
                  <div className={`w-full rounded-t-lg transition-all duration-1000 ease-in-out ${isDown ? 'bg-red-600/50' : 'bg-gradient-to-t from-orange-600 to-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]'}`} style={{ height: `${load}%` }}></div>
                </div>
                <div className="mt-3 flex flex-col items-center w-full">
                  <span className="text-[10px] md:text-xs text-slate-200 font-bold truncate w-full text-center" title={server.name}>{server.name}</span>
                  <span className="text-[9px] text-slate-500 font-mono truncate w-full text-center">{server.ip}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ==========================================
  // VIEW: TAMPILAN PUBLIK (ULTIMATE DASHBOARD)
  // ==========================================
  if (!isAdmin) {
    return (
      <div className="animate-in fade-in duration-500 space-y-8 max-w-5xl mx-auto">
        
        {/* HEADER & GLOBAL PING */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-200 pb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Pstar9 Systems Status</h2>
            <p className="text-gray-500 text-sm mt-1">Pantauan kondisi server dan jaringan Soko Mandiri.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-xl flex items-center gap-3 text-sm font-bold text-slate-700">
                <FaGlobe className="text-blue-500"/> ISP Global Ping: 
                <span className="text-emerald-500 font-mono text-lg">{globalPing}ms</span>
             </div>
          </div>
        </div>

        {/* UPTIME CALENDAR (SLA 99.9%) */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8">
           <div className="flex justify-between items-end mb-4">
              <h3 className="text-lg font-bold text-slate-900">Sistem Uptime (60 Hari Terakhir)</h3>
              <span className="text-2xl font-extrabold text-emerald-500">99.8%</span>
           </div>
           <div className="flex gap-1 h-10 w-full">
              {uptimeHistory.map((status, i) => (
                <div key={i} className={`flex-1 rounded-sm ${status === 'up' ? 'bg-emerald-400' : status === 'degraded' ? 'bg-amber-400' : 'bg-red-500'}`} title={`Hari ke-${60-i}: ${status.toUpperCase()}`}></div>
              ))}
           </div>
           <div className="flex justify-between text-xs text-gray-400 mt-2 font-bold uppercase">
              <span>60 Hari Lalu</span><span>Hari Ini</span>
           </div>
        </div>

        {/* PETA TOPOLOGI MINI */}
        <div className="bg-slate-50 rounded-3xl border border-gray-200 shadow-inner p-6 md:p-8 overflow-x-auto">
           <h3 className="text-lg font-bold text-slate-900 mb-6 text-center">Topologi Jaringan Aktif</h3>
           <div className="flex items-center justify-between min-w-[600px] max-w-3xl mx-auto px-4">
              {/* Internet */}
              <div className="flex flex-col items-center gap-2">
                 <div className="w-14 h-14 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-2xl shadow-sm border border-blue-200"><FaGlobe/></div>
                 <span className="text-xs font-bold text-slate-700">Internet (ISP)</span>
              </div>
              <div className="flex-1 h-1 bg-emerald-400 relative"><div className="absolute w-3 h-3 bg-emerald-500 rounded-full -top-1 animate-ping left-1/2"></div></div>
              
              {/* Firewall/Modem */}
              <div className="flex flex-col items-center gap-2">
                 <div className="w-14 h-14 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-orange-200"><FaShieldAlt/></div>
                 <span className="text-xs font-bold text-slate-700">Firewall / Modem</span>
              </div>
              <div className="flex-1 h-1 bg-emerald-400"></div>

              {/* Core Switch */}
              <div className="flex flex-col items-center gap-2">
                 <div className="w-14 h-14 bg-purple-100 text-purple-500 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-purple-200"><FaNetworkWired/></div>
                 <span className="text-xs font-bold text-slate-700">Core Switch</span>
              </div>
              <div className="flex-1 h-1 bg-emerald-400 relative"><FaArrowRight className="absolute text-emerald-500 -top-1.5 left-1/2 bg-slate-50"/></div>

              {/* Servers */}
              <div className="flex flex-col items-center gap-2">
                 <div className="w-14 h-14 bg-slate-800 text-white rounded-2xl flex items-center justify-center text-2xl shadow-sm"><FaServer/></div>
                 <span className="text-xs font-bold text-slate-700">Local Servers</span>
              </div>
           </div>
        </div>

        {/* GRAFIK TRAFFIC PER-IP */}
        <TrafficGraphPerIP />

        {/* STATUS SERVER */}
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><FaServer className="text-orange-500"/> Status Real-time Server</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {monitoredServers.map((server) => {
               let color = 'bg-gray-100 text-gray-500 border-gray-200';
               if (server.status === 'Lancar') color = 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100';
               else if (server.status === 'Looping') color = 'bg-amber-50 text-amber-700 border-amber-300 shadow-amber-100';
               else if (server.status === 'Putus') color = 'bg-red-50 text-red-700 border-red-200 shadow-red-100';

               return (
                <div key={server.id} className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between h-28 transition-colors ${color}`}>
                  <p className="font-bold text-sm truncate">{server.name}</p>
                  <div>
                    <span className="text-xs font-bold block mb-1 uppercase tracking-wider">{server.status}</span>
                    <span className="text-[10px] font-mono bg-white/50 px-2 py-0.5 rounded text-slate-600">{server.latency} ms</span>
                  </div>
                </div>
               );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* RIWAYAT INSIDEN */}
           <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><FaHistory className="text-orange-500"/> Riwayat Insiden Sistem</h3>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                 {incidentLogs.map((log, i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                       <div className="flex items-center justify-center w-5 h-5 rounded-full border-4 border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                       <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                             <span className="font-bold text-slate-900 text-sm">{log.title}</span>
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.status === 'Resolved' || log.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{log.status}</span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed mb-2">{log.desc}</p>
                          <time className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{log.date} • {log.time}</time>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* SPEEDTEST */}
           <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8 flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <div>
                    <h3 className="text-xl font-bold text-slate-900">Pstar9 Speedtest</h3>
                    <p className="text-xs text-gray-500">Uji kecepatan real-time.</p>
                 </div>
                 <button onClick={handleSpeedtest} disabled={isSpeedtesting} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                   {isSpeedtesting ? <><FaSpinner className="animate-spin" /> Menguji...</> : <><FaTachometerAlt /> Speedtest</>}
                 </button>
              </div>
              
              <div className="flex-1 bg-slate-900 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden border border-slate-800">
                 <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl"></div>
                 {isSpeedtesting ? (
                    <div className="text-center z-10"><p className="text-blue-300 font-mono animate-pulse">{testPhase}</p></div>
                 ) : speedResult ? (
                    <div className="grid grid-cols-1 gap-4 z-10">
                       <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-xl border border-slate-700"><span className="text-gray-400 text-xs font-bold">PING</span><span className="text-2xl text-emerald-400 font-bold">{speedResult.ping} <span className="text-sm">ms</span></span></div>
                       <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-xl border border-slate-700"><span className="text-gray-400 text-xs font-bold">DOWNLOAD</span><span className="text-2xl text-blue-400 font-bold">{speedResult.download} <span className="text-sm">Mbps</span></span></div>
                       <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-xl border border-slate-700"><span className="text-gray-400 text-xs font-bold">UPLOAD</span><span className="text-2xl text-purple-400 font-bold">{speedResult.upload} <span className="text-sm">Mbps</span></span></div>
                    </div>
                 ) : (
                    <div className="text-center z-10"><FaWifi className="text-4xl text-slate-600 mx-auto mb-3"/><p className="text-slate-400 text-sm">Klik Speedtest untuk menguji.</p></div>
                 )}
              </div>
           </div>
        </div>

      </div>
    );
  }

  // ==========================================
  // VIEW: TAMPILAN ADMIN (TETAP SAMA SEPERTI SEBELUMNYA)
  // ==========================================
  const tabs = [
    { id: 'overview', icon: FaGlobe, label: 'Global Overview' },
    { id: 'servers', icon: FaWifi, label: 'Konfigurasi Server' }, 
    { id: 'speedtest', icon: FaTachometerAlt, label: 'Speedtest & Diag' }, 
  ];

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Enterprise NMS <span className="text-orange-500">Pstar9</span></h2>
          <p className="text-gray-500 text-sm mt-1">Network Operations Center (NOC) Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-sm font-bold border border-emerald-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> System Normal
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
          {tabs.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 px-5 py-4 rounded-xl font-bold text-sm transition-all border ${activeTab === item.id ? 'bg-orange-500 text-white border-orange-600 shadow-md' : 'bg-white text-slate-600 border-gray-200 hover:border-orange-300 hover:text-orange-500'}`}>
              <item.icon className="text-lg" /> {item.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8 min-h-[500px]">
          
          {activeTab === 'overview' && (
            <div className="animate-in fade-in">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><FaGlobe className="text-orange-500"/> Network Health</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-center">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Active Nodes</p>
                  <p className="text-3xl font-bold text-slate-900">{monitoredServers.filter(s => s.status === 'Lancar').length}<span className="text-sm text-gray-500 font-normal ml-1">/ {monitoredServers.length}</span></p>
                </div>
                <div className="p-5 bg-red-50 rounded-2xl border border-red-100 flex flex-col justify-center">
                  <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1">Putus / Error</p>
                  <p className="text-3xl font-bold text-red-600">{monitoredServers.filter(s => s.status === 'Putus').length}</p>
                </div>
              </div>
              <TrafficGraphPerIP />
            </div>
          )}

          {activeTab === 'servers' && (
            <div className="animate-in fade-in">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><FaServer className="text-orange-500"/> Manajemen Target Ping</h3>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-8 flex flex-col sm:flex-row gap-4">
                 <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nama Perangkat</label>
                    <input type="text" value={newServerName} onChange={(e)=>setNewServerName(e.target.value)} placeholder="Contoh: CCTV Gerbang" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500"/>
                 </div>
                 <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">IP Address</label>
                    <input type="text" value={newServerIp} onChange={(e)=>setNewServerIp(e.target.value)} placeholder="Contoh: 192.168.1.100" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-orange-500"/>
                 </div>
                 <div className="flex items-end">
                    <button onClick={handleAddServer} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 h-10 w-full justify-center">
                      <FaPlus/> Tambah
                    </button>
                 </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Nama Server</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">IP Address</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase">Live Status</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitoredServers.map((server) => (
                      <tr key={server.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-4 px-4 font-bold text-slate-900">{server.name}</td>
                        <td className="py-4 px-4 font-mono text-sm text-slate-600">{server.ip}</td>
                        <td className="py-4 px-4">
                           <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block w-20 text-center ${server.status === 'Lancar' ? 'bg-emerald-100 text-emerald-700' : server.status === 'Looping' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                             {server.status}
                           </span>
                           <span className="text-[10px] text-gray-400 ml-2">{server.latency}ms</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                           <button onClick={() => handleRemoveServer(server.id)} className="text-red-400 hover:text-red-600 p-2"><FaTrash/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'speedtest' && (
            <div className="animate-in fade-in h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Bandwidth Diagnostics</h3>
                <button onClick={handleSpeedtest} disabled={isSpeedtesting} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
                  {isSpeedtesting ? <><FaSpinner className="animate-spin" /> Menguji...</> : <><FaTachometerAlt /> Speedtest</>}
                </button>
              </div>
              <div className="flex-1 bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-center text-center">
                 {isSpeedtesting ? (
                   <p className="text-blue-300 font-mono animate-pulse">{testPhase}</p>
                 ) : speedResult ? (
                   <div className="grid grid-cols-3 gap-6">
                     <div><p className="text-gray-400 text-sm">PING</p><p className="text-4xl text-emerald-400 font-bold">{speedResult.ping} ms</p></div>
                     <div><p className="text-gray-400 text-sm">DOWNLOAD</p><p className="text-4xl text-blue-400 font-bold">{speedResult.download} Mbps</p></div>
                     <div><p className="text-gray-400 text-sm">UPLOAD</p><p className="text-4xl text-purple-400 font-bold">{speedResult.upload} Mbps</p></div>
                   </div>
                 ) : (
                   <h4 className="text-xl font-bold text-slate-400">Siap Menguji Koneksi Server Lokal</h4>
                 )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}