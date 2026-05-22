import type { OrderTimelineItem } from '../../services/firestore-service'

type OrderTimelineProps = {
  timeline: OrderTimelineItem[]
}

export default function OrderTimeline({ timeline }: OrderTimelineProps) {
  if (!timeline.length) {
    return <p className="text-sm text-slate-500">No timeline updates yet.</p>
  }

  return (
    <ol className="space-y-4">
      {timeline.map((item, index) => {
        const isLast = index === timeline.length - 1
        return (
          <li key={`${item.status}-${index}`} className="relative pl-8">
            <span
              className={`absolute left-0 top-1.5 h-3 w-3 rounded-full ${
                isLast ? 'bg-brand-500' : 'bg-slate-300'
              }`}
            />
            {index < timeline.length - 1 ? (
              <span className="absolute left-[5px] top-4 h-8 w-[2px] bg-slate-200" />
            ) : null}

            <p className="text-sm font-semibold capitalize text-slate-900">{item.status}</p>
            <p className="text-xs text-slate-500">
              {item.timestamp?.toDate
                ? item.timestamp.toDate().toLocaleString('th-TH')
                : 'Unknown date'}
            </p>
            {item.message ? <p className="text-sm text-slate-600">{item.message}</p> : null}
          </li>
        )
      })}
    </ol>
  )
}
