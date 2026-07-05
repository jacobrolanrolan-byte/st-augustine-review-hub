import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip, CircularProgress, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, Divider, List, ListItemButton, ListItemIcon, ListItemText, InputAdornment, IconButton } from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FolderIcon from '@mui/icons-material/Folder';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const SUBJECT_LIST = [
  "Finite Mathematics", "Theology", "Effective Komunikasyon", 
  "Life and Career Skills", "General Mathematics", "Kasaysayan", "General Science"
];

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  
  const [materials, setMaterials] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetching, setFetching] = useState(true);
  const [openAdminModal, setOpenAdminModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchMaterials = async () => {
    setFetching(true);
    const { data } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
    if (data) setMaterials(data);
    setFetching(false);
  };

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    else if (user) fetchMaterials();
  }, [user, loading, router]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !title || !selectedFile) return;
    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${subject}/${fileName}`;
      const { error: storageError } = await supabase.storage.from('review-materials').upload(filePath, selectedFile);
      if (storageError) throw storageError;
      const { data: { publicUrl } } = supabase.storage.from('review-materials').getPublicUrl(filePath);
      await supabase.from('materials').insert([{ subject, title, description, download_url: publicUrl, uploaded_by: user?.email }]);
      setOpenAdminModal(false);
      fetchMaterials();
    } catch (error: any) { alert(error.message); } finally { setUploading(false); }
  };

  const handleDeleteMaterial = async (id: string, downloadUrl: string) => {
    if (!window.confirm("Are you sure?")) return;
    const urlParts = downloadUrl.split('/by-id/review-materials/');
    if (urlParts.length > 1) await supabase.storage.from('review-materials').remove([urlParts[1]]);
    await supabase.from('materials').delete().eq('id', id);
    fetchMaterials();
  };

  if (loading || fetching) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#F8F9FA' }}>
      <CircularProgress />
    </Box>
  );

  const isAdmin = profile?.role === 'admin' || user?.email?.includes('admin');
  const filteredMaterials = materials.filter(item => {
    const matchesSubject = selectedSubject ? item.subject === selectedSubject : true;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <Box sx={{ bgcolor: '#F8F9FA', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E0E0E0', px: 3, py: 2 }}>
        <Typography variant="h6">Review Hub</Typography>
      </Box>
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <Box sx={{ width: '280px', p: 2, display: { xs: 'none', lg: 'block' } }}>
          <List>
            <ListItemButton onClick={() => setSelectedSubject(null)}>All Subjects</ListItemButton>
            {SUBJECT_LIST.map(subj => (
              <ListItemButton key={subj} onClick={() => setSelectedSubject(subj)}>{subj}</ListItemButton>
            ))}
          </List>
        </Box>
        <Box sx={{ flexGrow: 1, p: 4 }}>
          <TextField fullWidth placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          {isAdmin && <Button sx={{ mt: 2 }} variant="contained" onClick={() => setOpenAdminModal(true)}>Upload</Button>}
          <Grid container spacing={3} sx={{ mt: 2 }}>
  {filteredMaterials.map((item) => (
    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}> 
      <Card sx={{ p: 2 }}>
        <Typography variant="h6">{item.title}</Typography>
        <Button href={item.download_url} target="_blank">View</Button>
        {isAdmin && (
          <IconButton color="error" onClick={() => handleDeleteMaterial(item.id, item.download_url)}>
            <DeleteIcon />
          </IconButton>
        )}
      </Card>
    </Grid>
  ))}
</Grid>
        </Box>
      </Box>
    </Box>
  );
}