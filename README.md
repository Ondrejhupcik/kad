# Rezervačný systém pre kaderníkov

Production-ready multi-tenant booking system pre kaderníctva s kompletným online rezervačným systémom.

## Funkcie

### Kompletný multi-tenant systém
- Každý kaderník má vlastný profil, služby a kalendár
- Slug-based routing pre verejné rezervačné stránky (napr. `/monika-hair`)
- Úplná izolácia dát medzi kaderníkmi pomocou Row Level Security

### Autentifikácia a správa účtu
- Email/heslo prihlásenie cez Supabase Auth
- Automatické vytvorenie profilu po registrácii
- Bezpečné nastavenie vlastného URL slug
- Správa profilu a nastavení

### Administrátorský panel
- **Prehľad**: Štatistiky rezervácií (dnes, týždeň, mesiac)
- **Rezervácie**: Správa všetkých rezervácií s možnosťou filtrovania
- **Služby**: Pridávanie a úprava služieb (názov, trvanie, cena)
- **Pracovný čas**: Nastavenie pracovných hodín pre každý deň v týždni
- **Nastavenia**: Úprava profilu a verejného URL

### Verejný rezervačný systém
- Profesionálne dizajnované rezervačné stránky pre každého kaderníka
- Týždenný kalendár s navigáciou vpred/vzad
- Zobrazenie voľných časových slotov v 30-minútových intervaloch
- Real-time kontrola dostupnosti
- Formulár pre zákazníka (meno, telefón, email, poznámka)

### Ochrana pred konfliktami
- Kontrola dostupnosti na úrovni aplikácie
- Dodatočná kontrola v databáze pred vytvorením rezervácie
- Zabránenie dvojitým rezerváciám na rovnaký čas
- Validácia voľných slotov podľa pracovného času

### Notifikačný systém
- Edge Function pripravená pre odosielanie notifikácií
- Email notifikácie pre kaderníka o novej rezervácii
- SMS potvrdenia pre zákazníka
- Pripravené pre integráciu s Twilio alebo lokálnym SMS poskytovateľom

## Technológie

- **Frontend**: Next.js 13 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Security**: Row Level Security policies
- **Date handling**: date-fns
- **UI Components**: Radix UI primitives

## Databázová štruktúra

### profiles
- Profil kaderníka spojený s auth.users
- Obsahuje slug pre verejnú URL, meno, email, telefón

### services
- Služby ponúkané kaderníkom
- Názov, trvanie v minútach, cena, aktívny status

### availability
- Pracovný čas pre každý deň v týždni
- Deň (0-6), čas od, čas do

### bookings
- Rezervácie zákazníkov
- Spojenie na profil a službu, údaje zákazníka
- Čas začiatku/konca, status, poznámky

## Inštalácia a nastavenie

### 1. Klonujte repository a nainštalujte závislosti

\`\`\`bash
npm install
\`\`\`

### 2. Nastavte Supabase

1. Vytvorte nový projekt na [supabase.com](https://supabase.com)
2. Spustite migračný SQL skript zo súboru migrácie (už vytvorený cez MCP tools)
3. Skopírujte Project URL a anon key

### 3. Nastavte environment variables

Vytvorte \`.env.local\` súbor:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### 4. Spustite aplikáciu

\`\`\`bash
npm run dev
\`\`\`

Aplikácia bude dostupná na \`http://localhost:3000\`

## Použitie

### Pre kaderníkov

1. **Registrácia**: Prejdite na \`/registracia\` a vytvorte si účet
2. **Nastavenie profilu**: Po registrácii zadajte názov kaderníctva a zvoľte URL slug
3. **Pridanie služieb**: V admin paneli pridajte služby ktoré ponúkate
4. **Nastavenie pracovného času**: Definujte pracovné hodiny pre každý deň
5. **Zdieľanie**: Zdieľajte svoj verejný link \`/vas-slug\` so zákazníkmi

### Pre zákazníkov

1. Návšteva verejnej rezervačnej stránky kaderníka (napr. \`/monika-hair\`)
2. Výber služby zo zoznamu
3. Výber dátumu a času z dostupných slotov
4. Vyplnenie kontaktných údajov
5. Potvrdenie rezervácie

## Bezpečnosť

Všetky tabuľky majú implementované Row Level Security (RLS) policies:

- **Profiles**: Verejne čitateľné, upravovateľné len vlastníkom
- **Services**: Aktívne služby viditeľné pre všetkých, správa len pre vlastníka
- **Availability**: Verejne čitateľná, správa len pre vlastníka
- **Bookings**: Vlastník vidí svoje rezervácie, ktokoľvek môže vytvoriť novú

## Rozšírenia a budúce funkcie

Systém je pripravený na rozšírenie o:

- **Google Calendar sync**: Kód má jasne oddelenú logiku kalendára
- **AI chatbot**: Pre hľadanie voľných termínov
- **SMS pripomienky**: Edge function už obsahuje prípravu pre SMS
- **Email notifikácie**: Integrácia s SendGrid/Resend
- **Platby online**: Možnosť platby pri rezervácii
- **Hodnotenia**: Systém hodnotení služieb

## Štruktúra projektu

\`\`\`
/app
  /admin              # Admin panel
    /layout.tsx       # Admin layout s navigáciou
    /page.tsx         # Dashboard
    /sluzby           # Správa služieb
    /pracovny-cas     # Nastavenie pracovného času
    /rezervacie       # Správa rezervácií
    /nastavenia       # Nastavenia profilu
  /[slug]             # Verejná rezervačná stránka (dynamic route)
  /prihlasenie        # Prihlásenie
  /registracia        # Registrácia
  /nastavenie-profilu # Úvodné nastavenie profilu
/lib
  /supabase           # Supabase client a types
  /auth               # Auth context
/components
  /ui                 # shadcn/ui komponenty
/supabase
  /functions          # Edge Functions
\`\`\`

## Licencia

MIT
