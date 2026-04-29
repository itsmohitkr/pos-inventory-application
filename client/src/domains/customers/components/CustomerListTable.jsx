import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Paper, Typography, Skeleton, Chip, Box, IconButton, Tooltip,
} from '@mui/material';
import { WhatsApp as WhatsAppIcon, Visibility as PreviewIcon, Edit as EditIcon } from '@mui/icons-material';
import { toPng } from 'html-to-image';
import customerService from '@/shared/api/customerService';
import whatsappService from '@/shared/api/whatsappService';
import CustomerCardPreview from './CustomerCardPreview';
import CustomerCard from './CustomerCard';

const CustomerListTable = ({ 
  customers, total, page, limit, isLoading, onPageChange, onRowClick, onEdit,
  whatsappEnabled, shopName
}) => {
  const [previewCustomer, setPreviewCustomer] = React.useState(null);
  const [sendingCustomer, setSendingCustomer] = React.useState(null);
  const hiddenCardRef = React.useRef(null);

  const handlePreview = (e, customer) => {
    e.stopPropagation();
    setPreviewCustomer(customer);
  };

  const handleSendBarcode = async (e, customer) => {
    e.stopPropagation();
    try {
      // 1. Check if WhatsApp is ready
      const status = await whatsappService.getStatus();
      if (status.status !== 'ready') {
        throw new Error('WhatsApp client is not ready. Please check the settings tab.');
      }
      
      // 2. Set the customer to render in the hidden div
      setSendingCustomer(customer);
      
      // 3. Wait for React to render the hidden div
      setTimeout(async () => {
        try {
          if (!hiddenCardRef.current) throw new Error('Failed to find card element');
          
          // 4. Capture the card as PNG
          const dataUrl = await toPng(hiddenCardRef.current, { cacheBust: true, pixelRatio: 2 });
          
          // 5. Send to backend
          const caption = `Hello ${customer.name || 'Valued Customer'}, here is your digital customer card for ${shopName || 'Bachat Bazar'}. Show this barcode at the counter to easily track your purchases!`;
          await whatsappService.sendCapturedCard({
            phone: customer.phone,
            base64Image: dataUrl,
            caption
          });
          
          alert('Digital Customer Card sent successfully via WhatsApp!');
        } catch (captureErr) {
          console.error(captureErr);
          alert('Failed to capture and send card: ' + captureErr.message);
        } finally {
          setSendingCustomer(null);
        }
      }, 300); // Wait for DOM update
      
    } catch (err) {
      console.error(err);
      alert('Failed to send barcode: ' + (err.response?.data?.error || err.message));
    }
  };

  if (isLoading && customers.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        {[...Array(8)].map((_, i) => <Skeleton key={i} height={52} sx={{ mb: 1 }} />)}
      </Box>
    );
  }

  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Name / Phone</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Barcode</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Purchases</TableCell>
               <TableCell sx={{ fontWeight: 700 }}>Last Visit</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Joined</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
               <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => (
                <TableRow
                  key={c.id}
                  hover
                  onClick={() => onRowClick(c)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{c.name || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">{c.phone}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={c.customerBarcode}
                      size="small"
                      sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700}>
                      {c._count?.sales ?? 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {c.sales?.[0]
                        ? new Date(c.sales[0].createdAt).toLocaleDateString()
                        : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="Edit Details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(c);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {whatsappEnabled && (
                        <>
                          <Tooltip title="Preview Card">
                            <IconButton
                              size="small"
                              onClick={(e) => handlePreview(e, c)}
                              sx={{ color: 'primary.main' }}
                            >
                              <PreviewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Send Barcode via WhatsApp">
                            <IconButton
                              size="small"
                              onClick={(e) => handleSendBarcode(e, c)}
                              sx={{ 
                                color: '#25D366',
                                '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.08)' }
                              }}
                            >
                              <WhatsAppIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CustomerCardPreview 
        open={Boolean(previewCustomer)} 
        onClose={() => setPreviewCustomer(null)} 
        customer={previewCustomer} 
        shopName={shopName} 
      />

      {/* Hidden Card for Image Capture */}
      {sendingCustomer && (
        <Box sx={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <CustomerCard 
            ref={hiddenCardRef} 
            customer={sendingCustomer} 
            shopName={shopName} 
          />
        </Box>
      )}

      <TablePagination
        component="div"
        count={total}
        page={page - 1}
        rowsPerPage={limit}
        rowsPerPageOptions={[limit]}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)}
      />
    </Paper>
  );
};

export default CustomerListTable;
