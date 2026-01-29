
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

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
    opacity: isDragging ? 0.3 : 1,
    visibility: (isBeingDragged && !isOverlay) ? 'hidden' as any : 'visible' as any,
  };

  const currentFontSize = label.customFontSize || (mode === LabelMode.PRODUCT ? 8.5 : 14);

  const handleSave = () => {
    onUpdate(label.id, localData);
    setIsEditing(false);
  };

  const handleDeleteTrigger = () => {
    setIsDeleting(true);
    setTimeout(() => onDelete(label.id), 300);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative ${isDeleting ? 'animate-item-delete' : (isOverlay ? '' : 'animate-item-in')} w-full`}
    >
      <div className={`bg-white rounded-[20px] lg:rounded-[28px] border-2 transition-all duration-300 ${isOverlay ? 'shadow-2xl scale-[1.03] border-[#facc15] ring-4 ring-yellow-400/20' : (isEditing || showFontControl ? 'border-yellow-400 shadow-lg scale-[1.01] ring-4 ring-yellow-400/5' : 'border-slate-50 hover:border-slate-200 shadow-sm')}`}>
        <div className="flex items-stretch min-h-[70px] lg:min-h-[82px]">
          {/* DRAG HANDLE - MAIOR PARA TOUCH */}
          <div 
            {...attributes} 
            {...listeners} 
            className={`w-12 lg:w-14 flex items-center justify-center cursor-grab active:cursor-grabbing border-r-2 transition-colors drag-handle-active ${isOverlay ? 'bg-[#18181b] text-[#facc15] rounded-l-[18px] lg:rounded-l-[26px]' : 'text-slate-200 hover:text-[#18181b] border-slate-50'}`}
          >
            <GripVertical size={22} />
          </div>

          <div className="flex-1 p-3 lg:p-6 flex flex-col justify-center overflow-hidden">
            {isEditing ? (
              <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                {mode === LabelMode.PRODUCT ? (
                  <div className="flex flex-col gap-2">
                    <input className="w-full text-[10px] font-black bg-slate-50 border-2 border-slate-100 px-3 py-2.5 rounded-lg outline-none focus:border-yellow-400 uppercase" value={localData.sku} onChange={e => setLocalData({...localData, sku: e.target.value})} placeholder="SKU" />
                    <div className="flex gap-2">
                      <input className="flex-1 min-w-0 text-[10px] font-black bg-slate-50 border-2 border-slate-100 px-3 py-2.5 rounded-lg text-yellow-600 outline-none focus:border-yellow-400" value={localData.price} onChange={e => setLocalData({...localData, price: e.target.value})} placeholder="Preço" />
                      <input className="flex-1 min-w-0 text-[10px] font-black bg-slate-50 border-2 border-slate-100 px-3 py-2.5 rounded-lg text-slate-400 uppercase outline-none focus:border-yellow-400" value={localData.cxInner} onChange={e => setLocalData({...localData, cxInner: e.target.value})} placeholder="Obs" />
                    </div>
                  </div>
                ) : (
                  <input className="w-full text-[10px] font-black bg-slate-50 border-2 border-slate-100 px-3 py-2.5 rounded-lg outline-none focus:border-yellow-400 uppercase" value={localData.measureText} onChange={e => setLocalData({...localData, measureText: e.target.value})} placeholder="Texto" />
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSave} className="flex-1 bg-[#bef264] text-black text-[9px] font-black uppercase py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"><Check size={16}/> Salvar</button>
                  <button onClick={() => { setLocalData({...label}); setIsEditing(false); }} className="flex-1 bg-slate-50 text-slate-400 text-[9px] font-black uppercase py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"><X size={16}/> Sair</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col truncate min-w-0">
                  {mode === LabelMode.PRODUCT ? (
                    <>
                      <span className="text-[12px] lg:text-[14px] font-black uppercase text-[#18181b] truncate leading-none mb-1.5 lg:mb-2">{label.sku || '---'}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="shrink-0 text-[9px] lg:text-[11px] font-black text-yellow-600 bg-yellow-50 px-2 lg:px-3 py-0.5 lg:py-1 rounded-md border border-yellow-100">{label.price || '---'}</span>
                        {label.cxInner && <span className="text-[8px] lg:text-[10px] font-bold text-slate-300 uppercase truncate">/ {label.cxInner}</span>}
                      </div>
                    </>
                  ) : (
                    <span className="text-[12px] lg:text-[14px] font-black uppercase text-[#18181b] truncate">{label.measureText || '---'}</span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setShowFontControl(!showFontControl)} className={`p-2 lg:p-3 rounded-xl lg:rounded-2xl transition-all duration-300 ${showFontControl ? 'bg-[#bef264] text-black shadow-lg rotate-12' : 'text-slate-200 hover:text-black'}`}>
                    <SlidersHorizontal size={18} />
                  </button>
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="p-2 lg:p-3 text-slate-200 hover:text-black hover:rotate-12 hover:scale-110 rounded-xl lg:rounded-2xl transition-all"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button onClick={handleDeleteTrigger} className="p-2 lg:p-3 text-slate-200 hover:text-rose-500 rounded-xl lg:rounded-2xl transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showFontControl && !isEditing && (
          <div className="p-5 lg:p-7 bg-slate-50/80 rounded-b-[18px] lg:rounded-b-[26px] border-t border-slate-100 space-y-4 lg:space-y-6 animate-in slide-in-from-top-2 duration-300">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <Type size={16} className="text-black" />
                  </div>
                  <div>
                    <span className="text-[8px] lg:text-[10px] font-black uppercase text-slate-400 tracking-widest block">Calibragem</span>
                    <span className="text-[11px] lg:text-[12px] font-black text-[#18181b]">Tamanho Texto</span>
                  </div>
                </div>
                <div className="bg-[#18181b] text-[#bef264] px-3 py-1.5 rounded-lg font-black text-[11px] lg:text-[13px]">
                  {currentFontSize.toFixed(1)} <span className="text-[8px] text-white/40">PT</span>
                </div>
             </div>
             
             <div className="px-1">
               <input type="range" min="4" max="24" step="0.5" value={currentFontSize} onChange={e => onUpdate(label.id, { customFontSize: parseFloat(e.target.value) })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#18181b]" />
             </div>
             
             <div className="flex justify-between items-center pt-1">
                <button onClick={() => onUpdate(label.id, { customFontSize: mode === LabelMode.PRODUCT ? 8.5 : 14 })} className="text-[9px] font-black text-slate-400 hover:text-[#18181b] flex items-center gap-1.5 transition-all">
                  <Settings2 size={14}/> Reset
                </button>
                <button onClick={() => setShowFontControl(false)} className="bg-white text-black text-[9px] font-black px-6 py-2 rounded-xl uppercase shadow-sm border border-slate-100 active:scale-95 transition-all">Fechar</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SortableLabelItem;
