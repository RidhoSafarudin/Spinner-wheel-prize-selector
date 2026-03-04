import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePrizes, useCreatePrize, useUpdatePrize, useDeletePrize, useSpinHistory, Prize } from '@/hooks/usePrizes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Plus, Pencil, Trash2, LogOut, Home, History } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

function PrizeForm({ prize, onSubmit, onCancel }: {
  prize?: Prize;
  onSubmit: (data: { name: string; quantity: number; status: string; color: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(prize?.name || '');
  const [quantity, setQuantity] = useState(prize?.quantity?.toString() || '10');
  const [status, setStatus] = useState(prize?.status || 'active');
  const [color, setColor] = useState(prize?.color || '#d4a017');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, quantity: parseInt(quantity), status, color });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>Prize Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Gift Card $50" />
      </div>
      <div className="space-y-2">
        <Label>Quantity</Label>
        <Input type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Wheel Color</Label>
        <div className="flex gap-2 items-center">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 rounded cursor-pointer" />
          <span className="text-sm text-muted-foreground">{color}</span>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">{prize ? 'Update' : 'Create'} Prize</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { data: prizes = [], isLoading } = usePrizes();
  const { data: history = [] } = useSpinHistory();
  const createPrize = useCreatePrize();
  const updatePrize = useUpdatePrize();
  const deletePrize = useDeletePrize();
  const [editPrize, setEditPrize] = useState<Prize | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const handleCreate = async (data: { name: string; quantity: number; status: string; color: string }) => {
    try {
      await createPrize.mutateAsync(data);
      setShowCreate(false);
      toast({ title: 'Prize created!' });
    } catch {
      toast({ title: 'Error', description: 'Failed to create prize', variant: 'destructive' });
    }
  };

  const handleUpdate = async (data: { name: string; quantity: number; status: string; color: string }) => {
    if (!editPrize) return;
    try {
      await updatePrize.mutateAsync({ id: editPrize.id, ...data });
      setEditPrize(null);
      toast({ title: 'Prize updated!' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update prize', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prize?')) return;
    try {
      await deletePrize.mutateAsync(id);
      toast({ title: 'Prize deleted' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete prize', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-navy text-primary-foreground py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="w-7 h-7 text-gold" />
            <h1 className="text-xl font-bold font-heading text-gold">Admin Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-primary-foreground/70 hover:text-primary-foreground">
              <Home className="w-4 h-4 mr-1" /> Home
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-primary-foreground/70 hover:text-primary-foreground">
              <LogOut className="w-4 h-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="prizes">
          <TabsList className="mb-6">
            <TabsTrigger value="prizes" className="gap-2">
              <Gift className="w-4 h-4" /> Prizes
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" /> Spin History
            </TabsTrigger>
          </TabsList>

          {/* Prizes Tab */}
          <TabsContent value="prizes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading">Manage Prizes</CardTitle>
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Prize</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Create Prize</DialogTitle></DialogHeader>
                    <PrizeForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : prizes.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No prizes yet. Create one to get started!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Color</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prizes.map((prize) => (
                          <TableRow key={prize.id}>
                            <TableCell>
                              <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: prize.color || '#d4a017' }} />
                            </TableCell>
                            <TableCell className="font-medium">{prize.name}</TableCell>
                            <TableCell>{prize.quantity}</TableCell>
                            <TableCell>
                              <Badge variant={prize.status === 'active' ? 'default' : 'secondary'}>
                                {prize.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Dialog open={editPrize?.id === prize.id} onOpenChange={(o) => !o && setEditPrize(null)}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setEditPrize(prize)}>
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader><DialogTitle>Edit Prize</DialogTitle></DialogHeader>
                                    <PrizeForm prize={editPrize!} onSubmit={handleUpdate} onCancel={() => setEditPrize(null)} />
                                  </DialogContent>
                                </Dialog>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(prize.id)}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Spin History</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No spins recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Prize Won</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((h) => (
                          <TableRow key={h.id}>
                            <TableCell className="font-medium">🎁 {h.prize_name}</TableCell>
                            <TableCell>{format(new Date(h.spun_at), 'MMM d, yyyy')}</TableCell>
                            <TableCell>{format(new Date(h.spun_at), 'HH:mm:ss')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
