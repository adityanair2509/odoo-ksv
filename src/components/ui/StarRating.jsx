import { Star } from 'lucide-react'

/**
 * @param {{ value: number, onChange?: (n: number) => void, readonly?: boolean, size?: number }} props
 */
export default function StarRating({ value = 0, onChange, readonly = false, size = 18 }) {
  return (
    <div className="flex items-center gap-0.5" role={readonly ? 'img' : 'group'} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} ${
            star <= value ? 'text-amber-400' : 'text-border'
          }`}
          aria-label={readonly ? undefined : `Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star size={size} fill={star <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}
