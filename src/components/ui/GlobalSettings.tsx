"use client";
import {useEffect,useId,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import {useAccessibilityPrefs} from "@/lib/accessibility/use-accessibility-preferences";
import {SoundToggle} from "./SoundToggle";
import {BackgroundSound} from "./BackgroundSound";
import {OfflineDownload} from "./OfflineDownload";
import type {SiteControlsCopy} from "@/content/site-controls-copy";
import type {Locale} from "@/i18n/config";

export const settingsLabels:Record<Locale,string[]> = {
en:["Settings","Display and images","Image size","Full illustrations","Smaller illustrations","Minimal decorative images","Reduced motion","High contrast","Text size","Normal","Large","Extra large","Focus mode","Reset to defaults","Sound"],
ro:["Setări","Afișare și imagini","Dimensiunea imaginilor","Ilustrații complete","Ilustrații mai mici","Imagini decorative minime","Mișcare redusă","Contrast ridicat","Dimensiunea textului","Normal","Mare","Foarte mare","Mod concentrare","Revino la setările inițiale","Sunet"],
es:["Ajustes","Pantalla e imágenes","Tamaño de imágenes","Ilustraciones completas","Ilustraciones pequeñas","Imágenes decorativas mínimas","Movimiento reducido","Alto contraste","Tamaño de texto","Normal","Grande","Muy grande","Modo concentración","Restablecer ajustes","Sonido"],
fr:["Paramètres","Affichage et images","Taille des images","Illustrations complètes","Illustrations réduites","Images décoratives minimales","Mouvement réduit","Contraste élevé","Taille du texte","Normal","Grand","Très grand","Mode concentration","Réinitialiser","Son"],
de:["Einstellungen","Anzeige und Bilder","Bildgröße","Alle Illustrationen","Kleinere Illustrationen","Weniger Dekorationen","Weniger Bewegung","Hoher Kontrast","Textgröße","Normal","Groß","Sehr groß","Fokusmodus","Zurücksetzen","Ton"],
it:["Impostazioni","Schermo e immagini","Dimensione immagini","Illustrazioni complete","Illustrazioni piccole","Immagini decorative minime","Movimento ridotto","Contrasto elevato","Dimensione testo","Normale","Grande","Molto grande","Modalità concentrazione","Ripristina","Audio"],
pt:["Definições","Ecrã e imagens","Tamanho das imagens","Ilustrações completas","Ilustrações menores","Imagens decorativas mínimas","Movimento reduzido","Alto contraste","Tamanho do texto","Normal","Grande","Muito grande","Modo de concentração","Repor definições","Som"],
nl:["Instellingen","Weergave en afbeeldingen","Afbeeldingsgrootte","Volledige illustraties","Kleinere illustraties","Minimale decoratie","Minder beweging","Hoog contrast","Tekstgrootte","Normaal","Groot","Extra groot","Focusmodus","Standaardinstellingen","Geluid"],
pl:["Ustawienia","Wygląd i obrazy","Rozmiar obrazów","Pełne ilustracje","Mniejsze ilustracje","Minimum dekoracji","Ogranicz ruch","Wysoki kontrast","Rozmiar tekstu","Normalny","Duży","Bardzo duży","Tryb skupienia","Przywróć ustawienia","Dźwięk"]
};
const closeLabels:Record<Locale,string>={en:"Close settings",ro:"Închide setările",es:"Cerrar ajustes",fr:"Fermer les paramètres",de:"Einstellungen schließen",it:"Chiudi impostazioni",pt:"Fechar definições",nl:"Instellingen sluiten",pl:"Zamknij ustawienia"};
export function GlobalSettings({locale,copy,compact=false}:{locale:Locale;copy:SiteControlsCopy;compact?:boolean}){
 const p=useAccessibilityPrefs(), t=settingsLabels[locale]??settingsLabels.en;
 const id=useId(), panel=useRef<HTMLDivElement>(null), trigger=useRef<HTMLButtonElement>(null), close=useRef<HTMLButtonElement>(null);
 const [open,setOpen]=useState(false), pathname=usePathname();
 useEffect(()=>{
  const element=panel.current;
  const sync=()=>{
   const shown=element?.matches(":popover-open")??false;
   setOpen(shown);
   if(shown) close.current?.focus({preventScroll:true});
   else if(element?.contains(document.activeElement)) trigger.current?.focus({preventScroll:true});
  };
  element?.addEventListener("toggle",sync);
  return ()=>element?.removeEventListener("toggle",sync);
 },[]);
 useEffect(()=>{panel.current?.hidePopover();},[pathname]);
 const closePanel=()=>{panel.current?.hidePopover();trigger.current?.focus({preventScroll:true});};
 const toggle=(label:string|undefined,checked:boolean,change:()=>void)=><label className="flex min-h-11 items-center justify-between gap-4"><span>{label}</span><input type="checkbox" checked={checked} disabled={!p.isLoaded} onChange={change} className="h-5 w-5 accent-teal"/></label>;
 // A native auto popover renders in the top layer. Root contrast filters and
 // sticky toolbars cannot clip it or move its Close button off the viewport.
 // The browser handles outside taps, Escape, repeated trigger clicks and Tab.
 return <div data-read-aloud-ignore className="relative rounded-xl border border-teal/40 bg-white text-ink">
  <button ref={trigger} type="button" data-settings-trigger {...{popovertarget:id,popovertargetaction:"toggle"}} aria-label={t[0]} title={t[0]} aria-expanded={open} aria-controls={id} aria-haspopup="dialog" className={compact?"flex min-h-11 min-w-11 items-center justify-center rounded-lg text-xl font-semibold text-teal-text":"min-h-12 px-4 py-3 font-semibold text-teal-text"}><span aria-hidden="true">⚙</span>{!compact&&t[0]}</button>
  <div ref={panel} id={id} popover="auto" role="dialog" aria-labelledby={`${id}-title`} data-settings-panel className="fixed inset-x-4 top-20 m-0 w-[calc(100vw-2rem)] min-w-0 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-6rem)] space-y-4 overflow-y-auto overscroll-contain rounded-2xl border border-teal/30 bg-white p-4 text-ink shadow-lg md:left-auto md:w-[min(24rem,calc(100vw-2rem))]">
   <div className="sticky top-0 z-10 -mx-1 flex items-center justify-between gap-3 bg-white px-1 py-2">
    <h2 id={`${id}-title`} className="min-w-0 break-words font-bold">{t[0]}</h2>
    <button ref={close} type="button" aria-label={closeLabels[locale]} title={closeLabels[locale]} onClick={closePanel} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-teal text-xl font-bold text-teal-text"><span aria-hidden="true">×</span></button>
   </div>
   <fieldset className="min-w-0 space-y-2"><legend className="font-bold">{t[1]}</legend>
    {toggle(copy.night,p.nightView,p.toggleNightView)}
    <label className="block">{t[2]}<select disabled={!p.isLoaded} value={p.imageSize} onChange={e=>p.setPreference("imageSize",e.target.value as typeof p.imageSize)} className="mt-1 min-h-11 w-full rounded-lg border border-ink/30 bg-white p-2"><option value="full">{t[3]}</option><option value="small">{t[4]}</option><option value="minimal">{t[5]}</option></select></label>
    {toggle(t[6],p.reducedMotion,p.toggleReducedMotion)}
    {toggle(t[7],p.highContrast,()=>p.setPreference("highContrast",!p.highContrast))}
    <label className="block">{t[8]}<select disabled={!p.isLoaded} value={p.textSize} onChange={e=>p.setPreference("textSize",e.target.value as typeof p.textSize)} className="mt-1 min-h-11 w-full rounded-lg border border-ink/30 bg-white p-2"><option value="normal">{t[9]}</option><option value="large">{t[10]}</option><option value="extra">{t[11]}</option></select></label>
    {toggle(t[12],p.focusMode,p.toggleFocusMode)}
   </fieldset>
   <fieldset className="min-w-0 space-y-3"><legend className="font-bold">{t[14]}</legend><SoundToggle/><BackgroundSound locale={locale}/><OfflineDownload locale={locale} copy={copy}/></fieldset>
   <button type="button" disabled={!p.isLoaded} onClick={p.resetPreferences} className="min-h-11 rounded-lg border border-teal px-4 py-2 font-semibold text-teal-text">{t[13]}</button>
  </div>
 </div>;
}
