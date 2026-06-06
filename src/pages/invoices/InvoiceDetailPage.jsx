import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Download, Printer, Mail } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { getInvoiceDetail, emailInvoice, openInvoicePdf } from '../../services/invoice.service'
import { formatINR } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [emailing, setEmailing] = useState(false)
  const [emailMsg, setEmailMsg] = useState('')
  const invoiceRef = useRef(null)

  useEffect(() => {
    getInvoiceDetail(id).then(setDetail).finally(() => setLoading(false))
  }, [id])

  const po = detail?.po

  const handleDownloadPDF = async () => {
    if (invoiceRef.current && detail) {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${detail.invoiceNumber || detail.id}.pdf`)
    }
  }

  const handleViewPdf = () => openInvoicePdf(id)

  const handleEmailInvoice = async () => {
    setEmailing(true)
    setEmailMsg('')
    try {
      const result = await emailInvoice(id)
      setEmailMsg(`Invoice emailed to ${result.sent?.length || 0} recipient(s).`)
    } catch (err) {
      setEmailMsg(err.response?.data?.message || err.message || 'Failed to send invoice email')
    } finally {
      setEmailing(false)
    }
  }

  if (loading) return <div className="text-sm text-text-muted">Loading...</div>
  if (!detail) return <div className="text-sm text-danger">Invoice not found</div>

  return (
    <div className="flex flex-col gap-6">
      <Link to="/invoices" className="text-sm text-text-muted hover:text-text-secondary w-fit">
        ← Invoices
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-semibold text-text-primary">{detail.invoiceNumber}</span>
          {po?.poNumber && (
            <span className="text-xs text-text-muted">PO: {po.poNumber}</span>
          )}
          <Badge variant={detail.status} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={handleDownloadPDF}>
            <Download size={13} /> Download PDF
          </Button>
          <Button variant="secondary" size="sm" onClick={handleViewPdf}>
            View PDF
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer size={13} /> Print
          </Button>
          <Button variant="secondary" size="sm" loading={emailing} onClick={handleEmailInvoice}>
            <Mail size={13} /> Email Invoice
          </Button>
          {po?.id && (
            <Link to={`/purchase-orders/${po.id}`} className="text-xs text-primary hover:text-blue-700">
              View PO →
            </Link>
          )}
        </div>
      </div>

      {emailMsg && (
        <p className="text-xs text-text-secondary bg-background border border-border rounded px-3 py-2">{emailMsg}</p>
      )}

      <div ref={invoiceRef} className="bg-surface border border-border rounded-lg p-10 max-w-4xl mx-auto w-full print:shadow-none">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-lg font-bold text-text-primary">VendorBridge</p>
            <p className="text-xs uppercase text-text-muted tracking-wide mt-0.5">Tax Invoice</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-text-primary">{detail.invoiceNumber}</p>
            <p className="text-xs text-text-muted mt-1">Invoice Date: {formatDate(detail.issuedAt)}</p>
            <p className="text-xs text-text-muted">Due Date: {formatDate(detail.dueAt)}</p>
            {po?.poNumber && <p className="text-xs text-text-muted">PO: {po.poNumber}</p>}
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <p className="text-xs uppercase text-text-muted font-medium tracking-wide mb-2">Bill To</p>
            <p className="text-sm font-semibold text-text-primary">{po?.orgName || 'KSV Enterprises Pvt Ltd'}</p>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">{po?.orgAddress}</p>
            <p className="text-xs text-text-muted mt-1 font-mono">GSTIN: {po?.orgGSTIN}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-text-muted font-medium tracking-wide mb-2">Vendor</p>
            <p className="text-sm font-semibold text-text-primary">{detail.vendorName || po?.vendorName}</p>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">{po?.vendorAddress}</p>
            <p className="text-xs text-text-muted mt-1 font-mono">GSTIN: {po?.vendorGSTIN}</p>
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        <table className="w-full mb-6">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-xs uppercase text-text-muted font-medium tracking-wide">Item</th>
              <th className="text-right py-2 text-xs uppercase text-text-muted font-medium tracking-wide w-16">Qty</th>
              <th className="text-right py-2 text-xs uppercase text-text-muted font-medium tracking-wide w-28">Unit Price</th>
              <th className="text-right py-2 text-xs uppercase text-text-muted font-medium tracking-wide w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {(po?.lineItems || []).map((item, i) => (
              <tr key={i} className="border-b border-border">
                <td className="py-3 text-sm text-text-primary">{item.name}</td>
                <td className="py-3 text-sm text-text-secondary text-right">{item.quantity}</td>
                <td className="py-3 text-sm text-text-secondary text-right">{formatINR(item.unitPrice)}</td>
                <td className="py-3 text-sm text-text-primary text-right font-medium">{formatINR(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Subtotal</span>
              <span>{formatINR(po?.subtotal || detail.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">CGST ({po?.cgstPercent || 0}%)</span>
              <span>{formatINR(po?.cgst || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">SGST ({po?.sgstPercent || 0}%)</span>
              <span>{formatINR(po?.sgst || 0)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-base font-bold text-text-primary">Grand Total</span>
              <span className="text-base font-bold text-text-primary">{formatINR(detail.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-4 flex items-center justify-between">
          <span className="text-xs text-text-muted">Status: {detail.status}</span>
          <span className="text-xs text-text-muted italic">Thank you for your business.</span>
        </div>
      </div>
    </div>
  )
}
