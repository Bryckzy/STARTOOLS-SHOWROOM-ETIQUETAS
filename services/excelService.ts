
import * as XLSX from 'xlsx';
import { LabelItem, LabelMode } from '../types';

export const downloadTemplate = (mode: LabelMode) => {
  const headers = mode === LabelMode.PRODUCT 
    ? [['SKU', 'PRECO', 'CX_INNER']]
    : [['MEDIDA']];
  
  const ws = XLSX.utils.aoa_to_sheet(headers);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  
  const fileName = mode === LabelMode.PRODUCT ? 'modelo_produto.xlsx' : 'modelo_medida.xlsx';
  XLSX.writeFile(wb, fileName);
};

export const parseExcel = async (file: File, mode: LabelMode): Promise<LabelItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet);

        const items: LabelItem[] = jsonData.map((row, index) => {
          const id = crypto.randomUUID();
          if (mode === LabelMode.PRODUCT) {
            return {
              id,
              sku: String(row['SKU'] || ''),
              price: String(row['PRECO'] || ''),
              cxInner: String(row['CX_INNER'] || '')
            };
          } else {
            return {
              id,
              measureText: String(row['MEDIDA'] || '')
            };
          }
        }).filter(item => {
          // Filter out empty rows
          if (mode === LabelMode.PRODUCT) {
            return item.sku || item.price || item.cxInner;
          }
          return item.measureText;
        });

        resolve(items);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
