// A dashed-border "watermark" placeholder — used wherever a stat/summary
// card has no data yet, so it's visually obvious something will appear
// there rather than looking like a missing/broken element.
export default function EmptyCard({ label, showRupee = false, className = '' }) {
  return (
    <div className={`border-2 border-dashed border-ink/15 rounded-xl px-4 py-4 sm:px-5 sm:py-5 flex flex-col items-center justify-center text-center ${className}`}>
      {showRupee && <div className="text-3xl sm:text-4xl text-ink/15 font-display leading-none mb-1">₹</div>}
      <div className="text-ink/30 text-xs sm:text-sm">{label}</div>
    </div>
  );
}
