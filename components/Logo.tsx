/* CVcraft's logo: a page with a folded corner and lines of text, in navy */
export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="3" y="3" width="26" height="26" rx="8" fill="#1f4e79" />
      <path d="M10 8h8.5l3.5 3.5V24H10V8Z" fill="#fff" />
      <path d="M18.5 8v3.5H22" fill="#cfe0f0" />
      <circle cx="13.6" cy="13" r="1.8" fill="#f2c46b" />
      <path d="M12.5 17.5h7M12.5 20.5h5" stroke="#1f4e79" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
