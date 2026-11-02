# Pregătirea publicării în nouă limbi

Decizia proprietarei: următoarea versiune publică trebuie să ofere EN, RO, ES, FR, DE, IT, PT, NL și PL, cu selector vizibil.

Stadiu: în lucru. Nu este o versiune multilingvă gata de publicare.

## Modificări pregătite

- Selector de limbă comun tuturor paginilor. Control nativ, utilizabil cu tastatura și pe telefon. Lista urmează limbile efectiv activate.
- Schimbarea limbii păstrează pagina, parametrii și ancora. Numele limbilor apar în forma lor nativă.
- Textele noi ale primei pagini, legătura de salt la conținut, pagina de învățare incluzivă și exemplele interactive despre bani au texte în toate cele nouă limbi.
- Linkurile către laboratoare păstrează identificatorii originali. Numele traduse nu devin adrese diferite.
- Soldul bancar folosește formatarea regională. Monedele, bancnotele, banii din cont, cardul și telefonul păstrează distincția dintre bani și instrumente de plată.
- Funcția SEO comună acceptă limba paginii pentru canonical și Open Graph. Sitemap-ul pentru bibliotecă și muzeu urmărește limbile active. Metadatele pentru colțul liniștit și învățarea incluzivă folosesc textele limbii cerute.
- Comanda `npm run check:multilingual` refuză confirmarea unei lansări incomplete. Inventarul este în `public-multilingual-release-audit.json`.

## Ce a descoperit auditul

Traducerile cu structură completă există pentru biografii, camerele muzeului, lecturile scurte și prezentările cărților altor autori în toate cele nouă limbi. Cărțile originale lungi și cele trei laboratoare au în prezent numai sursa engleză și traducerea română. În ES, FR, DE, IT, PT, NL și PL lipsesc aceste două grupuri. Fiecare grup trebuie tradus și integrat, inclusiv răspunsurile și nivelurile de dificultate.

Mai trebuie revizuite textele despre confidențialitate și părinți, deoarece unele mesaje vechi afirmă că nu se colectează niciun fel de date. Acest lucru nu descrie corect comenzile adulților, recenziile și jurnalele hostingului. Plata live și comunicarea comenzilor sunt încă în engleză. Mai multe pagini au metadate în engleză, iar fișele gratuite vechi și mostrele publice sunt în engleză. Produsele private multilingve sunt un set separat și nu înlocuiesc automat fișele publice asociate lecțiilor.

Activarea rămâne închisă în această etapă. Schimbarea listei de limbi acum ar produce erori la unele pagini, din cauza traducerilor lipsă. `PLANNED_LAUNCH_LOCALES` consemnează cerința tuturor celor nouă limbi. `ACTIVE_LOCALES` descrie instalarea deja livrată și nu trebuie schimbat până la completarea conținutului și verificărilor.

## Verificări efectuate

- Cele 45 de suite existente au trecut după modificările de interfață. Noul test a trecut după corectarea verificării ordinii atributelor HTML. Sunt 46 de suite validate în total.
- Noul test verifică selectorul în nouă limbi prin randare HTML, 81 de perechi de limbi, păstrarea rutei/parametrilor/ancorei, textele localizate pentru bani și URL-urile canonical/Open Graph.
- TypeScript și build-ul de producție au trecut.
- Aceste verificări nu reprezintă testarea vizuală în browser. Instalarea browserului local de test a returnat o arhivă de descărcare invalidă. Verificarea pe telefon/tabletă/desktop, interacțiunile reale și vocile instalate rămân de efectuat.
- Traducerile sunt texte editoriale AI, fără certificare independentă de la redactori nativi.

Nu s-a publicat pe hosting și nu s-a modificat `main`. Arhiva Namecheap trimisă înaintea acestei cereri rămâne ediția cu website public în engleză. Nu a fost reetichetată drept multilingvă.
