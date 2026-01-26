/**
 * Document Generator Interfaces
 * Provides types and interfaces for PDF and Excel document generation
 */

// ==================== Common Interfaces ====================

export interface IDocumentMetadata {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    createdAt?: Date;
}

export interface IMargins {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export interface IDocumentOptions {
    metadata?: IDocumentMetadata;
    margins?: Partial<IMargins>;
}

// ==================== PDF Interfaces ====================

export type PdfPageSize = 'A4' | 'A3' | 'LETTER' | 'LEGAL' | 'TABLOID';
export type PdfPageOrientation = 'portrait' | 'landscape';
export type PdfTextAlign = 'left' | 'center' | 'right' | 'justify';
export type PdfFontStyle = 'normal' | 'bold' | 'italic' | 'bolditalic';

export interface IPdfFontOptions {
    size?: number;
    family?: string;
    style?: PdfFontStyle;
    color?: string;
}

export interface IPdfTextOptions extends IPdfFontOptions {
    align?: PdfTextAlign;
    lineGap?: number;
    paragraphGap?: number;
    indent?: number;
    columns?: number;
    columnGap?: number;
    underline?: boolean;
    strike?: boolean;
    link?: string;
}

export interface IPdfImageOptions {
    width?: number;
    height?: number;
    fit?: [number, number];
    align?: 'left' | 'center' | 'right';
    valign?: 'top' | 'center' | 'bottom';
}

export interface IPdfTableColumn {
    header: string;
    width?: number | 'auto' | '*';
    align?: PdfTextAlign;
}

export interface IPdfTableOptions {
    columns: IPdfTableColumn[];
    headerBackground?: string;
    headerTextColor?: string;
    headerFontSize?: number;
    rowFontSize?: number;
    alternateRowColor?: string;
    borderColor?: string;
    borderWidth?: number;
    cellPadding?: number;
}

export interface IPdfDocumentOptions extends IDocumentOptions {
    pageSize?: PdfPageSize;
    orientation?: PdfPageOrientation;
    compress?: boolean;
    autoFirstPage?: boolean;
}

export interface IPdfSectionContent {
    type: 'text' | 'heading' | 'paragraph' | 'image' | 'table' | 'list' | 'divider' | 'space' | 'pageBreak';
    data: any;
    options?: any;
}

export interface IPdfSection {
    title?: string;
    contents: IPdfSectionContent[];
}

// ==================== Excel Interfaces ====================

export type ExcelCellType = 'string' | 'number' | 'date' | 'boolean' | 'formula' | 'hyperlink' | 'richText';
export type ExcelHorizontalAlignment = 'left' | 'center' | 'right' | 'fill' | 'justify' | 'centerContinuous' | 'distributed';
export type ExcelVerticalAlignment = 'top' | 'middle' | 'bottom' | 'distributed' | 'justify';
export type ExcelBorderStyle = 'thin' | 'dotted' | 'dashDot' | 'hair' | 'dashDotDot' | 'slantDashDot' | 'mediumDashed' | 'mediumDashDotDot' | 'mediumDashDot' | 'medium' | 'double' | 'thick';

export interface IExcelCellStyle {
    font?: {
        name?: string;
        size?: number;
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        strike?: boolean;
        color?: string;
    };
    fill?: {
        type?: 'pattern' | 'gradient';
        pattern?: 'solid' | 'darkGray' | 'mediumGray' | 'lightGray' | 'gray125' | 'gray0625';
        fgColor?: string;
        bgColor?: string;
    };
    alignment?: {
        horizontal?: ExcelHorizontalAlignment;
        vertical?: ExcelVerticalAlignment;
        wrapText?: boolean;
        shrinkToFit?: boolean;
        indent?: number;
        textRotation?: number;
    };
    border?: {
        top?: { style?: ExcelBorderStyle; color?: string };
        bottom?: { style?: ExcelBorderStyle; color?: string };
        left?: { style?: ExcelBorderStyle; color?: string };
        right?: { style?: ExcelBorderStyle; color?: string };
    };
    numFmt?: string;
}

export interface IExcelColumnDefinition {
    header: string;
    key: string;
    width?: number;
    style?: IExcelCellStyle;
    outlineLevel?: number;
    hidden?: boolean;
}

export interface IExcelRowData {
    [key: string]: any;
}

export interface IExcelSheetOptions {
    name: string;
    columns?: IExcelColumnDefinition[];
    headerStyle?: IExcelCellStyle;
    defaultRowStyle?: IExcelCellStyle;
    freezePane?: {
        row?: number;
        column?: number;
    };
    autoFilter?: boolean;
    protection?: {
        password?: string;
        sheet?: boolean;
        objects?: boolean;
        scenarios?: boolean;
    };
}

export interface IExcelDocumentOptions extends IDocumentOptions {
    creator?: string;
    lastModifiedBy?: string;
    created?: Date;
    modified?: Date;
    company?: string;
}

// ==================== Builder Interfaces ====================

export interface IPdfBuilder {
    setOptions(options: IPdfDocumentOptions): IPdfBuilder;
    addSection(title?: string): IPdfSectionBuilder;
    addPageBreak(): IPdfBuilder;
    build(): Promise<Buffer>;
    buildStream(): NodeJS.ReadableStream;
}

export interface IPdfSectionBuilder {
    addHeading(text: string, level?: 1 | 2 | 3 | 4, options?: IPdfTextOptions): IPdfSectionBuilder;
    addParagraph(text: string, options?: IPdfTextOptions): IPdfSectionBuilder;
    addText(text: string, options?: IPdfTextOptions): IPdfSectionBuilder;
    addImage(source: string | Buffer, options?: IPdfImageOptions): IPdfSectionBuilder;
    addTable(data: any[][], options?: IPdfTableOptions): IPdfSectionBuilder;
    addList(items: string[], options?: { ordered?: boolean; bulletChar?: string; indent?: number }): IPdfSectionBuilder;
    addDivider(options?: { color?: string; thickness?: number }): IPdfSectionBuilder;
    addSpace(height?: number): IPdfSectionBuilder;
    endSection(): IPdfBuilder;
}

export interface IExcelBuilder {
    setOptions(options: IExcelDocumentOptions): IExcelBuilder;
    addSheet(options: IExcelSheetOptions): IExcelSheetBuilder;
    build(): Promise<Buffer>;
    buildStream(): Promise<NodeJS.ReadableStream>;
}

export interface IExcelSheetBuilder {
    addRow(data: IExcelRowData, style?: IExcelCellStyle): IExcelSheetBuilder;
    addRows(data: IExcelRowData[]): IExcelSheetBuilder;
    setCell(row: number, col: number | string, value: any, style?: IExcelCellStyle): IExcelSheetBuilder;
    mergeCells(startRow: number, startCol: number, endRow: number, endCol: number): IExcelSheetBuilder;
    setColumnWidth(col: number | string, width: number): IExcelSheetBuilder;
    setRowHeight(row: number, height: number): IExcelSheetBuilder;
    addConditionalFormatting(range: string, rules: any): IExcelSheetBuilder;
    addFormula(row: number, col: number | string, formula: string, style?: IExcelCellStyle): IExcelSheetBuilder;
    addHyperlink(row: number, col: number | string, text: string, url: string, style?: IExcelCellStyle): IExcelSheetBuilder;
    endSheet(): IExcelBuilder;
}

// ==================== Service Interfaces ====================

export interface IDocumentGeneratorService {
    createPdfBuilder(): IPdfBuilder;
    createExcelBuilder(): IExcelBuilder;
}

export const DOCUMENT_GENERATOR_SERVICE = Symbol('DOCUMENT_GENERATOR_SERVICE');
