# Money Quest: instalare pe Namecheap

Acest kit pregătește website-ul actualizat și produsele PDF în nouă limbi. Website-ul public rămâne în engleză. Modul de plată pornește oprit. Nu trebuie să muți `main` pentru instalarea manuală a acestui pachet.

## 1. Fișierele au destinații diferite

| Fișier | Destinație | Conținut |
| --- | --- | --- |
| `Money-Quest-Website-Namecheap.zip` | Folderul aplicației Node.js din cPanel | Website compilat, imagini publice, mostre gratuite și comenzile de administrare |
| `Money-Quest-Private-Setup.zip` | Un folder privat din cont, în afara aplicației și a tuturor rădăcinilor web | Cele două produse multilingve, verificarea integrității și programul de configurare |

Arhiva privată nu se încarcă în `public_html`, în folderul aplicației sau într-un folder accesibil printr-un domeniu. Produsele pentru părinți sunt în interiorul ei, în `private-assets`. Fișierele de lucru și ilustrațiile originale nu fac parte din produsele pentru cumpărători.

## 2. Notează configurația existentă și fă o copie

În cPanel, deschide aplicația Money Quest din „Setup Node.js App”. Notează Application root, Application URL, versiunea Node și variabilele existente. Notează separat rădăcina web reală a domeniului, din lista domeniilor. Folderul aplicației nu este neapărat `public_html`.

Păstrează o copie a website-ului actual înainte de înlocuire. Păstrează separat orice date despre recenzii, comenzi și descărcări. Nu modifica directoarele jocului Godot sau ale altor domenii. Păstrează configurația generată de cPanel; kitul nu înlocuiește `.htaccess`.

## 3. Instalează website-ul

1. Oprește aplicația Node.js pentru actualizare.
2. Încarcă `Money-Quest-Website-Namecheap.zip` în Application root și extrage-l acolo. La rădăcină trebuie să apară `server.js`, `package.json`, `host-env.cjs`, `public` și folderul ascuns `.next`. Nu crea încă un folder intermediar. Arhiva nu conține produse plătite sau parole.
3. Folosește Node 24, modul Production și startup file `server.js`. Build-ul a folosit Node 24.22.1 și pachetele fixate în `package-lock.json`.
4. Activează mediul Node al aplicației folosind comanda afișată de cPanel. Din Application root rulează `npm ci --omit=dev`. Nu încărca un folder `node_modules` de pe alt calculator. Kitul conține deja build-ul, deci nu este necesar să compilezi pe hosting.
5. Repornește aplicația. Verifică `https://moneyquesteducation.com/api/health`, pagina principală și `/en/parents/shop`. Verifică cele două mostre PDF. Plățile rămân oprite până la configurarea lor.

## 4. Pregătește produsele în spațiul privat

Încarcă arhiva privată într-un folder precum `/home/UTILIZATOR/mq-private-setup` și extrage-o acolo. Păstrează produsele din `private-assets` ca ZIP-uri întregi. Nu le extrage în website.

În Terminal, după activarea aceluiași Node 24, intră în folderul kitului privat. Înlocuiește cele două căi de mai jos cu valorile reale din cPanel:

```sh
node setup-private-commerce.mjs --app-root /home/UTILIZATOR/FOLDER_APLICATIE --document-root /home/UTILIZATOR/RADACINA_WEB
```

Programul verifică dimensiunea și SHA-256 pentru ambele produse înainte să scrie ceva. Creează implicit `/home/UTILIZATOR/moneyquest-private`, în afara website-ului, cu directoare private pentru comenzi și descărcări. Copiază produsele cu nume care includ amprenta lor. Generează local cheia de semnare a comenzilor. Nu afișează cheia și nu trimite plăți sau emailuri.

O a doua rulare păstrează cheia, configurația și arhivele istorice. Nu schimbă produsele deja asociate unor cumpărături. Căile publice, legăturile simbolice nepermise și arhivele alterate sunt refuzate.

Programul afișează o variabilă de adăugat în cPanel:

```text
MONEYQUEST_HOST_ENV_FILE=/home/UTILIZATOR/moneyquest-private/commerce.env
```

Acest fișier trebuie să aibă permisiuni `600`. Variabilele deja definite în cPanel au prioritate față de fișier. Verifică eventualele valori vechi de test înainte să folosești noua configurație. Nu trimite chei, parole sau fișierul `commerce.env` în chat, GitHub ori într-un folder public.

## 5. Completează configurația privată

În `commerce.env` sunt deja pregătite căile, originea website-ului, emailul de contact și cele două prețuri live existente, £5.99 și £7.99. Mai trebuie completate pe hosting:

- `MONEYQUEST_STRIPE_KEY`: cheie Stripe live restricționată, pentru contul `acct_1UVYX9QZFq5acwqx`. Accesul dat asistentului în Stripe nu reprezintă această cheie de server.
- `MONEYQUEST_STRIPE_WEBHOOK_SECRET`: secretul endpoint-ului de mai jos.
- `MONEYQUEST_SMTP_HOST`, `MONEYQUEST_SMTP_PORT`, `MONEYQUEST_SMTP_USER`, `MONEYQUEST_SMTP_PASSWORD`, `MONEYQUEST_SMTP_FROM`: datele reale ale serviciului de email tranzacțional ales. Porturile acceptate sunt 465 sau 587 cu TLS. Dacă alegi Gmail, folosește metoda de autentificare permisă contului tău, nu presupune că parola obișnuită este suficientă.

În `release.pending.json` sunt pregătite contul și amprentele produselor. Completează numele legal al vânzătorului, adresa, contractul complet, informația de confidențialitate și situația fiscală reală. Nu sunt inventate în kit. După revizie, salvează configurația finală ca `release.json` în același folder privat și folosește o versiune finală a termenilor, fără „draft”. Cele nouă limbi ale produselor trebuie descrise corect; interfața comenzii și confirmarea sunt în engleză.

Nu modifica sumele sau amprentele produselor decât dacă instalezi o ediție nouă verificată. Cele două produse sunt sub limita de 100 MiB acceptată de livrare. Păstrează copii ale comenzilor, arhivelor vechi și cheii de semnare, separat de actualizările website-ului.

## 6. Webhook și verificare

În contul Stripe corespunzător mediului ales, endpoint-ul aplicației este:

```text
https://moneyquesteducation.com/api/shop/webhook
```

Evenimentele necesare sunt `checkout.session.completed` și `checkout.session.async_payment_succeeded`. Fișierul `stripe-webhook.json` din kit conține URL-ul și lista. Secretul real trebuie pus numai în configurația privată. Endpoint-ul refuză semnături și medii nepotrivite.

Mai întâi testează configurația într-un mediu Stripe de test, cu cheia, prețurile și webhook-ul acelui mediu. Nu combina credențiale test și live. Codul păstrează separat comenzile live. Configurația livrată de acest kit are prețurile live existente; ele nu sunt prețuri pentru test.

După completarea configurației finale, folosește mediul privat pentru comanda de verificare. Înlocuiește calea și rulează din Application root:

```sh
MONEYQUEST_HOST_ENV_FILE=/home/UTILIZATOR/moneyquest-private/commerce.env npm run shop:check
```

Modul trebuie setat la mediul pe care îl verifici. Comanda verifică arhivele, contul și prețurile live, precum și autentificarea SMTP, fără să creeze plată sau să trimită email. Nu dovedește singură livrarea în inbox sau o cumpărătură completă. Procesul website-ului deja pornit citește fișierul la pornire; repornește-l când aplici configurația finală.

Verifică apoi o comandă controlată: Checkout, webhook, confirmare în inbox, descărcare, redescărcare și comportamentul după rambursare. O comandă live folosește bani reali. Testele locale din raport folosesc date simulate și nu sunt prezentate drept o plată reală.

## 7. Reîncercarea emailurilor și revenirea

În cron-ul hostingului, rulează la fiecare cinci minute comanda de mai jos, cu calea reală către Node din mediul aplicației. `npm` poate să nu fie disponibil în mediul cron. Setează și directorul de lucru al aplicației:

```sh
cd /home/UTILIZATOR/FOLDER_APLICATIE && MONEYQUEST_HOST_ENV_FILE=/home/UTILIZATOR/moneyquest-private/commerce.env /CALEA_REALĂ_CĂTRE_NODE --require ./host-env.cjs --import tsx scripts/shop-deliver-pending.ts
```

Comanda reîncearcă confirmări pentru comenzi existente și nu creează debitări noi. Păstrează jurnalul agregat și investighează mesajele BLOCKED sau erorile de livrare.

Pentru a opri cumpărăturile, setează `MONEYQUEST_COMMERCE_MODE=off` și repornește aplicația. Păstrează comenzile, arhivele istorice și datele necesare livrării cumpărăturilor existente. Pentru revenirea website-ului, restaurează copia anterioară a aplicației și repornește, fără să înlocuiești directoarele private.
