export default function MetricCard({
  title,
  value,
  unit,
  description,
  color = 'from-yellow-400 to-pink-500',
}) {
  return (
    <div className="group relative bg-card border border-border rounded-xl p-4 sm:p-6 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 overflow-hidden">
      {/* Glassmorphism background gradient on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
      />

      {/* Top border accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10 space-y-2">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wide">
          {title}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
          <p className="text-2xl sm:text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text">
            {value}
          </p>

          <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
            {unit}
          </p>
        </div>

        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed pt-1">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}