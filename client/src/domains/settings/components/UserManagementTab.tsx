import React, { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react';
import {
  Box,
  Button,
  Divider,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  InputAdornment,
  CircularProgress,
  Tooltip,
  Stack,
  Collapse,
} from '@mui/material';
import {
  People as PeopleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  LockReset as LockResetIcon,
} from '@mui/icons-material';

import type { User } from '@/shared/api/settingsService';
import settingsService from '@/shared/api/settingsService';
import type { ApiError } from '@/shared/api/api';
import type { AuthUser } from '@/shared/types/auth';
import useCustomDialog from '@/shared/hooks/useCustomDialog';
import CustomDialog from '@/shared/components/CustomDialog';

interface UserFormState {
  username: string;
  password: string;
  role: string;
  status?: string;
}

interface UserManagementTabProps {
  /** The signed-in user; guards against deleting your own account. */
  currentUser?: AuthUser | null;
}

const UserManagementTab: React.FC<UserManagementTabProps> = ({ currentUser }) => {
  const { dialogState, showConfirm, showSuccess, showError, closeDialog } = useCustomDialog();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addWarning, setAddWarning] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormState>({
    username: '',
    password: '',
    role: 'cashier',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<User | null>(null);
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await settingsService.fetchUsers();
      setUsers(data);
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: 'user-management-fetch' } });
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const describeError = (errObj: unknown, fallback: string): string => {
    const err = errObj as ApiError;
    if (err.response?.status === 401 || err.response?.status === 403) {
      return 'Admin session expired. Please verify as admin again.';
    }
    return err.response?.data?.error || fallback;
  };

  const handleAddUser = async () => {
    const trimmedUsername = formData.username.trim();
    if (!trimmedUsername && !formData.password) {
      setAddWarning('Username and password are required');
      return;
    }
    if (!trimmedUsername) {
      setAddWarning('Username is required');
      return;
    }
    if (!formData.password) {
      setAddWarning('Password is required');
      return;
    }

    setAddLoading(true);
    setAddWarning('');
    try {
      await settingsService.createUser({
        username: trimmedUsername,
        password: formData.password,
        role: formData.role,
      });
      setShowAddForm(false);
      setFormData({ username: '', password: '', role: 'cashier' });
      fetchUsers();
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: 'user-management-create' } });
      setAddWarning(describeError(err, 'Failed to create user'));
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      await settingsService.updateUser(selectedUser.id, {
        role: formData.role,
        status: formData.status,
      });
      setShowEditDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: 'user-management-update' } });
      setError(describeError(err, 'Failed to update user'));
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (currentUser?.id === userId) {
      showError('Cannot delete your own account');
      return;
    }

    const confirmed = await showConfirm(`Are you sure you want to delete user "${username}"?`);
    if (confirmed) {
      try {
        await settingsService.deleteUser(userId);
        fetchUsers();
      } catch (err) {
        Sentry.captureException(err, { tags: { feature: 'user-management-delete' } });
        setError(describeError(err, 'Failed to delete user'));
      }
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
      status: user.status,
    });
    setShowEditDialog(true);
  };

  const handleOpenResetPassword = (user: User) => {
    setResetPasswordTarget(user);
    setNewPassword('');
    setConfirmNewPassword('');
    setResetPasswordError('');
    setShowResetPasswordDialog(true);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordTarget) return;
    if (!newPassword || !confirmNewPassword) {
      setResetPasswordError('Both password fields are required');
      return;
    }
    if (newPassword.length < 8) {
      setResetPasswordError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetPasswordError('Passwords do not match');
      return;
    }

    try {
      await settingsService.updateUser(resetPasswordTarget.id, { password: newPassword });
      setShowResetPasswordDialog(false);
      setResetPasswordTarget(null);
      setNewPassword('');
      setConfirmNewPassword('');
      showSuccess('Password reset successfully');
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: 'user-management-reset-password' } });
      setResetPasswordError(describeError(err, 'Failed to reset password'));
    }
  };

  const handleOpenAddForm = () => {
    setFormData({ username: '', password: '', role: 'cashier' });
    setAddWarning('');
    setShowAddForm(true);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
    setAddWarning('');
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          bgcolor: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca',
        };
      case 'salesman':
        return {
          bgcolor: '#eff6ff',
          color: '#1d4ed8',
          border: '1px solid #bfdbfe',
        };
      default:
        return {
          bgcolor: '#f5f3ff',
          color: '#6d28d9',
          border: '1px solid #ddd6fe',
        };
    }
  };

  const getStatusBadgeStyle = (status?: string) => {
    if (status === 'active') {
      return {
        bgcolor: '#f0fdf4',
        color: '#15803d',
        border: '1px solid #bbf7d0',
      };
    }
    return {
      bgcolor: '#fef2f2',
      color: '#b91c1c',
      border: '1px solid #fecaca',
    };
  };

  return (
    <Box data-testid="user-management-tab">
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
        }}
      >
        {/* Header with Title and Add User Action */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 0.75,
                borderRadius: '8px',
                bgcolor: 'rgba(11, 29, 57, 0.08)',
                color: '#0b1d39',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PeopleIcon fontSize="small" />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '1.05rem', lineHeight: 1.2 }}
              >
                User Management
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.78rem' }}>
                Manage staff accounts, assign roles, and control access permissions.
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddForm}
            disabled={showAddForm}
            sx={{
              bgcolor: '#0b1d39',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 700,
              textTransform: 'none',
              px: 2,
              py: 0.75,
              boxShadow: '0 2px 6px rgba(11, 29, 57, 0.15)',
              '&:hover': {
                bgcolor: '#1a365d',
              },
              '&.Mui-disabled': {
                bgcolor: '#e2e8f0',
                color: '#94a3b8',
              },
            }}
          >
            Add User
          </Button>
        </Box>

        <Divider sx={{ my: 2.5, borderColor: '#f1f5f9' }} />

        {/* In-Line Flat Add User Form */}
        <Collapse in={showAddForm} unmountOnExit>
          <Paper
            elevation={0}
            data-testid="add-user-form"
            role="region"
            aria-label="Add New User"
            onKeyDown={(event) => {
              if (event.defaultPrevented) return;
              if (event.key !== 'Enter') return;
              if (event.shiftKey) return;
              if ((event.target as HTMLElement | null)?.tagName === 'TEXTAREA') return;
              event.preventDefault();
              handleAddUser();
            }}
            sx={{
              p: { xs: 2, sm: 2.5 },
              mb: 3,
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              bgcolor: '#f8fafc',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
              }}
            >
              <PersonAddIcon sx={{ color: '#0b1d39', fontSize: 20 }} />
              <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700, color: '#0b1d39' }}>
                Add New User
              </Typography>
            </Box>

            {addWarning && (
              <Alert
                severity="warning"
                onClose={() => setAddWarning('')}
                sx={{ mb: 2, borderRadius: '8px' }}
              >
                {addWarning}
              </Alert>
            )}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                gap: 2,
                alignItems: 'start',
              }}
            >
              <TextField
                id="add-user-username"
                label="Username"
                value={formData.username}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({ ...prev, username: val }));
                  if (addWarning) setAddWarning('');
                }}
                size="small"
                fullWidth
                autoFocus
                placeholder="Enter username"
                inputProps={{ 'data-testid': 'add-user-username' }}
                sx={{ bgcolor: '#ffffff', borderRadius: '6px' }}
              />
              <TextField
                id="add-user-password"
                label="Password"
                type={showNewPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({ ...prev, password: val }));
                  if (addWarning) setAddWarning('');
                }}
                size="small"
                fullWidth
                placeholder="Enter password"
                inputProps={{ 'data-testid': 'add-user-password' }}
                sx={{ bgcolor: '#ffffff', borderRadius: '6px' }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                        size="small"
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? (
                          <VisibilityOffIcon fontSize="small" />
                        ) : (
                          <VisibilityIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                id="add-user-role"
                select
                label="Role"
                value={formData.role}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({ ...prev, role: val }));
                }}
                size="small"
                fullWidth
                sx={{ bgcolor: '#ffffff', borderRadius: '6px' }}
              >
                <MenuItem value="cashier">Cashier</MenuItem>
                <MenuItem value="salesman">Salesman</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2.5 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleCloseAddForm}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  color: '#64748b',
                  borderColor: '#cbd5e1',
                  '&:hover': { bgcolor: '#f1f5f9', borderColor: '#94a3b8' },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleAddUser}
                disabled={addLoading}
                sx={{
                  bgcolor: '#0b1d39',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 3,
                  boxShadow: '0 2px 6px rgba(11, 29, 57, 0.15)',
                  '&:hover': { bgcolor: '#1a365d' },
                }}
              >
                {addLoading ? 'Adding...' : 'Add User'}
              </Button>
            </Box>
          </Paper>
        </Collapse>

        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2.5, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}

        {/* Users Table */}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700, color: '#475467', py: 1.5, fontSize: '0.82rem' }}>
                  Username
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475467', py: 1.5, fontSize: '0.82rem' }}>
                  Role
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475467', py: 1.5, fontSize: '0.82rem' }}>
                  Status
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, color: '#475467', py: 1.5, fontSize: '0.82rem' }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: '#0b1d39', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Loading user accounts...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      No users found. Click &quot;Add User&quot; to create the first account.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const roleStyle = getRoleBadgeStyle(user.role);
                  const statusStyle = getStatusBadgeStyle(user.status);
                  const isCurrent = currentUser?.id === user.id;

                  return (
                    <TableRow
                      key={user.id}
                      sx={{
                        '&:hover': { bgcolor: '#f8fafc' },
                        transition: 'background-color 0.15s ease-in-out',
                      }}
                    >
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: '#0b1d39', fontSize: '0.88rem' }}
                          >
                            {user.username}
                          </Typography>
                          {isCurrent && (
                            <Typography
                              component="span"
                              sx={{
                                fontSize: '0.68rem',
                                bgcolor: '#f1f5f9',
                                color: '#64748b',
                                px: 1,
                                py: 0.2,
                                borderRadius: '4px',
                                fontWeight: 600,
                              }}
                            >
                              You
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-block',
                            px: 1.25,
                            py: 0.4,
                            borderRadius: '16px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            lineHeight: 1,
                            ...roleStyle,
                          }}
                        >
                          {user.role}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-block',
                            px: 1.25,
                            py: 0.4,
                            borderRadius: '16px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            lineHeight: 1,
                            ...statusStyle,
                          }}
                        >
                          {user.status || 'active'}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.5 }}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Edit user">
                            <IconButton
                              size="small"
                              onClick={() => handleEditUser(user)}
                              aria-label="Edit user"
                              sx={{
                                color: '#475467',
                                '&:hover': { bgcolor: '#f1f5f9', color: '#0b1d39' },
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reset password" disableInteractive>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenResetPassword(user)}
                              aria-label="Reset password"
                              sx={{
                                color: '#475467',
                                '&:hover': { bgcolor: '#f1f5f9', color: '#0b1d39' },
                              }}
                            >
                              <LockResetIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title={
                              isCurrent ? 'Cannot delete your own account' : 'Delete user'
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteUser(user.id, user.username)}
                                disabled={isCurrent}
                                aria-label="Delete user"
                                sx={{
                                  color: '#ef4444',
                                  '&:hover': { bgcolor: '#fef2f2', color: '#b91c1c' },
                                  '&.Mui-disabled': { color: '#cbd5e1' },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit User Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px', p: 1 },
        }}
        onKeyDown={(event) => {
          if (event.defaultPrevented) return;
          if (event.key !== 'Enter') return;
          if (event.shiftKey) return;
          if ((event.target as HTMLElement | null)?.tagName === 'TEXTAREA') return;
          event.preventDefault();
          handleUpdateUser();
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#0b1d39', pb: 1 }}>
          Edit User: {selectedUser?.username}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Username"
              value={formData.username}
              disabled
              fullWidth
              size="small"
            />
            <TextField
              select
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              fullWidth
              size="small"
            >
              <MenuItem value="cashier">Cashier</MenuItem>
              <MenuItem value="salesman">Salesman</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
            <TextField
              select
              label="Status"
              value={formData.status || 'active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              fullWidth
              size="small"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setShowEditDialog(false)}
            sx={{ color: '#64748b', fontWeight: 600, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateUser}
            variant="contained"
            sx={{
              bgcolor: '#0b1d39',
              borderRadius: '8px',
              fontWeight: 700,
              textTransform: 'none',
              px: 2.5,
              '&:hover': { bgcolor: '#1a365d' },
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={showResetPasswordDialog}
        onClose={() => setShowResetPasswordDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px', p: 1 },
        }}
        onKeyDown={(event) => {
          if (event.defaultPrevented) return;
          if (event.key !== 'Enter') return;
          if (event.shiftKey) return;
          if ((event.target as HTMLElement | null)?.tagName === 'TEXTAREA') return;
          event.preventDefault();
          handleResetPassword();
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#0b1d39', pb: 1 }}>
          Reset Password: {resetPasswordTarget?.username}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {resetPasswordError && (
              <Alert severity="error" onClose={() => setResetPasswordError('')} sx={{ borderRadius: '8px' }}>
                {resetPasswordError}
              </Alert>
            )}
            <TextField
              label="New Password"
              type={showResetNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              size="small"
              autoFocus
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                      edge="end"
                      size="small"
                    >
                      {showResetNewPassword ? (
                        <VisibilityOffIcon fontSize="small" />
                      ) : (
                        <VisibilityIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Confirm New Password"
              type={showResetConfirmPassword ? 'text' : 'password'}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                      edge="end"
                      size="small"
                    >
                      {showResetConfirmPassword ? (
                        <VisibilityOffIcon fontSize="small" />
                      ) : (
                        <VisibilityIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setShowResetPasswordDialog(false)}
            sx={{ color: '#64748b', fontWeight: 600, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            sx={{
              bgcolor: '#0b1d39',
              borderRadius: '8px',
              fontWeight: 700,
              textTransform: 'none',
              px: 2.5,
              '&:hover': { bgcolor: '#1a365d' },
            }}
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>

      <CustomDialog {...dialogState} onClose={closeDialog} />
    </Box>
  );
};

export default UserManagementTab;
