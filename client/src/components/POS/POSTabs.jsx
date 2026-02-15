import React from 'react';
import { Tabs, Tab, IconButton, Box } from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';

// Generate distinct colors for each tab
const getTabColor = (index) => {
    const colors = [
        { bg: '#e3f2fd', border: '#1976d2', text: '#0d47a1' },     // Blue
        { bg: '#f3e5f5', border: '#9c27b0', text: '#6a1b9a' },     // Purple
        { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' },     // Green
        { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },     // Orange
        { bg: '#fce4ec', border: '#e91e63', text: '#c2185b' },     // Pink
        { bg: '#e0f2f1', border: '#009688', text: '#00695c' },     // Teal
        { bg: '#fff9c4', border: '#fbc02d', text: '#f57f17' },     // Yellow
        { bg: '#ede7f6', border: '#673ab7', text: '#4527a0' },     // Deep Purple
        { bg: '#e1f5fe', border: '#03a9f4', text: '#01579b' },     // Light Blue
        { bg: '#f1f8e9', border: '#8bc34a', text: '#558b2f' }      // Light Green
    ];
    return colors[index % colors.length];
};

const POSTabs = ({ tabs, activeTabId, onTabChange, onTabClose, onAddTab }) => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
                value={activeTabId}
                onChange={(e, newVal) => onTabChange(newVal)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ flexGrow: 1 }}
            >
                {tabs.map((tab, index) => {
                    const tabColor = getTabColor(index);
                    const isActive = activeTabId === tab.id;
                    return (
                        <Tab
                            key={tab.id}
                            value={tab.id}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <span>{tab.name}</span>
                                    {tabs.length > 1 && (
                                        <IconButton
                                            size="small"
                                            component="span"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTabClose(tab.id);
                                            }}
                                            sx={{
                                                p: 0.2,
                                                ml: 0.5,
                                                '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' }
                                            }}
                                        >
                                            <CloseIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                                        </IconButton>
                                    )}
                                </Box>
                            }
                            sx={{
                                bgcolor: isActive ? tabColor.bg : 'transparent',
                                borderTop: isActive ? `3px solid ${tabColor.border}` : '3px solid transparent',
                                color: isActive ? tabColor.text : 'text.secondary',
                                fontWeight: isActive ? 600 : 400,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    bgcolor: tabColor.bg,
                                    opacity: 0.8
                                },
                                '&.Mui-selected': {
                                    color: tabColor.text
                                }
                            }}
                        />
                    );
                })}
            </Tabs>
            <IconButton onClick={onAddTab} sx={{ ml: 1, mr: 1 }} color="primary">
                <AddIcon />
            </IconButton>
        </Box>
    );
};

export default POSTabs;
