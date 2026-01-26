import * as fs from 'fs';
import * as path from 'path';
import { DocumentGeneratorService } from './services/document-generator.service';

/**
 * Example: Generate a Premium NABARUN Disclaimer using Puppeteer
 */
async function generatePremiumNabarunDisclaimer() {
    const documentGenerator = new DocumentGeneratorService();
    const builder = documentGenerator.createPdfBuilder('puppeteer');

    await builder
        .setOptions({
            pageSize: 'A4',
            margins: { top: 60, bottom: 60, left: 0, right: 0 },
            accentColor: '#2B5FA6',
            showBorder: true,
            watermark: { text: 'NABARUN NGO' },
            header: {
                title: 'NABARUN NGO',
                subtitle: 'Official Document\nWorking Together for a Better Tomorrow',
                date: 'January 2026'
            },
            footer: {
                text: '© 2026 NABARUN NGO. All rights reserved.',
                pageNumbers: true
            }
        })
        .addSection('Table of Contents')
        .addTOCEntry('1. Introduction', 1)
        .addTOCEntry('2. No Professional Advice', 1)
        .addTOCEntry('3. External Links', 1)
        .addTOCEntry('4. Voluntary Participation', 1)
        .endSection()
        .addSection('Introduction')
        .addParagraph('The information provided on the Nabarun website is for general informational and awareness purposes only. While we strive to keep the content accurate and up to date, we make no warranties or representations regarding its completeness, reliability, or suitability.')
        .endSection()
        .addSection('1. No Professional Advice')
        .addList([
            'The content on this website should not be considered legal, medical, financial, or professional advice. For such matters, please consult a qualified professional.'
        ])
        .endSection()
        .addSection('2. External Links')
        .addList([
            'Our website may contain links to external websites.',
            'We do not control or endorse the content of these websites and are not responsible for their accuracy, policies, or practices.'
        ])
        .endSection()
        .addSection('3. Voluntary Participation')
        .addList([
            'Any participation in our activities, volunteering, or donations is entirely voluntary.',
            'Since Nabarun is currently an unregistered NGO in India, contributions are not eligible for tax exemptions under Section 80G or similar provisions.'
        ])
        .addSignatureSection({
            label: 'Nabarun Executive Authority',
            dateLabel: 'Date of Issue',
            space: 40
        })
        .endSection();

    return await builder.build();
}

/**
 * Example: Generate a Premium NABARUN Terms of Use using Puppeteer
 */
async function generatePremiumNabarunTermsOfUse() {
    const documentGenerator = new DocumentGeneratorService();
    const builder = documentGenerator.createPdfBuilder('puppeteer');

    await builder
        .setOptions({
            pageSize: 'A4',
            margins: { top: 60, bottom: 60, left: 0, right: 0 },
            accentColor: '#E63946',
            showBorder: true,
            watermark: { text: 'NABARUN NGO' },
            header: {
                title: 'NABARUN NGO',
                subtitle: 'Terms & Conditions\nEmpowering Communities Since 2018',
                date: '26-JAN-2026'
            },
            footer: {
                text: 'This document is electronically generated.',
                pageNumbers: true
            }
        })
        .addSection('1. Purpose of This Website')
        .addParagraph('The NABARUN website is intended to share information about our activities, initiatives, and opportunities to volunteer or support our work. The content is provided for general informational purposes only.')
        .endSection()
        .addSection('2. Use of Content')
        .addList([
            'All text, images, graphics, and other content on this website belong to Nabarun unless otherwise stated.',
            'You may view, share, or print content for personal, non-commercial purposes only.',
            'You may not reproduce, distribute, or modify our content without prior written permission.'
        ])
        .endSection()
        .addSection('3. User Responsibilities')
        .addParagraph('When using our website, you agree not to use it for any unlawful, harmful, or disruptive purposes, and to respect the rights and privacy of other visitors.')
        .endSection()
        .addPageBreak()
        .addSection('4. Donations and Contributions')
        .addParagraph('Donations made through our website or third-party platforms are voluntary. Since Nabarun is currently an unregistered NGO in India, contributions are not eligible for tax exemptions under Section 80G or similar provisions.')
        .endSection()
        .addSection('5. Limitation of Liability')
        .addList([
            'We make no warranties or guarantee regarding the accuracy, reliability, or completeness of the content.',
            'We are not responsible for any direct, indirect, or incidental damages that may result from using our website.'
        ])
        .endSection()
        .addSection('6. Governing Law')
        .addParagraph('These Terms of Use shall be governed by the laws of India. Any disputes will be subject to the jurisdiction of the courts located in Barrackpore, West Bengal.')
        .addSignatureSection({
            label: 'Nabarun Legal Department',
            dateLabel: 'Effective Date'
        })
        .endSection();

    return await builder.build();
}

async function generatePremiumNabarunProjectReport() {
    const documentGenerator = new DocumentGeneratorService();
    const builder = documentGenerator.createPdfBuilder('puppeteer');

    await builder
        .setOptions({
            pageSize: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 },
            accentColor: '#0077B6', // Professional Blue
            showBorder: true,
            watermark: { text: 'NABARUN PROGRESS' },
            header: {
                title: 'NABARUN NGO',
                subtitle: 'Quarterly Project Progress Report\nOctober - December 2025',
                date: '26-JAN-2026'
            },
            footer: {
                text: 'Confidential Report - Nabarun Internal Use Only',
                pageNumbers: true
            }
        })
        .addSection('Executive Summary')
        .addParagraph('This report highlights the key achievements and financial status of our primary initiatives during Q4 2025. We have seen a 25% increase in community engagement compared to the previous quarter.')
        .endSection()
        .addSection('Project Metrics')
        .addHeading('Engagement & Outreach Statistics', 2)
        .addTable([
            ['Project Name', 'Location', 'Beneficiaries', 'Status'],
            ['Healthcare Drive', 'Kolkata', '500+', 'Completed'],
            ['Education for All', 'Barasat', '200+', 'Ongoing'],
            ['Clean Water Initiative', 'Barrackpore', '150+', 'Planning'],
            ['Skill Development', 'Naihati', '80+', 'Ongoing']
        ], {
            columns: [
                { header: 'Project Name', width: '*' },
                { header: 'Location', width: 100 },
                { header: 'Beneficiaries', width: 100, align: 'center' },
                { header: 'Status', width: 100, align: 'right' }
            ],
            headerBackground: '#E0F2FE', // Light blue header
            headerTextColor: '#0077B6',
            alternateRowColor: '#F8FAFC', // White/Light blue tint
            borderColor: '#BAE6FD',
            cellPadding: 10
        })
        .endSection()
        .addSection('Financial Overview')
        .addHeading('Allocation & Expenditure', 2)
        .addTable([
            ['Category', 'Allocated Budget', 'Actual Spend', 'Variance'],
            ['Operations', '₹50,000', '₹48,500', '₹1,500'],
            ['Logistics', '₹20,000', '₹22,000', '-₹2,000'],
            ['Marketing', '₹15,000', '₹12,000', '₹3,000'],
            ['Admin', '₹10,000', '₹9,800', '₹200'],
            ['Total', '₹95,000', '₹92,300', '₹2,700']
        ], {
            columns: [
                { header: 'Category' },
                { header: 'Allocated', align: 'right' },
                { header: 'Actual', align: 'right' },
                { header: 'Variance', align: 'right' }
            ],
            headerBackground: '#0077B6', // Darker blue header
            headerTextColor: '#FFFFFF',
            alternateRowColor: '#F0F9FF',
            borderColor: '#0077B6',
            rowFontSize: 9
        })
        .endSection()
        .addSection('Conclusion')
        .addParagraph('Overall, the quarter was successful with most targets met within the allocated budget. We plan to scale "Education for All" in the next quarter.')
        .addTable([
            ['Category', 'Allocated Budget', 'Actual Spend', 'Variance'],
            ['Operations', '₹50,000', '₹48,500', '₹1,500'],
            ['Logistics', '₹20,000', '₹22,000', '-₹2,000'],
            ['Marketing', '₹15,000', '₹12,000', '₹3,000'],
            ['Admin', '₹10,000', '₹9,800', '₹200'],
            ['Total', '₹95,000', '₹92,300', '₹2,700']
        ], {
            columns: [
                { header: 'Category' },
                { header: 'Allocated', align: 'right' },
                { header: 'Actual', align: 'right' },
                { header: 'Variance', align: 'right' }
            ],
            headerBackground: '#b600b0ff', // Darker blue header
            headerTextColor: '#FFFFFF',
            alternateRowColor: '#F0F9FF',
            borderColor: '#0077B6',
            rowFontSize: 9
        }).addSignatureSection({
            label: 'Project Director',
            dateLabel: 'Approval Date',
            space: 50
        })
        .endSection();

    return await builder.build();
}

async function main() {
    try {
        console.log('Generating Premium NABARUN Disclaimer via Puppeteer...');
        const disclaimerPdf = await generatePremiumNabarunDisclaimer();
        const disclaimerPath = path.join(__dirname, 'NABARUN_Premium_Disclaimer_v4.pdf');
        fs.writeFileSync(disclaimerPath, disclaimerPdf);
        console.log(`✓ Premium Disclaimer generated at: ${disclaimerPath}`);

        console.log('\nGenerating Premium NABARUN Terms of Use via Puppeteer...');
        const termsPdf = await generatePremiumNabarunTermsOfUse();
        const termsPath = path.join(__dirname, 'NABARUN_Premium_Terms_of_Use_v4.pdf');
        fs.writeFileSync(termsPath, termsPdf);
        console.log(`✓ Premium Terms of Use generated at: ${termsPath}`);

        console.log('\nGenerating Premium NABARUN Project Report (with Tables)...');
        const reportPdf = await generatePremiumNabarunProjectReport();
        const reportPath = path.join(__dirname, 'NABARUN_Premium_Project_Report_v4.pdf');
        fs.writeFileSync(reportPath, reportPdf);
        console.log(`✓ Premium Project Report generated at: ${reportPath}`);
    } catch (error) {
        console.error('Error in demo:', error);
    }
}

main();
