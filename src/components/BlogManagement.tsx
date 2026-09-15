import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Edit2, Trash2, Image as ImageIcon, CheckCircle2, XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  published: boolean;
  published_at: string | null;
  seo_title: string;
  seo_description: string;
  created_at: string;
}

export function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts' as any)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching blog posts:', error);
    } else {
      setPosts((data as BlogPost[]) || []);
    }
    setLoading(false);
  };

  const handleCreateNew = () => {
    setEditingPost({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      cover_image_url: '',
      published: false,
      seo_title: '',
      seo_description: ''
    });
    setImageFile(null);
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleSave = async () => {
    if (!editingPost?.title || !editingPost?.slug || !editingPost?.content) {
      alert("Title, Slug, and Content are required formatting constraints.");
      return;
    }
    
    setIsSaving(true);
    let coverImageUrl = editingPost.cover_image_url || '';

    // Handle Image Upload
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `covers/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, imageFile);
        
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(filePath);
        coverImageUrl = publicUrl;
      } else {
        alert("Image upload failed: " + uploadError.message);
      }
    }

    const postData = {
      ...editingPost,
      // Store only the same conservative HTML profile used by the reader.
      content: DOMPurify.sanitize(editingPost.content || '', { USE_PROFILES: { html: true } }),
      cover_image_url: coverImageUrl,
      published_at: editingPost.published && !editingPost.published_at ? new Date().toISOString() : editingPost.published_at,
    };

    if (postData.id) {
      // Update
      const { error } = await supabase
        .from('blog_posts' as any)
        .update(postData)
        .eq('id', postData.id);
      if (error) alert("Error updating post: " + error.message);
    } else {
      // Insert
      const { error } = await supabase
        .from('blog_posts' as any)
        .insert([postData]);
      if (error) alert("Error creating post: " + error.message);
    }

    await fetchPosts();
    setEditingPost(null);
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this blog post? This action is irreversible.")) {
      const { error } = await supabase.from('blog_posts' as any).delete().eq('id', id);
      if (!error) {
        setPosts(posts.filter(p => p.id !== id));
      } else {
        alert("Failed to delete post.");
      }
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = ['header', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'list', 'bullet', 'indent', 'link', 'image'];

  if (editingPost !== null) {
    return (
      <AnimatePresence mode="wait">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setEditingPost(null)} className="h-10 w-10 bg-white/5 hover:bg-white/10 rounded-xl">
                <ArrowLeft className="w-5 h-5 text-slate-300" />
              </Button>
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-1">{editingPost.id ? 'Edit Post' : 'New Post'}</h2>
                <p className="text-slate-400 text-sm">Craft high-quality content optimized for SEO.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                className="bg-white/5 border-white/10 hover:bg-white/10 font-bold px-6"
                onClick={() => setEditingPost({ ...editingPost, published: !editingPost.published })}
              >
                {editingPost.published ? <span className="text-emerald-400 flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> Published</span> : <span className="text-slate-400 flex items-center"><XCircle className="w-4 h-4 mr-2" /> Draft</span>}
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-glow" 
                onClick={handleSave} 
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Post
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-slate-950/40 backdrop-blur-md border-white/5">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Post Title <span className="text-rose-500">*</span></label>
                    <Input 
                      placeholder="e.g. The Future of Competency Based Education" 
                      className="h-14 text-lg font-bold bg-white/5 border-white/10 focus-visible:ring-primary"
                      value={editingPost.title || ''}
                      onChange={(e) => {
                        const title = e.target.value;
                        setEditingPost(prev => ({ 
                          ...prev, 
                          title, 
                          slug: prev?.id ? prev.slug : generateSlug(title) 
                        }));
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Content <span className="text-rose-500">*</span></label>
                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden text-white prose-quill">
                      <ReactQuill 
                        theme="snow" 
                        value={editingPost.content || ''} 
                        onChange={(content) => setEditingPost({ ...editingPost, content })}
                        modules={modules}
                        formats={formats}
                        className="h-[500px] mb-12"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-slate-950/40 backdrop-blur-md border-white/5">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-white">Post Meta</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6 pt-0">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">URL Slug <span className="text-rose-500">*</span></label>
                    <Input 
                      placeholder="e.g. future-of-cbe" 
                      className="bg-white/5 border-white/10 focus-visible:ring-primary text-slate-300"
                      value={editingPost.slug || ''}
                      onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Short Excerpt</label>
                    <Textarea 
                      placeholder="Brief snippet shown on blog grid..." 
                      className="h-24 resize-none bg-white/5 border-white/10 focus-visible:ring-primary text-slate-300"
                      value={editingPost.excerpt || ''}
                      onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Cover Image</label>
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
                      {editingPost.cover_image_url || imageFile ? (
                         <div className="absolute inset-0 w-full h-full">
                           <img src={imageFile ? URL.createObjectURL(imageFile) : editingPost.cover_image_url} alt="Cover Preview" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button variant="destructive" size="sm" onClick={() => { setImageFile(null); setEditingPost({ ...editingPost, cover_image_url: '' })}}>Remove</Button>
                           </div>
                         </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          </div>
                          <p className="text-xs text-slate-500 font-medium text-center">Click to upload image<br/>(16:9 recommended)</p>
                          <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => {
                            if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
                          }} />
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-950/40 backdrop-blur-md border-white/5">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-white">SEO Optimization</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4 pt-0">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">SEO Title</label>
                    <Input 
                      placeholder="Defaults to Post Title if blank" 
                      className="bg-white/5 border-white/10 focus-visible:ring-primary text-slate-300"
                      value={editingPost.seo_title || ''}
                      onChange={(e) => setEditingPost({ ...editingPost, seo_title: e.target.value })}
                    />
                    <p className="text-[10px] text-slate-500 text-right">{editingPost.seo_title?.length || 0}/60 chars</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Meta Description</label>
                    <Textarea 
                      placeholder="Optimal length 150-160 characters..." 
                      className="h-24 resize-none bg-white/5 border-white/10 focus-visible:ring-primary text-slate-300"
                      value={editingPost.seo_description || ''}
                      onChange={(e) => setEditingPost({ ...editingPost, seo_description: e.target.value })}
                    />
                    <p className="text-[10px] text-slate-500 text-right">{editingPost.seo_description?.length || 0}/160 chars</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-1">Publications & Blog</h2>
          <p className="text-slate-300 text-sm">Manage SEO-optimized articles and resources.</p>
        </div>
        <Button 
          onClick={handleCreateNew}
          className="h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold px-6 shadow-glow transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" /> Create New Post
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
        </div>
      ) : (
        <Card className="bg-slate-950/40 backdrop-blur-md border-white/5 shadow-glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase font-black tracking-widest text-slate-400 bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 rounded-tl-xl">Post Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Published Date</th>
                  <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {post.cover_image_url ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/10">
                            <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                            <ImageIcon className="w-5 h-5 text-slate-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white text-base">{post.title}</div>
                          <div className="text-slate-400 text-xs mt-0.5 font-medium">/{post.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {post.published ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 text-xs font-bold border border-slate-500/20">
                          <XCircle className="w-3.5 h-3.5" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-white hover:bg-white/10" onClick={() => setEditingPost(post)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-rose-400 hover:bg-rose-500/10" onClick={() => handleDelete(post.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No blog posts created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
