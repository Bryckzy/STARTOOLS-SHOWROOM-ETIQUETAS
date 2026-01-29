
import { jsPDF } from 'jspdf';
import { LabelItem, LabelMode, CA4249_CONFIG } from '../types';

/**
 * Motor de Calibração STARTOOLS V16
 * Calcula o multiplicador para que 10pt = 26mm físicos na largura.
 */
const getCalibratedMultiplier = (doc: jsPDF): number => {
  const benchmarkText = "CX464 - 74X107";
  const targetWidthMm = 26.0;
  const referencePt = 10.0;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(referencePt);
  const currentWidthMm = doc.getTextWidth(benchmarkText);
  return targetWidthMm / currentWidthMm;
};

export const generatePDFBlob = (
  labels: LabelItem[],
  mode: LabelMode,
  showOutline: boolean,
  startPosition: number = 0
): string => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    floatPrecision: 16
  });

  const { columns, rows, labelWidth, labelHeight, marginLeft, marginTop, borderRadius } = CA4249_CONFIG;
  const multiplier = getCalibratedMultiplier(doc);
  const labelsPerPage = columns * rows;
  const fullList = [...Array(startPosition).fill(null), ...labels];
  const totalPages = Math.ceil(fullList.length / labelsPerPage) || 1;

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage();
    const pageItems = fullList.slice(page * labelsPerPage, (page + 1) * labelsPerPage);

    pageItems.forEach((label, index) => {
      if (!label) return;
      const x = marginLeft + ((index % columns) * labelWidth);
      const y = marginTop + (Math.floor(index / columns) * labelHeight);

      if (showOutline) {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.05);
        doc.roundedRect(x, y, labelWidth, labelHeight, borderRadius, borderRadius, 'S');
      }

      const baseSize = mode === LabelMode.PRODUCT ? 8.5 : 14;
      const userFontSize = label.customFontSize || baseSize;
      const finalFontSize = userFontSize * multiplier;

      doc.setTextColor(0, 0, 0);
      const centerV = y + (labelHeight / 2);
      const ptToMm = 0.3527; 
      const lineSpacing = (finalFontSize * ptToMm) * 1.1;

      if (mode === LabelMode.PRODUCT) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(finalFontSize);
        doc.text((label.sku || '').toUpperCase(), x + (labelWidth/2), centerV - lineSpacing + (finalFontSize * 0.1), { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.text(label.price || '', x + (labelWidth/2), centerV + (finalFontSize * 0.1), { align: 'center' });
        
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(finalFontSize * 0.75);
        doc.text((label.cxInner || '').toUpperCase(), x + (labelWidth/2), centerV + lineSpacing + (finalFontSize * 0.1), { align: 'center' });
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(finalFontSize);
        doc.text((label.measureText || '').toUpperCase(), x + (labelWidth/2), centerV + (finalFontSize * 0.1), { align: 'center' });
      }
    });
  }
  
  // FIX: doc.output('bloburl') returns a URL object in modern jsPDF types, convert it to string.
  return doc.output('bloburl').toString();
};

export const downloadPDF = (blobUrl: string) => {
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `startools_print_${new Date().getTime()}.pdf`;
  link.click();
};
