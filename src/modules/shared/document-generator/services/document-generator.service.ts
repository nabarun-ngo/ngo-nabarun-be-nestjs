import { Injectable } from '@nestjs/common';

import { PdfBuilderService } from './pdf-builder.service';
import { ExcelBuilderService } from './excel-builder.service';
import { PuppeteerPdfBuilderService } from './puppeteer-pdf-builder.service';
import { IPdfBuilder } from '../interfaces/pdf-generator.interface';

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
 */
@Injectable()
export class DocumentGeneratorService {
    /**
     * Create a new PDF builder instance
     * 
     * @param engine The engine to use: 'pdfkit' (fast, lightweight) or 'puppeteer' (stunning HTML/CSS support)
     * @returns A new IPdfBuilder instance
     */
    createPdfBuilder(engine: 'pdfkit' | 'puppeteer' = 'pdfkit'): IPdfBuilder {
        if (engine === 'puppeteer') {
            return new PuppeteerPdfBuilderService();
        }
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
    createExcelBuilder() {
        return new ExcelBuilderService();
    }
}
