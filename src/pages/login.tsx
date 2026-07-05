import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Card, CardContent, Alert } from '@mui/material';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push('/');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: email.split('@')[0] } }
    });
    if (error) setError(error.message);
    else setMessage('Registration successful! You can now log in, or check your email for a verification link.');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card sx={{ p: 2, borderRadius: 6 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Typography 
  variant="h4" 
  gutterBottom 
  sx={{ fontWeight: 'bold', color: 'primary.main' }}
>
  Sign In
</Typography>
            <Typography variant="body2" color="text.secondary">
              Use your credentials for St. Augustine Review Hub
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
          {message && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>{message}</Alert>}

          <form onSubmit={handleSignIn}>
            <TextField fullWidth label="Email address" variant="outlined" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }} />
            <TextField fullWidth label="Password" type="password" variant="outlined" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
              <Button type="submit" variant="contained" size="large" fullWidth sx={{ borderRadius: 6, bgcolor: '#1A73E8' }}>
                Log In
              </Button>
              <Button variant="outlined" size="large" fullWidth onClick={handleSignUp} sx={{ borderRadius: 6 }}>
                Create Account
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}