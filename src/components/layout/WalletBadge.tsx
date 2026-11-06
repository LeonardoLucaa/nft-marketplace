export function WalletBadge({ className = '' }: { className?: string }) {
  return (
    <p
      className={`inline-flex items-center gap-2 rounded-sm border border-primary/60 bg-[#3A2314] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-primary ${className}`}
    >
      <span>MetaMask</span>
      <span aria-hidden="true">•</span>
      <span>WalletConnect</span>
      <span aria-hidden="true">•</span>
      <span>Coinbase</span>
    </p>
  )
}