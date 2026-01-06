'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Scissors, Calendar, Settings, List, Clock, LogOut, ExternalLink } from 'lucide-react';
import { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/prihlasenie');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!profileData) {
        router.push('/nastavenie-profilu');
        return;
      }

      setProfile(profileData);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/prihlasenie');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Načítavam...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: 'Prehľad', href: '/admin', icon: Calendar },
    { name: 'Rezervácie', href: '/admin/rezervacie', icon: List },
    { name: 'Služby', href: '/admin/sluzby', icon: Scissors },
    { name: 'Pracovný čas', href: '/admin/pracovny-cas', icon: Clock },
    { name: 'Nastavenia', href: '/admin/nastavenia', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex h-screen overflow-hidden">
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-slate-900 truncate">{profile?.name}</h2>
                <p className="text-xs text-slate-500 truncate">/{profile?.slug}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 space-y-2">
            <Link href={`/${profile?.slug}`} target="_blank">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Verejná stránka
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start"
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Odhlásiť sa
            </Button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
