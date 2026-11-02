import {isSupportedLocale,type Locale} from "@/i18n/config";

/** Kept independent of the translation provider so recovery works if it fails. */
export const errorBoundaryCopy={
  en:{title:"Something went wrong",body:"Try again. You can also return to the home page.",retry:"Try again",home:"Go to the home page"},
  ro:{title:"A apărut o problemă",body:"Încearcă din nou. Poți reveni și la pagina principală.",retry:"Încearcă din nou",home:"Mergi la pagina principală"},
  es:{title:"Algo ha salido mal",body:"Inténtalo de nuevo. También puedes volver a la página de inicio.",retry:"Intentar de nuevo",home:"Ir a la página de inicio"},
  fr:{title:"Un problème est survenu",body:"Réessaie. Tu peux aussi revenir à la page d’accueil.",retry:"Réessayer",home:"Aller à la page d’accueil"},
  de:{title:"Etwas ist schiefgelaufen",body:"Versuche es noch einmal. Du kannst auch zur Startseite zurückkehren.",retry:"Erneut versuchen",home:"Zur Startseite"},
  it:{title:"Si è verificato un problema",body:"Riprova. Puoi anche tornare alla pagina iniziale.",retry:"Riprova",home:"Vai alla pagina iniziale"},
  pt:{title:"Ocorreu um problema",body:"Tenta novamente. Também podes voltar à página inicial.",retry:"Tentar novamente",home:"Ir para a página inicial"},
  nl:{title:"Er is iets misgegaan",body:"Probeer het opnieuw. Je kunt ook terug naar de startpagina.",retry:"Opnieuw proberen",home:"Naar de startpagina"},
  pl:{title:"Coś poszło nie tak",body:"Spróbuj ponownie. Możesz też wrócić na stronę główną.",retry:"Spróbuj ponownie",home:"Przejdź na stronę główną"},
} satisfies Record<Locale,Record<"title"|"body"|"retry"|"home",string>>;

export function errorLocale(pathname:string):Locale{
  const segment=pathname.split("/")[1];
  return isSupportedLocale(segment??"")?segment as Locale:"en";
}
