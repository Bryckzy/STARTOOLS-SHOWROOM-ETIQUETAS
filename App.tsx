
import React, { useState, useEffect, useMemo } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FileSpreadsheet, Download, Printer, X, Menu, Zap, RefreshCcw, Eye } from 'lucide-react';
import { LabelItem, LabelMode, CA4249_CONFIG } from './types';
import { downloadTemplate, parseExcel } from './services/excelService';
import { generatePDFBlob, downloadPDF } from './services/pdfService';
import SortableLabelItem from './components/SortableLabelItem';

const App: React.FC = () => {
  const [mode, setMode] = useState<LabelMode>(LabelMode.PRODUCT);
  const [labels, setLabels] = useState<LabelItem[]>([]);
  const [showOutline, setShowOutline] = useState<boolean>(true);
  const [startPosition, setStartPosition] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isTuning, setIsTuning] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  
  const [formData, setFormData] = useState({ sku: '', price: '', cxInner: '', measureText: '' });

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  // Gera o PDF sempre que houver mudança nos dados
  useEffect(() => {
    const url = generatePDFBlob(labels, mode, showOutline, startPosition);
    setPdfUrl(url);
    
    // Cleanup para evitar memory leaks com Blob URLs
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [labels, mode, showOutline, startPosition]);

  const handleModeChange = (newMode: LabelMode) => {
    if (labels.length > 0 && !confirm('A mudança de modo limpará a fila. Confirmar?')) return;
    setMode(newMode);
    setLabels([]);
    setFormData({ sku: '', price: '', cxInner: '', measureText: '' });
  };

  const handleAddLabel = () => {
    if (mode === LabelMode.PRODUCT && (!formData.sku && !formData.price)) return;
    if (mode === LabelMode.MEASURE && !formData.measureText) return;
    setLabels(prev => [{ id: crypto.randomUUID(), ...formData }, ...prev]);
    setFormData({ sku: '', price: '', cxInner: '', measureText: '' });
  };

  const handleUpdateLabel = (id: string, updates: Partial<LabelItem>) => {
    setLabels(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleDelete = (id: string) => setLabels(prev => prev.filter(l => l.id !== id));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await parseExcel(file, mode);
      setLabels(prev => [...prev, ...imported]);
    } catch (err) { alert('Falha na leitura do Excel.'); }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setLabels((items) => {
        const oldIdx = items.findIndex(i => i.id === active.id);
        const newIdx = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIdx, newIdx);
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-white overflow-hidden selection:bg-yellow-400 selection:text-black font-sans">
      
      {/* HEADER INDUSTRIAL */}
      <header className="h-20 bg-black border-b-[4px] border-zinc-900 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-zinc-900 rounded-xl lg:hidden text-yellow-400">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-yellow-400 p-2.5 rounded-xl shadow-[0_0_30px_rgba(250,204,21,0.4)]">
              <Zap size={22} className="text-black" />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-xl font-black tracking-tighter uppercase text-white leading-none">STARTOOLS PDF-LIVE</h1>
              <span className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.4em] block mt-1 opacity-70">WYSIWYG PRINT ENGINE</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center bg-zinc-900/50 rounded-2xl p-1 border-2 border-zinc-800">
          <button onClick={() => handleModeChange(LabelMode.PRODUCT)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === LabelMode.PRODUCT ? 'bg-yellow-400 text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>Produtos</button>
          <button onClick={() => handleModeChange(LabelMode.MEASURE)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === LabelMode.MEASURE ? 'bg-yellow-400 text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>Medidas</button>
        </div>

        <button
          onClick={() => downloadPDF(pdfUrl)}
          disabled={labels.length === 0}
          className="bg-yellow-400 hover:bg-white disabled:opacity-20 text-black px-8 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-all border-2 border-black shadow-[0_10px_30px_rgba(250,204,21,0.2)]"
        >
          <Printer size={18} /> <span>Baixar PDF</span>
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 absolute lg:relative w-full lg:w-[480px] h-full bg-zinc-950 border-r-[4px] border-zinc-900 flex flex-col transition-all duration-300 z-40`}>
          <div className="p-6 space-y-8 overflow-y-auto no-scrollbar">
            
            <div className="space-y-4 p-6 bg-black rounded-[2rem] border-2 border-zinc-800 shadow-xl">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Entrada de Dados</span>
              {mode === LabelMode.PRODUCT ? (
                <>
                  <input type="text" placeholder="SKU / CÓDIGO" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="w-full px-6 py-4 bg-zinc-900 border-2 border-zinc-800 text-white rounded-xl outline-none focus:border-yellow-400 text-xs font-black uppercase placeholder:text-zinc-700" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="PREÇO" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full px-6 py-4 bg-zinc-900 border-2 border-zinc-800 text-yellow-400 rounded-xl outline-none focus:border-yellow-400 text-xs font-black placeholder:text-zinc-700" />
                    <input type="text" placeholder="OBS" value={formData.cxInner} onChange={e => setFormData({ ...formData, cxInner: e.target.value })} className="w-full px-6 py-4 bg-zinc-900 border-2 border-zinc-800 text-white rounded-xl outline-none focus:border-yellow-400 text-xs font-black uppercase placeholder:text-zinc-700" />
                  </div>
                </>
              ) : (
                <input type="text" placeholder="TEXTO DA MEDIDA" value={formData.measureText} onChange={e => setFormData({ ...formData, measureText: e.target.value })} className="w-full px-6 py-4 bg-zinc-900 border-2 border-zinc-800 text-white rounded-xl outline-none focus:border-yellow-400 text-xs font-black uppercase placeholder:text-zinc-700" />
              )}
              <button onClick={handleAddLabel} className="w-full bg-yellow-400 text-black py-4 rounded-xl font-black text-[12px] uppercase tracking-[0.1em] border-2 border-black hover:bg-white transition-all shadow-lg active:scale-95">Adicionar na Fila</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => downloadTemplate(mode)} className="flex items-center justify-center gap-3 py-4 bg-zinc-900 rounded-xl text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-white transition-all border-2 border-zinc-800">
                <Download size={16}/> Modelo Excel
              </button>
              <label className="flex items-center justify-center gap-3 py-4 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-emerald-500 hover:text-white transition-all border-2 border-emerald-500/20">
                <FileSpreadsheet size={16}/> Importar <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>

            <div className="pt-6 border-t-2 border-zinc-900">
              <div className="flex justify-between items-center mb-6 px-2">
                <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em]">Gestão de Fila ({labels.length})</span>
                <button onClick={() => setLabels([])} className="text-[9px] font-black text-rose-500 hover:text-rose-400 uppercase flex items-center gap-2">
                  <RefreshCcw size={12}/> Limpar Tudo
                </button>
              </div>
              <div className="space-y-4 pb-40">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={labels.map(l => l.id)} strategy={verticalListSortingStrategy}>
                    {labels.map(label => (
                      <SortableLabelItem 
                        key={label.id} 
                        label={label} 
                        mode={mode} 
                        onDelete={handleDelete} 
                        onUpdate={handleUpdateLabel}
                        onToggleTools={(isOpen) => setIsTuning(isOpen)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1 relative flex flex-col bg-zinc-900 overflow-hidden">
          <div className={`absolute inset-0 bg-black/60 z-30 pointer-events-none transition-all duration-500 backdrop-blur-sm ${isTuning ? 'opacity-100' : 'opacity-0'}`} />

          <div className="h-16 bg-black border-b-[2px] border-zinc-800 px-6 flex items-center justify-between z-40 shrink-0">
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-3">
                  <Eye size={18} className="text-yellow-400" />
                  <span className="text-[11px] font-black text-white uppercase tracking-widest">Visualização Real (A4)</span>
               </div>
               <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={showOutline} onChange={e => setShowOutline(e.target.checked)} className="peer sr-only" />
                  <div className="w-10 h-5 bg-zinc-800 rounded-full transition-colors peer-checked:bg-yellow-400 border-2 border-zinc-700 relative">
                    <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase group-hover:text-white transition-colors">Contornos</span>
                </label>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-zinc-500 uppercase mr-2">Pular Posições:</span>
                   <input type="number" min="0" max="125" value={startPosition} onChange={e => setStartPosition(Math.max(0, parseInt(e.target.value) || 0))} className="w-16 bg-zinc-900 border-2 border-zinc-800 text-yellow-400 text-[12px] font-black p-1.5 rounded-lg text-center outline-none focus:border-yellow-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-zinc-900 relative">
             {pdfUrl ? (
               <iframe 
                key={pdfUrl} // Força o refresh do frame ao mudar o Blob
                src={`${pdfUrl}#toolbar=1&navpanes=0&view=FitH`} 
                className="w-full h-full border-none"
                title="PDF Preview"
               />
             ) : (
               <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-zinc-700">
                  <Printer size={64} strokeWidth={1} />
                  <p className="font-black text-xs uppercase tracking-[0.3em]">Aguardando Dados...</p>
               </div>
             )}
          </div>
        </section>
      </main>

      <footer className="h-10 bg-black border-t-2 border-zinc-900 px-8 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.4em] text-zinc-700">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3 text-yellow-500/40">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
            <span>PDF ENGINE ONLINE</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
             <span className="text-zinc-500">Benchmark:</span>
             <span className="text-white">10PT = 26.0MM</span>
          </div>
        </div>
        <div className="italic text-yellow-600/30 font-black">STARTOOLS PRECISION v16.0 - CA4249</div>
      </footer>
    </div>
  );
};

export default App;
