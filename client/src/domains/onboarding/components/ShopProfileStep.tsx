import React from 'react';
import { Stack, TextField, Typography } from '@mui/material';

export default function ShopProfileStep({ fields, onChange }) {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Tell us about your shop. These details will appear on receipts.
      </Typography>
      <TextField
        label="Shop Name"
        value={fields.shopName}
        onChange={onChange('shopName')}
        required
        fullWidth
        autoFocus
      />
      <TextField
        label="Address"
        value={fields.address}
        onChange={onChange('address')}
        fullWidth
        multiline
        rows={2}
      />
      <Stack direction="row" spacing={2}>
        <TextField
          label="Phone"
          value={fields.phone}
          onChange={onChange('phone')}
          fullWidth
        />
        <TextField
          label="Secondary Phone"
          value={fields.phone2}
          onChange={onChange('phone2')}
          fullWidth
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Email"
          value={fields.email}
          onChange={onChange('email')}
          fullWidth
          type="email"
        />
        <TextField
          label="GST Number"
          value={fields.gst}
          onChange={onChange('gst')}
          fullWidth
        />
      </Stack>
    </Stack>
  );
}
