import React, { useState } from 'react';
import api from '../../api';
import {
    Container, Typography, TextField, Button, Paper, Box,
    Alert, CircularProgress, Card, CardContent
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import RefundProcessor from './RefundProcessor';

const Refund = () => {
    const [orderId, setOrderId] = useState('');
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchOrder = async () => {
        if (!orderId) return;
        setLoading(true);
        setError(null);
        setSale(null);
        try {
            // Remove 'ORD-' prefix if entered
            const id = orderId.replace('ORD-', '');
            const res = await api.get(`/api/sale/${id}`);
            setSale(res.data);
        } catch (err) {
            setError(err.response?.data?.error || "Order not found or an error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleRefundSuccess = () => {
        setSale(null);
        setOrderId('');
    };

    return (
        <Container maxWidth="md" sx={{ mt: { xs: 3, md: 5 }, mb: 6 }}>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2.5, md: 3 },
                    mb: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(120deg, #ffffff 0%, #f6efe6 100%)'
                }}
            >
                <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                    Process Refund / Return
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Search an order and choose items to return with confidence.
                </Typography>
            </Paper>

            <Paper sx={{ p: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Enter Order ID"
                        placeholder="e.g. ORD-5 or 5"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && fetchOrder()}
                    />
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<SearchIcon />}
                        onClick={fetchOrder}
                        disabled={loading}
                        sx={{ px: 4 }}
                    >
                        Search
                    </Button>
                </Box>
            </Paper>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {sale && (
                <Card elevation={0}>
                    <CardContent sx={{ p: 0 }}>
                        <RefundProcessor
                            sale={sale}
                            onRefundSuccess={handleRefundSuccess}
                        />
                    </CardContent>
                </Card>
            )}
        </Container>
    );
};

export default Refund;
