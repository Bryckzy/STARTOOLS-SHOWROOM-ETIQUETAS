
import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LabelItem, LabelMode, VoltageType } from '../types';
import { GripVertical, Trash2, Edit3, Type, Check, X, SlidersHorizontal, Settings2, Power, AlignJustify } from 'lucide-react';

interface Props {
  label: LabelItem;
  mode: LabelMode;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<LabelItem>) => void;
}

const SortableLabelItem: React.FC<Props> = ({ label, mode, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showFontControl, setShowFontControl] = useState(false);
  const [localData, setLocalData] = useState({ ...label });
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: label.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const currentFontSize = label.customFontSize || (mode === LabelMode.PRODUCT ? 8.5 : 14);

  const handleSave = () => {
    onUpdate(label.id, localData);
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="relative w-full animate-item-in">
      <div className={`bg-white rounded-[24px] border-2 transition-all ${isEditing || showFontControl ? 'border-yellow-400 shadow-lg' : 'border-slate-50 hover:border-slate-200 shadow-sm'}`}>
        <div className="flex items-stretch min-h-[82px]">
          <div {...attributes} {...listeners} className="w-12 flex items-center justify-center cursor-grab active:cursor-grabbing border-r-2 text-slate-200 hover:text-black border-slate-50 drag-handle-active">
            <GripVertical size={20} />
          </div>

          <div className="flex-1 p-4 flex flex-col justify-center overflow-hidden">
            {isEditing ? (
              <div className="space-y-3">
                {mode === LabelMode.PRODUCT ? (
                  <div className="space-y-2">
                    <input className="w-full text-[10px] font-black bg-slate-50 border-2 border-slate-100 px-3 py-2 rounded-lg outline-none uppercase" value={localData.sku} onChange={e => setLocalData({...localData, sku: e.target.value})} placeholder="SKU" />
                    <div className="grid grid-cols-2 gap-2">
                      <input className="text-[10px] font-black bg-slate-50 border-2 border-slate-100 px-3 py-2 rounded-lg text-yellow-600 outline-none" value={localData.price} onChange={e => setLocalData({...localData, price: e.target.value})} placeholder="Preço" />
                      <div className="flex gap-1">
                        {(['NONE', '127V', '220V'] as VoltageType[]).map(v => (
                          <button key={v} type="button" onClick={() => setLocalData({...localData, voltage: v})} className={`flex-1 py-1 rounded text-[8px] font-black transition-all ${localData.voltage === v ? 'bg-[#18181b] text-[#facc15]' : 'bg-slate-100 text-slate-400'}`}>
                            {v === 'NONE' ? 'D' : v.replace('V','')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input className="w-full text-[10px] font-black bg-slate-50 border-2 border-slate-100 px-3 py-2 rounded-lg outline-none uppercase" value={localData.measureText} onChange={e => setLocalData({...localData, measureText: e.target.value})} placeholder="Texto" />
                    <button onClick={() => setLocalData({...localData, multiLine: !localData.multiLine})} className={`w-full py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${localData.multiLine ? 'bg-[#18181b] text-[#facc15]' : 'bg-slate-100 text-slate-400'}`}>
                      Quebrar: {localData.multiLine ? 'SIM' : 'NÃO'}
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={handleSave} className="flex-1 bg-[#bef264] text-black text-[9px] font-black uppercase py-2 rounded-lg flex items-center justify-center gap-1"><Check size={14}/> Salvar</button>
                  <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-50 text-slate-400 text-[9px] font-black uppercase py-2 rounded-lg flex items-center justify-center gap-1"><X size={14}/> Sair</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col truncate min-w-0">
                  {mode === LabelMode.PRODUCT ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-black uppercase text-[#18181b] truncate">{label.sku || '---'}</span>
                        {label.voltage && label.voltage !== 'NONE' && (
                          <span className="bg-zinc-900 text-[#facc15] px-1.5 py-0.5 rounded text-[8px] font-black">{label.voltage}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-yellow-600">{label.price || '---'}</span>
                        <span className="text-[9px] font-bold text-slate-300 uppercase truncate">/ {label.cxInner || '---'}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-black uppercase text-[#18181b] truncate">{label.measureText || '---'}</span>
                      {label.multiLine && <AlignJustify size={14} className="text-[#bef264]" />}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setShowFontControl(!showFontControl)} className={`p-2 rounded-xl transition-all ${showFontControl ? 'bg-[#bef264] text-black shadow-md' : 'text-slate-200 hover:text-black'}`}><SlidersHorizontal size={16} /></button>
                  <button onClick={() => setIsEditing(true)} className="p-2 text-slate-200 hover:text-black rounded-xl transition-all"><Edit3 size={16} /></button>
                  <button onClick={() => onDelete(label.id)} className="p-2 text-slate-200 hover:text-rose-500 rounded-xl transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showFontControl && !isEditing && (
          <div className="p-5 bg-slate-50/80 rounded-b-[22px] border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Type size={16} className="text-slate-400" />
                  <span className="text-[11px] font-black text-[#18181b]">Tamanho do Texto</span>
                </div>
                <div className="bg-[#18181b] text-[#bef264] px-2 py-1 rounded-lg font-black text-[11px]">{currentFontSize.toFixed(1)}</div>
             </div>
             <input type="range" min="4" max="24" step="0.5" value={currentFontSize} onChange={e => onUpdate(label.id, { customFontSize: parseFloat(e.target.value) })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#18181b]" />
             <div className="flex justify-between items-center">
                <button onClick={() => onUpdate(label.id, { customFontSize: mode === LabelMode.PRODUCT ? 8.5 : 14 })} className="text-[9px] font-black text-slate-400 hover:text-black flex items-center gap-1"><Settings2 size={12}/> Reset</button>
                <button onClick={() => setShowFontControl(false)} className="bg-white text-black text-[9px] font-black px-4 py-1.5 rounded-lg shadow-sm border border-slate-100 uppercase">Fechar</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SortableLabelItem;
