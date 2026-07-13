export default function Loading() {
  return (
    <div className="grid min-h-[50svh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <span className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}
