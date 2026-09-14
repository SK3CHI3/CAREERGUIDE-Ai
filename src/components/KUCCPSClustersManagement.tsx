import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Edit2, Trash2, Save, X, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface KUCCPSCluster {
  id: string;
  cluster_id: number;
  name: string;
  subjects: string[];
  min_requirements: Record<string, string>;
  programmes: string[];
  universities: string[];
  cutoff_estimate: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const KUCCPSClustersManagement = () => {
  const [clusters, setClusters] = useState<KUCCPSCluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<KUCCPSCluster>>({});
  const { toast } = useToast();

  const fetchClusters = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('kuccps_clusters')
      .select('*')
      .order('cluster_id');

    if (error) {
      toast({ title: 'Error fetching clusters', description: error.message, variant: 'destructive' });
    } else {
      setClusters((data as KUCCPSCluster[]) || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const handleEdit = (cluster: KUCCPSCluster) => {
    setIsEditing(cluster.id);
    setFormData(cluster);
  };

  const handleCreate = () => {
    setIsEditing('new');
    setFormData({
      cluster_id: clusters.length > 0 ? Math.max(...clusters.map(c => c.cluster_id)) + 1 : 1,
      name: '',
      subjects: [],
      min_requirements: {},
      programmes: [],
      universities: [],
      cutoff_estimate: '',
      is_active: true
    });
  };

  const handleCancel = () => {
    setIsEditing(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subjects?.length || !formData.programmes?.length) {
      toast({ 
        title: 'Validation Error', 
        description: 'Name, subjects, and programmes are required', 
        variant: 'destructive' 
      });
      return;
    }

    setIsLoading(true);

    const payload = {
      ...formData,
      updated_at: new Date().toISOString()
    };

    let error;
    if (isEditing === 'new') {
      const { error: insertError } = await supabase.from('kuccps_clusters').insert([payload as KUCCPSCluster]);
      error = insertError;
    } else {
      const { error: updateError } = await supabase.from('kuccps_clusters').update(payload).eq('id', isEditing);
      error = updateError;
    }

    if (error) {
      toast({ title: 'Error saving cluster', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Cluster saved successfully' });
      setIsEditing(null);
      fetchClusters();
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this KUCCPS cluster?')) return;
    setIsLoading(true);
    const { error } = await supabase.from('kuccps_clusters').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Cluster deleted' });
      fetchClusters();
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="w-6 h-6" />
            KUCCPS Clusters
          </h2>
          <p className="text-muted-foreground">Manage the 19 official KUCCPS degree clusters and their requirements.</p>
        </div>
        <Button onClick={handleCreate} disabled={isLoading || isEditing !== null} className="bg-primary hover:bg-primary/90 text-white font-bold">
          <Plus className="w-4 h-4 mr-2" /> Add Cluster
        </Button>
      </div>

      {isEditing && (
        <Card className="bg-card border-border shadow-glass">
          <CardHeader>
            <CardTitle>{isEditing === 'new' ? 'Create New Cluster' : 'Edit Cluster'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">Cluster ID</label>
                <Input 
                  type="number"
                  value={formData.cluster_id || ''} 
                  onChange={e => setFormData({...formData, cluster_id: parseInt(e.target.value)})} 
                  className="bg-background border-border" 
                  placeholder="e.g. 8" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">Cluster Name</label>
                <Input 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="bg-background border-border" 
                  placeholder="e.g. Agriculture, Fisheries & Related" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">Cutoff Estimate</label>
                <Input 
                  value={formData.cutoff_estimate || ''} 
                  onChange={e => setFormData({...formData, cutoff_estimate: e.target.value})} 
                  className="bg-background border-border" 
                  placeholder="e.g. 20-27" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">
                  Required Subjects (Comma separated)
                </label>
                <Textarea
                  value={Array.isArray(formData.subjects) ? formData.subjects.join(', ') : ''}
                  onChange={e => setFormData({...formData, subjects: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                  className="bg-background border-border min-h-[80px]"
                  placeholder="e.g. Biology, Chemistry, Mathematics/Physics, Group II/III/IV/V"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Use "/" for alternatives (e.g., Mathematics/Physics)</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">
                  Minimum Requirements (JSON format)
                </label>
                <Textarea
                  value={JSON.stringify(formData.min_requirements || {}, null, 2)}
                  onChange={e => {
                    try {
                      setFormData({...formData, min_requirements: JSON.parse(e.target.value)});
                    } catch (err) {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="bg-background border-border font-mono text-xs min-h-[100px]"
                  placeholder='{"Biology": "C+", "Chemistry": "C+", "Mathematics": "C"}'
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">
                  Programmes (Comma separated)
                </label>
                <Textarea
                  value={Array.isArray(formData.programmes) ? formData.programmes.join(', ') : ''}
                  onChange={e => setFormData({...formData, programmes: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                  className="bg-background border-border min-h-[80px]"
                  placeholder="e.g. Agriculture, Agribusiness, Fisheries, Aquaculture, Horticulture"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">
                  Universities (Comma separated)
                </label>
                <Textarea
                  value={Array.isArray(formData.universities) ? formData.universities.join(', ') : ''}
                  onChange={e => setFormData({...formData, universities: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                  className="bg-background border-border min-h-[60px]"
                  placeholder="e.g. JKUAT, Egerton University, University of Nairobi"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active || false}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 rounded border-border bg-background text-primary"
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-foreground cursor-pointer">Active</label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSave} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Cluster
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && !isEditing ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !isEditing && (
        <div className="bg-background border border-border rounded-xl shadow-glass overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-bold text-foreground w-20">ID</TableHead>
                <TableHead className="font-bold text-foreground">Cluster Name</TableHead>
                <TableHead className="font-bold text-foreground">Programmes</TableHead>
                <TableHead className="font-bold text-foreground">Cutoff</TableHead>
                <TableHead className="text-right pr-6 font-bold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clusters.map(cluster => (
                <TableRow key={cluster.id} className="border-border">
                  <TableCell className="font-bold text-primary">{cluster.cluster_id}</TableCell>
                  <TableCell>
                    <div className="font-bold text-foreground">{cluster.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {cluster.subjects.slice(0, 2).join(', ')}
                      {cluster.subjects.length > 2 && ` +${cluster.subjects.length - 2} more`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {cluster.programmes.slice(0, 3).join(', ')}
                      {cluster.programmes.length > 3 && ` +${cluster.programmes.length - 3} more`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {cluster.cutoff_estimate}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(cluster)} className="text-muted-foreground hover:text-foreground">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cluster.id)} className="text-muted-foreground hover:text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
