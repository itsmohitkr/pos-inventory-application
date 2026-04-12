import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Typography, Container, Box, Paper, Stack, Chip } from '@mui/material';
import {
  PointOfSale as PointOfSaleIcon,
  Inventory2 as InventoryIcon,
  Assessment as AssessmentIcon,
  Replay as ReplayIcon,
  LocalOffer as PromoIcon,
} from '@mui/icons-material';

const DashboardCard = ({ to, title, description, icon, tone }) => (
  <Paper
    component={RouterLink}
    to={to}
    elevation={0}
    sx={{
      p: 3,
      textDecoration: 'none',
      color: 'inherit',
      display: 'flex',
      flexDirection: 'column',
      gap: 1.2,
      borderRadius: 2,
      background: 'linear-gradient(135deg, #ffffff 0%, #f9f3ea 100%)',
      transition: 'transform 150ms ease, box-shadow 150ms ease',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0 18px 35px rgba(11, 29, 57, 0.14)',
      },
    }}
  >
    <Box
      sx={{
        width: 52,
        height: 52,
        borderRadius: 2.4,
        display: 'grid',
        placeItems: 'center',
        bgcolor: tone.bg,
        color: tone.color,
      }}
    >
      {icon}
    </Box>
    <Typography variant="h6">{title}</Typography>
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  </Paper>
);

const OverviewPage = ({ shopName, userRole }) => (
  <Container maxWidth="lg" sx={{ mt: { xs: 4, md: 7 }, mb: 8 }}>
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        mb: 4,
        borderRadius: 2,
        background:
          'linear-gradient(135deg, rgba(11, 29, 57, 0.95) 0%, rgba(27, 62, 111, 0.9) 100%)',
        color: '#f8f5f0',
        border: 'none',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        alignItems={{ xs: 'flex-start', md: 'center' }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h3" sx={{ mb: 1.2 }}>
            {shopName} POS Suite
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(248, 245, 240, 0.8)', maxWidth: 520 }}>
            {userRole === 'cashier'
              ? 'Process transactions quickly with our focused checkout interface.'
              : userRole === 'admin'
                ? 'Complete control over inventory, sales, and user management.'
                : 'Comprehensive sales and return management capabilities.'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          {userRole === 'admin' && (
            <>
              <Chip
                label="Inventory & Sales"
                sx={{ bgcolor: 'rgba(242, 181, 68, 0.18)', color: '#f2b544' }}
              />
              <Chip
                label="Full analytics"
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#f8f5f0' }}
              />
            </>
          )}
          {userRole === 'cashier' && (
            <Chip
              label="Fast checkout"
              sx={{ bgcolor: 'rgba(31, 138, 91, 0.2)', color: '#c7f0dc' }}
            />
          )}
          {userRole === 'salesman' && (
            <>
              <Chip
                label="Sales & returns"
                sx={{ bgcolor: 'rgba(31, 138, 91, 0.2)', color: '#c7f0dc' }}
              />
            </>
          )}
        </Stack>
      </Stack>
    </Paper>

    <Box
      sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 3 }}
    >
      <DashboardCard
        to="/pos"
        title="POS Terminal"
        description="Scan, add discounts, and print receipts in seconds."
        icon={<PointOfSaleIcon fontSize="medium" />}
        tone={{ bg: 'rgba(11, 29, 57, 0.12)', color: 'primary.main' }}
      />
      {userRole === 'admin' && (
        <>
          <DashboardCard
            to="/inventory"
            title="Inventory Management"
            description="Control batches, pricing, and expiry in one clean table."
            icon={<InventoryIcon fontSize="medium" />}
            tone={{ bg: 'rgba(242, 181, 68, 0.18)', color: '#b76e00' }}
          />
          <DashboardCard
            to="/reports"
            title="Reports & Analytics"
            description="Track sales performance with rich, digestible analytics."
            icon={<AssessmentIcon fontSize="medium" />}
            tone={{ bg: 'rgba(31, 138, 91, 0.18)', color: '#1f8a5b' }}
          />
          <DashboardCard
            to="/promotions"
            title="Sales & Promotions"
            description="Manage temporary discounts and holiday sale events."
            icon={<PromoIcon fontSize="medium" />}
            tone={{ bg: 'rgba(124, 58, 237, 0.15)', color: '#7c3aed' }}
          />
        </>
      )}
      {(userRole === 'admin' || userRole === 'salesman') && (
        <DashboardCard
          to="/refund"
          title="Returns"
          description="Handle returns confidently with guided workflows."
          icon={<ReplayIcon fontSize="medium" />}
          tone={{ bg: 'rgba(217, 119, 6, 0.18)', color: '#b45309' }}
        />
      )}
      {userRole === 'admin' && (
        <DashboardCard
          to="/dashboard"
          title="Live Analytics"
          description="Deep insights into daily sales, revenue, and trends."
          icon={<AssessmentIcon fontSize="medium" />}
          tone={{ bg: 'rgba(31, 138, 91, 0.18)', color: '#1f8a5b' }}
        />
      )}
    </Box>
  </Container>
);

export default OverviewPage;
