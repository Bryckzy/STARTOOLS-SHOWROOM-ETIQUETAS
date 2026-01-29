
export enum LabelMode {
  PRODUCT = 'PRODUCT',
  MEASURE = 'MEASURE'
}

export interface LabelItem {
  id: string;
  sku?: string;
  price?: string;
  cxInner?: string;
  measureText?: string;
  customFontSize?: number;
}

export interface SheetConfig {
  columns: number;
  rows: number;
  labelWidth: number;
  labelHeight: number;
  marginLeft: number;
  marginTop: number;
  borderRadius: number;
}

/**
 * CONFIGURAÇÃO OFICIAL COLACRIL CA4249
 * 126 etiquetas por folha (7 colunas x 18 linhas)
 * Cada etiqueta: 26mm x 15mm
 * Folha A4: 210mm x 297mm
 */
export const CA4249_CONFIG: SheetConfig = {
  columns: 7,
  rows: 18,
  labelWidth: 26.0,
  labelHeight: 15.0,
  marginLeft: 14.0, // (210 - (7 * 26)) / 2
  marginTop: 13.5,  // (297 - (18 * 15)) / 2
  borderRadius: 1.0 
};
