'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, Calendar, Clock, Users, CheckCircle, Smartphone } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Scissors className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Rezervačný systém pre kaderníkov
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Jednoduchý a efektívny spôsob, ako spravovať rezervácie vo vašom kaderníctve
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/registracia">
              <Button size="lg" className="text-lg px-8">
                Začať zdarma
              </Button>
            </Link>
            <Link href="/prihlasenie">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Prihlásiť sa
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          <Card>
            <CardHeader>
              <Calendar className="w-10 h-10 text-slate-900 mb-2" />
              <CardTitle>Online rezervácie</CardTitle>
              <CardDescription>
                Zákazníci si môžu rezervovať termín 24/7 cez vašu verejnú stránku
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="w-10 h-10 text-slate-900 mb-2" />
              <CardTitle>Správa pracovného času</CardTitle>
              <CardDescription>
                Nastavte si pracovné hodiny a systém automaticky zobrazí voľné termíny
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-10 h-10 text-slate-900 mb-2" />
              <CardTitle>Multi-tenant</CardTitle>
              <CardDescription>
                Každý kaderník má vlastný profil, služby a rezervačný kalendár
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="w-10 h-10 text-slate-900 mb-2" />
              <CardTitle>Ochrana pred konfliktami</CardTitle>
              <CardDescription>
                Systém automaticky zabraňuje dvojitým rezerváciám na rovnaký čas
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Smartphone className="w-10 h-10 text-slate-900 mb-2" />
              <CardTitle>Notifikácie</CardTitle>
              <CardDescription>
                E-mailové notifikácie pre kaderníka a SMS potvrdenia pre zákazníka
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Scissors className="w-10 h-10 text-slate-900 mb-2" />
              <CardTitle>Správa služieb</CardTitle>
              <CardDescription>
                Jednoducho pridávajte a upravujte služby s cenami a trvaním
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="bg-slate-900 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Pripravení začať?</h2>
            <p className="text-slate-300 mb-6 text-lg">
              Vytvorte si účet a získajte vlastnú rezervačnú stránku za pár minút
            </p>
            <Link href="/registracia">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Zaregistrovať sa teraz
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
