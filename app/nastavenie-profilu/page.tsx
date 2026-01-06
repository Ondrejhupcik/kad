'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scissors } from 'lucide-react';

export default function ProfileSetupPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/prihlasenie');
        return;
      }

      setUserId(session.user.id);
      setEmail(session.user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        router.push('/admin');
      }
    };

    checkAuth();
  }, [router]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !slug.trim()) {
      setError('Meno a slug sú povinné');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      setError('Slug môže obsahovať iba malé písmená, čísla a pomlčky');
      return;
    }

    setLoading(true);

    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existingProfile) {
        setError('Tento slug je už obsadený. Skúste iný.');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId!,
          name: name.trim(),
          slug: slug.trim(),
          email: email,
          phone: phone.trim() || null,
        });

      if (insertError) throw insertError;

      router.push('/admin');
    } catch (error: any) {
      setError('Chyba pri vytváraní profilu. Skúste to znova.');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mb-2">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Nastavenie profilu</CardTitle>
          <CardDescription className="text-center">
            Dokončite nastavenie vášho kaderníctva
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Názov kaderníctva / Vaše meno *</Label>
              <Input
                id="name"
                type="text"
                placeholder="napr. Monika Hair Studio"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL adresa (slug) *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">/</span>
                <Input
                  id="slug"
                  type="text"
                  placeholder="monika-hair"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-slate-500">
                Vaša verejná rezervačná stránka bude dostupná na: /{slug}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefónne číslo</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+421 900 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
              />
              <p className="text-xs text-slate-500">
                E-mail z vášho účtu
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Ukladanie...' : 'Vytvoriť profil'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
