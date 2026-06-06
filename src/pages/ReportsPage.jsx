import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { formatINR } from '../utils/formatCurrency'
import { getPurchaseOrders } from '../services/order.service'
import { getVendors } from '../services/vendor.service'

const PIE_COLORS = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#A1A1AA']

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface border border-border rounded px-3 py-2 text-xs shadow-sm">
        <p className="text-text-muted">{payload[0].name || payload[0].payload?.category || payload[0].payload?.vendor || payload[0].payload?.month}</p>
        <p className="text-text-primary font-semibold">
          {typeof payload[0].value === 'number' && payload[0].value > 1000
            ? formatINR(payload[0].value)
            : payload[0].value}
        </p>
      </div>
    )
  }
  return null
}

export default function ReportsPage() {
  const [pos, setPOs] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getPurchaseOrders(), getVendors()])
      .then(([p, v]) => {
        setPOs(p)
        setVendors(v)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-text-muted">Loading reports...</div>

  // 1. Spending by Category
  const categoryMap = { IT: 0, Furniture: 0, Construction: 0, Logistics: 0, Other: 0 }
  pos.forEach((po) => {
    const vendor = vendors.find((v) => v.id === po.vendorId)
    const category = vendor?.category || 'Other'
    categoryMap[category] = (categoryMap[category] || 0) + po.grandTotal
  })
  const categoriesList = ['IT', 'Furniture', 'Construction', 'Logistics', 'Other']
  const spendingByCategory = categoriesList.map((cat) => ({
    category: cat,
    amount: categoryMap[cat] || 0,
  }))

  // 2. Vendor Performance
  const vendorPerformance = vendors.map((v) => ({
    vendor: v.name.split(' ')[0],
    rating: v.rating || 0,
    pos: v.totalPOs || 0,
  }))

  // 3. Monthly PO Volume
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyMap = {}
  months.forEach((m) => { monthlyMap[m] = 0 })
  pos.forEach((po) => {
    if (po.poDate) {
      const date = new Date(po.poDate)
      const m = months[date.getMonth()]
      monthlyMap[m] = (monthlyMap[m] || 0) + 1
    }
  })
  const monthlyPOs = months.slice(0, 6).map((m) => ({
    month: m,
    count: monthlyMap[m] || 0,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Reports</h2>
        <p className="text-sm text-text-muted mt-0.5">Procurement analytics and insights</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Spending by Category */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={spendingByCategory} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="" stroke="#F4F4F5" horizontal vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 100000}L`} width={42} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#2563EB" radius={[3, 3, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Spend Distribution Pie */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Spend Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={spendingByCategory}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={45}
              >
                {spendingByCategory.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, color: '#A1A1AA' }} />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Vendor Performance */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Vendor Performance (Rating)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={vendorPerformance} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="" stroke="#F4F4F5" horizontal={false} />
              <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="vendor" type="category" tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rating" fill="#16A34A" radius={[0, 3, 3, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly PO Volume */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Monthly PO Volume</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyPOs} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="" stroke="#F4F4F5" horizontal vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#D97706" radius={[3, 3, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
