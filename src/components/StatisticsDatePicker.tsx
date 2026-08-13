import type { StatisticsView } from '@/lib/statistics';
import { statisticsPickerValue } from '@/lib/statistics';
import { Input } from '@/components/ui/input';

interface StatisticsDatePickerProps {
  view: StatisticsView;
  value: string;
  onChange: (value: string) => void;
}

export function StatisticsDatePicker({ view, value, onChange }: StatisticsDatePickerProps) {
  if (view === 'weekday') return null;
  const type = view === 'week' ? 'week' : view === 'month' ? 'month' : 'date';
  const pickerValue = value && ((view === 'week' && /^\d{4}-W\d{2}$/.test(value))
    || (view === 'month' && /^\d{4}-\d{2}$/.test(value))
    || (view === 'day' && /^\d{4}-\d{2}-\d{2}$/.test(value)))
    ? value
    : statisticsPickerValue(view);
  return (
    <Input
      type={type}
      value={pickerValue}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 w-36 text-xs"
    />
  );
}
