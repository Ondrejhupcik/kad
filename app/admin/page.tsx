'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Scissors, TrendingUp } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { sk } from 'date-fns/locale';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    todayBookings: 0,
    weekBookings: 0,
    monthBookings: 0,
    totalServices: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const todayEnd = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      const weekStart = startOfWeek(new Date(), { locale: sk }).toISOString();
      const weekEnd = endOfWeek(new Date(), { locale: sk }).toISOString();
      const monthStart = startOfMonth(new Date()).toISOString();
      const monthEnd = endOfMonth(new Date()).toISOString();

      const [todayResult, weekResult, monthResult, servicesResult, bookingsResult] = await Promise.all([
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', session.user.id)
          .gte('start_time', todayStart)
          .lte('start_time', todayEnd)
          .neq('status', 'cancelled'),
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', session.user.id)
          .gte('start_time', weekStart)
          .lte('start_time', weekEnd)
          .neq('status', 'cancelled'),
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', session.user.id)
          .gte('start_time', monthStart)
          .lte('start_time', monthEnd)
          .neq('status', 'cancelled'),
        supabase
          .from('services')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', session.user.id)
          .eq('is_active', true),
        supabase
          .from('bookings')
          .select(`
            *,
            services (name)
          `)
          .eq('profile_id', session.user.id)
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(5),
      ]);

      setStats({
        todayBookings: todayResult.count || 0,
        weekBookings: weekResult.count || 0,
        monthBookings: monthResult.count || 0,
        totalServices: servicesResult.count || 0,
      });

      setRecentBookings(bookingsResult.data || []);
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Načítavam štatistiky...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Dnes',
      value: stats.todayBookings,
      icon: Calendar,
      description: 'Rezervácií dnes',
    },
    {
      title: 'Tento týždeň',
      value: stats.weekBookings,
      icon: TrendingUp,
      description: 'Rezervácií tento týždeň',
    },
    {
      title: 'Tento mesiac',
      value: stats.monthBookings,
      icon: Clock,
      description: 'Rezervácií tento mesiac',
    },
    {
      title: 'Aktívne služby',
      value: stats.totalServices,
      icon: Scissors,
      description: 'Počet služieb',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Prehľad</h1>
        <p className="text-slate-600 mt-1">Vitajte vo vašom administrátorskom paneli</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-slate-600 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nadchádzajúce rezervácie</CardTitle>
          <CardDescription>Najbližších 5 rezervácií</CardDescription>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Žiadne nadchádzajúce rezervácie</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{booking.client_name}</p>
                    <p className="text-sm text-slate-600">{booking.services?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">
                      {format(new Date(booking.start_time), 'PPP', { locale: sk })}
                    </p>
                    <p className="text-sm text-slate-600">
                      {format(new Date(booking.start_time), 'HH:mm', { locale: sk })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
