
import { jsPDF } from 'jspdf';
import { LabelItem, LabelMode, CA4249_CONFIG } from '../types';

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
  startPosition: number = 0,
  textAlign: 'left' | 'center' = 'center'
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

      // Cálculo de X baseado no alinhamento
      const isCenter = textAlign === 'center';
      const textX = isCenter ? x + (labelWidth / 2) : x + 2;
      const alignOption = isCenter ? 'center' : 'left';

      if (mode === LabelMode.PRODUCT) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(finalFontSize);
        doc.text((label.sku || '').toUpperCase(), textX, centerV - lineSpacing + (finalFontSize * 0.1), { align: alignOption });
        
        doc.setFont('helvetica', 'normal');
        doc.text(label.price || '', textX, centerV + (finalFontSize * 0.1), { align: alignOption });
        
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(finalFontSize * 0.75);
        doc.text((label.cxInner || '').toUpperCase(), textX, centerV + lineSpacing + (finalFontSize * 0.1), { align: alignOption });
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(finalFontSize);
        doc.text((label.measureText || '').toUpperCase(), textX, centerV + (finalFontSize * 0.1), { align: alignOption });
      }
    });
  }
  
  return doc.output('bloburl').toString();
};

export const downloadPDF = (blobUrl: string) => {
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `startools_${new Date().getTime()}.pdf`;
  link.click();
};
