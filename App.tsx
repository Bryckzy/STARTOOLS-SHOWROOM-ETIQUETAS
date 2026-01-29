
import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  TouchSensor,
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
import { FileSpreadsheet, Download, Printer, Zap, RefreshCcw, Eye, Plus, List, AlignCenter, AlignLeft, CheckCircle2, AlertTriangle, Info, HelpCircle } from 'lucide-react';
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
  const [formData, setFormData] = useState({ sku: '', price: '', cxInner: '', measureText: '', quantity: '1' });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const url = generatePDFBlob(labels, mode, showOutline, startPosition, textAlign);
    setPdfUrl(url);
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [labels, mode, showOutline, startPosition, textAlign]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleModeChange = (newMode: LabelMode) => {
    if (labels.length > 0 && !confirm('A fila atual será removida. Continuar?')) return;
    setMode(newMode);
    setLabels([]);
    setFormData({ sku: '', price: '', cxInner: '', measureText: '', quantity: '1' });
  };

  const executeAddAction = () => {
    const qty = Math.max(1, parseInt(formData.quantity) || 1);
    const newItems: LabelItem[] = [];
    for (let i = 0; i < qty; i++) {
      newItems.push({ id: crypto.randomUUID(), ...formData });
    }
    setLabels(prev => [...newItems, ...prev]);
    showToast(`${qty} ${qty > 1 ? 'itens adicionados' : 'item adicionado'} com sucesso!`);
    setFormData({ ...formData, sku: '', price: '', cxInner: '', measureText: '', quantity: '1' });
    setShowConfirmModal(false);
  };

  const handleAddLabel = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (mode === LabelMode.PRODUCT) {
      const isMissingData = !formData.sku || !formData.price || !formData.cxInner;
      if (isMissingData) {
        if (!formData.sku && !formData.price && !formData.cxInner) return;
        setShowConfirmModal(true);
        return;
      }
    } else {
      if (!formData.measureText) return;
    }
    executeAddAction();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const newLabels = await parseExcel(file, mode);
        setLabels(prev => [...newLabels, ...prev]);
        showToast(`${newLabels.length} itens importados com sucesso`);
        e.target.value = '';
      } catch (err) { alert('Erro no processamento do arquivo.'); }
    }
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

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
      
      {/* MODAL DE CONFIRMAÇÃO STARTOOLS */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-[#18181b]/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-[0_50px_100px_rgba(0,0,0,0.4)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={40} className="text-amber-500" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-[#18181b] mb-4">Campos Incompletos</h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                Você deixou campos vazios. Deseja adicionar as etiquetas mesmo assim?
              </p>
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={executeAddAction}
                  className="w-full h-14 bg-[#18181b] text-[#facc15] rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl"
                >
                  Sim, Adicionar
                </button>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full h-14 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                >
                  Voltar e Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[1000] transition-all duration-500 flex items-center gap-3 bg-[#18181b] text-[#bef264] px-6 py-4 rounded-[24px] shadow-2xl border border-zinc-700 ${toast.visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-90 pointer-events-none'}`}>
        <CheckCircle2 size={20} />
        <span className="text-[11px] font-black uppercase tracking-widest">{toast.message}</span>
      </div>

      {/* HEADER PREMIUM */}
      <header className="h-16 lg:h-20 bg-[#18181b] text-white flex items-center justify-between px-4 lg:px-12 z-50 shrink-0 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="bg-[#facc15] p-2.5 rounded-xl lg:rounded-2xl shadow-[0_0_30px_rgba(250,204,21,0.3)]">
            <Zap size={20} className="text-black fill-black" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[11px] lg:text-lg font-black tracking-tight uppercase leading-none">
              <span className="text-[#facc15]">STARTOOLS</span> <span className="text-white">SHOWROOM</span> <span className="text-[#bef264]">ETIQUETAS</span>
            </h1>
            <span className="text-[8px] lg:text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em] mt-1">Industrial Precision</span>
          </div>
        </div>

        {/* MODO DESKTOP */}
        <div className="hidden lg:flex items-center bg-zinc-800/40 p-1 rounded-[22px] border border-zinc-700/30">
          <button onClick={() => handleModeChange(LabelMode.PRODUCT)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${mode === LabelMode.PRODUCT ? 'bg-[#facc15] text-black shadow-lg scale-105' : 'text-zinc-500 hover:text-white'}`}>Produtos</button>
          <button onClick={() => handleModeChange(LabelMode.MEASURE)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${mode === LabelMode.MEASURE ? 'bg-[#facc15] text-black shadow-lg scale-105' : 'text-zinc-500 hover:text-white'}`}>Medidas</button>
        </div>

        <button
          onClick={() => downloadPDF(pdfUrl)}
          disabled={labels.length === 0}
          className="btn-generate h-10 lg:h-14 px-5 lg:px-10 rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-[11px] uppercase tracking-widest flex items-center gap-3 disabled:opacity-20 shadow-lg border-none"
        >
          <Printer size={18} /> <span className="hidden sm:inline">Gerar Arquivo</span>
        </button>
      </header>

      {/* MOBILE TABS */}
      <div className="flex lg:hidden bg-[#18181b] p-1 shrink-0 z-40 border-t border-zinc-800">
        <button onClick={() => setActiveTab('edit')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl transition-all ${activeTab === 'edit' ? 'bg-zinc-800 text-[#facc15]' : 'text-zinc-600'}`}>
          <List size={18} /> Editar
        </button>
        <button onClick={() => setActiveTab('preview')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl transition-all ${activeTab === 'preview' ? 'bg-zinc-800 text-[#bef264]' : 'text-zinc-600'}`}>
          <Eye size={18} /> Preview
        </button>
      </div>

      <main className="flex-1 flex overflow-hidden">
        {/* LADO ESQUERDO: CONTROLES */}
        <section className={`
          flex-col w-full lg:w-[460px] bg-white border-r border-slate-100 shrink-0 overflow-y-auto no-scrollbar
          ${activeTab === 'edit' ? 'flex' : 'hidden lg:flex'}
        `}>
          <div className="p-5 lg:p-10 space-y-8 pb-40">
            
            <div className="lg:hidden bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-200 shadow-inner">
               <button onClick={() => handleModeChange(LabelMode.PRODUCT)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${mode === LabelMode.PRODUCT ? 'bg-[#facc15] text-black shadow-sm' : 'text-slate-400'}`}>Produtos</button>
               <button onClick={() => handleModeChange(LabelMode.MEASURE)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${mode === LabelMode.MEASURE ? 'bg-[#facc15] text-black shadow-sm' : 'text-slate-400'}`}>Medidas</button>
            </div>

            <form onSubmit={handleAddLabel} className="space-y-6 p-6 lg:p-8 bg-[#fafafa] rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Plus size={40} className="text-black" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Entrada Manual</span>
              <div className="space-y-4">
                {mode === LabelMode.PRODUCT ? (
                  <>
                    <input type="text" placeholder="SKU / CÓDIGO" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#facc15] text-xs font-bold uppercase transition-all shadow-sm" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="PREÇO" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="h-14 px-6 bg-white border border-slate-200 text-yellow-600 font-black rounded-2xl outline-none focus:border-[#facc15] shadow-sm" />
                      <input type="text" placeholder="OBS" value={formData.cxInner} onChange={e => setFormData({ ...formData, cxInner: e.target.value })} className="h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#facc15] text-xs font-bold uppercase shadow-sm" />
                    </div>
                  </>
                ) : (
                  <input type="text" placeholder="TEXTO DA ETIQUETA" value={formData.measureText} onChange={e => setFormData({ ...formData, measureText: e.target.value })} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#facc15] text-xs font-bold uppercase shadow-sm" />
                )}
                
                <div className="flex items-end gap-4 pt-2">
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 ml-2 tracking-widest">Qtd</span>
                    <input 
                      type="number" min="1" max="126" value={formData.quantity} 
                      onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-20 h-14 bg-[#bef264] text-black border-none rounded-2xl outline-none text-center font-black text-[14px] shadow-lg focus:ring-4 focus:ring-lime-400/20 transition-all" 
                    />
                  </div>
                  <button type="submit" className="flex-1 h-14 bg-[#bef264] text-black rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_15px_30px_rgba(190,242,100,0.2)] flex items-center justify-center gap-3 active:scale-95 transition-all hover:brightness-105">
                    <Plus size={20} /> Adicionar {parseInt(formData.quantity) > 1 ? `${formData.quantity} Itens` : 'Item'}
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-4">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Configuração de Alinhamento</span>
               <div className="bg-slate-100 p-1.5 rounded-[22px] flex items-center gap-1.5 border border-slate-200/50 shadow-inner">
                  <button onClick={() => setTextAlign('left')} className={`flex-1 py-3 rounded-[18px] flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all duration-300 ${textAlign === 'left' ? 'bg-white text-[#18181b] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                    <AlignLeft size={18} /> Esquerda
                  </button>
                  <button onClick={() => setTextAlign('center')} className={`flex-1 py-3 rounded-[18px] flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all duration-300 ${textAlign === 'center' ? 'bg-white text-[#18181b] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                    <AlignCenter size={18} /> Centro
                  </button>
               </div>
            </div>

            <div className="space-y-5 pt-2">
               <div className="flex items-center gap-2 px-1">
                 <HelpCircle size={14} className="text-slate-400" />
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Extrair dados de planilha</h3>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-2">
                    <button onClick={() => downloadTemplate(mode)} className="flex items-center justify-center gap-3 h-14 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-500 uppercase active:scale-95 transition-all shadow-sm group">
                      <Download size={18} className="group-hover:-translate-y-1 transition-transform" /> Modelo
                    </button>
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wider text-center">1. Baixe o layout padrão</span>
                 </div>

                 <div className="flex flex-col gap-2">
                    <label className="flex items-center justify-center gap-3 h-14 bg-[#bef264]/10 text-[#5c8a00] border border-[#bef264]/30 rounded-2xl text-[10px] font-black uppercase cursor-pointer active:scale-95 transition-all shadow-sm group">
                      <FileSpreadsheet size={18} className="group-hover:scale-110 transition-transform" /> Importar 
                      <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <span className="text-[8px] font-black text-[#8eb344] uppercase tracking-wider text-center">2. Suba o arquivo preenchido</span>
                 </div>
               </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <div className="flex justify-between items-center mb-6 px-1">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  <h3 className="text-[11px] font-black text-[#18181b] uppercase tracking-widest">Fila Industrial ({labels.length})</h3>
                </div>
                <button onClick={() => setLabels([])} className="text-[9px] font-black text-slate-300 hover:text-rose-500 uppercase flex items-center gap-2 active:scale-90 transition-all">
                  <RefreshCcw size={14}/> Limpar Tudo
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

                  <DragOverlay dropAnimation={{
                    duration: 350,
                    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
                  }}>
                    {activeId && activeItem ? (
                      <div className="w-full shadow-[0_30px_60px_rgba(0,0,0,0.15)] scale-[1.03]">
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
                  <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[48px] flex flex-col items-center justify-center opacity-30 grayscale transition-all hover:opacity-50">
                    <List size={50} className="mb-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">Fila Vazia</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* LADO DIREITO: PREVIEW - REFINADO PARA MOBILE */}
        <section className={`
          flex-1 bg-zinc-100 p-2 lg:p-10 relative overflow-hidden flex flex-col items-center
          ${activeTab === 'preview' ? 'flex' : 'hidden lg:flex'}
        `}>
          <div className="max-w-4xl w-full h-full flex flex-col gap-4 lg:gap-6">
            
            {/* GLASS CARD RESPONSIVO */}
            <div className="glass-card p-3 lg:p-6 rounded-[24px] lg:rounded-[30px] shadow-2xl border border-white flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
              <div className="flex items-center gap-3 lg:gap-4 self-start sm:self-auto">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#18181b] rounded-xl lg:rounded-2xl flex items-center justify-center shadow-xl shrink-0">
                  <Eye size={18} className="text-[#bef264]" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[8px] lg:text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Preview</span>
                   <span className="text-[10px] lg:text-[11px] font-black uppercase text-[#18181b] tracking-tight truncate max-w-[120px] sm:max-w-none">Arquivo Digital</span>
                </div>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto gap-3 lg:gap-6">
                 {/* GRADE GUIA */}
                 <div className="flex flex-1 sm:flex-initial items-center justify-between sm:justify-start gap-3 lg:gap-4 bg-white/60 px-3 lg:px-5 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl border border-white shadow-sm min-w-[90px]">
                    <span className="text-[8px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">Grade</span>
                    <button 
                      onClick={() => setShowOutline(!showOutline)}
                      className={`w-10 lg:w-12 h-5 lg:h-6 rounded-full transition-all duration-300 relative shadow-inner flex items-center px-1 shrink-0 ${showOutline ? 'bg-[#bef264]' : 'bg-slate-200'}`}
                    >
                      <div className={`w-3.5 lg:w-4 h-3.5 lg:h-4 bg-white rounded-full shadow-md transition-all duration-300 ${showOutline ? 'translate-x-4.5 lg:translate-x-6' : 'translate-x-0'}`} />
                    </button>
                 </div>

                {/* PULO DE POSIÇÃO */}
                <div className="flex flex-1 sm:flex-initial items-center justify-between sm:justify-start gap-3 lg:gap-4 bg-[#18181b] text-white px-3 lg:px-5 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl shadow-2xl min-w-[80px]">
                  <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-zinc-500">Pulo</span>
                  <input 
                    type="number" min="0" max="125" value={startPosition} 
                    onChange={e => setStartPosition(Math.min(125, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-10 lg:w-12 bg-zinc-900 text-[#facc15] text-[12px] lg:text-[14px] font-black text-center outline-none rounded-lg lg:rounded-xl py-0.5"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 bg-white rounded-[32px] lg:rounded-[60px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.12)] border-4 lg:border-8 border-white relative">
              {pdfUrl && labels.length > 0 ? (
                <iframe src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`} className="w-full h-full border-none" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-200 gap-4 lg:gap-6">
                  <div className="w-24 h-24 lg:w-32 lg:h-32 bg-slate-50 rounded-[40px] lg:rounded-[48px] flex items-center justify-center animate-pulse">
                    {/* Fixed invalid lg:size prop by using tailwind classes for responsive sizing */}
                    <Printer size={40} strokeWidth={1} className="opacity-10 lg:w-16 lg:h-16" />
                  </div>
                  <p className="text-[10px] lg:text-[12px] font-black uppercase tracking-[0.4em] lg:tracking-[0.5em] text-slate-300">Aguardando Dados</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* FAB MOBILE */}
      {activeTab === 'edit' && labels.length > 0 && (
        <div className="lg:hidden fixed bottom-8 right-8 z-[100]">
          <button onClick={() => setActiveTab('preview')} className="bg-[#bef264] text-black w-20 h-20 rounded-[30px] shadow-2xl flex items-center justify-center active:scale-90 transition-all border-b-8 border-lime-600">
            <Eye size={36} />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
