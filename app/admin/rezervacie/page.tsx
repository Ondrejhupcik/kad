'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Phone, Mail, Clock, CheckCircle, XCircle, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { Database } from '@/lib/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  services: { name: string } | null;
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    let query = supabase
      .from('bookings')
      .select(`
        *,
        services (name)
      `)
      .eq('profile_id', session.user.id)
      .order('start_time', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (data && !error) {
      setBookings(data);
    }
    setLoading(false);
  };

  const updateStatus = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (!error) {
      await fetchBookings();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Čaká', variant: 'default' as const, icon: Circle },
      confirmed: { label: 'Potvrdené', variant: 'default' as const, icon: CheckCircle },
      cancelled: { label: 'Zrušené', variant: 'destructive' as const, icon: XCircle },
      completed: { label: 'Dokončené', variant: 'secondary' as const, icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Načítavam rezervácie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rezervácie</h1>
          <p className="text-slate-600 mt-1">Prehľad všetkých rezervácií</p>
        </div>
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všetky</SelectItem>
            <SelectItem value="pending">Čakajúce</SelectItem>
            <SelectItem value="confirmed">Potvrdené</SelectItem>
            <SelectItem value="completed">Dokončené</SelectItem>
            <SelectItem value="cancelled">Zrušené</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Žiadne rezervácie</h3>
            <p className="text-slate-600 text-center">
              {filter === 'all'
                ? 'Zatiaľ nemáte žiadne rezervácie'
                : `Žiadne ${filter === 'pending' ? 'čakajúce' : filter === 'confirmed' ? 'potvrdené' : filter === 'completed' ? 'dokončené' : 'zrušené'} rezervácie`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {booking.client_name}
                        </h3>
                        <p className="text-slate-600">{booking.services?.name}</p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(booking.start_time), 'PPP', { locale: sk })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-4 h-4" />
                        {format(new Date(booking.start_time), 'HH:mm', { locale: sk })} -{' '}
                        {format(new Date(booking.end_time), 'HH:mm', { locale: sk })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4" />
                        {booking.client_phone}
                      </div>
                      {booking.client_email && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-4 h-4" />
                          {booking.client_email}
                        </div>
                      )}
                    </div>

                    {booking.notes && (
                      <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                        <strong>Poznámka:</strong> {booking.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex lg:flex-col gap-2">
                    {booking.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateStatus(booking.id, 'confirmed')}
                          className="flex-1 lg:flex-none"
                        >
                          Potvrdiť
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(booking.id, 'cancelled')}
                          className="flex-1 lg:flex-none"
                        >
                          Zrušiť
                        </Button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateStatus(booking.id, 'completed')}
                          className="flex-1 lg:flex-none"
                        >
                          Dokončiť
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(booking.id, 'cancelled')}
                          className="flex-1 lg:flex-none"
                        >
                          Zrušiť
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
