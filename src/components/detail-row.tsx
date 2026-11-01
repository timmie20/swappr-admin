interface DetailRowProps {
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
}

export function DetailRow({ label, value, mono }: DetailRowProps) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div>
      <p className='text-sm font-medium'>{label}</p>
      <div
        className={`text-muted-foreground mt-1 text-sm break-words ${mono ? 'font-mono text-xs' : ''}`}
      >
        {empty ? '—' : value}
      </div>
    </div>
  );
}
