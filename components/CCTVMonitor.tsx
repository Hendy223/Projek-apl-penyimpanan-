'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaGlobe, FaServer, FaTachometerAlt, FaWater, FaTerminal, FaSpinner, FaExchangeAlt, FaDownload, FaUpload, FaWifi, FaPlus, FaTrash, FaShieldAlt, FaHistory, FaNetworkWired, FaVideo, FaProjectDiagram, FaLaptop, FaVectorSquare, FaTimes, FaLink, FaCut } from 'react-icons/fa';

// IMPORT MESIN TOPOLOGI
import { ReactFlow, Controls, Background, addEdge, applyNodeChanges, applyEdgeChanges, Handle, Position, ReactFlowProvider, useReactFlow, BackgroundVariant, NodeResizer } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface NetworkMonitorProps {
  isAdmin: boolean;
  monitoredServers: any[];
  setMonitoredServers: (servers: any[]) => void;
}

const generateRandomLog = () => {
  const levels = ['INFO', 'WARNING', 'SECURITY'];
  const messages = ['DHCP Lease assigned', 'Admin session active', 'High CPU utilization', 'Port scan detected on WAN'];
  return { time: new Date().toLocaleTimeString('id-ID'), level: levels[Math.floor(Math.random() * levels.length)], msg: messages[Math.floor(Math.random() * messages.length)] };
};

const getDeviceIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'router': return <FaGlobe className="text-blue-500 text-xl" title="Router" />;
    case 'switch': return <FaExchangeAlt className="text-purple-500 text-xl" title="Switch" />;
    case 'server': return <FaServer className="text-orange-500 text-xl" title="Server" />;
    case 'access point': return <FaWifi className="text-emerald-500 text-xl" title="Access Point" />;
    case 'firewall': return <FaShieldAlt className="text-red-500 text-xl" title="Firewall" />;
    case 'cctv': return <FaVideo className="text-slate-500 text-xl" title="CCTV" />;
    case 'pc': return <FaLaptop className="text-slate-700 text-xl" title="PC Client" />;
    case 'area ruangan': return <FaVectorSquare className="text-orange-500 text-xl" title="Area Ruangan" />;
    default: return <FaNetworkWired className="text-gray-400 text-xl" />;
  }
};

// ==========================================
// CUSTOM NODE 1: PERANGKAT JARINGAN (BUG FIX STATUS)
// ==========================================
const CustomDeviceNode = ({ data }: any) => {
  const isDown = data.status === 'Putus';
  const isLooping = data.status === 'Looping';
  const isLoading = data.status === 'Memuat...' || !data.status;
  
  // Logika warna border (garis pinggir)
  let borderColor = 'border-slate-200 hover:border-orange-500';
  if (isDown) borderColor = 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
  else if (isLooping) borderColor = 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]';
  else if (data.status === 'Lancar') borderColor = 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]';

  // Logika warna badge (kotak kecil status)
  let badgeClass = 'bg-slate-100 text-slate-500 animate-pulse'; // Default loading abu-abu
  if (isDown) badgeClass = 'bg-red-100 text-red-600';
  else if (isLooping) badgeClass = 'bg-amber-100 text-amber-600';
  else if (data.status === 'Lancar') badgeClass = 'bg-emerald-100 text-emerald-600';

  return (
    <div className={`bg-white/95 backdrop-blur-md border-2 shadow-lg rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px] transition-all group ${borderColor}`}>
      <Handle type="target" position={Position.Top} id="t-top" className="w-3 h-3 bg-blue-500 border-2 border-white rounded-full" />
      <Handle type="target" position={Position.Left} id="t-left" className="w-3 h-3 bg-blue-500 border-2 border-white rounded-full" />
      
      <div className={`mb-3 p-4 rounded-full border shadow-inner group-hover:scale-110 transition-transform ${isDown ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-gray-100'}`}>
         {getDeviceIcon(data.type)}
      </div>
      
      <div className="text-center w-full">
        <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wide truncate" title={data.label}>{data.label}</p>
        <p className="text-[10px] font-mono text-slate-500 mt-1 bg-slate-100 px-2 py-0.5 rounded-md inline-block">{data.ip}</p>
        
        {/* PERBAIKAN: Selalu tampilkan badge, walaupun sedang loading */}
        <p className={`text-[9px] font-bold mt-2 px-2 py-0.5 rounded-full ${badgeClass}`}>
          {data.status || 'Memuat...'} {(!isLoading && !isDown && data.latency !== undefined) ? `(${data.latency}ms)` : ''}
        </p>
      </div>

      <Handle type="source" position={Position.Bottom} id="s-bottom" className="w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
      <Handle type="source" position={Position.Right} id="s-right" className="w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
    </div>
  );
};

// ==========================================
// CUSTOM NODE 2: AREA RUANGAN
// ==========================================
const AreaNode = ({ data, selected }: any) => {
  return (
    <>
      <NodeResizer color="#f97316" isVisible={selected} minWidth={200} minHeight={150} />
      <div className="bg-orange-500/5 border-2 border-dashed border-orange-400/50 rounded-3xl w-full h-full relative pointer-events-none">
        <div className="absolute top-4 left-6 text-orange-600/40 font-black text-2xl uppercase tracking-widest">{data.label}</div>
      </div>
    </>
  );
};

const nodeTypes = { customDevice: CustomDeviceNode, areaNode: AreaNode };

// ==========================================
// KOMPONEN TOPOLOGI BUILDER INTERAKTIF
// ==========================================
const TopologyBuilder = ({ monitoredServers, setMonitoredServers }: any) => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const { screenToFlowPosition } = useReactFlow();

  const [editingNode, setEditingNode] = useState<any>(null);
  const [editForm, setEditForm] = useState({ label: '', ip: '' });

  const [editingEdge, setEditingEdge] = useState<any>(null);
  const [edgeForm, setEdgeForm] = useState({ label: '' });

  useEffect(() => {
    const savedNodes = localStorage.getItem('pstar9_topo_nodes');
    const savedEdges = localStorage.getItem('pstar9_topo_edges');
    if (savedNodes && savedNodes !== '[]') {
      setNodes(JSON.parse(savedNodes));
      if (savedEdges && savedEdges !== '[]') {
        const parsedEdges = JSON.parse(savedEdges).map((e: any) => ({ ...e, type: 'smoothstep' }));
        setEdges(parsedEdges);
      }
    }
  }, []);

  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      localStorage.setItem('pstar9_topo_nodes', JSON.stringify(nodes));
      localStorage.setItem('pstar9_topo_edges', JSON.stringify(edges));
    }

    setNodes((nds) => nds.map((n) => {
      if (n.type === 'customDevice') {
        const server = monitoredServers.find((s: any) => s.id === n.id);
        if (server && (n.data.status !== server.status || n.data.latency !== server.latency)) {
          return { ...n, data: { ...n.data, status: server.status, latency: server.latency } };
        }
      }
      return n;
    }));

    setEdges((eds) => eds.map((e) => {
      const targetServer = monitoredServers.find((s: any) => s.id === e.target);
      const sourceServer = monitoredServers.find((s: any) => s.id === e.source);
      const isDown = targetServer?.status === 'Putus' || sourceServer?.status === 'Putus';
      return { 
        ...e, 
        type: 'smoothstep', 
        animated: !isDown, 
        style: { ...e.style, stroke: isDown ? '#ef4444' : '#10b981', strokeWidth: 3 } 
      };
    }));

  }, [nodes.length, edges.length, monitoredServers]);

  const onNodesChange = useCallback((changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true, style: { stroke: '#10b981', strokeWidth: 3 } }, eds)), []);

  const onNodesDelete = useCallback((deletedNodes: any[]) => {
    const deletedIds = deletedNodes.map(n => n.id);
    setMonitoredServers((prev: any[]) => prev.filter(s => !deletedIds.includes(s.id)));
  }, [setMonitoredServers]);

  const onDragOver = useCallback((event: any) => {
    event.preventDefault(); event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: any) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const isArea = type === 'Area Ruangan';
      const newId = `node_${Date.now()}`;
      
      const newNode = {
        id: newId, type: isArea ? 'areaNode' : 'customDevice', position,
        data: { label: isArea ? 'Nama Ruangan' : `New ${type}`, type: type, ip: isArea ? '' : '192.168.x.x', status: 'Memuat...', latency: 0 },
        style: isArea ? { width: 400, height: 300, zIndex: -1 } : undefined, 
      };
      
      setNodes((nds) => nds.concat(newNode));
      if (!isArea) setMonitoredServers((prev: any) => [...prev, { id: newId, name: newNode.data.label, ip: newNode.data.ip, type: type, status: 'Memuat...', latency: 0 }]);

      setEditingNode(newNode);
      setEditForm({ label: newNode.data.label, ip: newNode.data.ip });
    }, [screenToFlowPosition, setMonitoredServers]
  );

  const onNodeDoubleClick = useCallback((event: any, node: any) => {
    event.preventDefault(); setEditingNode(node); setEditForm({ label: node.data.label, ip: node.data.ip || '' });
  }, []);

  const handleSaveNodeEdit = () => {
    setNodes((nds) => nds.map((n) => n.id === editingNode.id ? { ...n, data: { ...n.data, label: editForm.label, ip: editForm.ip } } : n));
    if (editingNode.type !== 'areaNode') setMonitoredServers((prev: any[]) => prev.map(s => s.id === editingNode.id ? { ...s, name: editForm.label, ip: editForm.ip } : s));
    setEditingNode(null);
  };

  const handleDeleteNode = () => {
    if (window.confirm(`Yakin ingin menghapus ${editingNode.data.label}?`)) {
      setNodes((nds) => nds.filter((n) => n.id !== editingNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== editingNode.id && e.target !== editingNode.id));
      if (editingNode.type !== 'areaNode') setMonitoredServers((prev: any[]) => prev.filter((s) => s.id !== editingNode.id));
      setEditingNode(null);
    }
  };

  const onEdgeDoubleClick = useCallback((event: any, edge: any) => {
    event.preventDefault();
    setEditingEdge(edge);
    setEdgeForm({ label: edge.label || '' });
  }, []);

  const handleSaveEdgeEdit = () => {
    setEdges((eds) => eds.map((e) => {
      if (e.id === editingEdge.id) {
        return {
          ...e,
          label: edgeForm.label,
          labelStyle: { fill: '#334155', fontWeight: 800, fontSize: 10, fontFamily: 'monospace' },
          labelBgStyle: { fill: '#f8fafc', stroke: '#cbd5e1', strokeWidth: 1, rx: 6, ry: 6 },
          labelBgPadding: [8, 4],
        };
      }
      return e;
    }));
    setEditingEdge(null);
  };

  const handleDeleteEdge = () => {
    if (window.confirm('Putuskan koneksi kabel ini?')) {
      setEdges((eds) => eds.filter((e) => e.id !== editingEdge.id));
      setEditingEdge(null);
    }
  };

  const clearTopology = () => { 
    if(window.confirm('Yakin ingin menghapus seluruh peta dan menghentikan semua monitoring?')) { 
      setNodes([]); setEdges([]); setMonitoredServers([]); localStorage.removeItem('pstar9_topo_nodes'); localStorage.removeItem('pstar9_topo_edges');
    } 
  };

  return (
    <div className="flex flex-col h-[85vh] min-h-[750px] w-full bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner relative">
      
      {/* POP-UP MODAL EDIT NODE */}
      {editingNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <button onClick={() => setEditingNode(null)} className="absolute top-4 right-4 text-gray-400 hover:text-slate-800"><FaTimes className="text-xl"/></button>
            <div className="flex items-center gap-3 mb-6">
               <div className="p-3 bg-orange-100 text-orange-500 rounded-full">{getDeviceIcon(editingNode.data.type)}</div>
               <div><h3 className="font-bold text-lg text-slate-900">Edit {editingNode.data.type}</h3><p className="text-xs text-gray-500">Konfigurasi perangkat.</p></div>
            </div>
            <div className="space-y-4">
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nama Label / Ruangan</label>
                 <input type="text" value={editForm.label} onChange={(e) => setEditForm({...editForm, label: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:outline-none"/>
              </div>
              {editingNode.type !== 'areaNode' && (
                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">IP Address</label>
                   <input type="text" value={editForm.ip} onChange={(e) => setEditForm({...editForm, ip: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3 font-mono focus:ring-2 focus:ring-orange-500 focus:outline-none"/>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={handleDeleteNode} className="flex-1 bg-red-50 text-red-600 font-bold rounded-xl px-4 py-3.5 hover:bg-red-600 hover:text-white transition-colors border border-red-200">Hapus</button>
                <button onClick={handleSaveNodeEdit} className="flex-1 bg-slate-900 text-white font-bold rounded-xl px-4 py-3.5 hover:bg-orange-500 transition-colors">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL EDIT KABEL */}
      {editingEdge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative border-t-4 border-emerald-500">
            <button onClick={() => setEditingEdge(null)} className="absolute top-4 right-4 text-gray-400 hover:text-slate-800"><FaTimes className="text-xl"/></button>
            <div className="flex items-center gap-3 mb-6">
               <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full"><FaLink className="text-xl"/></div>
               <div><h3 className="font-bold text-lg text-slate-900">Edit Koneksi</h3><p className="text-xs text-gray-500">Ubah label kabel jaringan.</p></div>
            </div>
            <div className="space-y-4">
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Label Kabel (Opsional)</label>
                 <input type="text" value={edgeForm.label} onChange={(e) => setEdgeForm({...edgeForm, label: e.target.value})} placeholder="Cth: Port 1, Fiber 10G" className="w-full border border-gray-300 rounded-xl px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"/>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleDeleteEdge} className="flex-1 bg-red-50 text-red-600 font-bold rounded-xl px-4 py-3.5 hover:bg-red-600 hover:text-white transition-colors border border-red-200 flex justify-center items-center gap-2"><FaCut/> Putus Kabel</button>
                <button onClick={handleSaveEdgeEdit} className="flex-1 bg-slate-900 text-white font-bold rounded-xl px-4 py-3.5 hover:bg-emerald-500 transition-colors">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP-BAR PALETTE */}
      <div className="w-full bg-white border-b border-slate-200 p-3 flex items-center gap-4 overflow-x-auto z-10 shadow-sm shrink-0">
        <div className="flex flex-col pr-4 border-r border-slate-200 shrink-0">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Device Palette</h3>
          <p className="text-[9px] text-gray-500">Tarik ikon ke bawah ⬇️</p>
        </div>
        <div className="flex gap-2 items-center">
          {['Area Ruangan', 'Router', 'Switch', 'Server', 'PC', 'Access Point', 'Firewall', 'CCTV'].map((type) => (
            <div key={type} onDragStart={(e) => e.dataTransfer.setData('application/reactflow', type)} draggable className="flex items-center gap-2 p-2 px-3 bg-slate-50 border border-slate-200 rounded-xl cursor-grab hover:bg-orange-50 hover:border-orange-300 hover:shadow-md transition-all active:cursor-grabbing whitespace-nowrap">
              {getDeviceIcon(type)}
              <span className="text-xs font-bold text-slate-700">{type}</span>
            </div>
          ))}
        </div>
        <button onClick={clearTopology} className="ml-auto flex items-center justify-center gap-2 bg-red-50 text-red-500 border border-red-200 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-red-500 hover:text-white transition-all shrink-0">
          <FaTrash /> Bersihkan
        </button>
      </div>

      {/* CANVAS REACT FLOW */}
      <div className="flex-1 w-full relative" onDragOver={onDragOver} onDrop={onDrop}>
        
        <div className="absolute top-6 right-6 z-10 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200 pointer-events-none">
           <h4 className="text-xs font-extrabold text-slate-800 mb-3 uppercase tracking-wider">Keterangan Indikator</h4>
           <div className="flex items-center gap-3 mb-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div><span className="text-xs font-bold text-slate-600">Lancar (Kabel Mengalir)</span></div>
           <div className="flex items-center gap-3 mb-2"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></div><span className="text-xs font-bold text-slate-600">Delay / Ping Tinggi</span></div>
           <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div><span className="text-xs font-bold text-slate-600">Terputus (Kabel Berhenti)</span></div>
           <div className="mt-3 pt-3 border-t border-slate-100 text-[9px] text-gray-400"><strong>TIPS:</strong> Klik 2x pada Alat atau Kabel untuk Mengedit.</div>
        </div>

        <ReactFlow 
          nodes={nodes} edges={edges} 
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} 
          onConnect={onConnect} onNodeDoubleClick={onNodeDoubleClick} 
          onEdgeDoubleClick={onEdgeDoubleClick} 
          onNodesDelete={onNodesDelete} 
          nodeTypes={nodeTypes} fitView deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background variant={BackgroundVariant.Dots} color="#94a3b8" gap={24} size={2} />
          <Controls className="bg-white shadow-lg border-slate-200 rounded-lg overflow-hidden" />
        </ReactFlow>
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT (NETWORK MONITOR)
// ==========================================
export default function NetworkMonitor({ isAdmin, monitoredServers, setMonitoredServers }: NetworkMonitorProps) {
  const [activeTab, setActiveTab] = useState('topology'); 
  const [isSpeedtesting, setIsSpeedtesting] = useState(false);
  const [testPhase, setTestPhase] = useState(''); 
  const [speedResult, setSpeedResult] = useState<{ ping: number, download: number, upload: number } | null>(null);

  const [serverLoads, setServerLoads] = useState<Record<string, number>>({});
  const [globalPing, setGlobalPing] = useState(12);
  const [syslogs, setSyslogs] = useState<{time: string, level: string, msg: string}[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlobalPing(Math.floor(Math.random() * 15) + 10);
      setServerLoads(prev => {
        const newLoads: Record<string, number> = {};
        monitoredServers.forEach(server => {
          if (server.status === 'Putus' || server.status === 'Memuat...') newLoads[server.id] = 0; 
          else {
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

    const logInterval = setInterval(() => setSyslogs(prev => [...prev, generateRandomLog()].slice(-40)), 3500);
    return () => { clearInterval(interval); clearInterval(logInterval); };
  }, [monitoredServers]);

  useEffect(() => { if (activeTab === 'syslog' && logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [syslogs, activeTab]);

  const serversRef = useRef(monitoredServers);
  useEffect(() => { serversRef.current = monitoredServers; }, [monitoredServers]);

  useEffect(() => {
    const pingSemuaServer = async () => {
       if (serversRef.current.length === 0) return;
       const updatedServers = await Promise.all(serversRef.current.map(async (server) => {
           try {
               const res = await fetch('/api/ping', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ ip: server.ip }) });
               const data = await res.json();
               if (!data.success || data.status === 'Offline') return { ...server, status: 'Putus', latency: 0 };
               const latency = parseInt(data.time) || 0;
               return { ...server, status: latency > 100 ? 'Looping' : 'Lancar', latency };
           } catch(e) { return { ...server, status: 'Putus', latency: 0 }; }
       }));
       setMonitoredServers(updatedServers);
    };
    pingSemuaServer(); 
    const interval = setInterval(pingSemuaServer, 5000); 
    return () => clearInterval(interval);
  }, [setMonitoredServers]);

  const handleSpeedtest = async () => {
    setIsSpeedtesting(true); setSpeedResult(null);
    try {
      setTestPhase('Mengukur Ping...'); const pingStart = performance.now(); await fetch(`/api/speedtest?ping=true`); 
      setTestPhase('Menguji Download...'); const dlStart = performance.now(); const dlRes = await fetch(`/api/speedtest?download=true`); const dlBlob = await dlRes.blob();
      setTestPhase('Menguji Upload...'); const ulBlob = new Blob([new Uint8Array(1024*1024)]); const ulStart = performance.now(); await fetch('/api/speedtest', { method: 'POST', body: ulBlob });
      setSpeedResult({ ping: Math.round(performance.now() - pingStart), download: parseFloat((((dlBlob.size * 8) / ((performance.now() - dlStart) / 1000)) / 1000000).toFixed(2)), upload: parseFloat((((ulBlob.size * 8) / ((performance.now() - ulStart) / 1000)) / 1000000).toFixed(2)) });
    } catch (e) { alert("Error speedtest"); } finally { setIsSpeedtesting(false); setTestPhase(''); }
  };

  if (isAdmin) {
    const adminTabs = [
      { id: 'topology', icon: FaProjectDiagram, label: 'Visual Topologi' }, 
      { id: 'servers', icon: FaWifi, label: 'Tabel Status Node' }, 
      { id: 'overview', icon: FaGlobe, label: 'Live Traffic' },
      { id: 'syslog', icon: FaTerminal, label: 'Terminal Syslog' }, 
    ];

    return (
      <div className="max-w-7xl mx-auto animate-in fade-in p-2 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div><h2 className="text-3xl font-bold text-slate-900 tracking-tight">Enterprise NMS <span className="text-orange-500">Pstar9</span></h2><p className="text-gray-500 text-sm mt-1">Network Operations Center (NOC) Dashboard</p></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
            {adminTabs.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 px-5 py-4 rounded-xl font-bold text-sm transition-all border ${activeTab === item.id ? 'bg-orange-500 text-white border-orange-600 shadow-md' : 'bg-white text-slate-600 border-gray-200 hover:border-orange-300 hover:text-orange-500'}`}>
                <item.icon className="text-lg" /> {item.label}
              </button>
            ))}
          </div>

          <div className={`flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden ${activeTab === 'topology' ? 'p-2 md:p-4' : 'p-6 md:p-8'}`}>
            
            {activeTab === 'topology' && (
              <div className="animate-in fade-in h-full flex flex-col">
                <div className="flex justify-between items-center mb-4 px-2">
                  <div><h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><FaProjectDiagram className="text-orange-500"/> Network Topology Builder</h3></div>
                </div>
                <ReactFlowProvider><TopologyBuilder monitoredServers={monitoredServers} setMonitoredServers={setMonitoredServers} /></ReactFlowProvider>
              </div>
            )}

            {activeTab === 'servers' && (
              <div className="animate-in fade-in">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><FaServer className="text-orange-500"/> Tabel Status Node (Read-Only)</h3>
                <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm font-bold mb-6 border border-blue-200">ℹ️ Penambahan dan Penghapusan perangkat sekarang dilakukan secara visual melalui tab <strong>"Visual Topologi"</strong>.</div>
                <table className="w-full text-left border-collapse">
                  <thead><tr className="border-b-2 border-gray-100"><th className="py-3 px-4 text-xs font-bold text-gray-500">Tipe</th><th className="py-3 px-4 text-xs font-bold text-gray-500">Nama Perangkat</th><th className="py-3 px-4 text-xs font-bold text-gray-500">IP Address</th><th className="py-3 px-4 text-xs font-bold text-gray-500">Live Status</th></tr></thead>
                  <tbody>
                    {monitoredServers.map((server) => (
                      <tr key={server.id} className="border-b border-gray-50">
                        <td className="py-4 px-4 text-slate-600">{getDeviceIcon(server.type)}</td>
                        <td className="py-4 px-4 font-bold text-slate-900">{server.name}</td>
                        <td className="py-4 px-4 font-mono text-sm text-slate-600">{server.ip}</td>
                        <td className="py-4 px-4">
                           <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block w-20 text-center ${server.status === 'Lancar' ? 'bg-emerald-100 text-emerald-700' : server.status === 'Looping' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{server.status}</span>
                           <span className="text-[10px] text-gray-400 ml-2">{server.latency}ms</span>
                        </td>
                      </tr>
                    ))}
                    {monitoredServers.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">Belum ada perangkat di Topologi.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
            
            {activeTab === 'syslog' && (
              <div className="animate-in fade-in h-full flex flex-col"><h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FaTerminal className="text-orange-500"/> Live Syslog Server</h3><div className="flex-1 bg-[#0c0c0c] rounded-2xl p-4 font-mono text-xs overflow-y-auto text-slate-300 h-[400px]">{syslogs.map((log, i) => (<div key={i}>[{log.time}] <span className="text-amber-400">{log.level}</span> {log.msg}</div>))}<div ref={logEndRef}></div></div></div>
            )}
            {activeTab === 'overview' && (
              <div className="animate-in fade-in"><h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FaGlobe className="text-orange-500"/> Live Network Health</h3><div className="bg-slate-900 rounded-3xl p-6 shadow-xl h-[250px] flex items-end overflow-x-auto gap-2">{monitoredServers.map(s => <div key={s.id} className="w-12 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t flex flex-col justify-end items-center" style={{height:`${serverLoads[s.id]||10}%`}}><span className="text-[8px] text-white font-mono -mt-4 absolute">{serverLoads[s.id]}</span></div>)}</div></div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // TAMPILAN PUBLIK
  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 space-y-8">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8 flex flex-col sm:flex-row justify-between items-center gap-4">
         <div><h3 className="text-xl font-bold text-slate-900">Pstar9 Speedtest</h3><p className="text-xs text-gray-500">Uji kecepatan koneksi real-time.</p></div>
         <button onClick={handleSpeedtest} disabled={isSpeedtesting} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">{isSpeedtesting ? <FaSpinner className="animate-spin" /> : <FaTachometerAlt />} Mulai Test</button>
      </div>
      {speedResult && !isSpeedtesting && (
         <div className="grid grid-cols-3 gap-4 bg-slate-900 p-8 rounded-3xl text-center"><div className="text-emerald-400"><p className="text-sm font-bold text-gray-400">PING</p><p className="text-4xl font-bold">{speedResult.ping} ms</p></div><div className="text-blue-400 border-x border-slate-700"><p className="text-sm font-bold text-gray-400">DOWNLOAD</p><p className="text-4xl font-bold">{speedResult.download} Mbps</p></div><div className="text-purple-400"><p className="text-sm font-bold text-gray-400">UPLOAD</p><p className="text-4xl font-bold">{speedResult.upload} Mbps</p></div></div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {monitoredServers.map((server) => {
          let color = 'bg-gray-100 text-gray-500 border-gray-200';
          if (server.status === 'Lancar') color = 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100';
          else if (server.status === 'Looping') color = 'bg-amber-50 text-amber-700 border-amber-300 shadow-amber-100';
          else if (server.status === 'Putus') color = 'bg-red-50 text-red-700 border-red-200 shadow-red-100';

          return (
          <div key={server.id} className={`p-4 rounded-2xl border shadow-sm h-28 flex flex-col justify-between transition-colors ${color}`}>
            <div className="flex justify-between items-start"><p className="font-bold text-sm truncate pr-2">{server.name}</p>{getDeviceIcon(server.type)}</div>
            <div><span className="text-xs font-bold block mb-1 uppercase tracking-wider">{server.status}</span><span className="text-[10px] font-mono opacity-80">{server.ip} • {server.latency}ms</span></div>
          </div>
          );
        })}
      </div>
    </div>
  );
}