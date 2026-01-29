
import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent, 
  DragStartEvent,
  DragOverlay, 
  defaultDropAnimationSideEffects 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { FileSpreadsheet, Download, Printer, Zap, RefreshCcw, Eye, Plus, List, AlignCenter, AlignLeft } from 'lucide-react';
import { LabelItem, LabelMode } from './types';
import { downloadTemplate, parseExcel } from './services/excelService';
import { generatePDFBlob, downloadPDF } from './services/pdfService';
import SortableLabelItem from './components/SortableLabelItem';

const App: React.FC = () => {
  const [mode, setMode] = useState<LabelMode>(LabelMode.PRODUCT);
  const [labels, setLabels] = useState<LabelItem[]>([]);
  const [showOutline, setShowOutline] = useState<boolean>(true);
  const [startPosition, setStartPosition] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [textAlign, setTextAlign] = useState<'left' | 'center'>('center');
  const [formData, setFormData] = useState({ sku: '', price: '', cxInner: '', measureText: '' });
  
  // Estado para gerenciar o item que está sendo arrastado no momento
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const url = generatePDFBlob(labels, mode, showOutline, startPosition, textAlign);
    setPdfUrl(url);
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [labels, mode, showOutline, startPosition, textAlign]);

  const handleModeChange = (newMode: LabelMode) => {
    if (labels.length > 0 && !confirm('Limpar fila para trocar de modo?')) return;
    setMode(newMode);
    setLabels([]);
    setFormData({ sku: '', price: '', cxInner: '', measureText: '' });
  };

  const handleAddLabel = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (mode === LabelMode.PRODUCT && (!formData.sku && !formData.price)) return;
    if (mode === LabelMode.MEASURE && !formData.measureText) return;
    setLabels(prev => [{ id: crypto.randomUUID(), ...formData }, ...prev]);
    setFormData({ sku: '', price: '', cxInner: '', measureText: '' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const newLabels = await parseExcel(file, mode);
        setLabels(prev => [...newLabels, ...prev]);
        e.target.value = '';
      } catch (err) { alert('Erro no processamento.'); }
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setLabels((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const handleDelete = (id: string) => setLabels(prev => prev.filter(label => label.id !== id));
  const handleUpdateLabel = (id: string, updates: Partial<LabelItem>) => {
    setLabels(prev => prev.map(label => label.id === id ? { ...label, ...updates } : label));
  };

  const activeItem = labels.find(l => l.id === activeId);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f8fafc] text-[#18181b] overflow-hidden">
      
      {/* HEADER PREMIUM */}
      <header className="h-16 lg:h-20 bg-[#18181b] text-white flex items-center justify-between px-6 lg:px-12 z-50 shrink-0 shadow-2xl">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="bg-[#facc15] p-2.5 rounded-2xl shadow-[0_0_40px_rgba(250,204,21,0.3)] transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
            <Zap size={22} className="text-black fill-black" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm lg:text-xl font-black tracking-tight uppercase leading-none">
              <span className="text-[#facc15]">STARTOOLS</span> <span className="text-white">SHOWROOM</span> <span className="text-[#bef264]">ETIQUETAS</span>
            </h1>
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.4em] block mt-1">Industrial Precision v16</span>
          </div>
        </div>

        {/* MODOS DESKTOP */}
        <div className="hidden lg:flex items-center bg-zinc-800/60 p-1.5 rounded-[22px] border border-zinc-700/50 backdrop-blur-md">
          <button onClick={() => handleModeChange(LabelMode.PRODUCT)} className={`px-8 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all duration-500 ${mode === LabelMode.PRODUCT ? 'bg-[#facc15] text-black shadow-lg scale-105' : 'text-zinc-500 hover:text-white'}`}>Produtos</button>
          <button onClick={() => handleModeChange(LabelMode.MEASURE)} className={`px-8 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all duration-500 ${mode === LabelMode.MEASURE ? 'bg-[#facc15] text-black shadow-lg scale-105' : 'text-zinc-500 hover:text-white'}`}>Medidas</button>
        </div>

        <button
          onClick={() => downloadPDF(pdfUrl)}
          disabled={labels.length === 0}
          className="bg-[#bef264] text-black px-6 lg:px-10 h-11 lg:h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all duration-300 disabled:opacity-20 shadow-[0_15px_40px_rgba(190,242,100,0.3)] btn-hover-effect border-none"
        >
          <Printer size={20} /> <span className="hidden sm:inline">Gerar Arquivo</span>
        </button>
      </header>

      {/* MOBILE TABS */}
      <div className="flex lg:hidden bg-[#18181b] p-1 shrink-0 z-40 border-t border-zinc-800">
        <button onClick={() => setActiveTab('edit')} className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded-2xl transition-all ${activeTab === 'edit' ? 'bg-zinc-800/80 text-[#facc15]' : 'text-zinc-600'}`}>
          <List size={18} /> Editar
        </button>
        <button onClick={() => setActiveTab('preview')} className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded-2xl transition-all ${activeTab === 'preview' ? 'bg-zinc-800/80 text-[#bef264]' : 'text-zinc-600'}`}>
          <Eye size={18} /> Preview
        </button>
      </div>

      <main className="flex-1 flex overflow-hidden">
        {/* LADO ESQUERDO: CONTROLES */}
        <section className={`
          flex-col w-full lg:w-[480px] bg-white border-r border-slate-100 shrink-0
          ${activeTab === 'edit' ? 'flex' : 'hidden lg:flex'}
        `}>
          <div className="p-6 lg:p-10 space-y-8 overflow-y-auto no-scrollbar flex-1 pb-48">
            
            <form onSubmit={handleAddLabel} className="space-y-6 p-8 bg-[#fafafa] rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Entrada Manual</span>
              <div className="space-y-4">
                {mode === LabelMode.PRODUCT ? (
                  <>
                    <input type="text" placeholder="CÓDIGO / SKU" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-yellow-400/10 focus:border-[#facc15] text-sm font-bold uppercase transition-all shadow-sm" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="PREÇO" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="h-14 px-6 bg-white border border-slate-200 text-yellow-600 font-black rounded-2xl outline-none focus:border-[#facc15] shadow-sm" />
                      <input type="text" placeholder="OBS" value={formData.cxInner} onChange={e => setFormData({ ...formData, cxInner: e.target.value })} className="h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#facc15] text-sm font-bold uppercase shadow-sm" />
                    </div>
                  </>
                ) : (
                  <input type="text" placeholder="TEXTO DA MEDIDA" value={formData.measureText} onChange={e => setFormData({ ...formData, measureText: e.target.value })} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#facc15] text-sm font-bold uppercase shadow-sm" />
                )}
                <button type="submit" className="w-full h-14 bg-[#18181b] text-[#facc15] rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 btn-hover-effect">
                  <Plus size={20} /> Adicionar na Fila
                </button>
              </div>
            </form>

            <div className="space-y-3">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Alinhamento</span>
               <div className="bg-slate-100 p-1.5 rounded-[20px] flex items-center gap-1.5 border border-slate-200/50 shadow-inner">
                  <button onClick={() => setTextAlign('left')} className={`flex-1 py-3 rounded-[16px] flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all duration-300 ${textAlign === 'left' ? 'bg-white text-[#18181b] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                    <AlignLeft size={16} /> Esquerda
                  </button>
                  <button onClick={() => setTextAlign('center')} className={`flex-1 py-3 rounded-[16px] flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all duration-300 ${textAlign === 'center' ? 'bg-white text-[#18181b] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                    <AlignCenter size={16} /> Centro
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => downloadTemplate(mode)} className="flex items-center justify-center gap-3 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-500 uppercase transition-all shadow-sm btn-hover-effect">
                <Download size={18}/> Modelo
              </button>
              <label className="flex items-center justify-center gap-3 py-4 bg-lime-50 text-lime-700 border border-lime-200 rounded-2xl text-[10px] font-black uppercase cursor-pointer transition-all shadow-sm btn-hover-effect">
                <FileSpreadsheet size={18}/> Importar <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[11px] font-black text-[#18181b] uppercase tracking-widest">Fila de Produção</h3>
                <button onClick={() => setLabels([])} className="text-[10px] font-black text-slate-300 hover:text-rose-500 uppercase flex items-center gap-2 transition-all active:scale-90">
                  <RefreshCcw size={14}/> Limpar
                </button>
              </div>
              
              <div className="space-y-4">
                <DndContext 
                  sensors={sensors} 
                  collisionDetection={closestCenter} 
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={labels.map(l => l.id)} strategy={verticalListSortingStrategy}>
                    {labels.map(label => (
                      <SortableLabelItem 
                        key={label.id} 
                        label={label} 
                        mode={mode} 
                        onDelete={handleDelete} 
                        onUpdate={handleUpdateLabel}
                        isBeingDragged={activeId === label.id}
                      />
                    ))}
                  </SortableContext>

                  <DragOverlay adjustScale={true} dropAnimation={{
                    duration: 350,
                    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                    sideEffects: defaultDropAnimationSideEffects({
                      styles: { active: { opacity: '0.5' } },
                    }),
                  }}>
                    {activeId && activeItem ? (
                      <div className="w-full scale-[1.05]">
                         <SortableLabelItem 
                            label={activeItem} 
                            mode={mode} 
                            onDelete={() => {}} 
                            onUpdate={() => {}}
                            isOverlay
                          />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
                
                {labels.length === 0 && (
                  <div className="py-24 text-center text-slate-200 border-2 border-dashed border-slate-100 rounded-[48px] flex flex-col items-center justify-center opacity-40">
                    <List size={54} className="mb-4 opacity-10" />
                    <span className="text-[11px] font-black uppercase tracking-[0.4em]">Fila Vazia</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* LADO DIREITO: PREVIEW */}
        <section className={`
          flex-1 bg-zinc-100 p-4 lg:p-10 relative overflow-hidden flex flex-col items-center
          ${activeTab === 'preview' ? 'flex' : 'hidden lg:flex'}
        `}>
          <div className="max-w-4xl w-full h-full flex flex-col gap-6">
            <div className="glass-card p-5 rounded-[30px] shadow-2xl border border-white flex flex-wrap items-center justify-between gap-6 z-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#18181b] rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-105">
                  <Eye size={22} className="text-[#bef264]" />
                </div>
                <span className="text-[11px] font-black uppercase text-[#18181b] tracking-tight">Preview Digital</span>
              </div>

              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-4 bg-white/60 px-5 py-3 rounded-2xl border border-white shadow-sm">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">Grade Guia</span>
                    <button 
                      onClick={() => setShowOutline(!showOutline)}
                      className={`w-14 h-7 rounded-full transition-all duration-300 relative shadow-inner flex items-center ${showOutline ? 'bg-[#bef264]' : 'bg-slate-200'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute transition-all duration-300 ${showOutline ? 'left-[32px]' : 'left-[4px]'}`} />
                    </button>
                 </div>

                <div className="flex items-center gap-4 bg-[#18181b] text-white px-6 py-3.5 rounded-2xl shadow-xl">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pulo:</span>
                  <input 
                    type="number" min="0" max="125" value={startPosition} 
                    onChange={e => setStartPosition(Math.min(125, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-14 bg-zinc-900 text-[#facc15] text-[14px] font-black text-center outline-none rounded-xl py-1 focus:ring-1 focus:ring-[#facc15]/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 bg-white rounded-[50px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.1)] border-8 border-white relative">
              {pdfUrl && labels.length > 0 ? (
                <iframe src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`} className="w-full h-full border-none" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-8">
                  <div className="w-36 h-36 bg-slate-50 rounded-[48px] flex items-center justify-center animate-float">
                    <Printer size={64} strokeWidth={1} className="opacity-10" />
                  </div>
                  <p className="text-[14px] font-black uppercase tracking-[0.5em] text-[#18181b]">Aguardando Dados</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {activeTab === 'edit' && labels.length > 0 && (
        <div className="lg:hidden fixed bottom-12 right-8 z-[100]">
          <button onClick={() => setActiveTab('preview')} className="bg-[#bef264] text-black w-20 h-20 rounded-[30px] shadow-2xl flex items-center justify-center active:scale-90 transition-all border-b-8 border-lime-600">
            <Eye size={36} />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
