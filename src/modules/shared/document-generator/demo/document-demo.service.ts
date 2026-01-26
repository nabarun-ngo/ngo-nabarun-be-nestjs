import * as fs from 'fs';
import * as path from 'path';
import { DocumentGeneratorService } from '../services/document-generator.service';
import { ExcelStyles } from '../services/excel-builder.service';
/**
 * Demo script showcasing PDF and Excel generation capabilities
 * Uses direct instantiation with `new` keyword - no DI required
 * 
 * Run with: npx ts-node src/modules/shared/document-generator/demo/document-demo.service.ts
 */

// Output directory for generated files
const OUTPUT_DIR = path.join(process.cwd(), 'generated-documents');

/**
 * Ensure output directory exists
 */
function ensureOutputDir(): void {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`Created output directory: ${OUTPUT_DIR}`);
    }
}

/**
 * Save buffer to file
 */
function saveToFile(buffer: Buffer, filename: string): string {
    ensureOutputDir();
    const filePath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`Saved: ${filePath}`);
    return filePath;
}

/**
 * Generate a sample invoice PDF
 */
async function generateSampleInvoicePdf(): Promise<string> {
    const invoiceData = {
        invoiceNumber: 'INV-2026-001',
        date: new Date().toLocaleDateString('en-IN'),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
        company: {
            name: 'Acme Corporation',
            address: '123 Business Park, Mumbai, MH 400001',
            email: 'billing@acme.com',
            phone: '+91 22 1234 5678',
        },
        customer: {
            name: 'John Doe',
            company: 'Doe Enterprises',
            address: '456 Tech Lane, Bangalore, KA 560001',
            email: 'john@doeenterprises.com',
        },
        items: [
            { description: 'Web Development Services', quantity: 40, rate: 2500, amount: 100000 },
            { description: 'UI/UX Design', quantity: 20, rate: 2000, amount: 40000 },
            { description: 'API Integration', quantity: 15, rate: 3000, amount: 45000 },
            { description: 'Testing & QA', quantity: 10, rate: 1500, amount: 15000 },
            { description: 'Documentation', quantity: 5, rate: 1000, amount: 5000 },
        ],
        subtotal: 205000,
        tax: 36900,
        total: 241900,
    };

    const buffer = await new DocumentGeneratorService()
        .createPdfBuilder()
        .setOptions({
            pageSize: 'A4',
            orientation: 'portrait',
            metadata: {
                title: `Invoice ${invoiceData.invoiceNumber}`,
                author: invoiceData.company.name,
                subject: 'Invoice',
                keywords: ['invoice', 'billing', 'payment'],
            },
            margins: { top: 50, bottom: 50, left: 50, right: 50 },
        })
        // Header Section
        .addSection()
        .addHeading('INVOICE', 1, { align: 'center', color: '#2563EB' })
        .addSpace(10)
        .addText(`Invoice Number: ${invoiceData.invoiceNumber}`, { align: 'right' })
        .addText(`Date: ${invoiceData.date}`, { align: 'right' })
        .addText(`Due Date: ${invoiceData.dueDate}`, { align: 'right' })
        .addDivider({ color: '#2563EB', thickness: 2 })
        .endSection()
        // Company & Customer Info
        .addSection()
        .addHeading('From:', 3)
        .addText(invoiceData.company.name, { style: 'bold' })
        .addText(invoiceData.company.address)
        .addText(`Email: ${invoiceData.company.email}`)
        .addText(`Phone: ${invoiceData.company.phone}`)
        .addSpace(15)
        .addHeading('Bill To:', 3)
        .addText(invoiceData.customer.name, { style: 'bold' })
        .addText(invoiceData.customer.company)
        .addText(invoiceData.customer.address)
        .addText(`Email: ${invoiceData.customer.email}`)
        .addSpace(20)
        .endSection()
        // Items Table
        .addSection()
        .addHeading('Items', 2)
        .addTable(
            invoiceData.items.map(item => [
                item.description,
                item.quantity.toString(),
                `₹${item.rate.toLocaleString('en-IN')}`,
                `₹${item.amount.toLocaleString('en-IN')}`,
            ]),
            {
                columns: [
                    { header: 'Description', width: 250 },
                    { header: 'Qty', width: 50, align: 'center' },
                    { header: 'Rate', width: 80, align: 'right' },
                    { header: 'Amount', width: 100, align: 'right' },
                ],
                headerBackground: '#2563EB',
                headerTextColor: '#FFFFFF',
                alternateRowColor: '#F3F4F6',
                borderColor: '#E5E7EB',
                cellPadding: 8,
            }
        )
        .addSpace(20)
        .endSection()
        // Totals Section
        .addSection()
        .addText(`Subtotal: ₹${invoiceData.subtotal.toLocaleString('en-IN')}`, { align: 'right', size: 12 })
        .addText(`GST (18%): ₹${invoiceData.tax.toLocaleString('en-IN')}`, { align: 'right', size: 12 })
        .addDivider()
        .addText(`Total: ₹${invoiceData.total.toLocaleString('en-IN')}`, { align: 'right', size: 16, style: 'bold', color: '#2563EB' })
        .addSpace(30)
        .endSection()
        // Footer
        .addSection()
        .addDivider({ color: '#E5E7EB' })
        .addParagraph('Thank you for your business!', { align: 'center', style: 'italic', color: '#6B7280' })
        .addText('Payment Terms: Net 30 days', { align: 'center', size: 10, color: '#9CA3AF' })
        .endSection()
        .build();

    return saveToFile(buffer, 'sample-invoice.pdf');
}

/**
 * Generate a sample report PDF
 */
async function generateSampleReportPdf(): Promise<string> {
    const reportData = {
        title: 'Monthly Sales Report',
        period: 'January 2026',
        generatedAt: new Date().toLocaleString('en-IN'),
        summary: {
            totalSales: 1250000,
            totalOrders: 342,
            averageOrderValue: 3654,
            topProduct: 'Enterprise License',
        },
        salesByRegion: [
            ['North', '₹4,50,000', '120', '36%'],
            ['South', '₹3,80,000', '98', '30%'],
            ['East', '₹2,20,000', '64', '18%'],
            ['West', '₹2,00,000', '60', '16%'],
        ],
        topProducts: [
            ['Enterprise License', '45', '₹5,62,500'],
            ['Professional Plan', '89', '₹3,56,000'],
            ['Starter Pack', '156', '₹2,34,000'],
            ['Add-on Services', '52', '₹97,500'],
        ],
    };

    const buffer = await new DocumentGeneratorService()
        .createPdfBuilder()
        .setOptions({
            pageSize: 'A4',
            orientation: 'portrait',
            metadata: {
                title: reportData.title,
                subject: `Report for ${reportData.period}`,
            },
        })
        // Title Page
        .addSection()
        .addSpace(100)
        .addHeading(reportData.title, 1, { align: 'center', color: '#1F2937' })
        .addHeading(reportData.period, 2, { align: 'center', color: '#6B7280' })
        .addSpace(50)
        .addText(`Generated: ${reportData.generatedAt}`, { align: 'center', color: '#9CA3AF', size: 10 })
        .endSection()
        .addPageBreak()
        // Executive Summary
        .addSection('Executive Summary')
        .addParagraph('This report provides an overview of sales performance for the reporting period. Key metrics and regional breakdowns are included for analysis.')
        .addSpace(20)
        .addHeading('Key Metrics', 3)
        .addList([
            `Total Sales: ₹${reportData.summary.totalSales.toLocaleString('en-IN')}`,
            `Total Orders: ${reportData.summary.totalOrders}`,
            `Average Order Value: ₹${reportData.summary.averageOrderValue.toLocaleString('en-IN')}`,
            `Top Product: ${reportData.summary.topProduct}`,
        ])
        .addSpace(20)
        .endSection()
        // Sales by Region
        .addSection('Sales by Region')
        .addTable(reportData.salesByRegion, {
            columns: [
                { header: 'Region', width: 120 },
                { header: 'Revenue', width: 120, align: 'right' },
                { header: 'Orders', width: 80, align: 'center' },
                { header: 'Share', width: 80, align: 'center' },
            ],
            headerBackground: '#059669',
            headerTextColor: '#FFFFFF',
            alternateRowColor: '#ECFDF5',
            cellPadding: 10,
        })
        .addSpace(30)
        .endSection()
        // Top Products
        .addSection('Top Products')
        .addTable(reportData.topProducts, {
            columns: [
                { header: 'Product', width: 200 },
                { header: 'Units Sold', width: 100, align: 'center' },
                { header: 'Revenue', width: 120, align: 'right' },
            ],
            headerBackground: '#7C3AED',
            headerTextColor: '#FFFFFF',
            alternateRowColor: '#F5F3FF',
            cellPadding: 10,
        })
        .addSpace(30)
        .endSection()
        // Conclusion
        .addSection('Conclusion')
        .addParagraph('The sales performance for this period shows strong growth in the Northern region. The Enterprise License continues to be our top revenue generator. Recommendations include focusing marketing efforts on the Eastern and Western regions to improve market penetration.')
        .endSection()
        .build();

    return saveToFile(buffer, 'sample-report.pdf');
}

/**
 * Generate a sample Excel workbook with multiple sheets
 */
async function generateSampleExcel(): Promise<string> {
    const salesData = [
        { date: '2026-01-01', product: 'Enterprise License', category: 'Software', region: 'North', quantity: 5, unitPrice: 12500, amount: 62500 },
        { date: '2026-01-02', product: 'Professional Plan', category: 'Subscription', region: 'South', quantity: 10, unitPrice: 4000, amount: 40000 },
        { date: '2026-01-03', product: 'Starter Pack', category: 'Subscription', region: 'East', quantity: 15, unitPrice: 1500, amount: 22500 },
        { date: '2026-01-04', product: 'Enterprise License', category: 'Software', region: 'West', quantity: 3, unitPrice: 12500, amount: 37500 },
        { date: '2026-01-05', product: 'Add-on Services', category: 'Services', region: 'North', quantity: 8, unitPrice: 2000, amount: 16000 },
        { date: '2026-01-06', product: 'Professional Plan', category: 'Subscription', region: 'South', quantity: 12, unitPrice: 4000, amount: 48000 },
        { date: '2026-01-07', product: 'Training Package', category: 'Services', region: 'East', quantity: 4, unitPrice: 5000, amount: 20000 },
        { date: '2026-01-08', product: 'Enterprise License', category: 'Software', region: 'North', quantity: 2, unitPrice: 12500, amount: 25000 },
        { date: '2026-01-09', product: 'Starter Pack', category: 'Subscription', region: 'West', quantity: 20, unitPrice: 1500, amount: 30000 },
        { date: '2026-01-10', product: 'Support Contract', category: 'Services', region: 'South', quantity: 6, unitPrice: 3000, amount: 18000 },
    ];

    const employeeData = [
        { id: 'EMP001', name: 'Rahul Sharma', department: 'Engineering', designation: 'Senior Developer', salary: 120000, joinDate: '2023-03-15' },
        { id: 'EMP002', name: 'Priya Patel', department: 'Design', designation: 'UI/UX Lead', salary: 95000, joinDate: '2022-08-01' },
        { id: 'EMP003', name: 'Amit Kumar', department: 'Engineering', designation: 'Tech Lead', salary: 150000, joinDate: '2021-01-10' },
        { id: 'EMP004', name: 'Sneha Reddy', department: 'Marketing', designation: 'Marketing Manager', salary: 85000, joinDate: '2023-06-20' },
        { id: 'EMP005', name: 'Vikram Singh', department: 'Sales', designation: 'Sales Executive', salary: 65000, joinDate: '2024-02-01' },
        { id: 'EMP006', name: 'Anjali Gupta', department: 'HR', designation: 'HR Manager', salary: 90000, joinDate: '2022-11-15' },
        { id: 'EMP007', name: 'Karthik Nair', department: 'Engineering', designation: 'DevOps Engineer', salary: 110000, joinDate: '2023-09-01' },
        { id: 'EMP008', name: 'Meera Iyer', department: 'Finance', designation: 'Financial Analyst', salary: 80000, joinDate: '2024-01-05' },
    ];

    const summaryData = {
        totalSales: salesData.reduce((sum, s) => sum + s.amount, 0),
        totalQuantity: salesData.reduce((sum, s) => sum + s.quantity, 0),
        averageOrderValue: Math.round(salesData.reduce((sum, s) => sum + s.amount, 0) / salesData.length),
        totalEmployees: employeeData.length,
        avgSalary: Math.round(employeeData.reduce((sum, e) => sum + e.salary, 0) / employeeData.length),
    };

    const buffer = await new DocumentGeneratorService()
        .createExcelBuilder()
        .setOptions({
            creator: 'Document Generator Demo',
            lastModifiedBy: 'System',
            created: new Date(),
            metadata: {
                title: 'Demo Workbook',
                subject: 'Sample Excel with multiple sheets',
                keywords: ['demo', 'sample', 'excel'],
            },
        })
        // Sales Data Sheet
        .addSheet({
            name: 'Sales Data',
            columns: [
                { header: 'Date', key: 'date', width: 12 },
                { header: 'Product', key: 'product', width: 20 },
                { header: 'Category', key: 'category', width: 15 },
                { header: 'Region', key: 'region', width: 12 },
                { header: 'Quantity', key: 'quantity', width: 10 },
                { header: 'Unit Price', key: 'unitPrice', width: 12 },
                { header: 'Amount', key: 'amount', width: 12 },
            ],
            headerStyle: ExcelStyles.header,
            autoFilter: true,
            freezePane: { row: 1 },
        })
        .addRows(salesData)
        // Add total row
        .setCell(salesData.length + 2, 1, 'TOTAL', { font: { bold: true } })
        .addFormula(salesData.length + 2, 5, `SUM(E2:E${salesData.length + 1})`, { font: { bold: true } })
        .addFormula(salesData.length + 2, 7, `SUM(G2:G${salesData.length + 1})`, { font: { bold: true }, numFmt: '₹#,##0' })
        .endSheet()
        // Employee Data Sheet
        .addSheet({
            name: 'Employees',
            columns: [
                { header: 'Employee ID', key: 'id', width: 12 },
                { header: 'Name', key: 'name', width: 20 },
                { header: 'Department', key: 'department', width: 15 },
                { header: 'Designation', key: 'designation', width: 20 },
                { header: 'Salary', key: 'salary', width: 12 },
                { header: 'Join Date', key: 'joinDate', width: 12 },
            ],
            headerStyle: {
                font: { bold: true, color: '#FFFFFF' },
                fill: { type: 'pattern', pattern: 'solid', fgColor: '#7C3AED' },
                alignment: { horizontal: 'center' },
            },
            autoFilter: true,
            freezePane: { row: 1 },
        })
        .addRows(employeeData)
        .endSheet()
        // Summary Sheet
        .addSheet({ name: 'Summary' })
        .setColumnWidth(1, 25)
        .setColumnWidth(2, 20)
        // Title
        .mergeCells(1, 1, 1, 2)
        .setCell(1, 1, 'DASHBOARD SUMMARY', {
            font: { bold: true, size: 16, color: '#1F2937' },
            alignment: { horizontal: 'center' },
        })
        .setRowHeight(1, 30)
        // Sales Section
        .setCell(3, 1, 'Sales Metrics', { font: { bold: true, size: 12 }, fill: { type: 'pattern', pattern: 'solid', fgColor: '#DBEAFE' } })
        .setCell(3, 2, '', { fill: { type: 'pattern', pattern: 'solid', fgColor: '#DBEAFE' } })
        .setCell(4, 1, 'Total Sales')
        .setCell(4, 2, summaryData.totalSales, { numFmt: '₹#,##0' })
        .setCell(5, 1, 'Total Quantity')
        .setCell(5, 2, summaryData.totalQuantity)
        .setCell(6, 1, 'Avg Order Value')
        .setCell(6, 2, summaryData.averageOrderValue, { numFmt: '₹#,##0' })
        // Employee Section
        .setCell(8, 1, 'Employee Metrics', { font: { bold: true, size: 12 }, fill: { type: 'pattern', pattern: 'solid', fgColor: '#F3E8FF' } })
        .setCell(8, 2, '', { fill: { type: 'pattern', pattern: 'solid', fgColor: '#F3E8FF' } })
        .setCell(9, 1, 'Total Employees')
        .setCell(9, 2, summaryData.totalEmployees)
        .setCell(10, 1, 'Average Salary')
        .setCell(10, 2, summaryData.avgSalary, { numFmt: '₹#,##0' })
        // Generated timestamp
        .setCell(12, 1, 'Generated At:', { font: { italic: true, color: '#6B7280' } })
        .setCell(12, 2, new Date().toLocaleString('en-IN'), { font: { italic: true, color: '#6B7280' } })
        .endSheet()
        .build();

    return saveToFile(buffer, 'sample-workbook.xlsx');
}

/**
 * Generate a simple single-sheet Excel
 */
async function generateSimpleExcel(): Promise<string> {
    const data = [
        { name: 'Product A', jan: 1200, feb: 1350, mar: 1100 },
        { name: 'Product B', jan: 800, feb: 950, mar: 1200 },
        { name: 'Product C', jan: 2100, feb: 1900, mar: 2300 },
        { name: 'Product D', jan: 450, feb: 500, mar: 480 },
    ];

    const buffer = await new DocumentGeneratorService()
        .createExcelBuilder()
        .setOptions({ creator: 'Demo', metadata: { title: 'Quarterly Sales' } })
        .addSheet({
            name: 'Q1 Sales',
            columns: [
                { header: 'Product', key: 'name', width: 15 },
                { header: 'January', key: 'jan', width: 12 },
                { header: 'February', key: 'feb', width: 12 },
                { header: 'March', key: 'mar', width: 12 },
            ],
            headerStyle: ExcelStyles.header,
            autoFilter: true,
        })
        .addRows(data)
        .endSheet()
        .build();

    return saveToFile(buffer, 'quarterly-sales.xlsx');
}

/**
 * Main function - generates all demo files
 */
async function main(): Promise<void> {
    console.log('='.repeat(50));
    console.log('Document Generator Demo');
    console.log('='.repeat(50));
    console.log('');

    try {
        console.log('Generating PDF files...');
        await generateSampleInvoicePdf();
        await generateSampleReportPdf();

        console.log('');
        console.log('Generating Excel files...');
        await generateSampleExcel();
        await generateSimpleExcel();

        console.log('');
        console.log('='.repeat(50));
        console.log('All files generated successfully!');
        console.log(`Output directory: ${OUTPUT_DIR}`);
        console.log('='.repeat(50));
    } catch (error) {
        console.error('Error generating documents:', error);
        process.exit(1);
    }
}

// Run if executed directly
main();

// Export functions for programmatic use
export {
    generateSampleInvoicePdf,
    generateSampleReportPdf,
    generateSampleExcel,
    generateSimpleExcel,
    saveToFile,
    OUTPUT_DIR,
};
