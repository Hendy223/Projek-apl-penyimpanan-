'use client';

import { useState, useEffect, useRef } from 'react';

// --- MOCK DATABASE ---
const initialMediaAssets = [
  { id: 1, title: 'Dokumentasi_Kegiatan_01.jpg', type: 'Foto', size: '2.4 MB', url: '#' },
  { id: 2, title: 'Video_Cinematic_Bumper.mp4', type: 'Video', size: '15.8 MB', url: '#' },
];

const initialDashboardFeatures = [
  { id: 'storage', title: 'Cloud Storage', desc: 'Pusat unggah, unduh, dan manajemen galeri foto serta video terintegrasi.', isActive: true },
  { id: 'chat', title: 'Nexus AI Assistant', desc: 'Asisten pintar untuk mencari file, merangkum dokumen, dan tanya jawab sistem.', isActive: true },
  { id: 'analytics', title: 'Storage Analytics', desc: 'Pantau statistik penggunaan kapasitas, traffic unduhan, dan log aktivitas.', isActive: true },
];

export default function NexusCloudDynamic() {
  const [activeView, setActiveView] = useState('home'); 
  const [isAdmin, setIsAdmin] = useState(false);
  
  // State untuk Fitur/Menu Utama yang dinamis
  const [dashboardFeatures, setDashboardFeatures] = useState(initialDashboardFeatures);

  // State Storage
  const [mediaAssets, setMediaAssets] = useState(initialMediaAssets);
  const [newFileTitle, setNewFileTitle] = useState('');

  // State Chatbot
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: 'Sistem diinisialisasi. Halo! Saya Nexus AI. Apa yang bisa saya bantu terkait pengelolaan file Anda hari ini?' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (activeView === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeView]);

  // --- FUNGSI ADMIN UNTUK MENU UTAMA ---
  const handleFeatureUpdate = (id: string, field: string, value: string | boolean) => {
    setDashboardFeatures(prev => 
      prev.map(feat => feat.id === id ? { ...feat, [field]: value } : feat)
    );
  };

  // --- FUNGSI STORAGE ---
  const handleDownload = (fileName: string) => alert(`Memulai unduhan: ${fileName}`);
  
  const handleUploadSim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileTitle) return;
    const newFile = {
      id: Date.now(),
      title: newFileTitle.replace(/\s+/g, '_') + '.jpg',
      type: 'Foto',
      size: (Math.random() * 5 + 1).toFixed(1) + ' MB',
      url: '#'
    };
    setMediaAssets([newFile, ...mediaAssets]);
    setNewFileTitle('');
  };

  const handleDelete = (id: number) => {
    setMediaAssets((prev) => prev.filter((item) => item.id !== id));
  };

  // --- FUNGSI CHATBOT ---
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { role: 'user', text: chatInput }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Respon diterima. Saya akan segera mencarikan file yang relevan di database Anda.' }]);
    }, 1000);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-800 font-sans selection:bg-orange-100">
      
      {/* --- GLOBAL NAVBAR --- */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <h1 onClick={() => setActiveView('home')} className="text-2xl font-bold tracking-tight text-slate-900 cursor-pointer hover:opacity-80 transition-opacity">
          Nexus<span className="text-orange-500">Cloud.</span>
        </h1>
        <div className="flex gap-4">
          {activeView !== 'home' && (
            <button onClick={() => setActiveView('home')} className="text-sm font-semibold px-4 py-2 rounded-lg transition-all text-gray-600 hover:text-orange-500 bg-gray-50 border border-gray-200">
              ← Dashboard
            </button>
          )}
          <button onClick={() => setIsAdmin(!isAdmin)} className="text-sm font-semibold px-5 py-2 rounded-lg transition-all border border-gray-300 hover:border-orange-500 hover:text-orange-500 bg-white">
            {isAdmin ? 'Tutup Akses Admin' : 'Login Admin'}
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-10">
        
        {/* =========================================
            HALAMAN 1: HOME (DASHBOARD MENU)
        ========================================= */}
        {activeView === 'home' && (
          <div className="animate-fade-in">
            <header className="mb-10 text-center mt-6">
              <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                Pusat Kontrol <span className="text-orange-500">Workspace.</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Pilih modul aplikasi di bawah ini untuk mengelola aset, berinteraksi dengan asisten AI, atau memantau penggunaan sistem.
              </p>
            </header>

            {/* PANEL ADMIN UNTUK EDIT MENU (Hanya muncul jika isAdmin true) */}
            {isAdmin && (
              <div className="mb-12 bg-white p-6 rounded-3xl border-2 border-orange-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  <h3 className="font-bold text-lg text-slate-800">Admin Mode: Kustomisasi Tampilan Menu</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {dashboardFeatures.map((feat) => (
                    <div key={feat.id} className={`p-4 rounded-2xl border ${feat.isActive ? 'border-gray-200 bg-gray-50' : 'border-red-200 bg-red-50 opacity-60'}`}>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Judul Menu</label>
                      <input 
                        type="text" 
                        value={feat.title} 
                        onChange={(e) => handleFeatureUpdate(feat.id, 'title', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm mb-3 focus:outline-none focus:border-orange-500"
                      />
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Deskripsi</label>
                      <textarea 
                        value={feat.desc} 
                        onChange={(e) => handleFeatureUpdate(feat.id, 'desc', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm mb-3 text-gray-600 focus:outline-none focus:border-orange-500"
                        rows={2}
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={feat.isActive} 
                          onChange={(e) => handleFeatureUpdate(feat.id, 'isActive', e.target.checked)}
                          className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm font-semibold text-slate-700">Tampilkan ke Publik</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAMPILAN PUBLIK MENU (Sesuai dengan State yang diatur Admin) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {dashboardFeatures.filter(f => f.isActive || isAdmin).map(feat => (
                <div 
                  key={feat.id}
                  onClick={() => feat.isActive ? setActiveView(feat.id) : null}
                  className={`group bg-white p-8 rounded-3xl shadow-sm border ${feat.isActive ? 'border-gray-200 hover:border-orange-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer' : 'border-dashed border-red-300 opacity-50 cursor-not-allowed'} transition-all duration-300 flex flex-col items-center text-center relative`}
                >
                  {!feat.isActive && isAdmin && (
                     <span className="absolute top-4 right-4 bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-md">Tersembunyi</span>
                  )}
                  <div className="w-20 h-20 bg-orange-50 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {/* Render Icon Berdasarkan ID */}
                    {feat.id === 'storage' && <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>}
                    {feat.id === 'chat' && <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>}
                    {feat.id === 'analytics' && <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feat.title}</h3>
                  <p className="text-gray-500 text-sm">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ... HALAMAN 2 (STORAGE), HALAMAN 3 (CHAT), HALAMAN 4 (ANALYTICS) TETAP SAMA KARENA KITA FOKUS PADA UPDATE MENU UTAMA ... */}
        {/* =========================================
            SISA KODE (Halaman Modul) 
        ========================================= */}
        {activeView === 'storage' && (
          <div className="animate-fade-in">
             <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Cloud Storage</h2>
                <p className="text-gray-500">Direktori publik untuk foto dan video.</p>
              </div>
              {isAdmin && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nama File Aset Baru</label>
                    <input type="text" value={newFileTitle} onChange={(e) => setNewFileTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Contoh: Foto_Bersama_Tim..."/>
                  </div>
                  <button onClick={handleUploadSim} className="bg-orange-500 text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-orange-600 transition-all">Unggah File</button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {mediaAssets.map((asset) => (
                  <div key={asset.id} className="group bg-white p-5 rounded-3xl shadow-sm border border-gray-200 flex flex-col">
                    <div className="w-full h-40 bg-gray-100 rounded-2xl mb-4 flex items-center justify-center"><span className="text-xs font-semibold text-gray-400">{asset.type}</span></div>
                    <div className="flex-grow"><h3 className="text-sm font-bold mb-1 truncate">{asset.title}</h3><p className="text-gray-500 text-xs mb-4">Ukuran: {asset.size}</p></div>
                    <div className="flex gap-2">
                      <button onClick={() => handleDownload(asset.title)} className="flex-1 bg-slate-50 text-slate-700 font-semibold py-2 rounded-xl border border-gray-200 hover:bg-orange-500 hover:text-white transition-all text-sm">Unduh</button>
                      {isAdmin && <button onClick={() => handleDelete(asset.id)} className="bg-red-50 text-red-600 font-semibold py-2 px-3 rounded-xl hover:bg-red-500 hover:text-white transition-all text-sm">Hapus</button>}
                    </div>
                  </div>
                ))}
              </div>
          </div>
        )}

        {activeView === 'chat' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
             <div className="mb-6"><h2 className="text-3xl font-bold">Nexus AI Assistant</h2></div>
             <div className="bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col h-[500px]">
                <div className="flex-1 bg-gray-50 overflow-y-auto p-6 space-y-6">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-5 py-3 text-sm rounded-2xl ${msg.role === 'user' ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-white border rounded-tl-none'}`}>{msg.text}</div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-3">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 border rounded-xl px-4 py-2" placeholder="Tanya AI..."/>
                  <button type="submit" className="bg-orange-500 text-white px-6 py-2 rounded-xl">Kirim</button>
                </form>
             </div>
          </div>
        )}

        {activeView === 'analytics' && (
           <div className="animate-fade-in max-w-4xl mx-auto text-center py-20">
              <h2 className="text-3xl font-bold mb-4">Storage Analytics</h2>
              <p className="text-gray-500">Fitur sedang dalam tahap pengembangan (Bisa ditambahkan Chart.js nantinya).</p>
           </div>
        )}

      </main>
    </div>
  );
}