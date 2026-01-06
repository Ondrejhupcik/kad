'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, ExternalLink } from 'lucide-react';
import { Database } from '@/lib/supabase/types';
import Link from 'next/link';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (data && !error) {
      const profileData = data as Profile;
      setProfile(profileData);
      setFormData({
        name: profileData.name,
        slug: profileData.slug,
        phone: profileData.phone || '',
        email: profileData.email,
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (!formData.name.trim() || !formData.slug.trim()) {
        throw new Error('Meno a slug sú povinné');
      }

      if (!/^[a-z0-9-]+$/.test(formData.slug)) {
        throw new Error('Slug môže obsahovať iba malé písmená, čísla a pomlčky');
      }

      if (formData.slug !== profile?.slug) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('slug', formData.slug)
          .maybeSingle();

        if (existingProfile) {
          throw new Error('Tento slug je už obsadený');
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          phone: formData.phone.trim() || null,
        })
        .eq('id', profile!.id);

      if (updateError) throw updateError;

      await fetchProfile();
      setSuccess('Nastavenia boli úspešne uložené');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Chyba pri ukladaní nastavení');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Načítavam nastavenia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Nastavenia</h1>
        <p className="text-slate-600 mt-1">Upravte informácie o vašom kaderníctve</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-900">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profil kaderníctva</CardTitle>
          <CardDescription>
            Základné informácie, ktoré sa zobrazia na vašej verejnej rezervačnej stránke
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Názov kaderníctva / Vaše meno *</Label>
              <Input
                id="name"
                type="text"
                placeholder="napr. Monika Hair Studio"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={saving}
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
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  disabled={saving}
                />
              </div>
              <p className="text-xs text-slate-500">
                Vaša verejná rezervačná stránka: /{formData.slug}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefónne číslo</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+421 900 123 456"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
              />
              <p className="text-xs text-slate-500">
                E-mail z vášho účtu (nie je možné zmeniť)
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Ukladám...' : 'Uložiť zmeny'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verejná rezervačná stránka</CardTitle>
          <CardDescription>
            Odkaz na vašu verejnú rezervačnú stránku, ktorú môžete zdieľať so zákazníkmi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/${profile?.slug}`}
              readOnly
              className="flex-1"
            />
            <Link href={`/${profile?.slug}`} target="_blank">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Otvoriť
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
