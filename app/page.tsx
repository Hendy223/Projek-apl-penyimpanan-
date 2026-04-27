'use client';

import { useState, useEffect, useRef } from 'react';
import AdminDashboard from '../components/AdminDashboard';
import NetworkMonitor from '../components/NetworkMonitor'; 
import CCTVMonitor from '../components/CCTVMonitor'; 
import { FaCloud, FaRobot, FaNetworkWired, FaLock, FaArrowLeft, FaPaperPlane, FaVideo } from 'react-icons/fa';

export default function Pstar9CloudApp() {
  const [activeView, setActiveView] = useState('home'); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [adminMenu, setAdminMenu] = useState('tampilan_dashboard'); 

  // STATE UNTUK STORAGE
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pinnedFileIds, setPinnedFileIds] = useState<string[]>([]);

  // STATE 10 SERVER PING
  const [monitoredServers, setMonitoredServers] = useState([
    { id: '1', name: 'Router Core', ip: '192.168.1.1', status: 'Memuat...', latency: 0 },
    { id: '2', name: 'Server NAS', ip: '192.168.10.10', status: 'Memuat...', latency: 0 },
    { id: '3', name: 'WiFi Balai Desa', ip: '192.168.1.50', status: 'Memuat...', latency: 0 },
  ]);

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([{ role: 'ai', text: 'Sistem Pstar9 diinisialisasi. Halo! Saya Pstar9 AI.' }]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [isMounted, setIsMounted] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // MEMBACA BRANKAS SAAT WEB DIBUKA
  useEffect(() => {
    setIsMounted(true);
    
    const savedPins = localStorage.getItem('pstar9_pinned_files');
    if (savedPins) { try { setPinnedFileIds(JSON.parse(savedPins)); } catch (e) {} }

    const savedServers = localStorage.getItem('pstar9_monitored_servers');
    if (savedServers) { 
      try { 
        const parsedServers = JSON.parse(savedServers).map((s: any) => ({...s, status: 'Memuat...', latency: 0}));
        setMonitoredServers(parsedServers); 
      } catch (e) {} 
    }

    setIsDataLoaded(true);

    const fetchDriveData = async () => {
      try {
        const res = await fetch('/api/drive');
        const data = await res.json();
        if (data.success) {
          const formattedFiles = data.files.map((file: any) => ({
            id: file.id, title: file.name, type: file.mimeType.includes('video') ? 'Video' : 'Foto',
            size: file.size ? (parseInt(file.size) / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown',
            url: file.webContentLink, thumbnail: `https://drive.google.com/thumbnail?id=${file.id}&sz=w400-h400`
          }));
          setMediaAssets(formattedFiles);
        }
      } catch (error) {} finally { setIsLoading(false); }
    };
    fetchDriveData();
  }, []);

  // MENYIMPAN PERUBAHAN
  useEffect(() => { 
    if (isMounted && isDataLoaded) { 
      localStorage.setItem('pstar9_pinned_files', JSON.stringify(pinnedFileIds));
      localStorage.setItem('pstar9_monitored_servers', JSON.stringify(monitoredServers));
    }
  }, [pinnedFileIds, monitoredServers, isMounted, isDataLoaded]);

  useEffect(() => { if (activeView === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, activeView]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true); setLoginError('');
    try {
      const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginForm) });
      const data = await res.json();
      if (data.success) { setIsAdmin(true); setShowLoginModal(false); setLoginForm({ username: '', password: '' }); } 
      else { setLoginError(data.message); }
    } catch (err) { setLoginError("Gagal menghubungi server."); } finally { setIsLoggingIn(false); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault(); if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]); setChatInput('');
    const typingId = Date.now();
    setChatMessages(prev => [...prev, { role: 'ai', text: 'Memproses...', id: typingId } as any]);
    
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userText, contextFiles: "Data Drive" }) });
      const data = await res.json();
      setChatMessages(prev => prev.map(msg => (msg as any).id === typingId ? { role: 'ai', text: data.text } : msg));
    } catch (err) { setChatMessages(prev => prev.map(msg => (msg as any).id === typingId ? { role: 'ai', text: "Error" } : msg)); }
  };

  if (!isMounted) return null;

  // TAMPILAN ADMIN
  if (isAdmin) {
    return (
      <AdminDashboard 
        handleLogout={() => { setIsAdmin(false); setActiveView('home'); }} 
        adminMenu={adminMenu} setAdminMenu={setAdminMenu} 
        mediaAssets={mediaAssets} pinnedFileIds={pinnedFileIds} 
        togglePin={(id) => setPinnedFileIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])} 
        isLoading={isLoading}
        monitoredServers={monitoredServers}
        setMonitoredServers={setMonitoredServers}
      />
    );
  }

  // TAMPILAN PUBLIK
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-800 font-sans relative">
      
      {/* MODAL LOGIN */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 font-bold">✕</button>
            <div className="text-center mb-8">
              <FaLock className="text-5xl text-orange-500 mx-auto mb-4 bg-orange-100 p-3 rounded-full"/>
              <h2 className="text-2xl font-bold">Login Admin</h2>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <input required type="text" placeholder="Username" value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:outline-none"/>
              <input required type="password" placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:outline-none"/>
              {loginError && <p className="text-red-500 text-sm font-semibold text-center">{loginError}</p>}
              <button type="submit" disabled={isLoggingIn} className="w-full bg-slate-900 text-white font-bold rounded-xl px-4 py-3.5 hover:bg-orange-500 transition-colors">
                {isLoggingIn ? 'Memeriksa...' : 'Masuk Ke Dashboard'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <h1 onClick={() => setActiveView('home')} className="text-2xl font-bold tracking-tight cursor-pointer">Pstar9<span className="text-orange-500">Cloud.</span></h1>
        <div className="flex gap-4">
          {activeView !== 'home' && (
            <button onClick={() => setActiveView('home')} className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg text-gray-600 hover:text-orange-500 bg-gray-50 border border-gray-200 transition-all"><FaArrowLeft/> Kembali</button>
          )}
          <button onClick={() => setShowLoginModal(true)} className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-lg border border-gray-300 hover:border-orange-500 hover:text-orange-500 bg-white transition-all"><FaLock/> Login Admin</button>
        </div>
      </nav>

      {/* KONTEN UTAMA */}
      <main className="max-w-6xl mx-auto px-6 md:px-8 py-10">
        
        {activeView === 'home' && (
          <div className="animate-in fade-in duration-500">
            <header className="mb-12 text-center mt-6">
              <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">Pusat Kontrol <span className="text-orange-500">Pstar9.</span></h2>
              <p className="text-lg text-gray-600">Kelola aset digital dan pantau jaringan Soko Mandiri.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                <div onClick={() => setActiveView('storage')} className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:border-orange-400 hover:shadow-xl cursor-pointer transition-all flex flex-col items-center text-center">
                  <FaCloud className="text-6xl text-orange-500 mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold mb-2">Pstar9 Storage</h3>
                  <p className="text-gray-500 text-sm">Pusat manajemen galeri foto serta video.</p>
                </div>
                <div onClick={() => setActiveView('chat')} className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:border-orange-400 hover:shadow-xl cursor-pointer transition-all flex flex-col items-center text-center">
                  <FaRobot className="text-6xl text-orange-500 mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold mb-2">AI Assistant</h3>
                  <p className="text-gray-500 text-sm">Asisten pintar pencari file dan tanya jawab.</p>
                </div>
                <div onClick={() => setActiveView('network')} className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:border-orange-400 hover:shadow-xl cursor-pointer transition-all flex flex-col items-center text-center">
                  <FaNetworkWired className="text-6xl text-orange-500 mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold mb-2">Network Monitor</h3>
                  <p className="text-gray-500 text-sm">Diagnostik jaringan, server, dan Pstar9 Speedtest.</p>
                </div>
                <div onClick={() => setActiveView('cctv')} className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:border-orange-400 hover:shadow-xl cursor-pointer transition-all flex flex-col items-center text-center">
                  <FaVideo className="text-6xl text-orange-500 mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold mb-2">CCTV Monitor</h3>
                  <p className="text-gray-500 text-sm">Pemantauan NVR & kamera keamanan Segmen 11.</p>
                </div>
            </div>
          </div>
        )}

        {activeView === 'storage' && (
          <div className="animate-in slide-in-from-bottom-4">
             <div className="mb-10 text-center"><h2 className="text-3xl font-bold text-slate-900">Pstar9 Storage</h2></div>
              {isLoading ? (
                <div className="text-center py-20"><p className="text-gray-400 font-medium">Memuat Data...</p></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(pinnedFileIds.length > 0 ? mediaAssets.filter(a => pinnedFileIds.includes(a.id)) : mediaAssets.slice(0,3)).map((asset) => (
                    <div key={asset.id} className="group bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col h-[320px]">
                      <div className="h-48 bg-gray-50 relative overflow-hidden">
                        <img src={asset.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="p-5 flex flex-col flex-grow">
                        <h3 className="font-bold text-sm truncate mb-4">{asset.title}</h3>
                        <a href={asset.url} target="_blank" className="mt-auto block text-center bg-orange-50 text-orange-600 font-bold py-2.5 rounded-xl hover:bg-orange-500 hover:text-white transition-all text-sm">Download</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {activeView === 'chat' && (
          <div className="animate-in zoom-in-95 max-w-4xl mx-auto">
             <h2 className="text-3xl font-bold mb-6 flex items-center gap-3"><FaRobot className="text-orange-500"/> Pstar9 AI</h2>
             <div className="bg-white border rounded-[2rem] shadow-sm flex flex-col h-[500px]">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-5 py-3 text-sm rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-gray-100 text-slate-700 rounded-tl-none'}`}>{msg.text}</div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-3">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 bg-gray-50 border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500" placeholder="Ketik pesan..."/>
                  <button type="submit" className="bg-orange-500 text-white px-6 rounded-xl hover:bg-orange-600"><FaPaperPlane/></button>
                </form>
             </div>
          </div>
        )}

        {activeView === 'network' && (
          <NetworkMonitor 
            isAdmin={false} 
            monitoredServers={monitoredServers} 
            setMonitoredServers={setMonitoredServers} 
          />
        )}

        {activeView === 'cctv' && (
          <CCTVMonitor 
            isAdmin={isAdmin} 
            monitoredServers={monitoredServers} 
            setMonitoredServers={setMonitoredServers} 
          />
        )}

      </main>
    </div>
  );
}