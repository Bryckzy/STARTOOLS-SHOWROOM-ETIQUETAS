
export enum LabelMode {
  PRODUCT = 'PRODUCT',
  MEASURE = 'MEASURE'
}

export type VoltageType = '127V' | '220V' | 'NONE';

export interface LabelItem {
  id: string;
  sku?: string;
  price?: string;
  cxInner?: string;
  measureText?: string;
  customFontSize?: number;
  voltage?: VoltageType;
  multiLine?: boolean;
}

export interface SheetConfig {
  columns: number;
  rows: number;
  labelWidth: number;
  labelHeight: number;
  marginLeft: number;
  marginTop: number;
  columnGap: number;
  rowGap: number;
  borderRadius: number;
}

/**
 * CONFIGURAÇÃO TÉCNICA OFICIAL PIMACO A4249
 * 126 etiquetas por folha (7 colunas x 18 linhas)
 * Dimensões: 26mm x 15mm
 * Margens: 8mm laterais | 13mm superior
 * Espaçamento: 2mm horizontal | 0mm vertical
 */
export const PIMACO_A4249_CONFIG: SheetConfig = {
  columns: 7,
  rows: 18,
  labelWidth: 26.0,
  labelHeight: 15.0,
  marginLeft: 8.0,
  marginTop: 13.0,
  columnGap: 2.0,
  rowGap: 0.0,
  borderRadius: 0.5 
};
