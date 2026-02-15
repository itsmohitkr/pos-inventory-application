import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    Button,
    ButtonGroup,
    Divider,
    LinearProgress,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip
} from '@mui/material';

const rangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' }
];

const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString();
};

const formatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const movementColor = (type) => {
    switch (type) {
        case 'added':
            return 'success';
        case 'sold':
            return 'error';
        case 'returned':
            return 'info';
        case 'adjustment_in':
            return 'warning';
        case 'adjustment_out':
            return 'warning';
        default:
            return 'default';
    }
};

const movementLabel = (type) => {
    switch (type) {
        case 'added':
            return 'Added';
        case 'sold':
            return 'Sold';
        case 'returned':
            return 'Returned';
        case 'adjustment_in':
            return 'Adjust +';
        case 'adjustment_out':
            return 'Adjust -';
        default:
            return type;
    }
};

const ProductHistoryDialog = ({
    open,
    onClose,
    product,
    history,
    loading,
    range,
    onRangeChange
}) => {
    const totals = history?.totals || {
        added: 0,
        sold: 0,
        returned: 0,
        adjustmentIn: 0,
        adjustmentOut: 0,
        net: 0
    };
    const summaryByDate = history?.summaryByDate || [];
    const movements = history?.movements || [];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{ sx: { minHeight: '75vh' } }}
            onKeyDown={(event) => {
                if (event.defaultPrevented) return;
                if (event.key !== 'Enter') return;
                if (event.shiftKey) return;
                if (event.target?.tagName === 'TEXTAREA') return;
                event.preventDefault();
                onClose();
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box>
                        <Typography variant="h6">Product History</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {product?.name || ''}
                        </Typography>
                    </Box>
                    <ButtonGroup size="small" variant="outlined">
                        {rangeOptions.map((option) => (
                            <Button
                                key={option.value}
                                onClick={() => onRangeChange(option.value)}
                                variant={range === option.value ? 'contained' : 'outlined'}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </ButtonGroup>
                </Box>
            </DialogTitle>
            <DialogContent>
                {loading && <LinearProgress sx={{ mb: 2 }} />}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                    <Chip label={`Added: ${totals.added}`} color="success" variant="outlined" />
                    <Chip label={`Sold: ${totals.sold}`} color="error" variant="outlined" />
                    <Chip label={`Returned: ${totals.returned}`} color="info" variant="outlined" />
                    <Chip label={`Adjust +: ${totals.adjustmentIn}`} color="warning" variant="outlined" />
                    <Chip label={`Adjust -: ${totals.adjustmentOut}`} color="warning" variant="outlined" />
                    <Chip label={`Net: ${totals.net}`} color={totals.net >= 0 ? 'success' : 'error'} variant="filled" />
                </Box>

                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    Daily Summary
                </Typography>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell align="right">Added</TableCell>
                            <TableCell align="right">Sold</TableCell>
                            <TableCell align="right">Returned</TableCell>
                            <TableCell align="right">Adjust +</TableCell>
                            <TableCell align="right">Adjust -</TableCell>
                            <TableCell align="right">Net</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {summaryByDate.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography variant="body2" color="text.secondary">No history for this range</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            summaryByDate.map((row) => (
                                <TableRow key={row.date}>
                                    <TableCell>{formatDate(row.date)}</TableCell>
                                    <TableCell align="right">{row.added}</TableCell>
                                    <TableCell align="right">{row.sold}</TableCell>
                                    <TableCell align="right">{row.returned}</TableCell>
                                    <TableCell align="right">{row.adjustmentIn}</TableCell>
                                    <TableCell align="right">{row.adjustmentOut}</TableCell>
                                    <TableCell align="right">{row.net}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    Movement Details
                </Typography>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Time</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell align="right">Qty</TableCell>
                            <TableCell>Batch</TableCell>
                            <TableCell>Note</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {movements.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography variant="body2" color="text.secondary">No movements found</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            movements.map((movement) => (
                                <TableRow key={movement.id}>
                                    <TableCell>{formatDate(movement.createdAt)}</TableCell>
                                    <TableCell>{formatTime(movement.createdAt)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={movementLabel(movement.type)}
                                            color={movementColor(movement.type)}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell align="right">{movement.quantity}</TableCell>
                                    <TableCell>{movement.batch?.batchCode || 'N/A'}</TableCell>
                                    <TableCell>{movement.note || '—'}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </DialogContent>
        </Dialog>
    );
};

export default ProductHistoryDialog;
