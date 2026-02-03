
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
import { FileSpreadsheet, Download, Printer, Zap, RefreshCcw, Eye, Plus, List, AlignCenter, AlignLeft, CheckCircle2, AlertTriangle, HelpCircle, Power, AlignJustify } from 'lucide-react';
import { LabelItem, LabelMode, VoltageType } from './types';
import { downloadTemplate, parseExcel } from './services/excelService';
import { generatePDFBlob, downloadPDF } from './services/pdfService';
import SortableLabelItem from './components/SortableLabelItem';

const App: React.FC = () => {
  const [mode, setMode] = useState<LabelMode>(LabelMode.PRODUCT);
  const [labels, setLabels] = useState<LabelItem[]>([]);
  const [showOutline, setShowOutline] = useState<boolean>(false);
  const [startPosition, setStartPosition] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [textAlign, setTextAlign] = useState<'left' | 'center'>('center');
  const [formData, setFormData] = useState({ sku: '', price: '', cxInner: '', measureText: '', quantity: '1', voltage: 'NONE' as VoltageType, multiLine: false });
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
    setFormData({ sku: '', price: '', cxInner: '', measureText: '', quantity: '1', voltage: 'NONE', multiLine: false });
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
      if (!formData.sku && !formData.price && !formData.cxInner) return;
      if (!formData.sku || !formData.price || !formData.cxInner) {
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

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f8fafc] text-[#18181b] overflow-hidden">
      {showConfirmModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-[#18181b]/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={40} className="text-amber-500" />
              </div>
              <h2 className="text-xl font-black uppercase text-[#18181b] mb-4">Dados Incompletos</h2>
              <p className="text-sm text-slate-500 mb-8">Deseja adicionar as etiquetas com campos vazios?</p>
              <div className="flex flex-col w-full gap-3">
                <button onClick={executeAddAction} className="w-full h-14 bg-[#18181b] text-[#facc15] rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Sim, Adicionar</button>
                <button onClick={() => setShowConfirmModal(false)} className="w-full h-14 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">Voltar e Editar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[1000] transition-all duration-500 flex items-center gap-3 bg-[#18181b] text-[#bef264] px-6 py-4 rounded-[24px] shadow-2xl border border-zinc-700 ${toast.visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-90 pointer-events-none'}`}>
        <CheckCircle2 size={20} />
        <span className="text-[11px] font-black uppercase tracking-widest">{toast.message}</span>
      </div>

      <header className="h-16 lg:h-20 bg-[#18181b] text-white flex items-center justify-between px-4 lg:px-12 z-50 shrink-0 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="bg-[#facc15] p-2.5 rounded-xl lg:rounded-2xl shadow-[0_0_30px_rgba(250,204,21,0.3)]">
            <Zap size={20} className="text-black fill-black" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[11px] lg:text-lg font-black tracking-tight uppercase leading-none">
              <span className="text-[#facc15]">STARTOOLS</span> <span className="text-white">SHOWROOM ETIQUETAS</span>
            </h1>
            <span className="text-[8px] lg:text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em] mt-1">Pimaco Precision v16.3</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center bg-zinc-800/40 p-1 rounded-[22px] border border-zinc-700/30">
          <button onClick={() => handleModeChange(LabelMode.PRODUCT)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${mode === LabelMode.PRODUCT ? 'bg-[#facc15] text-black shadow-lg scale-105' : 'text-zinc-500 hover:text-white'}`}>Produtos</button>
          <button onClick={() => handleModeChange(LabelMode.MEASURE)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${mode === LabelMode.MEASURE ? 'bg-[#facc15] text-black shadow-lg scale-105' : 'text-zinc-500 hover:text-white'}`}>Medidas</button>
        </div>

        <button onClick={() => downloadPDF(pdfUrl)} disabled={labels.length === 0} className="btn-generate h-10 lg:h-14 px-5 lg:px-10 rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-[11px] uppercase tracking-widest flex items-center gap-3 disabled:opacity-20 shadow-lg border-none">
          <Printer size={18} /> <span className="hidden sm:inline">Gerar Arquivo</span>
        </button>
      </header>

      {/* Mobile Mode Switcher - Novo */}
      <div className="lg:hidden flex bg-white p-2 border-b border-slate-100 z-40">
        <button onClick={() => handleModeChange(LabelMode.PRODUCT)} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${mode === LabelMode.PRODUCT ? 'bg-[#facc15] text-black' : 'text-slate-400'}`}>Produtos</button>
        <button onClick={() => handleModeChange(LabelMode.MEASURE)} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${mode === LabelMode.MEASURE ? 'bg-[#facc15] text-black' : 'text-slate-400'}`}>Medidas</button>
      </div>

      <main className="flex-1 flex overflow-hidden relative">
        <section className={`flex-col w-full lg:w-[460px] bg-white border-r border-slate-100 shrink-0 overflow-y-auto no-scrollbar ${activeTab === 'edit' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="p-5 lg:p-10 space-y-8 pb-40">
            <form onSubmit={handleAddLabel} className="space-y-6 p-6 lg:p-8 bg-[#fafafa] rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Entrada Manual</span>
              <div className="space-y-4">
                {mode === LabelMode.PRODUCT ? (
                  <>
                    <input type="text" placeholder="SKU / CÓDIGO" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#facc15] text-xs font-bold uppercase transition-all shadow-sm" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="PREÇO" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="h-14 px-6 bg-white border border-slate-200 text-yellow-600 font-black rounded-2xl outline-none focus:border-[#facc15] shadow-sm" />
                      <input type="text" placeholder="OBS" value={formData.cxInner} onChange={e => setFormData({ ...formData, cxInner: e.target.value })} className="h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#facc15] text-xs font-bold uppercase shadow-sm" />
                    </div>
                    
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Power size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Voltagem Showroom</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['NONE', '127V', '220V'] as VoltageType[]).map(v => (
                          <button key={v} type="button" onClick={() => setFormData({...formData, voltage: v})} className={`py-2.5 rounded-xl text-[10px] font-black transition-all ${formData.voltage === v ? 'bg-[#18181b] text-[#facc15]' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                            {v === 'NONE' ? 'DESL' : v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <input type="text" placeholder="TEXTO DA ETIQUETA" value={formData.measureText} onChange={e => setFormData({ ...formData, measureText: e.target.value })} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#facc15] text-xs font-bold uppercase shadow-sm" />
                    <button type="button" onClick={() => setFormData({...formData, multiLine: !formData.multiLine})} className={`w-full py-3 rounded-2xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${formData.multiLine ? 'bg-[#18181b] text-[#facc15] border-[#18181b]' : 'bg-white text-slate-400 border-slate-200'}`}>
                       <AlignJustify size={16} /> Quebrar Linhas: {formData.multiLine ? 'ATIVADO' : 'DESATIVADO'}
                    </button>
                  </div>
                )}
                
                <div className="flex items-end gap-4 pt-2">
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 ml-2">Qtd</span>
                    <input type="number" min="1" max="126" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className="w-20 h-14 bg-[#bef264] text-black border-none rounded-2xl text-center font-black text-[14px] shadow-lg outline-none" />
                  </div>
                  <button type="submit" className="flex-1 h-14 bg-[#bef264] text-black rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <Plus size={20} /> Adicionar
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-4">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Configuração de Alinhamento</span>
               <div className="bg-slate-100 p-1.5 rounded-[22px] flex items-center gap-1.5 border border-slate-200/50 shadow-inner">
                  <button onClick={() => setTextAlign('left')} className={`flex-1 py-3 rounded-[18px] flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${textAlign === 'left' ? 'bg-white text-[#18181b] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}><AlignLeft size={18} /> Esquerda</button>
                  <button onClick={() => setTextAlign('center')} className={`flex-1 py-3 rounded-[18px] flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${textAlign === 'center' ? 'bg-white text-[#18181b] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}><AlignCenter size={18} /> Centro</button>
               </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <div className="flex justify-between items-center mb-6 px-1">
                <h3 className="text-[11px] font-black text-[#18181b] uppercase tracking-widest">Fila de Showroom ({labels.length})</h3>
                <button onClick={() => setLabels([])} className="text-[9px] font-black text-slate-300 hover:text-rose-500 uppercase flex items-center gap-2 transition-all"><RefreshCcw size={14}/> Limpar</button>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={labels.map(l => l.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {labels.map(label => (
                      <SortableLabelItem key={label.id} label={label} mode={mode} onDelete={handleDelete} onUpdate={handleUpdateLabel} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </section>

        <section className={`flex-1 bg-zinc-100 p-2 lg:p-10 relative overflow-hidden flex flex-col items-center ${activeTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="max-w-4xl w-full h-full flex flex-col gap-4">
            <div className="glass-card p-4 lg:p-6 rounded-[30px] shadow-2xl border border-white flex items-center justify-between z-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#18181b] rounded-2xl flex items-center justify-center shadow-xl"><Eye size={18} className="text-[#bef264]" /></div>
                <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Preview</span><span className="text-[11px] font-black uppercase text-[#18181b]">Pimaco A4249 Digital</span></div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-3 bg-white/60 px-4 py-2.5 rounded-2xl border border-white shadow-sm">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Grade</span>
                    <button onClick={() => setShowOutline(!showOutline)} className={`w-12 h-6 rounded-full transition-all relative shadow-inner flex items-center px-1 ${showOutline ? 'bg-[#bef264]' : 'bg-slate-200'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all ${showOutline ? 'translate-x-6' : 'translate-x-0'}`} /></button>
                 </div>
              </div>
            </div>
            
            {/* Contenedor PDF Mejorado para Mobile */}
            <div className="flex-1 bg-white rounded-[40px] overflow-hidden shadow-2xl border-4 border-white relative min-h-[400px]">
              {pdfUrl && labels.length > 0 ? (
                <iframe 
                  src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`} 
                  className="w-full h-full border-none" 
                  title="PDF Preview"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-200 gap-6">
                  <Printer size={64} strokeWidth={1} className="opacity-10" />
                  <p className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-300">Aguardando Dados</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Mobile Tab Switcher Fixo na Parte Inferior */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-white border border-slate-100 shadow-2xl rounded-full p-1.5 flex gap-2">
           <button 
             onClick={() => setActiveTab('edit')} 
             className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase transition-all ${activeTab === 'edit' ? 'bg-[#18181b] text-[#facc15]' : 'text-slate-400'}`}
           >
             <List size={16} /> Lista
           </button>
           <button 
             onClick={() => setActiveTab('preview')} 
             className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase transition-all ${activeTab === 'preview' ? 'bg-[#18181b] text-[#bef264]' : 'text-slate-400'}`}
           >
             <Eye size={16} /> Preview
           </button>
        </div>
      </main>
    </div>
  );
};

export default App;
