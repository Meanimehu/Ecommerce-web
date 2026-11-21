import { Eye } from 'lucide-react';
import { StatusChip } from '@/components/common/status-chip';

/**
 * "View only", beside a page's title, for a role that can read a screen but not change it
 * (Document 5, section 8.3; Document 6, 8.7: neutral, outlined, eye icon).
 */
export function ViewOnlyChip({ label }: { label: string }) {
  return (
    <StatusChip tone="neutral" icon={Eye} label={label} className="border border-line bg-surface" />
  );
}
