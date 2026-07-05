import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Container, Typography, Grid, Card, CardContent, Button, Chip,
  CircularProgress, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Divider, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, InputAdornment, IconButton,
  Tabs, Tab, Paper, Tooltip, Badge
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { useThemeContext } from '@/pages/_app';
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
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CommentIcon from '@mui/icons-material/Comment';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import CampaignIcon from '@mui/icons-material/Campaign';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import EventNoteIcon from '@mui/icons-material/EventNote';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import NotesIcon from '@mui/icons-material/Notes';
import StyleIcon from '@mui/icons-material/Style';

const SUBJECT_LIST = [
  "Finite Mathematics", "Theology", "Effective Komunikasyon",
  "Life and Career Skills", "General Mathematics", "Kasaysayan", "General Science"
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Home() {
  const { user, profile, loading, signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useThemeContext();
  const router = useRouter();

  const [tab, setTab] = useState(0);
  const [materials, setMaterials] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetching, setFetching] = useState(true);

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [planner, setPlanner] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const [openUpload, setOpenUpload] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [openFlashcard, setOpenFlashcard] = useState<string | null>(null);
  const [openAnnouncement, setOpenAnnouncement] = useState(false);

  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [fcFront, setFcFront] = useState('');
  const [fcBack, setFcBack] = useState('');
  const [flipped, setFlipped] = useState<string | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [plannerDay, setPlannerDay] = useState('Monday');
  const [plannerSubject, setPlannerSubject] = useState('');

  const isAdmin = profile?.role === 'admin' || user?.email?.includes('admin') || user?.email?.includes('officer');

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setFetching(true);

    const [{ data: mats }, { data: favs }, { data: note }, { data: coms }, { data: fcs }, { data: plans }, { data: anns }] = await Promise.all([
      supabase.from('materials').select('*').order('created_at', { ascending: false }),
      supabase.from('favorites').select('material_id').eq('user_id', user.id),
      supabase.from('notes').select('*').eq('user_id', user.id).single(),
      supabase.from('comments').select('*').order('created_at', { ascending: true }),
      supabase.from('flashcards').select('*').order('created_at', { ascending: false }),
      supabase.from('study_planner').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(5),
    ]);

    if (mats) setMaterials(mats);
    if (favs) setFavorites(new Set(favs.map((f: any) => f.material_id)));
    if (note) setNotes(note.content || '');
    if (coms) setComments(coms);
    if (fcs) setFlashcards(fcs);
    if (plans) setPlanner(plans);
    if (anns) setAnnouncements(anns);

    setFetching(false);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    else if (user) fetchAll();
  }, [user, loading, router, fetchAll]);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(async () => {
      const { data: existing } = await supabase.from('notes').select('id').eq('user_id', user.id).single();
      if (existing) {
        await supabase.from('notes').update({ content: notes, updated_at: new Date().toISOString() }).eq('id', existing.id);
      } else {
        await supabase.from('notes').insert({ user_id: user.id, content: notes });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [notes, user]);

  const toggleFavorite = async (materialId: string) => {
    const next = new Set(favorites);
    if (next.has(materialId)) {
      next.delete(materialId);
      await supabase.from('favorites').delete().eq('material_id', materialId).eq('user_id', user?.id);
    } else {
      next.add(materialId);
      await supabase.from('favorites').insert({ user_id: user?.id, material_id: materialId });
    }
    setFavorites(next);
  };

  const postComment = async () => {
    if (!openComments || !commentText.trim() || !user) return;
    await supabase.from('comments').insert({
      material_id: openComments,
      user_id: user.id,
      user_email: user.email,
      content: commentText.trim(),
    });
    setCommentText('');
    const { data } = await supabase.from('comments').select('*').order('created_at', { ascending: true });
    if (data) setComments(data);
  };

  const addFlashcard = async () => {
    if (!openFlashcard || !fcFront.trim() || !fcBack.trim()) return;
    await supabase.from('flashcards').insert({
      material_id: openFlashcard,
      front: fcFront.trim(),
      back: fcBack.trim(),
      created_by: user?.email,
    });
    setFcFront(''); setFcBack(''); setOpenFlashcard(null);
    const { data } = await supabase.from('flashcards').select('*').order('created_at', { ascending: false });
    if (data) setFlashcards(data);
  };

  const addPlanner = async () => {
    if (!plannerSubject.trim() || !user) return;
    await supabase.from('study_planner').insert({
      user_id: user.id,
      day: plannerDay,
      subject: plannerSubject.trim(),
    });
    setPlannerSubject('');
    const { data } = await supabase.from('study_planner').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
    if (data) setPlanner(data);
  };

  const togglePlanner = async (id: string, done: boolean) => {
    await supabase.from('study_planner').update({ completed: !done }).eq('id', id);
    const { data } = await supabase.from('study_planner').select('*').eq('user_id', user?.id).order('created_at', { ascending: true });
    if (data) setPlanner(data);
  };

  const deletePlanner = async (id: string) => {
    await supabase.from('study_planner').delete().eq('id', id);
    const { data } = await supabase.from('study_planner').select('*').eq('user_id', user?.id).order('created_at', { ascending: true });
    if (data) setPlanner(data);
  };

  const postAnnouncement = async () => {
    if (!annTitle.trim() || !annContent.trim()) return;
    await supabase.from('announcements').insert({
      title: annTitle.trim(),
      content: annContent.trim(),
      created_by: user?.email,
    });
    setAnnTitle(''); setAnnContent(''); setOpenAnnouncement(false);
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(5);
    if (data) setAnnouncements(data);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !title || !selectedFile) { alert("Fill all fields"); return; }
    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${subject}/${fileName}`;
      const { error: sErr } = await supabase.storage.from('review-materials').upload(filePath, selectedFile);
      if (sErr) throw sErr;
      const { data: { publicUrl } } = supabase.storage.from('review-materials').getPublicUrl(filePath);
      const { error: dErr } = await supabase.from('materials').insert([
        { subject, title, description, download_url: publicUrl, uploaded_by: user?.email }
      ]);
      if (dErr) throw dErr;
      setOpenUpload(false); setSubject(''); setTitle(''); setDescription(''); setSelectedFile(null);
      fetchAll();
    } catch (error: any) { alert(error.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  const handleDeleteMaterial = async (id: string, downloadUrl: string) => {
    if (typeof window !== 'undefined' && !window.confirm("Delete this material?")) return;
    try {
      const url = new URL(downloadUrl);
      const parts = url.pathname.split('/');
      const idx = parts.indexOf('review-materials');
      if (idx !== -1 && parts[idx + 1]) {
        await supabase.storage.from('review-materials').remove([parts.slice(idx + 1).join('/')]);
      }
    } catch (e) { console.error(e); }
    await supabase.from('materials').delete().eq('id', id);
    fetchAll();
  };

  const filteredMaterials = materials.filter((item) => {
    const matchesSubject = selectedSubject ? item.subject === selectedSubject : true;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  const favMaterials = materials.filter((m) => favorites.has(m.id));
  const materialComments = (id: string) => comments.filter((c) => c.material_id === id);
  const materialFlashcards = (id: string) => flashcards.filter((f) => f.material_id === id);

  if (loading || fetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#1A73E8' }} />
      </Box>
    );
  }
  if (!user) return null;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 1.5, position: 'sticky', top: 0, zIndex: 1000 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: '#1A73E8', color: '#fff', p: 1, borderRadius: '8px', display: 'flex' }}>
              <SchoolIcon />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>St. Augustine of Hippo</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>Academic Review Portal</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
              <IconButton onClick={toggleDarkMode} color="inherit">
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            <Box sx={{ alignItems: 'center', gap: 1.5, display: { xs: 'none', md: 'flex' } }}>
              <AccountCircleIcon sx={{ color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1 }}>{user.email}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{isAdmin ? 'Class Officer' : 'Student'}</Typography>
              </Box>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Button variant="outlined" onClick={() => signOut()} sx={{ textTransform: 'none' }}>Sign Out</Button>
          </Box>
        </Box>
      </Box>

      {(announcements.length > 0 || isAdmin) && (
        <Box sx={{ px: { xs: 3, md: 4 }, pt: 3 }}>
          {announcements.map((ann) => (
            <Paper key={ann.id} sx={{ p: 2, mb: 2, bgcolor: 'warning.light', color: 'warning.contrastText', borderRadius: '8px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <CampaignIcon fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{ann.title}</Typography>
              </Box>
              <Typography variant="body2">{ann.content}</Typography>
            </Paper>
          ))}
          {isAdmin && (
            <Button startIcon={<AddIcon />} size="small" onClick={() => setOpenAnnouncement(true)} sx={{ mb: 2, textTransform: 'none' }}>
              Post Announcement
            </Button>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <Box sx={{ width: '280px', borderRight: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', display: { xs: 'none', lg: 'block' }, p: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, px: 2, display: 'block', mb: 1, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Course Directories
          </Typography>
          <List>
            <ListItem disablePadding>
              <ListItemButton selected={selectedSubject === null} onClick={() => setSelectedSubject(null)} sx={{ borderRadius: '8px', mb: 0.5 }}>
                <ListItemIcon><FolderIcon /></ListItemIcon>
                <ListItemText primary="All Subjects Stream" slotProps={{ primary: { sx: { fontSize: '0.9rem', fontWeight: 500 } } }} />
              </ListItemButton>
            </ListItem>
            {SUBJECT_LIST.map((subj) => (
              <ListItem disablePadding key={subj}>
                <ListItemButton selected={selectedSubject === subj} onClick={() => setSelectedSubject(subj)} sx={{ borderRadius: '8px', mb: 0.5 }}>
                  <ListItemIcon><FolderIcon /></ListItemIcon>
                  <ListItemText primary={subj} slotProps={{ primary: { sx: { fontSize: '0.9rem' } } }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Box sx={{ flexGrow: 1, p: { xs: 3, md: 4 } }}>
          <Container maxWidth="xl" disableGutters>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
              <Tab icon={<MenuBookIcon fontSize="small" />} label="Materials" iconPosition="start" />
              <Tab icon={<NotesIcon fontSize="small" />} label="My Notes" iconPosition="start" />
              <Tab icon={<BookmarkIcon fontSize="small" />} label="Favorites" iconPosition="start" />
              <Tab icon={<StyleIcon fontSize="small" />} label="Flashcards" iconPosition="start" />
              <Tab icon={<EventNoteIcon fontSize="small" />} label="Planner" iconPosition="start" />
            </Tabs>

            <TabPanel value={tab} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ minWidth: { xs: '100%', md: '350px' } }}>
                  <TextField
                    fullWidth
                    placeholder="Search files..."
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>
                        ),
                        sx: { borderRadius: '8px' }
                      }
                    }}
                  />
                </Box>
                {isAdmin && (
                  <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={() => setOpenUpload(true)} sx={{ bgcolor: '#1A73E8', textTransform: 'none', boxShadow: 'none' }}>
                    Upload Document
                  </Button>
                )}
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>{selectedSubject || "All Subjects Stream"}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                {filteredMaterials.length} result{filteredMaterials.length !== 1 ? 's' : ''}
              </Typography>

              {filteredMaterials.length === 0 ? (
                <Paper sx={{ p: 8, textAlign: 'center', border: '1px dashed', borderColor: 'divider' }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>No files match criteria</Typography>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {filteredMaterials.map((item) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: 'divider', borderRadius: '8px', boxShadow: 'none' }}>
                        <CardContent sx={{ p: 3, flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Chip label={item.subject} size="small" sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', fontWeight: 600, borderRadius: '4px', fontSize: '0.75rem' }} />
                            <Box>
                              {isAdmin && (
                                <IconButton size="small" color="error" onClick={() => handleDeleteMaterial(item.id, item.download_url)} sx={{ p: 0.5 }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{item.title}</Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{item.description || "No details."}</Typography>
                        </CardContent>
                        <Divider />
                        <Box sx={{ px: 3, py: 2, bgcolor: 'action.hover', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>By: {item.uploaded_by?.split('@')[0]}</Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Comments">
                              <IconButton size="small" onClick={() => setOpenComments(item.id)} sx={{ color: 'text.secondary' }}>
                                <Badge badgeContent={materialComments(item.id).length} color="primary"><CommentIcon fontSize="small" /></Badge>
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={favorites.has(item.id) ? "Unfavorite" : "Favorite"}>
                              <IconButton size="small" onClick={() => toggleFavorite(item.id)} sx={{ color: favorites.has(item.id) ? 'error.main' : 'text.secondary' }}>
                                {favorites.has(item.id) ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            <Button variant="text" component="a" endIcon={<OpenInNewIcon fontSize="small" />} href={item.download_url} target="_blank" rel="noopener noreferrer" sx={{ textTransform: 'none', color: '#1A73E8', fontWeight: 600, p: 0 }}>
                              View
                            </Button>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>

            <TabPanel value={tab} index={1}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>My Notes</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>Auto-saves while you type.</Typography>
              <TextField
                fullWidth
                multiline
                rows={16}
                placeholder="Type your private study notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ bgcolor: 'background.paper' }}
              />
            </TabPanel>

            <TabPanel value={tab} index={2}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>Favorite Reviewers</Typography>
              {favMaterials.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider' }}>
                  <Typography color="text.secondary">No favorites yet. Click the heart icon on any material to save it here.</Typography>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {favMaterials.map((item) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: 'divider', borderRadius: '8px', boxShadow: 'none' }}>
                        <CardContent sx={{ p: 3, flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Chip label={item.subject} size="small" sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', fontWeight: 600, borderRadius: '4px', fontSize: '0.75rem' }} />
                            <IconButton size="small" color="error" onClick={() => toggleFavorite(item.id)}><FavoriteIcon fontSize="small" /></IconButton>
                          </Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{item.title}</Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{item.description || "No details."}</Typography>
                        </CardContent>
                        <Divider />
                        <Box sx={{ px: 3, py: 2, bgcolor: 'action.hover', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>By: {item.uploaded_by?.split('@')[0]}</Typography>
                          <Button variant="text" component="a" endIcon={<OpenInNewIcon fontSize="small" />} href={item.download_url} target="_blank" rel="noopener noreferrer" sx={{ textTransform: 'none', color: '#1A73E8', fontWeight: 600, p: 0 }}>View</Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>

            <TabPanel value={tab} index={3}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>Flashcards</Typography>
              {flashcards.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider' }}>
                  <Typography color="text.secondary">No flashcards yet. Admins can create them from the Materials tab.</Typography>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {flashcards.map((fc) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={fc.id}>
                      <Card onClick={() => setFlipped(flipped === fc.id ? null : fc.id)} sx={{ cursor: 'pointer', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid', borderColor: 'divider', borderRadius: '8px', boxShadow: 'none', bgcolor: flipped === fc.id ? 'success.light' : 'background.paper' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {flipped === fc.id ? fc.back : fc.front}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 2, display: 'block' }}>
                            {flipped === fc.id ? 'Click to flip back' : 'Click to reveal answer'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>

            <TabPanel value={tab} index={4}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>Study Planner</Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap'
