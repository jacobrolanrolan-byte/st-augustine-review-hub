import React, { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Grid, Card, CardContent, Button, Chip,
  CircularProgress, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Divider, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, InputAdornment, IconButton
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import SchoolIcon from '@mui/icons-material/School';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FolderIcon from '@mui/icons-material/Folder';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';

const SUBJECT_LIST = [
  "Finite Mathematics",
  "Theology",
  "Effective Komunikasyon",
  "Life and Career Skills",
  "General Mathematics",
  "Kasaysayan",
  "General Science"
];

export default function Home() {
  const { user, profile, loading, signOut } = useAuth();
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
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('Fetch error:', error);
    if (data) setMaterials(data);
    setFetching(false);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchMaterials();
    }
  }, [user, loading, router]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !title || !selectedFile) {
      alert("Please fill in all fields and select a file to upload.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${subject}/${fileName}`;

      const { error: storageError } = await supabase.storage
        .from('review-materials')
        .upload(filePath, selectedFile);

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage
        .from('review-materials')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('materials').insert([
        {
          subject,
          title,
          description,
          download_url: publicUrl,
          uploaded_by: user?.email
        }
      ]);

      if (dbError) throw dbError;

      setOpenAdminModal(false);
      setSubject('');
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      fetchMaterials();
    } catch (error: any) {
      alert(error.message || "An error occurred during publication.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (id: string, downloadUrl: string) => {
    if (typeof window !== 'undefined' && !window.confirm("Are you sure you want to permanently remove this study material?")) {
      return;
    }

    try {
      // Robust path extraction from public URL
      try {
        const url = new URL(downloadUrl);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.indexOf('review-materials');
        if (bucketIndex !== -1 && pathParts[bucketIndex + 1]) {
          const filePath = pathParts.slice(bucketIndex + 1).join('/');
          await supabase.storage.from('review-materials').remove([filePath]);
        }
      } catch (urlErr) {
        console.error('URL parse error:', urlErr);
      }

      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;

      fetchMaterials();
    } catch (error: any) {
      alert(error.message || "Failed to remove item.");
    }
  };

  if (loading || fetching) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ bgcolor: '#F8F9FA' }}>
        <CircularProgress sx={{ color: '#1A73E8' }} />
      </Box>
    );
  }

  if (!user) return null;

  const isAdmin = profile?.role === 'admin' || user.email?.includes('admin') || user.email?.includes('officer');

  const filteredMaterials = materials.filter((item) => {
    const matchesSubject = selectedSubject ? item.subject === selectedSubject : true;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  return (
    <Box sx={{ bgcolor: '#F8F9FA', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <Box sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E0E0E0', px: 3, py: 1.5, position: 'sticky', top: 0, zIndex: 1000 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ bgcolor: '#1A73E8', color: '#FFFFFF', p: 1, borderRadius: '8px', display: 'flex' }}>
              <SchoolIcon />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>St. Augustine of Hippo</Typography>
              <Typography variant="body2" sx={{ color: '#5F6368', fontSize: '0.8rem' }}>Academic Review Portal</Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={3}>
            <Box display="flex" alignItems="center" gap={1.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
              <AccountCircleIcon sx={{ color: '#5F6368' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1 }}>{user.email}</Typography>
                <Typography variant="caption" sx={{ color: '#70757A' }}>{isAdmin ? 'Class Officer' : 'Student'}</Typography>
              </Box>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Button
              variant="outlined"
              onClick={() => signOut()}
              sx={{ textTransform: 'none', borderColor: '#DADCE0', color: '#3C4043' }}
            >
              Sign Out
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Sidebar */}
        <Box sx={{ width: '280px', borderRight: '1px solid #E0E0E0', bgcolor: '#FFFFFF', display: { xs: 'none', lg: 'block' }, p: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: '#70757A', fontWeight: 600, px: 2, display: 'block', mb: 1,
              letterSpacing: '0.8px', textTransform: 'uppercase'
            }}
          >
            Course Directories
          </Typography>
          <List>
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedSubject === null}
                onClick={() => setSelectedSubject(null)}
                sx={{ borderRadius: '8px', mb: 0.5 }}
              >
                <ListItemIcon><FolderIcon /></ListItemIcon>
                <ListItemText primary="All Subjects Stream" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
            {SUBJECT_LIST.map((subj) => (
              <ListItem disablePadding key={subj}>
                <ListItemButton
                  selected={selectedSubject === subj}
                  onClick={() => setSelectedSubject(subj)}
                  sx={{ borderRadius: '8px', mb: 0.5 }}
                >
                  <ListItemIcon><FolderIcon /></ListItemIcon>
                  <ListItemText primary={subj} primaryTypographyProps={{ fontSize: '0.9rem' }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, p: { xs: 3, md: 4 } }}>
          <Container maxWidth="xl" disableGutters>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
              <Box sx={{ minWidth: { xs: '100%', md: '350px' } }}>
                <TextField
                  fullWidth
                  placeholder="Search files inside this workspace..."
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#5F6368' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '8px', bgcolor: '#FFFFFF' }
                  }}
                />
              </Box>

              {isAdmin && (
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => setOpenAdminModal(true)}
                  sx={{
                    bgcolor: '#1A73E8', boxShadow: 'none', textTransform: 'none',
                    '&:hover': { bgcolor: '#1557B0', boxShadow: 'none' }
                  }}
                >
                  Upload File Document
                </Button>
              )}
            </Box>

            <Box mb={3}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {selectedSubject || "All Subjects Stream"}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5F6368' }}>
                Filtered search tracking returned {filteredMaterials.length} result modules.
              </Typography>
            </Box>

            {filteredMaterials.length === 0 ? (
              <Box sx={{ p: 8, border: '1px dashed #DADCE0', borderRadius: '8px', textAlign: 'center', bgcolor: '#FFFFFF' }}>
                <Typography variant="body1" sx={{ color: '#5F6368', fontWeight: 500 }}>No files match criteria</Typography>
                <Typography variant="body2" sx={{ color: '#70757A' }}>
                  Try typing an alternate search parameter title sequence or tracking key phrase signature.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {filteredMaterials.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Card sx={{
                      height: '100%', display: 'flex', flexDirection: 'column',
                      bgcolor: '#FFFFFF', border: '1px solid #E0E0E0', borderRadius: '8px',
                      boxShadow: 'none', position: 'relative'
                    }}>
                      <CardContent sx={{ p: 3, flexGrow: 1 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Chip
                            label={item.subject}
                            size="small"
                            sx={{
                              bgcolor: '#E8F0FE', color: '#1A73E8', fontWeight: 600,
                              borderRadius: '4px', fontSize: '0.75rem'
                            }}
                          />
                          {isAdmin && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteMaterial(item.id, item.download_url)}
                              sx={{ p: 0.5 }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{item.title}</Typography>
                        <Typography variant="body2" sx={{ color: '#5F6368', fontSize: '0.85rem' }}>
                          {item.description || "No supplemental details populated."}
                        </Typography>
                      </CardContent>
                      <Divider />
                      <Box sx={{
                        px: 3, py: 2, bgcolor: '#F8F9FA',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <Typography variant="caption" sx={{ color: '#70757A' }}>
                          By: {item.uploaded_by?.split('@')[0]}
                        </Typography>
                        <Button
                          variant="text"
                          component="a"
                          endIcon={<OpenInNewIcon fontSize="small" />}
                          href={item.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ textTransform: 'none', color: '#1A73E8', fontWeight: 600, p: 0 }}
                        >
                          View
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Container>
        </Box>
      </Box>

      {/* Upload Dialog */}
      <Dialog open={openAdminModal} onClose={() => setOpenAdminModal(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>Upload Class Document</DialogTitle>
        <form onSubmit={handleUploadSubmit}>
          <DialogContent dividers sx={{ py: 3 }}>
            <FormControl fullWidth margin="dense" required>
              <InputLabel>Subject Category</InputLabel>
              <Select value={subject} onChange={(e) => setSubject(e.target.value)} label="Subject Category">
                {SUBJECT_LIST.map((subj) => <MenuItem key={subj} value={subj}>{subj}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Document Name / Title"
              variant="outlined"
              margin="dense"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mt: 2.5 }}
            />
            <TextField
              fullWidth
              label="Description Notes"
              variant="outlined"
              margin="dense"
              multiline
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mt: 2.5 }}
            />

            <Box sx={{
              mt: 3, p: 3, border: '2px dashed #DADCE0',
              borderRadius: '4px', bgcolor: '#F8F9FA', textAlign: 'center'
            }}>
              <Button variant="outlined" component="label" startIcon={<AttachFileIcon />} sx={{ textTransform: 'none' }}>
                Select PDF / Document
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </Button>
              <Typography
                variant="body2"
                sx={{
                  mt: 1.5,
                  color: selectedFile ? '#386A20' : '#70757A',
                  fontWeight: selectedFile ? 600 : 400
                }}
              >
                {selectedFile ? `Target selected: ${selectedFile.name}` : "No local asset package attached yet"}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenAdminModal(false)} disabled={uploading}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={uploading}
              sx={{ bgcolor: '#1A73E8', textTransform: 'none', boxShadow: 'none' }}
            >
              {uploading ? "Uploading Binary..." : "Publish to Hub"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}