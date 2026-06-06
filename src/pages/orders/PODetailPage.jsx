import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Download, Printer, Mail } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { getPOById, markPOAsPaid } from '../../services/order.service'
import { formatINR } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

export default function PODetailPage() {
  const { id } = useParams()
  const [po, setPO] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)
  const invoiceRef = useRef(null)

  useEffect(() => {
    getPOById(id).then(setPO).finally(() => setLoading(false))
  }, [id])

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return
    const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`${po.poNumber}.pdf`)
  }

  const handleMarkPaid = async () => {
    setPaying(true)
    await markPOAsPaid(id)
    setPaid(true)
    setPaying(false)
  }

  if (loading) return <div className="text-sm text-text-muted">Loading...</div>
  if (!po) return <div className="text-sm text-danger">Purchase order not found</div>

  const status = paid ? 'paid' : po.status

  return (
    <div className="flex flex-col gap-6">
      <Link to="/purchase-orders" className="text-sm text-text-muted hover:text-text-secondary w-fit">
        ← Purchase Orders
      </Link>

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-semibold text-text-primary">{po.poNumber}</span>
          <Badge variant={status} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleDownloadPDF}>
            <Download size={13} /> Download PDF
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer size={13} /> Print
          </Button>
          <Button variant="secondary" size="sm">
            <Mail size={13} /> Email Invoice
          </Button>
          {!paid && po.status !== 'delivered' ? null : (
            <Button variant="primary" size="sm" loading={paying} onClick={handleMarkPaid}>
              Mark as Paid
            </Button>
          )}
          {!paid && po.status === 'pending' && (
            <Button variant="primary" size="sm" loading={paying} onClick={handleMarkPaid}>
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      {/* Invoice card */}
      <div ref={invoiceRef} className="bg-surface border border-border rounded-lg p-10 max-w-4xl mx-auto w-full">
        {/* Invoice header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-lg font-bold text-text-primary">VendorBridge</p>
            <p className="text-xs uppercase text-text-muted tracking-wide mt-0.5">Purchase Order</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-text-primary">{po.poNumber}</p>
            <p className="text-xs text-text-muted mt-1">PO Date: {formatDate(po.poDate)}</p>
            <p className="text-xs text-text-muted">Invoice Date: {formatDate(po.invoiceDate)}</p>
            <p className="text-xs text-text-muted">Due Date: {formatDate(po.dueDate)}</p>
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        {/* Address block */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <p className="text-xs uppercase text-text-muted font-medium tracking-wide mb-2">Bill To</p>
            <p className="text-sm font-semibold text-text-primary">{po.orgName}</p>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">{po.orgAddress}</p>
            <p className="text-xs text-text-muted mt-1 font-mono">GSTIN: {po.orgGSTIN}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-text-muted font-medium tracking-wide mb-2">Vendor</p>
            <p className="text-sm font-semibold text-text-primary">{po.vendorName}</p>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">{po.vendorAddress}</p>
            <p className="text-xs text-text-muted mt-1 font-mono">GSTIN: {po.vendorGSTIN}</p>
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        {/* Line items */}
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
            {po.lineItems.map((item, i) => (
              <tr key={i} className="border-b border-border">
                <td className="py-3 text-sm text-text-primary">{item.name}</td>
                <td className="py-3 text-sm text-text-secondary text-right">{item.quantity}</td>
                <td className="py-3 text-sm text-text-secondary text-right">{formatINR(item.unitPrice)}</td>
                <td className="py-3 text-sm text-text-primary text-right font-medium">{formatINR(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Subtotal</span>
              <span>{formatINR(po.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">CGST ({po.cgstPercent}%)</span>
              <span>{formatINR(po.cgst)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">SGST ({po.sgstPercent}%)</span>
              <span>{formatINR(po.sgst)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-base font-bold text-text-primary">Grand Total</span>
              <span className="text-base font-bold text-text-primary">{formatINR(po.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border mt-8 pt-4 flex items-center justify-between">
          <span className="text-xs text-text-muted">Status: {paid ? 'Paid' : po.status === 'delivered' ? 'Pending Payment' : po.status}</span>
          <span className="text-xs text-text-muted italic">Thank you for your business.</span>
        </div>
      </div>
    </div>
  )
}
