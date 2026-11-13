/** A value that cannot be changed, shown as plain information (Document 6, 8.1, read-only). */
export function ReadOnlyValue({
  label,
  value,
  help,
}: {
  label: string;
  value: string;
  help?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <p className="type-label text-ink">{label}</p>
      <p className="rounded-2 bg-sunken px-3.5 py-2.5 text-ink">{value}</p>
      {help ? <p className="type-small text-muted-foreground">{help}</p> : null}
    </div>
  );
}
