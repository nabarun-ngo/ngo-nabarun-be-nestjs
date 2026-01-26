import PDFDocument from 'pdfkit';
import {
    IPdfBuilder,
    IPdfSectionBuilder,
    IPdfDocumentOptions,
    IPdfTextOptions,
    IPdfImageOptions,
    IPdfTableOptions,
    IPdfTableColumn,
    IPdfSectionContent,
    PdfPageSize,
} from '../interfaces/document-generator.interface';

/**
 * PDF Section Builder - Fluent API for building PDF sections
 */
class PdfSectionBuilder implements IPdfSectionBuilder {
    private contents: IPdfSectionContent[] = [];

    constructor(
        private readonly parentBuilder: PdfBuilderService,
        private readonly sectionTitle?: string,
    ) { }

    addHeading(text: string, level: 1 | 2 | 3 | 4 = 1, options?: IPdfTextOptions): IPdfSectionBuilder {
        const fontSizes = { 1: 24, 2: 20, 3: 16, 4: 14 };
        this.contents.push({
            type: 'heading',
            data: text,
            options: {
                ...options,
                size: options?.size || fontSizes[level],
                style: options?.style || 'bold',
            },
        });
        return this;
    }

    addParagraph(text: string, options?: IPdfTextOptions): IPdfSectionBuilder {
        this.contents.push({
            type: 'paragraph',
            data: text,
            options: {
                ...options,
                paragraphGap: options?.paragraphGap || 10,
            },
        });
        return this;
    }

    addText(text: string, options?: IPdfTextOptions): IPdfSectionBuilder {
        this.contents.push({
            type: 'text',
            data: text,
            options,
        });
        return this;
    }

    addImage(source: string | Buffer, options?: IPdfImageOptions): IPdfSectionBuilder {
        this.contents.push({
            type: 'image',
            data: source,
            options,
        });
        return this;
    }

    addTable(data: any[][], options?: IPdfTableOptions): IPdfSectionBuilder {
        this.contents.push({
            type: 'table',
            data,
            options,
        });
        return this;
    }

    addList(items: string[], options?: { ordered?: boolean; bulletChar?: string; indent?: number }): IPdfSectionBuilder {
        this.contents.push({
            type: 'list',
            data: items,
            options: {
                ordered: options?.ordered || false,
                bulletChar: options?.bulletChar || '•',
                indent: options?.indent || 20,
            },
        });
        return this;
    }

    addDivider(options?: { color?: string; thickness?: number }): IPdfSectionBuilder {
        this.contents.push({
            type: 'divider',
            data: null,
            options: {
                color: options?.color || '#cccccc',
                thickness: options?.thickness || 1,
            },
        });
        return this;
    }

    addSpace(height: number = 20): IPdfSectionBuilder {
        this.contents.push({
            type: 'space',
            data: height,
            options: {},
        });
        return this;
    }

    endSection(): IPdfBuilder {
        this.parentBuilder.registerSection({
            title: this.sectionTitle,
            contents: this.contents,
        });
        return this.parentBuilder;
    }

    getContents(): IPdfSectionContent[] {
        return this.contents;
    }
}

/**
 * PDF Builder Service - Main service for building PDF documents with a fluent API
 * 
 * @example
 * ```typescript
 * const pdf = await pdfBuilder
 *   .setOptions({ pageSize: 'A4', orientation: 'portrait' })
 *   .addSection('Introduction')
 *     .addHeading('Welcome to Our Report', 1)
 *     .addParagraph('This is an introductory paragraph...')
 *     .addDivider()
 *   .endSection()
 *   .addSection('Data')
 *     .addTable(tableData, { columns: [...] })
 *   .endSection()
 *   .build();
 * ```
 */
export class PdfBuilderService implements IPdfBuilder {
    private options: IPdfDocumentOptions = {};
    private sections: { title?: string; contents: IPdfSectionContent[] }[] = [];
    private pageBreaks: number[] = [];

    private static readonly PAGE_SIZES: Record<PdfPageSize, [number, number]> = {
        'A4': [595.28, 841.89],
        'A3': [841.89, 1190.55],
        'LETTER': [612, 792],
        'LEGAL': [612, 1008],
        'TABLOID': [792, 1224],
    };

    private static readonly DEFAULT_MARGINS = {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
    };

    setOptions(options: IPdfDocumentOptions): IPdfBuilder {
        this.options = { ...this.options, ...options };
        return this;
    }

    addSection(title?: string): IPdfSectionBuilder {
        return new PdfSectionBuilder(this, title);
    }

    addPageBreak(): IPdfBuilder {
        this.pageBreaks.push(this.sections.length);
        return this;
    }

    registerSection(section: { title?: string; contents: IPdfSectionContent[] }): void {
        this.sections.push(section);
    }

    async build(): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            const doc = this.createDocument();

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            this.renderDocument(doc);
            doc.end();
        });
    }

    buildStream(): NodeJS.ReadableStream {
        const doc = this.createDocument();
        this.renderDocument(doc);
        doc.end();
        return doc;
    }

    private createDocument(): PDFKit.PDFDocument {
        const pageSize = this.options.pageSize || 'A4';
        const orientation = this.options.orientation || 'portrait';
        const margins = { ...PdfBuilderService.DEFAULT_MARGINS, ...this.options.margins };

        let size = PdfBuilderService.PAGE_SIZES[pageSize];
        if (orientation === 'landscape') {
            size = [size[1], size[0]];
        }

        // Build info object, filtering out undefined values
        const info: PDFKit.PDFDocumentOptions['info'] = {
            CreationDate: new Date(),
        };
        if (this.options.metadata?.title) info.Title = this.options.metadata.title;
        if (this.options.metadata?.author) info.Author = this.options.metadata.author;
        if (this.options.metadata?.subject) info.Subject = this.options.metadata.subject;
        if (this.options.metadata?.keywords?.length) info.Keywords = this.options.metadata.keywords.join(', ');
        if (this.options.metadata?.createdAt) info.CreationDate = this.options.metadata.createdAt;

        const doc = new PDFDocument({
            size,
            margins,
            compress: this.options.compress ?? true,
            autoFirstPage: this.options.autoFirstPage ?? true,
            info,
        });

        return doc;
    }

    private renderDocument(doc: PDFKit.PDFDocument): void {
        this.sections.forEach((section, sectionIndex) => {
            // Check for page break before this section
            if (this.pageBreaks.includes(sectionIndex) && sectionIndex > 0) {
                doc.addPage();
            }

            // Render section title if present
            if (section.title) {
                this.renderHeading(doc, section.title, { size: 18, style: 'bold' });
                doc.moveDown(0.5);
            }

            // Render section contents
            section.contents.forEach((content) => {
                this.renderContent(doc, content);
            });

            // Add spacing between sections
            if (sectionIndex < this.sections.length - 1) {
                doc.moveDown(1);
            }
        });
    }

    private renderContent(doc: PDFKit.PDFDocument, content: IPdfSectionContent): void {
        switch (content.type) {
            case 'heading':
                this.renderHeading(doc, content.data, content.options);
                break;
            case 'paragraph':
                this.renderParagraph(doc, content.data, content.options);
                break;
            case 'text':
                this.renderText(doc, content.data, content.options);
                break;
            case 'image':
                this.renderImage(doc, content.data, content.options);
                break;
            case 'table':
                this.renderTable(doc, content.data, content.options);
                break;
            case 'list':
                this.renderList(doc, content.data, content.options);
                break;
            case 'divider':
                this.renderDivider(doc, content.options);
                break;
            case 'space':
                doc.moveDown(content.data / 12);
                break;
            case 'pageBreak':
                doc.addPage();
                break;
        }
    }

    private renderHeading(doc: PDFKit.PDFDocument, text: string, options?: IPdfTextOptions): void {
        this.applyFontOptions(doc, options);
        doc.text(text, {
            align: options?.align || 'left',
            underline: options?.underline,
            strike: options?.strike,
            link: options?.link,
        });
        doc.moveDown(0.5);
    }

    private renderParagraph(doc: PDFKit.PDFDocument, text: string, options?: IPdfTextOptions): void {
        this.applyFontOptions(doc, { ...options, style: options?.style || 'normal' });
        doc.text(text, {
            align: options?.align || 'justify',
            lineGap: options?.lineGap || 2,
            paragraphGap: options?.paragraphGap || 10,
            indent: options?.indent,
            columns: options?.columns,
            columnGap: options?.columnGap,
        });
    }

    private renderText(doc: PDFKit.PDFDocument, text: string, options?: IPdfTextOptions): void {
        this.applyFontOptions(doc, options);
        doc.text(text, {
            align: options?.align || 'left',
            continued: false,
            underline: options?.underline,
            strike: options?.strike,
            link: options?.link,
        });
    }

    private renderImage(doc: PDFKit.PDFDocument, source: string | Buffer, options?: IPdfImageOptions): void {
        const imageOptions: PDFKit.Mixins.ImageOption = {};

        if (options?.width) imageOptions.width = options.width;
        if (options?.height) imageOptions.height = options.height;
        if (options?.fit) imageOptions.fit = options.fit;
        if (options?.align && options.align !== 'left') {
            imageOptions.align = options.align as 'center' | 'right';
        }
        if (options?.valign && options.valign !== 'top') {
            imageOptions.valign = options.valign as 'center' | 'bottom';
        }

        doc.image(source, imageOptions);
        doc.moveDown(0.5);
    }

    private renderTable(doc: PDFKit.PDFDocument, data: any[][], options?: IPdfTableOptions): void {
        if (!data || data.length === 0) return;

        const startX = doc.page.margins.left;
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const cellPadding = options?.cellPadding || 5;
        const borderWidth = options?.borderWidth || 0.5;
        const borderColor = options?.borderColor || '#000000';

        // Calculate column widths
        const columns: IPdfTableColumn[] = options?.columns || data[0].map((_, i) => ({ header: `Column ${i + 1}` }));
        const numColumns = columns.length;
        const columnWidths = this.calculateColumnWidths(columns, pageWidth, numColumns);

        let currentY = doc.y;

        // Draw header row
        if (columns.length > 0) {
            const headerHeight = this.calculateRowHeight(doc, columns.map(c => c.header), columnWidths, cellPadding, options?.headerFontSize || 10);

            // Header background
            if (options?.headerBackground) {
                doc.rect(startX, currentY, pageWidth, headerHeight)
                    .fill(options.headerBackground);
            }

            // Header text
            doc.fillColor(options?.headerTextColor || '#000000');
            doc.font('Helvetica-Bold').fontSize(options?.headerFontSize || 10);

            let cellX = startX;
            columns.forEach((column, i) => {
                doc.text(column.header, cellX + cellPadding, currentY + cellPadding, {
                    width: columnWidths[i] - cellPadding * 2,
                    align: column.align || 'left',
                });
                cellX += columnWidths[i];
            });

            // Header border
            doc.strokeColor(borderColor).lineWidth(borderWidth);
            doc.rect(startX, currentY, pageWidth, headerHeight).stroke();

            currentY += headerHeight;
        }

        // Draw data rows
        doc.font('Helvetica').fontSize(options?.rowFontSize || 10);
        doc.fillColor('#000000');

        data.forEach((row, rowIndex) => {
            const rowHeight = this.calculateRowHeight(doc, row, columnWidths, cellPadding, options?.rowFontSize || 10);

            // Check for page break
            if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                currentY = doc.page.margins.top;
            }

            // Alternate row background
            if (options?.alternateRowColor && rowIndex % 2 === 1) {
                doc.rect(startX, currentY, pageWidth, rowHeight)
                    .fill(options.alternateRowColor);
                doc.fillColor('#000000');
            }

            // Row cells
            let cellX = startX;
            row.forEach((cell, cellIndex) => {
                const cellValue = cell?.toString() || '';
                const column = columns[cellIndex];
                doc.text(cellValue, cellX + cellPadding, currentY + cellPadding, {
                    width: columnWidths[cellIndex] - cellPadding * 2,
                    align: column?.align || 'left',
                });
                cellX += columnWidths[cellIndex];
            });

            // Row border
            doc.strokeColor(borderColor).lineWidth(borderWidth);
            doc.rect(startX, currentY, pageWidth, rowHeight).stroke();

            currentY += rowHeight;
        });

        doc.y = currentY;
        doc.moveDown(0.5);
    }

    private calculateColumnWidths(columns: any[], pageWidth: number, numColumns: number): number[] {
        const widths: number[] = [];
        let totalFixed = 0;
        let autoCount = 0;

        columns.forEach((col) => {
            if (typeof col.width === 'number') {
                widths.push(col.width);
                totalFixed += col.width;
            } else {
                widths.push(0);
                autoCount++;
            }
        });

        const remainingWidth = pageWidth - totalFixed;
        const autoWidth = autoCount > 0 ? remainingWidth / autoCount : 0;

        return widths.map((w, i) => w === 0 ? autoWidth : w);
    }

    private calculateRowHeight(doc: PDFKit.PDFDocument, row: any[], columnWidths: number[], cellPadding: number, fontSize: number): number {
        let maxHeight = fontSize + cellPadding * 2;

        row.forEach((cell, i) => {
            const cellValue = cell?.toString() || '';
            const textHeight = doc.heightOfString(cellValue, {
                width: columnWidths[i] - cellPadding * 2,
            });
            maxHeight = Math.max(maxHeight, textHeight + cellPadding * 2);
        });

        return maxHeight;
    }

    private renderList(doc: PDFKit.PDFDocument, items: string[], options: { ordered?: boolean; bulletChar?: string; indent?: number }): void {
        const indent = options.indent || 20;
        const bulletChar = options.bulletChar || '•';

        items.forEach((item, index) => {
            const prefix = options.ordered ? `${index + 1}. ` : `${bulletChar} `;
            doc.text(prefix + item, doc.page.margins.left + indent, doc.y, {
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right - indent,
            });
        });

        doc.moveDown(0.5);
    }

    private renderDivider(doc: PDFKit.PDFDocument, options: { color?: string; thickness?: number }): void {
        const startX = doc.page.margins.left;
        const endX = doc.page.width - doc.page.margins.right;
        const y = doc.y + 10;

        doc.strokeColor(options.color || '#cccccc')
            .lineWidth(options.thickness || 1)
            .moveTo(startX, y)
            .lineTo(endX, y)
            .stroke();

        doc.y = y + 10;
    }

    private applyFontOptions(doc: PDFKit.PDFDocument, options?: IPdfTextOptions): void {
        const fontFamily = options?.family || 'Helvetica';
        const fontSize = options?.size || 12;
        const fontStyle = options?.style || 'normal';

        const fontMap: Record<string, string> = {
            'normal': fontFamily,
            'bold': `${fontFamily}-Bold`,
            'italic': `${fontFamily}-Oblique`,
            'bolditalic': `${fontFamily}-BoldOblique`,
        };

        try {
            doc.font(fontMap[fontStyle] || fontFamily);
        } catch {
            doc.font(fontFamily);
        }

        doc.fontSize(fontSize);

        if (options?.color) {
            doc.fillColor(options.color);
        } else {
            doc.fillColor('#000000');
        }
    }

    /**
     * Reset the builder for reuse
     */
    reset(): PdfBuilderService {
        this.options = {};
        this.sections = [];
        this.pageBreaks = [];
        return this;
    }
}
