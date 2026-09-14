import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CareerPath } from '@/lib/dashboard-service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Edit2, Trash2, Save, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const CareerPathwaysManagement = () => {
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CareerPath>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 10;
  const { toast } = useToast();

  const fetchPaths = async () => {
    setIsLoading(true);
    const { data, error, count } = await supabase
      .from('career_paths')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

    if (error) {
      toast({ title: 'Error fetching pathways', description: error.message, variant: 'destructive' });
    } else {
      setCareerPaths((data as CareerPath[]) || []);
      setTotalCount(count || 0);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPaths();
  }, [currentPage]);

  const handleEdit = (path: CareerPath) => {
    setIsEditing(path.id);
    setFormData(path);
  };

  const handleCreate = () => {
    setIsEditing('new');
    setFormData({
      title: '',
      category: 'Technology',
      demand_level: 'High',
      salary_range: '',
      growth_percentage: '+10%',
      description: '',
      image_url: '',
      skills_required: [],
      education_requirements: '',
      career_level: 'Entry Level',
      is_active: true,
      is_featured: false,
      slug: ''
    });
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleCancel = () => {
    setIsEditing(null);
    setFormData({});
    setImageFile(null);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      toast({ title: 'Validation Error', description: 'Title and Description are required', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    let imageUrl = formData.image_url || '';

    // Handle Image Upload
    if (imageFile) {
      setIsUploading(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `career-paths/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('career-images')
        .upload(filePath, imageFile);
        
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('career-images')
          .getPublicUrl(filePath);
        imageUrl = publicUrl;
      } else {
        toast({ title: 'Upload Failed', description: uploadError.message, variant: 'destructive' });
      }
      setIsUploading(false);
    }

    const payload = {
      ...formData,
      slug: formData.slug || generateSlug(formData.title || ''),
      image_url: imageUrl,
      updated_at: new Date().toISOString()
    };

    let error;
    if (isEditing === 'new') {
      const { error: insertError } = await supabase.from('career_paths').insert([payload as CareerPath]);
      error = insertError;
    } else {
      const { error: updateError } = await supabase.from('career_paths').update(payload).eq('id', isEditing);
      error = updateError;
    }

    if (error) {
      toast({ title: 'Error saving pathway', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Pathway saved successfully' });
      setIsEditing(null);
      setImageFile(null);
      fetchPaths();
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this career pathway?')) return;
    setIsLoading(true);
    const { error } = await supabase.from('career_paths').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Pathway deleted' });
      fetchPaths();
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Career Pathways</h2>
          <p className="text-muted-foreground">Manage dynamically displayed career pathways.</p>
        </div>
        <Button onClick={handleCreate} disabled={isLoading || isEditing !== null} className="bg-primary hover:bg-primary/90 text-white font-bold">
          <Plus className="w-4 h-4 mr-2" /> Add Pathway
        </Button>
      </div>

      {isEditing && (
        <Card className="bg-card border-border shadow-glass">
          <CardHeader>
            <CardTitle>{isEditing === 'new' ? 'Create New Pathway' : 'Edit Pathway'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">Title</label>
                <Input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-background border-border" placeholder="e.g. Software Engineer" />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">Category</label>
                <Input value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} className="bg-background border-border" placeholder="e.g. Technology" />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">Slug</label>
                <Input value={formData.slug || ''} onChange={e => setFormData({...formData, slug: e.target.value})} className="bg-background border-border" placeholder="e.g. software-engineer" />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">Demand Level</label>
                <Input value={formData.demand_level || ''} onChange={e => setFormData({...formData, demand_level: e.target.value})} className="bg-background border-border" placeholder="High, Growing, etc." />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">Salary Range</label>
                <Input value={formData.salary_range || ''} onChange={e => setFormData({...formData, salary_range: e.target.value})} className="bg-background border-border" placeholder="e.g. KES 100k - 200k" />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">Growth Rate</label>
                <Input value={formData.growth_percentage || ''} onChange={e => setFormData({...formData, growth_percentage: e.target.value})} className="bg-background border-border" placeholder="+15%" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">
                  Pathway Image
                </label>
                <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden group bg-background/50">
                  {formData.image_url || imageFile ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                      <img src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => { 
                            setImageFile(null); 
                            setFormData({ ...formData, image_url: '' });
                          }}
                        >
                          Remove Image
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold">Click to upload image</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Recommended: 16:9 Aspect Ratio</p>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
                        }} 
                      />
                    </>
                  )}
                </div>
                {formData.image_url && !imageFile && (
                  <p className="text-[10px] text-muted-foreground mt-2 truncate">Current URL: {formData.image_url}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase tracking-wider text-primary/70">Or use Image URL</label>
                <Input value={formData.image_url || ''} onChange={e => setFormData({...formData, image_url: e.target.value})} className="bg-background border-border text-xs" placeholder="https://unsplash..." />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">Career Level</label>
                <Input value={formData.career_level || ''} onChange={e => setFormData({...formData, career_level: e.target.value})} className="bg-background border-border" placeholder="e.g. Entry Level" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">Education Requirements</label>
                <Input value={formData.education_requirements || ''} onChange={e => setFormData({...formData, education_requirements: e.target.value})} className="bg-background border-border" placeholder="e.g. Degree in Computer Science" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">One-Liner (Brief Overview)</label>
                <Input value={formData.one_liner || ''} onChange={e => setFormData({...formData, one_liner: e.target.value})} className="bg-background border-border" placeholder="e.g. Architecting resilient digital infrastructures for the future." />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">Kenyan Universities (Comma separated)</label>
                <Input
                  value={Array.isArray(formData.universities) ? formData.universities.join(', ') : formData.universities || ''}
                  onChange={e => setFormData({...formData, universities: e.target.value.split(',').map(s => s.trim())})}
                  className="bg-background border-border"
                  placeholder="e.g. UoN, Strathmore, JKUAT"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">Related Job Roles (Comma separated)</label>
                <Input
                  value={Array.isArray(formData.related_roles) ? formData.related_roles.join(', ') : formData.related_roles || ''}
                  onChange={e => setFormData({...formData, related_roles: e.target.value.split(',').map(s => s.trim())})}
                  className="bg-background border-border"
                  placeholder="e.g. Bank Manager, Financial Analyst, Investment Banker"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Job titles/positions this course leads to</p>
              </div>
              <div>
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">Pros (Comma separated)</label>
                <Input 
                  value={Array.isArray(formData.pros) ? formData.pros.join(', ') : formData.pros || ''} 
                  onChange={e => setFormData({...formData, pros: e.target.value.split(',').map(s => s.trim())})} 
                  className="bg-background border-border" 
                  placeholder="e.g. High Demand, Flexible, Remote" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">Cons (Comma separated)</label>
                <Input 
                  value={Array.isArray(formData.cons) ? formData.cons.join(', ') : formData.cons || ''} 
                  onChange={e => setFormData({...formData, cons: e.target.value.split(',').map(s => s.trim())})} 
                  className="bg-background border-border" 
                  placeholder="e.g. Fast-paced, Continuous Learning" 
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="is_featured"
                  checked={formData.is_featured || false} 
                  onChange={e => setFormData({...formData, is_featured: e.target.checked})} 
                  className="w-4 h-4 rounded border-border bg-background text-primary"
                />
                <label htmlFor="is_featured" className="text-sm font-semibold text-foreground cursor-pointer">Featured on Homepage (Top 3)</label>
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold text-foreground/80 mb-1 block uppercase tracking-wider">Description</label>
              <Textarea 
                value={formData.description || ''} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                className="bg-background border-border min-h-[100px]" 
                placeholder="Detailed description of the career..."
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSave} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Pathway
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
                <TableHead className="font-bold text-foreground">Image</TableHead>
                <TableHead className="font-bold text-foreground">Title & Category</TableHead>
                <TableHead className="font-bold text-foreground">Demand & Growth</TableHead>
                <TableHead className="text-right pr-6 font-bold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {careerPaths.map(path => (
                <TableRow key={path.id} className="border-border">
                  <TableCell className="w-20">
                    {path.image_url ? (
                      <img src={path.image_url} alt={path.title} className="w-12 h-12 object-cover rounded-md border border-border" />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-md border border-border flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-bold text-foreground">{path.title}</div>
                      {path.is_featured && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full uppercase tracking-widest">Featured</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{path.category}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{path.demand_level}</div>
                    <div className="text-xs text-muted-foreground">{path.growth_percentage} Growth</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(path)} className="text-muted-foreground hover:text-foreground">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(path.id)} className="text-muted-foreground hover:text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Showing <span className="text-foreground">{Math.min(totalCount, currentPage * ITEMS_PER_PAGE + 1)}-{Math.min(totalCount, (currentPage + 1) * ITEMS_PER_PAGE)}</span> of <span className="text-foreground">{totalCount}</span> Pathways
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0 || isLoading}
                className="text-xs h-8"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={(currentPage + 1) * ITEMS_PER_PAGE >= totalCount || isLoading}
                className="text-xs h-8"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
