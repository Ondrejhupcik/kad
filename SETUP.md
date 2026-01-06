# Návod na nastavenie - Rezervačný systém

## Rýchly štart

### 1. Supabase nastavenie

1. Prejdite na [supabase.com](https://supabase.com) a vytvorte si nový projekt
2. Po vytvorení projektu:
   - Prejdite do **SQL Editor**
   - Databázová schéma je už vytvorená cez Supabase MCP tools
   - Ak potrebujete manuálne spustiť migráciu, je pripravená v systéme

3. Získajte prístupové údaje:
   - Prejdite do **Settings** → **API**
   - Skopírujte **Project URL**
   - Skopírujte **anon/public key**

### 2. Lokálne nastavenie

1. Vytvorte súbor \`.env.local\` v root priečinku projektu:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://vasa-instancia.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=vasa-anon-key-tu
\`\`\`

2. Nainštalujte závislosti:

\`\`\`bash
npm install
\`\`\`

3. Spustite vývojový server:

\`\`\`bash
npm run dev
\`\`\`

4. Otvorte prehliadač na [http://localhost:3000](http://localhost:3000)

### 3. Prvé kroky v aplikácii

1. **Registrácia**:
   - Kliknite na "Začať zdarma"
   - Zadajte email a heslo (min. 6 znakov)
   - Email confirmation je vypnuté, takže môžete hneď pokračovať

2. **Nastavenie profilu**:
   - Zadajte názov vášho kaderníctva
   - Systém automaticky vygeneruje URL slug
   - Môžete ho upraviť (len malé písmená, čísla, pomlčky)
   - Pridajte telefónne číslo

3. **Pridanie služieb**:
   - V admin paneli prejdite do "Služby"
   - Kliknite "Pridať službu"
   - Zadajte názov (napr. "Dámsky strih")
   - Nastavte trvanie (napr. 60 minút)
   - Nastavte cenu (napr. 25 €)

4. **Nastavenie pracovného času**:
   - Prejdite do "Pracovný čas"
   - Zapnite dni kedy pracujete
   - Nastavte časy pre každý deň
   - Uložte zmeny

5. **Zdieľanie rezervačnej stránky**:
   - V nastaveniach alebo v admin layoute nájdete tlačidlo "Verejná stránka"
   - Skopírujte URL (napr. \`vasedomena.com/monika-hair\`)
   - Zdieľajte ho so zákazníkmi

## Notifikácie (voliteľné)

### Email notifikácie

Pre fungovanie email notifikácií potrebujete integrovať službu ako:
- [Resend](https://resend.com)
- [SendGrid](https://sendgrid.com)
- [Mailgun](https://mailgun.com)

Aktualizujte Edge Function \`send-booking-notification\` s vašimi API keys.

### SMS notifikácie

Pre SMS notifikácie odporúčame:
- [Twilio](https://twilio.com) - medzinárodné SMS
- Lokálny slovenský SMS poskytovateľ

Edge Function je pripravená, stačí pridať integráciu v \`supabase/functions/send-booking-notification/index.ts\`.

## Produkčné nasadenie

### Netlify (odporúčané)

1. Pushnte kód na GitHub
2. Prejdite na [netlify.com](https://netlify.com)
3. Kliknite "New site from Git"
4. Vyberte váš repository
5. Pridajte environment variables:
   - \`NEXT_PUBLIC_SUPABASE_URL\`
   - \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
6. Deploy

### Vercel

1. Pushnte kód na GitHub
2. Prejdite na [vercel.com](https://vercel.com)
3. Import projektu
4. Pridajte environment variables
5. Deploy

## Časté problémy

### Problém: Rezervácie sa nezobrazujú
- Skontrolujte či máte nastavený pracovný čas
- Skontrolujte či máte pridané služby
- Skontrolujte konzolu prehliadača pre chyby

### Problém: Nemôžem sa prihlásiť
- Skontrolujte či je email správny
- Skontrolujte či heslo má min. 6 znakov
- Skontrolujte Supabase Auth logs

### Problém: Verejná stránka nefunguje
- Skontrolujte či je slug správne nastavený
- Skontrolujte či je profil kompletný
- Skontrolujte URL v prehliadači

## Podpora

Pre otázky a problémy:
1. Skontrolujte README.md pre dokumentáciu
2. Skontrolujte browser console pre chyby
3. Skontrolujte Supabase logs

## Ďalšie kroky

Po základnom nastavení môžete:
- Prispôsobiť farby a dizajn v \`app/globals.css\`
- Pridať vlastné logo
- Integrovať Google Calendar
- Pridať vlastnú doménu
- Nastaviť automatické zálohovanie databázy
