import { Injectable } from '@nestjs/common';
import {
    IDocumentGeneratorService,
    IPdfBuilder,
    IExcelBuilder,
} from '../interfaces/document-generator.interface';
import { PdfBuilderService } from './pdf-builder.service';
import { ExcelBuilderService } from './excel-builder.service';

/**
 * Document Generator Service
 * 
 * Factory service for creating PDF and Excel document builders.
 * Use this service to generate documents with a fluent builder pattern.
 * 
 * @example
 * ```typescript
 * // Inject the service
 * constructor(private documentGenerator: DocumentGeneratorService) {}
 * 
 * // Create a PDF
 * async generateReport() {
 *   const pdfBuffer = await this.documentGenerator
 *     .createPdfBuilder()
 *     .setOptions({ pageSize: 'A4', metadata: { title: 'Report' } })
 *     .addSection('Introduction')
 *       .addHeading('Monthly Report', 1)
 *       .addParagraph('This report covers...')
 *     .endSection()
 *     .addSection('Data')
 *       .addTable(data, { columns: [...] })
 *     .endSection()
 *     .build();
 *   
 *   return pdfBuffer;
 * }
 * 
 * // Create an Excel file
 * async generateSpreadsheet() {
 *   const excelBuffer = await this.documentGenerator
 *     .createExcelBuilder()
 *     .setOptions({ creator: 'System' })
 *     .addSheet({ 
 *       name: 'Data', 
 *       columns: [
 *         { header: 'Name', key: 'name', width: 20 },
 *         { header: 'Value', key: 'value', width: 15 }
 *       ]
 *     })
 *       .addRows(data)
 *     .endSheet()
 *     .build();
 *   
 *   return excelBuffer;
 * }
 * ```
 */
@Injectable()
export class DocumentGeneratorService implements IDocumentGeneratorService {
    /**
     * Create a new PDF builder instance
     * 
     * @returns A new PdfBuilderService instance with fluent API
     * 
     * @example
     * ```typescript
     * const pdf = await documentGenerator
     *   .createPdfBuilder()
     *   .setOptions({
     *     pageSize: 'A4',
     *     orientation: 'portrait',
     *     metadata: {
     *       title: 'Invoice',
     *       author: 'Company Name'
     *     }
     *   })
     *   .addSection('Header')
     *     .addHeading('INVOICE', 1, { align: 'center' })
     *     .addText('Invoice #12345')
     *   .endSection()
     *   .addSection('Items')
     *     .addTable(items, {
     *       columns: [
     *         { header: 'Description', width: 200 },
     *         { header: 'Qty', width: 50, align: 'center' },
     *         { header: 'Price', width: 80, align: 'right' }
     *       ],
     *       headerBackground: '#4472C4',
     *       headerTextColor: '#FFFFFF'
     *     })
     *   .endSection()
     *   .build();
     * ```
     */
    createPdfBuilder(): IPdfBuilder {
        return new PdfBuilderService();
    }

    /**
     * Create a new Excel builder instance
     * 
     * @returns A new ExcelBuilderService instance with fluent API
     * 
     * @example
     * ```typescript
     * const excel = await documentGenerator
     *   .createExcelBuilder()
     *   .setOptions({
     *     creator: 'System',
     *     metadata: { title: 'Sales Report' }
     *   })
     *   .addSheet({
     *     name: 'Sales',
     *     columns: [
     *       { header: 'Date', key: 'date', width: 12 },
     *       { header: 'Product', key: 'product', width: 25 },
     *       { header: 'Amount', key: 'amount', width: 12 }
     *     ],
     *     autoFilter: true,
     *     freezePane: { row: 1 }
     *   })
     *     .addRows(salesData)
     *   .endSheet()
     *   .build();
     * ```
     */
    createExcelBuilder(): IExcelBuilder {
        return new ExcelBuilderService();
    }
}
