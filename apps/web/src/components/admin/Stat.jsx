export default function Stat({ l, v }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 text-center shadow-sm">
      <p className="text-muted-foreground text-sm font-semibold">{l}</p>
      <p className="font-display text-3xl font-extrabold text-primary mt-2">{v}</p>
    </div>
  );
}