'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Clock, Save } from 'lucide-react';
import { Database } from '@/lib/supabase/types';

type Availability = Database['public']['Tables']['availability']['Row'];

interface DaySchedule {
  enabled: boolean;
  start_time: string;
  end_time: string;
  id?: string;
}

const DAYS = [
  { value: 1, label: 'Pondelok' },
  { value: 2, label: 'Utorok' },
  { value: 3, label: 'Streda' },
  { value: 4, label: 'Štvrtok' },
  { value: 5, label: 'Piatok' },
  { value: 6, label: 'Sobota' },
  { value: 0, label: 'Nedeľa' },
];

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState<Record<number, DaySchedule>>({
    1: { enabled: true, start_time: '09:00', end_time: '17:00' },
    2: { enabled: true, start_time: '09:00', end_time: '17:00' },
    3: { enabled: true, start_time: '09:00', end_time: '17:00' },
    4: { enabled: true, start_time: '09:00', end_time: '17:00' },
    5: { enabled: true, start_time: '09:00', end_time: '17:00' },
    6: { enabled: false, start_time: '09:00', end_time: '14:00' },
    0: { enabled: false, start_time: '09:00', end_time: '14:00' },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('profile_id', session.user.id);

    if (data && !error) {
      const newSchedule = { ...schedule };
      data.forEach((avail) => {
        newSchedule[avail.day_of_week] = {
          enabled: true,
          start_time: avail.start_time,
          end_time: avail.end_time,
          id: avail.id,
        };
      });

      DAYS.forEach((day) => {
        if (!data.find(a => a.day_of_week === day.value)) {
          newSchedule[day.value] = {
            ...newSchedule[day.value],
            enabled: false,
          };
        }
      });

      setSchedule(newSchedule);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const deletePromises = [];
      const upsertPromises = [];

      for (const day of DAYS) {
        const daySchedule = schedule[day.value];

        if (!daySchedule.enabled && daySchedule.id) {
          deletePromises.push(
            supabase.from('availability').delete().eq('id', daySchedule.id)
          );
        } else if (daySchedule.enabled) {
          if (daySchedule.start_time >= daySchedule.end_time) {
            throw new Error(`Neplatný čas pre ${day.label}`);
          }

          if (daySchedule.id) {
            upsertPromises.push(
              supabase
                .from('availability')
                .update({
                  start_time: daySchedule.start_time,
                  end_time: daySchedule.end_time,
                })
                .eq('id', daySchedule.id)
            );
          } else {
            upsertPromises.push(
              supabase.from('availability').insert({
                profile_id: session.user.id,
                day_of_week: day.value,
                start_time: daySchedule.start_time,
                end_time: daySchedule.end_time,
              })
            );
          }
        }
      }

      await Promise.all([...deletePromises, ...upsertPromises]);
      await fetchAvailability();
      setSuccess('Pracovný čas bol úspešne uložený');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Chyba pri ukladaní pracovného času');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Načítavam pracovný čas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Pracovný čas</h1>
        <p className="text-slate-600 mt-1">Nastavte si pracovné hodiny pre každý deň</p>
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
          <CardTitle>Týždenný rozvrh</CardTitle>
          <CardDescription>
            Vyberte pracovné dni a nastavte pracovné hodiny
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day) => {
            const daySchedule = schedule[day.value];
            return (
              <div
                key={day.value}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-slate-200 rounded-lg"
              >
                <div className="flex items-center space-x-3 sm:w-32">
                  <Switch
                    checked={daySchedule.enabled}
                    onCheckedChange={(checked) =>
                      setSchedule({
                        ...schedule,
                        [day.value]: { ...daySchedule, enabled: checked },
                      })
                    }
                  />
                  <span className="font-medium text-slate-900">{day.label}</span>
                </div>

                {daySchedule.enabled ? (
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2 flex-1">
                      <Label htmlFor={`start-${day.value}`} className="text-slate-600 whitespace-nowrap">
                        Od
                      </Label>
                      <Input
                        id={`start-${day.value}`}
                        type="time"
                        value={daySchedule.start_time}
                        onChange={(e) =>
                          setSchedule({
                            ...schedule,
                            [day.value]: { ...daySchedule, start_time: e.target.value },
                          })
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <Label htmlFor={`end-${day.value}`} className="text-slate-600 whitespace-nowrap">
                        Do
                      </Label>
                      <Input
                        id={`end-${day.value}`}
                        type="time"
                        value={daySchedule.end_time}
                        onChange={(e) =>
                          setSchedule({
                            ...schedule,
                            [day.value]: { ...daySchedule, end_time: e.target.value },
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-500 italic">Zatvorené</span>
                )}
              </div>
            );
          })}

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Ukladám...' : 'Uložiť zmeny'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Tip
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-2">
          <p>
            Rezervácie sa budú vytvárať len v rámci pracovného času, ktorý ste nastavili.
          </p>
          <p>
            Zákazníci uvidia dostupné časové sloty v 30-minútových intervaloch.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
