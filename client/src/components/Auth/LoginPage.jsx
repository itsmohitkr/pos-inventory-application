import React, { useState } from 'react';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Stack,
    Divider
} from '@mui/material';
import { Store as StoreIcon } from '@mui/icons-material';
import api from '../../api';

const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/api/auth/login', {
                username,
                password
            });

            onLogin(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async (role) => {
        setError('');
        setLoading(true);

        try {
            const demoAccounts = {
                admin: { username: 'admin', password: 'admin123' },
                cashier: { username: 'niranjan', password: '2025' },
                salesman: { username: 'sumant', password: '2025' }
            };

            const account = demoAccounts[role];
            const response = await api.post('/api/auth/login', account);
            onLogin(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <StoreIcon sx={{ fontSize: 48, color: '#1f8a5b', mb: 2 }} />
                        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            Bachat Bazaar
                            <Box sx={{ width: 10, height: 10, bgcolor: '#4caf50', borderRadius: '50%' }} />
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            POS System Login
                        </Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Stack spacing={2} sx={{ mb: 4 }}>
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            onClick={() => handleDemoLogin('salesman')}
                            disabled={loading}
                            sx={{
                                py: 2,
                                bgcolor: '#1976d2',
                                '&:hover': { bgcolor: '#1565c0' },
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                textTransform: 'none',
                                borderRadius: 2
                            }}
                        >
                            Login as Salesman
                        </Button>
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            onClick={() => handleDemoLogin('cashier')}
                            disabled={loading}
                            sx={{
                                py: 2,
                                bgcolor: '#7b1fa2',
                                '&:hover': { bgcolor: '#6a1b9a' },
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                textTransform: 'none',
                                borderRadius: 2
                            }}
                        >
                            Login as Cashier
                        </Button>
                    </Stack>

                    <Divider sx={{ mb: 3 }}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                            OR LOG IN AS ADMIN
                        </Typography>
                    </Divider>

                    <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Admin Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            fullWidth
                            disabled={loading}
                        />
                        <TextField
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            disabled={loading}
                        />
                        <Button
                            type="submit"
                            variant="outlined"
                            fullWidth
                            disabled={loading || !username || !password}
                            sx={{ py: 1.5, fontWeight: 600, textTransform: 'none' }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Login as Admin'}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default LoginPage;
