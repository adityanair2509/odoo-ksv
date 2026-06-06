import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { formatINR } from '../utils/formatCurrency'
import {
  getSpendingByCategory,
  getMonthlyPOVolume,
  getVendorPerformance,
} from '../services/analytics.service'

const PIE_COLORS = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#A1A1AA', '#7C3AED']

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const label = payload[0].name || payload[0].payload?.category || payload[0].payload?.vendor || payload[0].payload?.month
    const val = payload[0].value
    return (
      <div className="bg-surface border border-border rounded px-3 py-2 text-xs shadow-sm">
        <p className="text-text-muted">{label}</p>
        <p className="text-text-primary font-semibold">
          {typeof val === 'number' && val > 1000 ? formatINR(val) : val}
        </p>
      </div>
    )
  }
  return null
}

export default function ReportsPage() {
  const [spendingByCategory, setSpendingByCategory] = useState([])
  const [monthlyPOs, setMonthlyPOs] = useState([])
  const [vendorPerformance, setVendorPerformance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getSpendingByCategory(),
      getMonthlyPOVolume(12),
      getVendorPerformance(),
    ])
      .then(([cat, monthly, vendors]) => {
        setSpendingByCategory(cat.length ? cat : [{ category: 'No data', amount: 0 }])
        setMonthlyPOs(monthly)
        setVendorPerformance(vendors)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-text-muted">Loading reports...</div>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Reports</h2>
        <p className="text-sm text-text-muted mt-0.5">Procurement analytics from live data</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={spendingByCategory} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#F4F4F5" horizontal vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} tickFormatter={(v) => v > 0 ? `₹${v / 100000}L` : '0'} width={42} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#2563EB" radius={[3, 3, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Spend Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={spendingByCategory} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                {spendingByCategory.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Vendor Performance (Rating)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={vendorPerformance.length ? vendorPerformance : [{ vendor: '—', rating: 0 }]} layout="vertical" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#F4F4F5" horizontal={false} vertical />
              <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="vendor" tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rating" fill="#16A34A" radius={[0, 3, 3, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Monthly PO Volume</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyPOs} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#F4F4F5" horizontal vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#D97706" radius={[3, 3, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
