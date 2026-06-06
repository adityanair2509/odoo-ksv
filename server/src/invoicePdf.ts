/**
 * Server-side invoice PDF generation (pdfkit).
 */

import PDFDocument from 'pdfkit'
import type { InvoiceDetail } from './types.js'

function formatINR(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string | null | undefined): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function generateInvoicePdf(detail: InvoiceDetail): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' })
        const chunks: Buffer[] = []

        doc.on('data', (chunk: Buffer) => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)

        const po = detail.po
        const invNo = detail.invoiceNumber || detail.id

        doc.fontSize(20).font('Helvetica-Bold').text('VendorBridge', { align: 'left' })
        doc.fontSize(10).font('Helvetica').fillColor('#666').text('TAX INVOICE', { align: 'left' })
        doc.fillColor('#000')

        doc.fontSize(12).font('Helvetica-Bold')
        doc.text(invNo, 350, 50, { align: 'right', width: 195 })
        doc.fontSize(9).font('Helvetica').fillColor('#666')
        doc.text(`PO: ${po?.poNumber || '—'}`, 350, 68, { align: 'right', width: 195 })
        doc.text(`Invoice Date: ${formatDate(detail.issuedAt)}`, 350, 82, { align: 'right', width: 195 })
        doc.text(`Due Date: ${formatDate(detail.dueAt)}`, 350, 96, { align: 'right', width: 195 })
        doc.fillColor('#000')

        doc.moveDown(2)
        doc.fontSize(10).font('Helvetica-Bold').text('Bill To')
        doc.font('Helvetica').text(po?.orgName || 'KSV Enterprises Pvt Ltd')
        doc.text(po?.orgAddress || '')
        doc.text(`GSTIN: ${po?.orgGSTIN || '—'}`)

        doc.moveDown()
        doc.font('Helvetica-Bold').text('Vendor')
        doc.font('Helvetica').text(po?.vendorName || detail.vendorName || '—')
        doc.text(po?.vendorAddress || '')
        doc.text(`GSTIN: ${po?.vendorGSTIN || '—'}`)

        doc.moveDown(2)
        const tableTop = doc.y
        doc.font('Helvetica-Bold').fontSize(9)
        doc.text('Item', 50, tableTop)
        doc.text('Qty', 280, tableTop, { width: 40, align: 'right' })
        doc.text('Unit Price', 330, tableTop, { width: 80, align: 'right' })
        doc.text('Total', 420, tableTop, { width: 125, align: 'right' })

        doc.moveTo(50, tableTop + 14).lineTo(545, tableTop + 14).stroke('#ccc')

        let y = tableTop + 22
        doc.font('Helvetica').fontSize(9)
        for (const item of po?.lineItems || []) {
            doc.text(item.name, 50, y, { width: 220 })
            doc.text(String(item.quantity), 280, y, { width: 40, align: 'right' })
            doc.text(formatINR(item.unitPrice || 0), 330, y, { width: 80, align: 'right' })
            doc.text(formatINR(item.total || 0), 420, y, { width: 125, align: 'right' })
            y += 18
        }

        doc.moveDown(2)
        const totalsX = 350
        let ty = Math.max(y + 20, doc.y)
        doc.font('Helvetica').fontSize(10)
        doc.text('Subtotal:', totalsX, ty)
        doc.text(formatINR(po?.subtotal || detail.amount), 420, ty, { width: 125, align: 'right' })
        ty += 16
        doc.text(`CGST (${po?.cgstPercent || 0}%):`, totalsX, ty)
        doc.text(formatINR(po?.cgst || 0), 420, ty, { width: 125, align: 'right' })
        ty += 16
        doc.text(`SGST (${po?.sgstPercent || 0}%):`, totalsX, ty)
        doc.text(formatINR(po?.sgst || 0), 420, ty, { width: 125, align: 'right' })
        ty += 20
        doc.font('Helvetica-Bold').fontSize(12)
        doc.text('Grand Total:', totalsX, ty)
        doc.text(formatINR(detail.totalAmount), 420, ty, { width: 125, align: 'right' })

        doc.moveDown(4)
        doc.font('Helvetica').fontSize(9).fillColor('#666')
        doc.text(`Status: ${detail.status}`, { align: 'left' })
        doc.text('Thank you for your business.', { align: 'right' })

        doc.end()
    })
}
