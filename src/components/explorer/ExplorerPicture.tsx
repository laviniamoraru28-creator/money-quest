import Image from "next/image";
import { Coin } from "@/components/ui/Coin";

const moneyImages: Record<string, string> = {
  "💳": "card",
};

const illustrations: Record<string, React.ReactNode> = {
  "💵": <><rect x="4" y="14" width="56" height="36" rx="6" fill="#ccebd9" stroke="#197567" strokeWidth="3"/><path d="M10 22h6m32 20h6" stroke="#197567" strokeWidth="3" strokeLinecap="round"/><circle cx="32" cy="32" r="10" fill="#fff3cb" stroke="#197567" strokeWidth="2"/></>,
  "🏦": <><path d="M5 23 32 7l27 16zM8 54h48v5H8z" fill="#197567"/><path d="M14 28h7v22h-7zm15 0h7v22h-7zm15 0h7v22h-7z" fill="#77ae9d"/></>,
  "👖": <path d="M15 7h34l5 51H37l-5-30-5 30H10z M15 16h34" fill="#87baf0" stroke="#2868a4" strokeWidth="3" strokeLinejoin="round"/>,
  "🎯": <><circle cx="30" cy="34" r="24" fill="#f5b2a3" stroke="#a33936" strokeWidth="3"/><circle cx="30" cy="34" r="14" fill="#fff3cb" stroke="#a33936" strokeWidth="3"/><path d="m30 34 25-24m-12 1h12v11" stroke="#197567" strokeWidth="4" fill="none" strokeLinecap="round"/></>,
  "💰": <><path d="M17 8h30l-7 13c13 8 18 17 17 26-3 16-47 16-50 0-1-9 4-18 17-26z" fill="#efb84b" stroke="#a96321" strokeWidth="3"/><path d="M23 22h18" stroke="#197567" strokeWidth="4"/><circle cx="32" cy="41" r="8" fill="#fff3cb" stroke="#a96321" strokeWidth="2"/></>,
  "📊": <><path d="M9 8v47h47" fill="none" stroke="#197567" strokeWidth="3"/><path d="M16 36h10v13H16z" fill="#efb84b"/><path d="M30 27h10v22H30z" fill="#87baf0"/><path d="M44 15h10v34H44z" fill="#72ae55"/></>,
  "🏆": <><path d="M17 10h30v9c0 11-6 18-15 18s-15-7-15-18zm15 27v13m-12 5h24M17 15H7v7c0 6 6 9 13 9m27-16h10v7c0 6-6 9-13 9" fill="#efb84b" stroke="#a96321" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/></>,
  "🫙": <><path d="M14 16h36v9l4 6v22a5 5 0 0 1-5 5H15a5 5 0 0 1-5-5V31l4-6z" fill="#d0f0e7" stroke="#197567" strokeWidth="3"/><rect x="12" y="8" width="40" height="9" rx="3" fill="#197567"/><circle cx="32" cy="41" r="10" fill="#efb84b" stroke="#a96321" strokeWidth="2"/></>,
  seed: <ellipse cx="32" cy="39" rx="18" ry="11" transform="rotate(-30 32 39)" fill="#a36535" stroke="#693b1d" strokeWidth="3"/>,
  sprout: <><path d="M32 53V28" stroke="#197567" strokeWidth="4"/><path d="M32 34C16 35 12 25 12 17c13 0 20 4 20 17m0 0c0-12 7-19 20-19-1 12-8 19-20 19" fill="#72ae55"/></>,
  bud: <><path d="M32 55V30m0 17-11-8" stroke="#197567" strokeWidth="4" strokeLinecap="round"/><path d="M32 33c-13 0-14-16 0-25 14 9 13 25 0 25z" fill="#d76282" stroke="#ad3d61" strokeWidth="2"/></>,
  flower: <><path d="M32 57V31m0 16 11-8" stroke="#197567" strokeWidth="4" strokeLinecap="round"/><g fill="#e17893"><circle cx="22" cy="23" r="9"/><circle cx="42" cy="23" r="9"/><circle cx="32" cy="13" r="9"/><circle cx="32" cy="33" r="9"/></g><circle cx="32" cy="23" r="8" fill="#efb84b"/></>,
};

export function ExplorerPicture({symbol, size=48}: {symbol: string; size?: number}) {
  const moneyImage = moneyImages[symbol];
  if (moneyImage) return <Image unoptimized aria-hidden="true" src={`/images/money-quest/money/${moneyImage}.webp`} alt="" width={size} height={size} className="shrink-0 object-contain"/>;
  if (symbol === "🪙") return <span aria-hidden="true"><Coin size={size > 40 ? "lg" : "md"}/></span>;
  if (illustrations[symbol]) return <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 64 64" className="shrink-0">{illustrations[symbol]}</svg>;
  if (["1️⃣","2️⃣","3️⃣","4️⃣"].includes(symbol)) return <span aria-hidden="true" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal/10 font-bold text-teal-text">{symbol[0]}</span>;
  return <span aria-hidden="true" style={{fontSize:size, lineHeight:1}}>{symbol}</span>;
}
