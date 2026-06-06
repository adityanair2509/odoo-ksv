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

const SPENDING_BY_CATEGORY = [
  { category: 'IT', amount: 2900000 },
  { category: 'Furniture', amount: 1875000 },
  { category: 'Construction', amount: 1270000 },
  { category: 'Logistics', amount: 340000 },
  { category: 'Other', amount: 180000 },
]

const VENDOR_PERFORMANCE = [
  { vendor: 'Infra Supplies', rating: 4.5, pos: 12 },
  { vendor: 'TechSoft', rating: 4.8, pos: 7 },
  { vendor: 'QuickMove', rating: 3.9, pos: 3 },
  { vendor: 'FurnishPro', rating: 4.2, pos: 5 },
]

const MONTHLY_POS = [
  { month: 'Jan', count: 2 },
  { month: 'Feb', count: 4 },
  { month: 'Mar', count: 3 },
  { month: 'Apr', count: 6 },
  { month: 'May', count: 5 },
  { month: 'Jun', count: 3 },
]

const PIE_COLORS = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#A1A1AA']

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface border border-border rounded px-3 py-2 text-xs shadow-sm">
        <p className="text-text-muted">{payload[0].name}</p>
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
            <BarChart data={SPENDING_BY_CATEGORY} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
                data={SPENDING_BY_CATEGORY}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={45}
              >
                {SPENDING_BY_CATEGORY.map((_, index) => (
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
            <BarChart data={VENDOR_PERFORMANCE} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="" stroke="#F4F4F5" horizontal={false} />
              <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="vendor" type="category" tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rating" fill="#16A34A" radius={[0, 3, 3, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly POs */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Monthly PO Volume</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MONTHLY_POS} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
