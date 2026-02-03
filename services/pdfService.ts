
import { jsPDF } from 'jspdf';
import { LabelItem, LabelMode, PIMACO_A4249_CONFIG } from '../types';

const ptToMm = 0.3527;

const getCalibratedMultiplier = (doc: jsPDF): number => {
  const benchmarkText = "CX464 - 74X107";
  const targetWidthMm = 26.0;
  const referencePt = 10.0;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(referencePt);
  const currentWidthMm = doc.getTextWidth(benchmarkText);
  return targetWidthMm / currentWidthMm;
};

const getAutoFontSize = (doc: jsPDF, text: string | string[], maxWidth: number, baseSize: number): number => {
  let size = baseSize;
  doc.setFontSize(size);
  
  const checkWidth = (txt: string | string[]) => {
    if (Array.isArray(txt)) {
      return Math.max(...txt.map(line => doc.getTextWidth(line)));
    }
    return doc.getTextWidth(txt);
  };

  let width = checkWidth(text);
  while (width > maxWidth && size > 3.5) {
    size -= 0.3;
    doc.setFontSize(size);
    width = checkWidth(text);
  }
  return size;
};

export const generatePDFBlob = (
  labels: LabelItem[],
  mode: LabelMode,
  showOutline: boolean,
  startPosition: number = 0,
  textAlign: 'left' | 'center' = 'center'
): string => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    floatPrecision: 16
  });

  const { 
    columns, 
    rows, 
    labelWidth, 
    labelHeight, 
    marginLeft, 
    marginTop, 
    columnGap, 
    rowGap, 
    borderRadius 
  } = PIMACO_A4249_CONFIG;

  const multiplier = getCalibratedMultiplier(doc);
  const labelsPerPage = columns * rows;
  const fullList = [...Array(startPosition).fill(null), ...labels];
  const totalPages = Math.ceil(fullList.length / labelsPerPage) || 1;

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage();
    const pageItems = fullList.slice(page * labelsPerPage, (page + 1) * labelsPerPage);

    pageItems.forEach((label, index) => {
      if (!label) return;
      
      const col = index % columns;
      const row = Math.floor(index / columns);
      
      const x = marginLeft + (col * (labelWidth + columnGap));
      const y = marginTop + (row * (labelHeight + rowGap));

      if (showOutline) {
        doc.setDrawColor(210, 210, 210);
        doc.setLineWidth(0.05);
        doc.roundedRect(x, y, labelWidth, labelHeight, borderRadius, borderRadius, 'S');
      }

      const hasVoltage = mode === LabelMode.PRODUCT && label.voltage && label.voltage !== 'NONE';
      const padding = 1.2;
      const availableWidth = hasVoltage ? (labelWidth / 2) - (padding * 1.5) : labelWidth - (padding * 2);
      
      const baseSize = mode === LabelMode.PRODUCT ? 8.5 : 14;
      const userFontSize = label.customFontSize || baseSize;
      const finalFontSize = userFontSize * multiplier;

      doc.setTextColor(0, 0, 0);
      
      if (mode === LabelMode.PRODUCT) {
        doc.setFont('helvetica', 'bold');
        const skuText = (label.sku || '').toUpperCase();
        const priceText = label.price || '';
        const obsText = (label.cxInner || '').toUpperCase();

        const effectiveAlign = hasVoltage ? 'left' : textAlign;
        const textX = effectiveAlign === 'center' ? x + (labelWidth / 2) : x + padding;

        const skuSize = getAutoFontSize(doc, skuText, availableWidth, finalFontSize);
        doc.setFontSize(skuSize);
        doc.text(skuText, textX, y + 4.5, { align: effectiveAlign });

        const priceSize = getAutoFontSize(doc, priceText, availableWidth, finalFontSize);
        doc.setFontSize(priceSize);
        doc.text(priceText, textX, y + 8.8, { align: effectiveAlign });

        const obsSize = getAutoFontSize(doc, obsText, availableWidth, finalFontSize * 0.75);
        doc.setFontSize(obsSize);
        doc.text(obsText, textX, y + 13, { align: effectiveAlign });

        if (hasVoltage) {
          const vBoxW = labelWidth / 2 - 1.5;
          const vBoxH = labelHeight - 2;
          const vBoxX = x + labelWidth / 2 + 0.5;
          const vBoxY = y + 1;
          
          doc.setDrawColor(0);
          doc.setLineWidth(0.15);
          doc.roundedRect(vBoxX, vBoxY, vBoxW, vBoxH, 0.5, 0.5, 'S');
          
          const voltValue = (label.voltage || '').replace('V', '');
          const voltFontSize = 18 * multiplier;
          doc.setFontSize(voltFontSize);
          doc.setFont('helvetica', 'bold');
          
          const vTextX = vBoxX + (vBoxW / 2);
          const vTextY = y + (labelHeight / 2) + 1.5;
          
          doc.text(voltValue, vTextX, vTextY - 1, { align: 'center' });
          doc.setFontSize(voltFontSize * 0.35);
          doc.text('VOLTS', vTextX, vTextY + 2.5, { align: 'center' });
        }
      } else {
        // Modo Medida com suporte a Multi-line
        doc.setFont('helvetica', 'bold');
        let mText = (label.measureText || '').toUpperCase();
        
        const wrapWidth = labelWidth - 4;
        let lines: string[] = label.multiLine ? doc.splitTextToSize(mText, wrapWidth) : [mText];
        
        const mSize = getAutoFontSize(doc, lines, wrapWidth, finalFontSize);
        doc.setFontSize(mSize);

        const lineHeight = mSize * ptToMm * 1.2;
        const totalHeight = lines.length * lineHeight;
        const startY = y + (labelHeight / 2) - (totalHeight / 2) + (lineHeight / 2) + (mSize * 0.1 * ptToMm);
        const textX = textAlign === 'center' ? x + (labelWidth / 2) : x + 1.5;

        lines.forEach((line, i) => {
          doc.text(line, textX, startY + (i * lineHeight), { align: textAlign === 'center' ? 'center' : 'left' });
        });
      }
    });
  }
  
  return doc.output('bloburl').toString();
};

export const downloadPDF = (blobUrl: string) => {
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `etiquetas_showroom_${new Date().getTime()}.pdf`;
  link.click();
};
