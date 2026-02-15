import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';

const StatCard = ({ title, value, icon, color, isCurrency = false }) => (
    <Card elevation={0} sx={{
        border: '1px solid #e0e0e0',
        borderRadius: 3,
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
        }
    }}>
        <CardContent sx={{ p: '20px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold', letterSpacing: 1.2, display: 'block', mb: 0.5 }}>
                        {title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a1a' }}>
                        {isCurrency ? `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : value}
                    </Typography>
                </Box>
                <Box sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: `${color}15`,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {React.cloneElement(icon, { fontSize: 'medium' })}
                </Box>
            </Box>
        </CardContent>
    </Card>
);

export default StatCard;
