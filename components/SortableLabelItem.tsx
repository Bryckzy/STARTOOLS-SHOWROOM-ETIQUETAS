
import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LabelItem, LabelMode } from '../types';
import { GripVertical, Trash2, Edit3, Type, Check, X, SlidersHorizontal, Settings2 } from 'lucide-react';

interface Props {
  label: LabelItem;
  mode: LabelMode;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<LabelItem>) => void;
  isBeingDragged?: boolean;
  isOverlay?: boolean;
}

const SortableLabelItem: React.FC<Props> = ({ label, mode, onDelete, onUpdate, isBeingDragged, isOverlay }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showFontControl, setShowFontControl] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localData, setLocalData] = useState({ ...label });
  
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({ id: label.id });

  // Estilo para o item na lista (enquanto outro é arrastado ou ele mesmo é o ghost)
  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
    opacity: isDragging ? 0.4 : 1,
    visibility: (isBeingDragged && !isOverlay) ? 'hidden' as any : 'visible' as any,
  };

  const currentFontSize = label.customFontSize || (mode === LabelMode.PRODUCT ? 8.5 : 14);

  const handleSave = () => {
    onUpdate(label.id, localData);
    setIsEditing(false);
  };

  const handleDeleteTrigger = () => {
    setIsDeleting(true);
    setTimeout(() => onDelete(label.id), 400);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative ${isDeleting ? 'animate-item-delete' : (isOverlay ? '' : 'animate-item-in')} ${isOverlay ? 'z-[9999]' : ''}`}
    >
      <div className={`bg-white rounded-[28px] border-2 transition-all duration-300 ${isOverlay ? 'shadow-[0_20px_60px_rgba(0,0,0,0.15)] scale-[1.05] border-[#facc15]' : (isEditing || showFontControl ? 'border-yellow-400 shadow-xl scale-[1.02] ring-8 ring-yellow-400/5' : 'border-slate-50 hover:border-slate-200 shadow-sm')}`}>
        <div className="flex items-stretch min-h-[82px]">
          {/* DRAG HANDLE */}
          <div 
            {...attributes} 
            {...listeners} 
            className={`w-14 flex items-center justify-center cursor-grab active:cursor-grabbing border-r-2 transition-colors ${isOverlay ? 'bg-[#18181b] text-[#facc15] rounded-l-[26px]' : 'text-slate-200 hover:text-[#18181b] border-slate-50'}`}
          >
            <GripVertical size={22} />
          </div>

          <div className="flex-1 p-4 lg:p-6 flex flex-col justify-center overflow-hidden">
            {isEditing ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                {mode === LabelMode.PRODUCT ? (
                  <div className="flex flex-col gap-3">
                    <input className="w-full text-[11px] font-black bg-slate-50 border-2 border-slate-100 px-4 py-3.5 rounded-xl outline-none focus:border-yellow-400 uppercase" value={localData.sku} onChange={e => setLocalData({...localData, sku: e.target.value})} placeholder="SKU" />
                    <div className="flex gap-3">
                      <input className="flex-1 min-w-0 text-[11px] font-black bg-slate-50 border-2 border-slate-100 px-4 py-3.5 rounded-xl text-yellow-600 outline-none focus:border-yellow-400" value={localData.price} onChange={e => setLocalData({...localData, price: e.target.value})} placeholder="Preço" />
                      <input className="flex-1 min-w-0 text-[11px] font-black bg-slate-50 border-2 border-slate-100 px-4 py-3.5 rounded-xl text-slate-400 uppercase outline-none focus:border-yellow-400" value={localData.cxInner} onChange={e => setLocalData({...localData, cxInner: e.target.value})} placeholder="Obs" />
                    </div>
                  </div>
                ) : (
                  <input className="w-full text-[11px] font-black bg-slate-50 border-2 border-slate-100 px-4 py-3.5 rounded-xl outline-none focus:border-yellow-400 uppercase" value={localData.measureText} onChange={e => setLocalData({...localData, measureText: e.target.value})} placeholder="Texto" />
                )}
                <div className="flex gap-3 pt-1">
                  <button onClick={handleSave} className="flex-1 bg-[#bef264] text-black text-[10px] font-black uppercase py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 hover:brightness-105"><Check size={18}/> Salvar</button>
                  <button onClick={() => { setLocalData({...label}); setIsEditing(false); }} className="flex-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"><X size={18}/> Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col truncate min-w-0">
                  {mode === LabelMode.PRODUCT ? (
                    <>
                      <span className="text-[14px] font-black uppercase text-[#18181b] truncate leading-none mb-2">{label.sku || '---'}</span>
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-[11px] font-black text-yellow-600 bg-yellow-50 px-3 py-1 rounded-lg border border-yellow-100">{label.price || '---'}</span>
                        {label.cxInner && <span className="text-[10px] font-bold text-slate-300 uppercase truncate">/ {label.cxInner}</span>}
                      </div>
                    </>
                  ) : (
                    <span className="text-[14px] font-black uppercase text-[#18181b] truncate">{label.measureText || '---'}</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setShowFontControl(!showFontControl)} className={`p-3 rounded-2xl transition-all duration-300 ${showFontControl ? 'bg-[#bef264] text-black shadow-xl scale-110 rotate-12' : 'text-slate-300 hover:bg-slate-50 hover:text-black'}`}>
                    <SlidersHorizontal size={20} />
                  </button>
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="p-3 text-slate-300 hover:bg-slate-100 hover:text-[#18181b] hover:rotate-[15deg] hover:scale-125 rounded-2xl transition-all active:scale-90"
                  >
                    <Edit3 size={20} />
                  </button>
                  <button onClick={handleDeleteTrigger} className="p-3 text-slate-300 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all active:scale-90">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showFontControl && !isEditing && (
          <div className="p-7 bg-slate-50/80 rounded-b-[26px] border-t border-slate-100 space-y-6 animate-in slide-in-from-top-4 duration-500">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100">
                    <Type size={18} className="text-black" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Calibração</span>
                    <span className="text-[12px] font-black text-[#18181b]">Tamanho da Fonte</span>
                  </div>
                </div>
                <div className="bg-[#18181b] text-[#bef264] px-4 py-2 rounded-xl font-black text-[13px] shadow-2xl">
                  {currentFontSize.toFixed(1)} <span className="text-[9px] text-white/40">PT</span>
                </div>
             </div>
             
             <div className="px-2">
               <input type="range" min="4" max="24" step="0.5" value={currentFontSize} onChange={e => onUpdate(label.id, { customFontSize: parseFloat(e.target.value) })} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#18181b]" />
             </div>
             
             <div className="flex justify-between items-center pt-2">
                <button onClick={() => onUpdate(label.id, { customFontSize: mode === LabelMode.PRODUCT ? 8.5 : 14 })} className="text-[10px] font-black text-slate-400 hover:text-[#18181b] flex items-center gap-2 transition-all">
                  <Settings2 size={16}/> Restaurar Padrão
                </button>
                <button onClick={() => setShowFontControl(false)} className="bg-white text-black text-[10px] font-black px-8 py-3 rounded-2xl uppercase shadow-md border border-slate-100 active:scale-95 transition-all">Fechar</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SortableLabelItem;
