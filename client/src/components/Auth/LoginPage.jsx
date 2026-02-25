import React, { useState } from 'react';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress
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
                cashier: { username: 'cashier', password: 'cashier123' },
                salesman: { username: 'salesman', password: 'salesman123' }
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
                        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                            Bachat Bazaar
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            POS System Login
                        </Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            fullWidth
                            disabled={loading}
                            variant="outlined"
                        />
                        <TextField
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            disabled={loading}
                            variant="outlined"
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={loading || !username || !password}
                            sx={{ py: 1.5, textTransform: 'none', fontSize: '16px' }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Login'}
                        </Button>
                    </Box>

                    <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e0e0e0' }}>
                        <Typography variant="body2" sx={{ mb: 2, textAlign: 'center', color: '#666' }}>
                            Demo Accounts
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleDemoLogin('admin')}
                                disabled={loading}
                            >
                                Admin
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleDemoLogin('cashier')}
                                disabled={loading}
                            >
                                Cashier
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleDemoLogin('salesman')}
                                disabled={loading}
                            >
                                Salesman
                            </Button>
                        </Box>
                        <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#999', textAlign: 'center' }}>
                            Demo: admin123 / cashier123 / salesman123
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default LoginPage;
