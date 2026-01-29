
import React, { useState, useMemo, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LabelItem, LabelMode, CA4249_CONFIG } from '../types';
import { GripVertical, Trash2, Settings2, AlertCircle, Edit3, RotateCcw, Ruler, CheckCircle } from 'lucide-react';

interface Props {
  label: LabelItem;
  mode: LabelMode;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<LabelItem>) => void;
  onToggleTools?: (isOpen: boolean) => void;
}

const MM_TO_PX = 3.7795;

/**
 * MOTOR DE MEDIÇÃO V15
 * Calcula a largura em mm baseado na métrica da Helvetica Bold.
 * Benchmark: "CX464 - 74X107" em 10pt = 26mm.
 */
const getRealWidthMm = (text: string, fontSizePt: number, isBold: boolean): number => {
  if (!text) return 0;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return 0;
  
  context.font = `${isBold ? 'bold' : 'normal'} 100px Helvetica, Arial, sans-serif`;
  const metrics = context.measureText(text.toUpperCase());
  
  // A 10pt, o benchmark "CX464 - 74X107" em Helvetica Bold (canvas) tem aprox 85.5px de largura escala 0.1.
  // Para que isso seja 26mm, o fator de calibração é 26 / 85.5 = 0.3041.
  const calibrationFactor = 0.3041;
  const widthAt10pt = (metrics.width / 100) * 10;
  
  return (widthAt10pt * (fontSizePt / 10)) * calibrationFactor;
};

const SortableLabelItem: React.FC<Props> = ({ label, mode, onDelete, onUpdate, onToggleTools }) => {
  const [showTools, setShowTools] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState({ ...label });
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: label.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const currentFontSize = label.customFontSize || (mode === LabelMode.PRODUCT ? 8.5 : 14);

  const { overflowLimitPt, currentWidthMm } = useMemo(() => {
    const text = mode === LabelMode.PRODUCT ? (label.sku || '') : (label.measureText || '');
    const isBold = true;
    
    const TARGET = 26.0;
    const wAt10 = getRealWidthMm(text, 10, isBold);
    
    const limit = wAt10 > 0 ? (TARGET * 10) / wAt10 : 30;
    const currentW = getRealWidthMm(text, currentFontSize, isBold);
    
    return { 
      overflowLimitPt: Math.max(4, Math.min(32, limit)),
      currentWidthMm: currentW
    };
  }, [label, mode, currentFontSize]);

  const isOverflowing = currentWidthMm > 26.01;

  useEffect(() => {
    onToggleTools?.(showTools);
  }, [showTools, onToggleTools]);

  // Multiplicador visual para o preview 4:1 bater com os 26mm (393px)
  const visualScale = 1.21; 

  return (
    <div ref={setNodeRef} style={style} className={`flex flex-col transition-all duration-300 ${showTools ? 'my-8' : 'my-0'}`}>
      
      <div className={`relative transition-all duration-300 rounded-2xl overflow-hidden border-[4px] industrial-card ${showTools ? 'border-yellow-400 bg-zinc-900 scale-[1.02] z-50' : 'border-zinc-800 bg-black'}`}>
        
        <div className="flex items-stretch min-h-[80px]">
          <button {...attributes} {...listeners} className={`w-12 shrink-0 flex items-center justify-center ${showTools ? 'bg-yellow-400 text-black' : 'bg-zinc-900 text-zinc-600'}`}>
            <GripVertical size={24} />
          </button>

          <div className="flex-1 p-4 flex items-center justify-between cursor-pointer" onClick={() => !isEditing && setShowTools(!showTools)}>
            {isEditing ? (
              <div className="w-full space-y-2 py-1" onClick={(e) => e.stopPropagation()}>
                <input className="w-full text-xs font-black border-2 border-zinc-700 bg-zinc-800 text-white px-4 py-2 uppercase rounded-lg outline-none" value={localData.sku} onChange={e => setLocalData({...localData, sku: e.target.value})} placeholder="SKU" />
                <div className="flex gap-2">
                  <input className="flex-1 text-xs font-black border-2 border-zinc-700 bg-zinc-800 text-yellow-400 px-4 py-2 rounded-lg" value={localData.price} onChange={e => setLocalData({...localData, price: e.target.value})} placeholder="PREÇO" />
                  <input className="flex-1 text-xs font-black border-2 border-zinc-700 bg-zinc-800 text-white px-4 py-2 uppercase rounded-lg" value={localData.cxInner} onChange={e => setLocalData({...localData, cxInner: e.target.value})} placeholder="OBS" />
                </div>
                <button onClick={() => { onUpdate(label.id, localData); setIsEditing(false); }} className="w-full bg-yellow-400 text-black text-[10px] font-black uppercase py-2.5 rounded-lg">Confirmar</button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-between overflow-hidden">
                <div className="flex flex-col overflow-hidden pr-4">
                  <span className="text-sm font-black text-white uppercase truncate">{label.sku || label.measureText || 'VAZIO'}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-yellow-400 tabular-nums">{label.price || 'R$ 0,00'}</span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase truncate">{label.cxInner}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                   {isOverflowing ? (
                    <div className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black border-2 border-rose-400 shadow-lg animate-pulse">VAZA</div>
                  ) : (
                    <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest">OK</div>
                  )}
                  <div className="bg-zinc-800 text-zinc-200 px-3 py-2 rounded-lg text-xs font-mono font-black border border-zinc-700">{currentFontSize.toFixed(1)}pt</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col border-l-2 border-zinc-800 shrink-0">
             <button onClick={() => setShowTools(!showTools)} className={`flex-1 px-4 flex items-center justify-center transition-all ${showTools ? 'bg-yellow-400 text-black' : 'text-zinc-600 hover:text-yellow-400'}`}>
                <Settings2 size={20} />
             </button>
             <button onClick={() => onDelete(label.id)} className="flex-1 px-4 flex items-center justify-center text-zinc-600 hover:bg-rose-600 hover:text-white transition-all border-t-2 border-zinc-800">
                <Trash2 size={20} />
             </button>
          </div>
        </div>
      </div>

      {showTools && (
        <div className="mt-3 bg-zinc-950 border-[4px] border-yellow-400 rounded-[2rem] p-6 space-y-8 shadow-[0_50px_100px_rgba(0,0,0,0.8)] animate-in slide-in-from-top-4 duration-300">
          
          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Preview PDF (Papel Real)</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                  <span className="text-[10px] font-black text-zinc-600 uppercase">Largura:</span>
                  <span className={`text-[10px] font-black tabular-nums ${isOverflowing ? 'text-rose-500' : 'text-emerald-500'}`}>{currentWidthMm.toFixed(2)}mm</span>
                </div>
             </div>
             
             {/* PREVIEW PAPEL REAL (4:1) */}
             <div className="bg-white rounded-lg flex flex-col items-center justify-center relative shadow-inner overflow-hidden border-[6px] border-zinc-900 mx-auto" 
                  style={{ 
                    width: `${26 * MM_TO_PX * 4}px`, 
                    height: `${15 * MM_TO_PX * 4}px`,
                  }}>
              <div 
                className="flex flex-col items-center text-black text-center uppercase w-full font-sans" 
                style={{ gap: '0px' }}
              >
                {/* 10pt Benchmark encosta na borda (26mm) */}
                <span className="font-bold w-full" style={{ fontSize: `${currentFontSize * visualScale * 4}px`, lineHeight: '1.1', whiteSpace: 'nowrap' }}>{label.sku || label.measureText || 'CONTEÚDO'}</span>
                {mode === LabelMode.PRODUCT && (
                  <>
                    <span className="font-normal w-full" style={{ fontSize: `${currentFontSize * visualScale * 4}px`, lineHeight: '1.1', whiteSpace: 'nowrap' }}>{label.price || 'R$ 0,00'}</span>
                    <span className="font-normal text-zinc-400 w-full" style={{ fontSize: `${currentFontSize * 0.75 * visualScale * 4}px`, lineHeight: '1.1', whiteSpace: 'nowrap' }}>{label.cxInner || 'OBSERVAÇÃO'}</span>
                  </>
                )}
              </div>
              
              {/* Linhas Técnicas de 26mm */}
              <div className="absolute inset-y-0 left-0 w-[1px] bg-zinc-100" />
              <div className="absolute inset-y-0 right-0 w-[1px] bg-zinc-100" />
              {isOverflowing && <div className="absolute inset-0 bg-rose-600/5 pointer-events-none" />}
            </div>
          </div>

          <div className="bg-black rounded-3xl p-6 border-2 border-zinc-800 space-y-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 text-yellow-400 font-black text-[12px] uppercase tracking-widest">
                <Ruler size={20} /> Escala Real (PDF)
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="number" step="0.1" min="4" max="32"
                  value={currentFontSize}
                  onChange={(e) => onUpdate(label.id, { customFontSize: parseFloat(e.target.value) || 4 })}
                  className="w-20 bg-zinc-900 border border-zinc-700 text-yellow-400 font-mono text-xl font-black p-2 rounded-lg text-center outline-none focus:border-yellow-400"
                />
                <span className="text-zinc-600 font-black text-[10px] uppercase">PT</span>
              </div>
            </div>

            <div className="relative py-8">
              {/* Graduação Técnica */}
              <div className="absolute top-0 left-0 w-full flex justify-between px-1 pointer-events-none opacity-20">
                {[...Array(29)].map((_, i) => (
                  <div key={i} className={`w-[1px] ${i % 5 === 0 ? 'h-10 bg-white' : 'h-4 bg-zinc-500'}`} />
                ))}
              </div>

              {/* MARCADOR DE 26MM */}
              <div 
                className="absolute top-0 w-2 h-16 bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.8)] z-10 transition-all duration-300 rounded-full"
                style={{ left: `${((overflowLimitPt - 4) / (32 - 4)) * 100}%` }}
              >
                <div className="bg-rose-600 text-[8px] font-black text-white px-3 py-1 rounded-full absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap border border-rose-400">
                   LIMITE 26MM
                </div>
              </div>

              <input 
                type="range" min="4" max="32" step="0.1"
                value={currentFontSize}
                onChange={(e) => onUpdate(label.id, { customFontSize: parseFloat(e.target.value) })}
                className="w-full h-8 bg-zinc-900 rounded-full appearance-none cursor-pointer accent-yellow-400 border-2 border-zinc-800"
              />
            </div>

            <div className="flex gap-4">
              <button onClick={() => onUpdate(label.id, { customFontSize: undefined })} className="flex-1 flex items-center justify-center gap-2 py-4 bg-zinc-900 text-zinc-500 hover:text-white rounded-2xl text-[10px] font-black uppercase border border-zinc-800 transition-all">
                <RotateCcw size={16}/> Resetar
              </button>
              <button onClick={() => setIsEditing(true)} className="flex-1 flex items-center justify-center gap-2 py-4 bg-yellow-400 text-black hover:bg-white rounded-2xl text-[10px] font-black uppercase shadow-lg transition-all border border-black">
                <Edit3 size={16}/> Editar
              </button>
            </div>
          </div>

          <button onClick={() => setShowTools(false)} className="w-full bg-yellow-400 text-black py-5 rounded-[2rem] text-[14px] font-black uppercase tracking-[0.2em] border-[4px] border-black hover:bg-white transition-all shadow-xl active:scale-[0.98]">
            Validar Medida
          </button>
        </div>
      )}
    </div>
  );
};

export default SortableLabelItem;
