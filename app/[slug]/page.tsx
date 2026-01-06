'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Scissors, Calendar, Clock, Phone, Mail, User, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, addMinutes, parse, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { sk } from 'date-fns/locale';
import { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Service = Database['public']['Tables']['services']['Row'];
type Availability = Database['public']['Tables']['availability']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];

interface TimeSlot {
  time: Date;
  available: boolean;
}

export default function PublicBookingPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { locale: sk, weekStartsOn: 1 }));

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (slug) {
      fetchProfileData();
    }
  }, [slug]);

  useEffect(() => {
    if (profile) {
      fetchBookingsForWeek();
    }
  }, [profile, weekStart]);

  const fetchProfileData = async () => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (profileError || !profileData) {
      setError('Kaderníctvo nenájdené');
      setLoading(false);
      return;
    }

    const currentProfile = profileData as Profile;
    setProfile(currentProfile);

    const [servicesResult, availabilityResult] = await Promise.all([
      supabase
        .from('services')
        .select('*')
        .eq('profile_id', currentProfile.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true }),
      supabase
        .from('availability')
        .select('*')
        .eq('profile_id', currentProfile.id),
    ]);

    if (servicesResult.data) setServices(servicesResult.data);
    if (availabilityResult.data) setAvailability(availabilityResult.data);

    setLoading(false);
  };

  const fetchBookingsForWeek = async () => {
    if (!profile) return;

    const weekEnd = addDays(weekStart, 7);

    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('profile_id', profile.id)
      .neq('status', 'cancelled')
      .gte('start_time', weekStart.toISOString())
      .lt('start_time', weekEnd.toISOString());

    if (data) {
      setExistingBookings(data);
    }
  };

  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const dayOfWeek = date.getDay();
    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek);

    if (!dayAvailability || !selectedService) {
      return [];
    }

    const service = services.find(s => s.id === selectedService);
    if (!service) return [];

    const slots: TimeSlot[] = [];
    const startTime = parse(dayAvailability.start_time, 'HH:mm:ss', date);
    const endTime = parse(dayAvailability.end_time, 'HH:mm:ss', date);

    let currentSlot = startTime;

    while (currentSlot < endTime) {
      const slotEnd = addMinutes(currentSlot, service.duration_minutes);

      if (slotEnd <= endTime) {
        const isAvailable = !existingBookings.some(booking => {
          const bookingStart = parseISO(booking.start_time);
          const bookingEnd = parseISO(booking.end_time);

          return (
            isSameDay(bookingStart, date) &&
            ((currentSlot >= bookingStart && currentSlot < bookingEnd) ||
             (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
             (currentSlot <= bookingStart && slotEnd >= bookingEnd))
          );
        });

        slots.push({
          time: currentSlot,
          available: isAvailable,
        });
      }

      currentSlot = addMinutes(currentSlot, 30);
    }

    return slots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!selectedService || !selectedTime || !clientName.trim() || !clientPhone.trim()) {
        throw new Error('Vyplňte všetky povinné polia');
      }

      const service = services.find(s => s.id === selectedService);
      if (!service) throw new Error('Služba nenájdená');

      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = addMinutes(startTime, service.duration_minutes);

      const { data: conflictingBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('profile_id', profile!.id)
        .neq('status', 'cancelled')
        .gte('end_time', startTime.toISOString())
        .lte('start_time', endTime.toISOString());

      if (conflictingBookings && conflictingBookings.length > 0) {
        throw new Error('Tento termín už nie je dostupný. Vyberte iný čas.');
      }

      const { error: insertError } = await supabase
        .from('bookings')
        .insert([{
          profile_id: profile!.id,
          service_id: selectedService,
          client_name: clientName.trim(),
          client_phone: clientPhone.trim(),
          client_email: clientEmail.trim() || null,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          notes: notes.trim() || null,
          status: 'pending',
        }]);

      if (insertError) throw insertError;

      setSuccess(true);
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setNotes('');
      setSelectedService('');
      setSelectedTime('');
      await fetchBookingsForWeek();
    } catch (error: any) {
      setError(error.message || 'Chyba pri vytváraní rezervácie');
    } finally {
      setSubmitting(false);
    }
  };

  const goToPreviousWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const goToNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Načítavam...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Rezervácia vytvorená!</h2>
            <p className="text-slate-600">
              Vaša rezervácia bola úspešne vytvorená. Budete kontaktovaný na uvedenom telefónnom čísle.
            </p>
            <Button onClick={() => setSuccess(false)} className="w-full">
              Vytvoriť ďalšiu rezerváciu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const timeSlots = generateTimeSlots(selectedDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scissors className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl">{profile?.name}</CardTitle>
            <CardDescription className="text-base">Online rezervačný systém</CardDescription>
          </CardHeader>
        </Card>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>1. Vyberte službu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {services.length === 0 ? (
                  <p className="text-slate-600 text-center py-4">Žiadne dostupné služby</p>
                ) : (
                  services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        setSelectedService(service.id);
                        setSelectedTime('');
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedService === service.id
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-medium text-slate-900">{service.name}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        {service.duration_minutes} min • {Number(service.price).toFixed(2)} €
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Vyberte dátum a čas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousWeek}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-medium">
                    {format(weekStart, 'd. MMM', { locale: sk })} -{' '}
                    {format(addDays(weekStart, 6), 'd. MMM yyyy', { locale: sk })}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={goToNextWeek}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((day) => {
                    const hasAvailability = availability.some(a => a.day_of_week === day.getDay());
                    const isSelected = isSameDay(day, selectedDate);

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => {
                          setSelectedDate(day);
                          setSelectedTime('');
                        }}
                        disabled={!hasAvailability || !selectedService}
                        className={`p-2 text-center rounded-lg text-sm transition-all ${
                          !hasAvailability || !selectedService
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-slate-900 text-white'
                            : 'bg-white border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs">{format(day, 'EEE', { locale: sk })}</div>
                        <div className="font-medium">{format(day, 'd')}</div>
                      </button>
                    );
                  })}
                </div>

                {selectedService && (
                  <div className="space-y-2">
                    <Label>Dostupné časy</Label>
                    {timeSlots.length === 0 ? (
                      <p className="text-sm text-slate-600 text-center py-4">
                        V tento deň nie sú dostupné žiadne termíny
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                        {timeSlots.map((slot) => {
                          const timeString = format(slot.time, 'HH:mm');
                          const isSelected = selectedTime === timeString;

                          return (
                            <button
                              key={timeString}
                              type="button"
                              onClick={() => setSelectedTime(timeString)}
                              disabled={!slot.available}
                              className={`p-2 text-sm rounded-lg transition-all ${
                                !slot.available
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-white border border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {timeString}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>3. Vaše kontaktné údaje</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientName">
                    <User className="w-4 h-4 inline mr-1" />
                    Meno a priezvisko *
                  </Label>
                  <Input
                    id="clientName"
                    placeholder="Vaše celé meno"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientPhone">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Telefónne číslo *
                  </Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    placeholder="+421 900 123 456"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="clientEmail">
                    <Mail className="w-4 h-4 inline mr-1" />
                    E-mail (voliteľné)
                  </Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="vas@email.sk"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes">Poznámka (voliteľné)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Akékoľvek špeciálne požiadavky alebo poznámky..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={submitting}
                    rows={3}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-6"
                size="lg"
                disabled={!selectedService || !selectedTime || submitting}
              >
                {submitting ? 'Vytváram rezerváciu...' : 'Potvrdiť rezerváciu'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
