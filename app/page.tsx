'use client';

import { useState, useEffect, useRef } from 'react';

const initialDashboardFeatures = [
  { id: 'storage', title: 'Pstar9 Storage', desc: 'Pusat unggah, unduh, dan manajemen galeri foto serta video terintegrasi.', isActive: true },
  { id: 'chat', title: 'Pstar9 AI Assistant', desc: 'Asisten pintar untuk mencari file, merangkum dokumen, dan tanya jawab sistem.', isActive: true },
  { id: 'analytics', title: 'Storage Analytics', desc: 'Pantau statistik penggunaan kapasitas, traffic unduhan, dan log aktivitas.', isActive: true },
];

export default function Pstar9CloudApp() {
  const [activeView, setActiveView] = useState('home'); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [dashboardFeatures, setDashboardFeatures] = useState(initialDashboardFeatures);

  // --- STATE STORAGE ---
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE CHATBOT ---
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: 'Sistem Pstar9 diinisialisasi. Halo! Saya Pstar9 AI. Apa yang bisa saya bantu hari ini?' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isMounted, setIsMounted] = useState(false);

  // --- 1. MENGAMBIL DATA DARI GOOGLE DRIVE API ---
  useEffect(() => {
    setIsMounted(true);
    const fetchDriveData = async () => {
      try {
        const res = await fetch('/api/drive');
        const data = await res.json();
        
        if (data.success) {
          const formattedFiles = data.files.map((file: any) => ({
            id: file.id,
            title: file.name,
            type: file.mimeType.includes('video') ? 'Video' : 'Foto',
            size: file.size ? (parseInt(file.size) / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown',
            url: file.webContentLink,
            thumbnail: `https://lh3.googleusercontent.com/u/0/d/${file.id}=w400-h400-p`
          }));
          setMediaAssets(formattedFiles);
        }
      } catch (error) {
        console.error("Pstar9 Drive Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDriveData();
  }, []);

  // Auto scroll chat
  useEffect(() => {
    if (activeView === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeView]);

  const handleFeatureUpdate = (id: string, field: string, value: string | boolean) => {
    setDashboardFeatures(prev => prev.map(feat => feat.id === id ? { ...feat, [field]: value } : feat));
  };

  // --- 2. LOGIKA CHAT KOLABORASI (DRIVE + GEMINI AI) ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');

    // Status memproses sementara
    const typingId = Date.now();
    setChatMessages(prev => [...prev, { role: 'ai', text: 'Pstar9 sedang memproses pesan Anda...', id: typingId } as any]);

    // Konteks file untuk Gemini
    const contextFiles = mediaAssets.length > 0 
      ? mediaAssets.map(f => f.title).join(", ") 
      : "Tidak ada file di folder Drive.";

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, contextFiles }),
      });

      const data = await res.json();

      // Ganti pesan loading dengan jawaban asli Gemini
      setChatMessages(prev => 
        prev.map(msg => (msg as any).id === typingId ? { role: 'ai', text: data.text } : msg)
      );
    } catch (err) {
      setChatMessages(prev => 
        prev.map(msg => (msg as any).id === typingId ? { role: 'ai', text: "Gagal terhubung ke otak Gemini." } : msg)
      );
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-800 font-sans">
      
      {/* NAVBAR */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <h1 onClick={() => setActiveView('home')} className="text-2xl font-bold tracking-tight text-slate-900 cursor-pointer">
          Pstar9<span className="text-orange-500">Cloud.</span>
        </h1>
        <div className="flex gap-4">
          {activeView !== 'home' && (
            <button onClick={() => setActiveView('home')} className="text-sm font-semibold px-4 py-2 rounded-lg text-gray-600 hover:text-orange-500 bg-gray-50 border border-gray-200 transition-all">
              ← Dashboard
            </button>
          )}
          <button onClick={() => setIsAdmin(!isAdmin)} className="text-sm font-semibold px-5 py-2 rounded-lg border border-gray-300 hover:border-orange-500 hover:text-orange-500 bg-white transition-all">
            {isAdmin ? 'Tutup Admin' : 'Login Admin'}
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-10">
        
        {/* DASHBOARD HOME */}
        {activeView === 'home' && (
          <div className="animate-in fade-in duration-500">
            <header className="mb-12 text-center mt-6">
              <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">
                Pusat Kontrol <span className="text-orange-500">Pstar9.</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Kelola aset digital Anda dengan integrasi Google Drive yang mulus.
              </p>
            </header>

            {isAdmin && (
              <div className="mb-12 bg-white p-6 rounded-3xl border-2 border-orange-200 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-orange-600">Edit Tampilan Menu (Admin Mode)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {dashboardFeatures.map((feat) => (
                    <div key={feat.id} className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
                      <input type="text" value={feat.title} onChange={(e) => handleFeatureUpdate(feat.id, 'title', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm mb-3 focus:outline-none focus:border-orange-500"/>
                      <textarea value={feat.desc} onChange={(e) => handleFeatureUpdate(feat.id, 'desc', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm mb-3 focus:outline-none focus:border-orange-500" rows={2}/>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={feat.isActive} onChange={(e) => handleFeatureUpdate(feat.id, 'isActive', e.target.checked)} className="w-4 h-4 text-orange-500 rounded"/>
                        <span className="text-sm font-semibold text-slate-700">Tampilkan ke User</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {dashboardFeatures.filter(f => f.isActive || isAdmin).map(feat => (
                <div key={feat.id} onClick={() => feat.isActive ? setActiveView(feat.id) : null} className={`group bg-white p-8 rounded-3xl shadow-sm border ${feat.isActive ? 'border-gray-200 hover:border-orange-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer' : 'border-dashed border-red-300 opacity-50 cursor-not-allowed'} transition-all duration-300 flex flex-col items-center text-center`}>
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl mb-6 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                    {feat.id === 'storage' && <svg className="w-8 h-8 text-orange-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>}
                    {feat.id === 'chat' && <svg className="w-8 h-8 text-orange-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>}
                    {feat.id === 'analytics' && <svg className="w-8 h-8 text-orange-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feat.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STORAGE VIEW */}
        {activeView === 'storage' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
             <div className="mb-10">
                <h2 className="text-3xl font-bold text-slate-900">Pstar9 Storage</h2>
                <p className="text-gray-500">Sinkronisasi langsung dengan Google Drive Anda.</p>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400 font-medium">Menghubungkan ke Drive...</p>
                </div>
              ) : mediaAssets.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-300">
                  <p className="text-gray-400">Belum ada file di folder Drive Anda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {mediaAssets.map((asset) => (
                    <div key={asset.id} className="group bg-white rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 overflow-hidden flex flex-col">
                      <div className="h-52 bg-gray-50 flex items-center justify-center overflow-hidden relative">
                        <img 
                          src={asset.thumbnail} 
                          alt={asset.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          onError={(e) => { (e.target as any).src = 'https://placehold.co/400x400/f3f4f6/9ca3af?text=File'; }}
                        />
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-slate-700 shadow-sm uppercase tracking-wider">
                          {asset.type}
                        </div>
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <h3 className="font-bold text-slate-900 mb-1 truncate" title={asset.title}>{asset.title}</h3>
                        <p className="text-gray-400 text-xs mb-6 uppercase tracking-tighter">Ukuran: {asset.size}</p>
                        <a href={asset.url} target="_blank" rel="noopener noreferrer" className="mt-auto block w-full text-center bg-orange-50 text-orange-600 font-bold py-3 rounded-2xl border border-orange-100 hover:bg-orange-500 hover:text-white transition-all duration-300">
                          Download File
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* CHAT VIEW */}
        {activeView === 'chat' && (
          <div className="animate-in zoom-in-95 duration-500 max-w-4xl mx-auto">
             <h2 className="text-3xl font-bold mb-6">Pstar9 AI</h2>
             <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm flex flex-col h-[550px] overflow-hidden">
                <div className="flex-1 bg-gray-50/50 overflow-y-auto p-8 space-y-6">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-6 py-3.5 text-sm rounded-2xl max-w-[80%] shadow-sm ${msg.role === 'user' ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none text-slate-700 leading-relaxed'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-5 bg-white border-t border-gray-100 flex gap-4">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Tanya Pstar9 sesuatu..."/>
                  <button type="submit" className="bg-orange-500 text-white px-10 py-4 rounded-2xl font-bold hover:bg-orange-600 shadow-md shadow-orange-200 transition-all">Kirim</button>
                </form>
             </div>
          </div>
        )}

        {/* ANALYTICS VIEW */}
        {activeView === 'analytics' && (
           <div className="animate-in fade-in py-20 text-center">
              <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">📊</div>
              <h2 className="text-3xl font-bold mb-3 text-slate-900">Storage Analytics</h2>
              <p className="text-gray-500">Fitur ini akan segera hadir untuk memantau trafik file Anda.</p>
           </div>
        )}

      </main>
    </div>
  );
}