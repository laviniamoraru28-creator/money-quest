"use client";
import {useAccessibilityPrefs} from "@/lib/accessibility/use-accessibility-preferences";
import {BackgroundSound} from "./BackgroundSound";
import {OfflineDownload} from "./OfflineDownload";
import {LanguageSwitcher} from "./LanguageSwitcher";
import type {SiteControlsCopy} from "@/content/site-controls-copy";
import type {Locale} from "@/i18n/config";

const labels:Record<Locale,string[]> = {
en:["Settings","Display and images","Image size","Full illustrations","Smaller illustrations","Minimal decorative images","Reduced motion","High contrast","Text size","Normal","Large","Extra large","Focus mode","Reset to defaults","Sound and language"],
ro:["Setări","Afișare și imagini","Dimensiunea imaginilor","Ilustrații complete","Ilustrații mai mici","Imagini decorative minime","Mișcare redusă","Contrast ridicat","Dimensiunea textului","Normal","Mare","Foarte mare","Mod concentrare","Revino la setările inițiale","Sunet și limbă"],
es:["Ajustes","Pantalla e imágenes","Tamaño de imágenes","Ilustraciones completas","Ilustraciones pequeñas","Imágenes decorativas mínimas","Movimiento reducido","Alto contraste","Tamaño de texto","Normal","Grande","Muy grande","Modo concentración","Restablecer ajustes","Sonido e idioma"],
fr:["Paramètres","Affichage et images","Taille des images","Illustrations complètes","Illustrations réduites","Images décoratives minimales","Mouvement réduit","Contraste élevé","Taille du texte","Normal","Grand","Très grand","Mode concentration","Réinitialiser","Son et langue"],
de:["Einstellungen","Anzeige und Bilder","Bildgröße","Alle Illustrationen","Kleinere Illustrationen","Weniger Dekorationen","Weniger Bewegung","Hoher Kontrast","Textgröße","Normal","Groß","Sehr groß","Fokusmodus","Zurücksetzen","Ton und Sprache"],
it:["Impostazioni","Schermo e immagini","Dimensione immagini","Illustrazioni complete","Illustrazioni piccole","Immagini decorative minime","Movimento ridotto","Contrasto elevato","Dimensione testo","Normale","Grande","Molto grande","Modalità concentrazione","Ripristina","Audio e lingua"],
pt:["Definições","Ecrã e imagens","Tamanho das imagens","Ilustrações completas","Ilustrações menores","Imagens decorativas mínimas","Movimento reduzido","Alto contraste","Tamanho do texto","Normal","Grande","Muito grande","Modo de concentração","Repor definições","Som e idioma"],
nl:["Instellingen","Weergave en afbeeldingen","Afbeeldingsgrootte","Volledige illustraties","Kleinere illustraties","Minimale decoratie","Minder beweging","Hoog contrast","Tekstgrootte","Normaal","Groot","Extra groot","Focusmodus","Standaardinstellingen","Geluid en taal"],
pl:["Ustawienia","Wygląd i obrazy","Rozmiar obrazów","Pełne ilustracje","Mniejsze ilustracje","Minimum dekoracji","Ogranicz ruch","Wysoki kontrast","Rozmiar tekstu","Normalny","Duży","Bardzo duży","Tryb skupienia","Przywróć ustawienia","Dźwięk i język"]
};
export function GlobalSettings({locale,copy}:{locale:Locale;copy:SiteControlsCopy}){
 const p=useAccessibilityPrefs(), t=labels[locale]??labels.en;
 const toggle=(label:string,checked:boolean,change:()=>void)=><label className="flex min-h-11 items-center justify-between gap-4"><span>{label}</span><input type="checkbox" checked={checked} disabled={!p.isLoaded} onChange={change} className="h-5 w-5 accent-teal"/></label>;
 return <details data-read-aloud-ignore className="relative z-40 rounded-xl border border-teal/40 bg-white text-ink">
  <summary className="min-h-12 cursor-pointer px-4 py-3 font-semibold text-teal-text">⚙ {t[0]}</summary>
  <div className="absolute right-0 top-full z-50 mt-2 max-h-[75vh] w-[min(22rem,90vw)] space-y-4 overflow-y-auto rounded-2xl border border-teal/30 bg-white p-4 shadow-lg">
   <fieldset className="space-y-2"><legend className="font-bold">{t[1]}</legend>
    {toggle(copy.night,p.nightView,p.toggleNightView)}
    <label className="block">{t[2]}<select disabled={!p.isLoaded} value={p.imageSize} onChange={e=>p.setPreference("imageSize",e.target.value as typeof p.imageSize)} className="mt-1 min-h-11 w-full rounded-lg border border-ink/30 bg-white p-2"><option value="full">{t[3]}</option><option value="small">{t[4]}</option><option value="minimal">{t[5]}</option></select></label>
    {toggle(t[6],p.reducedMotion,p.toggleReducedMotion)}
    {toggle(t[7],p.highContrast,()=>p.setPreference("highContrast",!p.highContrast))}
    <label className="block">{t[8]}<select disabled={!p.isLoaded} value={p.textSize} onChange={e=>p.setPreference("textSize",e.target.value as typeof p.textSize)} className="mt-1 min-h-11 w-full rounded-lg border border-ink/30 bg-white p-2"><option value="normal">{t[9]}</option><option value="large">{t[10]}</option><option value="extra">{t[11]}</option></select></label>
    {toggle(t[12],p.focusMode,p.toggleFocusMode)}
   </fieldset>
   <fieldset className="space-y-3"><legend className="font-bold">{t[14]}</legend><LanguageSwitcher/><BackgroundSound locale={locale}/><OfflineDownload locale={locale} copy={copy}/></fieldset>
   <button type="button" disabled={!p.isLoaded} onClick={p.resetPreferences} className="min-h-11 rounded-lg border border-teal px-4 py-2 font-semibold text-teal-text">{t[13]}</button>
  </div>
 </details>;
}
