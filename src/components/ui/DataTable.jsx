/**
 * @param {{
 *   columns: Array<{ key: string, label: string, render?: (value: any, row: object) => React.ReactNode }>,
 *   data: Array<object>,
 *   loading?: boolean,
 *   emptyMessage?: string,
 *   keyField?: string,
 * }} props
 */
export default function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = 'No records found',
  keyField = 'id',
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-background border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-2.5 text-xs uppercase text-text-muted font-medium tracking-wide whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-border rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-text-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row[keyField]}
                className="h-12 border-b border-border hover:bg-background transition-colors duration-100"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-2 text-sm text-text-secondary whitespace-nowrap"
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
