import type {CSSProperties} from "react";
const paths={
  sound:"M4 9h4l5-5v16l-5-5H4z M17 8c2 2 2 6 0 8 M20 5c4 4 4 10 0 14",
  settings:"M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2.1 2.1 M16.3 16.3l2.1 2.1 M5.6 18.4l2.1-2.1 M16.3 7.7l2.1-2.1",
  night:"M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z",
  page:"M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6",
  brain:"M12 5c-3-4-8-1-7 3-4 2-3 7 0 8-1 4 4 6 7 3 M12 5c3-4 8-1 7 3 4 2 3 7 0 8 1 4-4 6-7 3 M12 5v14 M7 8l2 2 M17 8l-2 2 M7 15l2-2 M17 15l-2-2",
  mind:"M12 20 4 12C-2 5 8-1 12 7c4-8 14-2 8 5z",
  idea:"M8 17h8 M9 21h6 M8 14c-6-7 2-14 7-10 4 3 3 7 0 10v3H8z",
  menu:"M3 6h18 M3 12h18 M3 18h18",
  close:"M5 5l14 14 M19 5L5 19",
  search:"M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M16 16l5 5",
  chevronDown:"M6 9l6 6 6-6",
  home:"M4 11l8-7 8 7 M6 10v10h5v-6h2v6h5V10",
  worlds:"M4 7h16 M4 12h16 M4 17h10",
  compass:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M15 9l-2 6-4 2 2-6z",
  heart:"M12 20s-7-4.4-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 5c-2.5 4.6-9.5 9-9.5 9z",
  family:"M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M16 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M2 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2 M14 11h2a4 4 0 0 1 4 4v2",
  books:"M4 5a2 2 0 0 1 2-2h4v18H6a2 2 0 0 1-2-2z M14 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4z",
  info:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 11v6 M12 7.5v.01"
};
export function ActionIcon({name,size=24,style}:{name:keyof typeof paths;size?:number;style?:CSSProperties}){
 return <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={style}><path d={paths[name]}/>{name==="settings"&&<circle cx="12" cy="12" r="5"/>}</svg>;
}
