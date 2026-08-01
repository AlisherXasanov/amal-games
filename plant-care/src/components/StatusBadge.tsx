import type { CareUrgency } from '../types'

const LABELS: Record<CareUrgency, string> = {
  overdue: 'Срочно',
  due: 'Сегодня',
  soon: 'Скоро',
  ok: 'В порядке',
}

export function StatusBadge({ urgency, text }: { urgency: CareUrgency; text?: string }) {
  return <span className={`badge badge-${urgency}`}>{text ?? LABELS[urgency]}</span>
}
