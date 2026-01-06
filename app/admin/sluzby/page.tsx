'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Scissors } from 'lucide-react';
import { Database } from '@/lib/supabase/types';

type Service = Database['public']['Tables']['services']['Row'];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    duration_minutes: 60,
    price: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('profile_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setServices(data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      duration_minutes: 60,
      price: 0,
      is_active: true,
    });
    setEditingService(null);
    setError('');
  };

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        duration_minutes: service.duration_minutes,
        price: Number(service.price),
        is_active: service.is_active,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTimeout(resetForm, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update({
            name: formData.name,
            duration_minutes: formData.duration_minutes,
            price: formData.price,
            is_active: formData.is_active,
          })
          .eq('id', editingService.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .insert({
            profile_id: session.user.id,
            name: formData.name,
            duration_minutes: formData.duration_minutes,
            price: formData.price,
            is_active: formData.is_active,
          });

        if (error) throw error;
      }

      await fetchServices();
      handleCloseDialog();
    } catch (error: any) {
      setError('Chyba pri ukladaní služby');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Naozaj chcete odstrániť túto službu?')) return;

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (!error) {
      await fetchServices();
    }
  };

  const toggleActive = async (service: Service) => {
    const { error } = await supabase
      .from('services')
      .update({ is_active: !service.is_active })
      .eq('id', service.id);

    if (!error) {
      await fetchServices();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Načítavam služby...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Služby</h1>
          <p className="text-slate-600 mt-1">Spravujte služby, ktoré ponúkate</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Pridať službu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Upraviť službu' : 'Nová služba'}
              </DialogTitle>
              <DialogDescription>
                {editingService
                  ? 'Upravte detaily služby'
                  : 'Pridajte novú službu do svojej ponuky'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Názov služby *</Label>
                  <Input
                    id="name"
                    placeholder="napr. Dámsky strih"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Trvanie (min) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="15"
                      step="15"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Cena (€) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="active">Aktívna služba</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Zrušiť
                </Button>
                <Button type="submit">
                  {editingService ? 'Uložiť zmeny' : 'Pridať službu'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Scissors className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Žiadne služby</h3>
            <p className="text-slate-600 text-center mb-4">
              Začnite pridaním vašich prvých služieb
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Pridať službu
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className={!service.is_active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {service.duration_minutes} min • {Number(service.price).toFixed(2)} €
                    </CardDescription>
                  </div>
                  <Switch
                    checked={service.is_active}
                    onCheckedChange={() => toggleActive(service)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenDialog(service)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Upraviť
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
