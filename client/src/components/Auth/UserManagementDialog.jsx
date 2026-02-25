import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    TextField,
    MenuItem,
    IconButton,
    Dialog as AddUserDialog,
    DialogTitle as AddUserTitle,
    DialogContent as AddUserContent,
    DialogActions as AddUserActions,
    Alert,
    Typography
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    Add as AddIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { InputAdornment } from '@mui/material';
import api from '../../api';
import useCustomDialog from '../../hooks/useCustomDialog';
import CustomDialog from '../common/CustomDialog';

const UserManagementDialog = ({ open, onClose, currentUser }) => {
    const { dialogState, showConfirm, showError, closeDialog } = useCustomDialog();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'cashier'
    });
    const [visiblePasswords, setVisiblePasswords] = useState({});
    const [showNewPassword, setShowNewPassword] = useState(false);

    const togglePasswordVisibility = (userId) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    useEffect(() => {
        if (open) {
            fetchUsers();
        }
    }, [open]);

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/api/auth/users');
            setUsers(response.data);
        } catch (err) {
            setError('Failed to fetch users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        if (!formData.username || !formData.password) {
            setError('Username and password are required');
            return;
        }

        try {
            await api.post('/api/auth/users', {
                username: formData.username,
                password: formData.password,
                role: formData.role
            });
            setShowAddDialog(false);
            setFormData({ username: '', password: '', role: 'cashier' });
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create user');
        }
    };

    const handleUpdateUser = async () => {
        try {
            await api.put(`/api/auth/users/${selectedUser.id}`, {
                role: formData.role,
                status: formData.status
            });
            setShowEditDialog(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update user');
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (currentUser.id === userId) {
            showError('Cannot delete your own account');
            return;
        }

        const confirmed = await showConfirm(`Are you sure you want to delete user "${username}"?`);
        if (confirmed) {
            try {
                await api.delete(`/api/auth/users/${userId}`);
                fetchUsers();
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to delete user');
            }
        }
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setFormData({
            username: user.username,
            role: user.role,
            status: user.status
        });
        setShowEditDialog(true);
    };

    const handleOpenAddDialog = () => {
        setFormData({ username: '', password: '', role: 'cashier' });
        setError('');
        setShowAddDialog(true);
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>User Management</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenAddDialog}
                        >
                            Add User
                        </Button>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell><strong>Username</strong></TableCell>
                                    <TableCell><strong>Password</strong></TableCell>
                                    <TableCell><strong>Role</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    <TableCell align="right"><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                                        <TableCell>{user.username}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                    {visiblePasswords[user.id] ? user.password : '••••••••'}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => togglePasswordVisibility(user.id)}
                                                >
                                                    {visiblePasswords[user.id] ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                backgroundColor: user.role === 'admin' ? '#fce4ec' : user.role === 'salesman' ? '#e3f2fd' : '#f3e5f5',
                                                color: user.role === 'admin' ? '#c2185b' : user.role === 'salesman' ? '#1976d2' : '#7b1fa2',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}>
                                                {user.role}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                backgroundColor: user.status === 'active' ? '#e8f5e9' : '#ffebee',
                                                color: user.status === 'active' ? '#2e7d32' : '#c62828',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}>
                                                {user.status}
                                            </span>
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEditUser(user)}
                                                title="Edit user"
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteUser(user.id, user.username)}
                                                title="Delete user"
                                                disabled={currentUser.id === user.id}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Close</Button>
                </DialogActions>

                {/* Add User Dialog */}
                <AddUserDialog
                    open={showAddDialog}
                    onClose={() => setShowAddDialog(false)}
                    onKeyDown={(event) => {
                        if (event.defaultPrevented) return;
                        if (event.key !== 'Enter') return;
                        if (event.shiftKey) return;
                        if (event.target?.tagName === 'TEXTAREA') return;
                        event.preventDefault();
                        handleAddUser();
                    }}
                >
                    <AddUserTitle>Add New User</AddUserTitle>
                    <AddUserContent sx={{ minWidth: 400 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            <TextField
                                label="Username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Password"
                                type={showNewPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                fullWidth
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                edge="end"
                                            >
                                                {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                select
                                label="Role"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                fullWidth
                            >
                                <MenuItem value="cashier">Cashier</MenuItem>
                                <MenuItem value="salesman">Salesman</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                            </TextField>
                        </Box>
                    </AddUserContent>
                    <AddUserActions>
                        <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
                        <Button onClick={handleAddUser} variant="contained">Add User</Button>
                    </AddUserActions>
                </AddUserDialog>

                {/* Edit User Dialog */}
                <AddUserDialog
                    open={showEditDialog}
                    onClose={() => setShowEditDialog(false)}
                    onKeyDown={(event) => {
                        if (event.defaultPrevented) return;
                        if (event.key !== 'Enter') return;
                        if (event.shiftKey) return;
                        if (event.target?.tagName === 'TEXTAREA') return;
                        event.preventDefault();
                        handleUpdateUser();
                    }}
                >
                    <AddUserTitle>Edit User: {selectedUser?.username}</AddUserTitle>
                    <AddUserContent sx={{ minWidth: 400 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            <TextField
                                label="Username"
                                value={formData.username}
                                disabled
                                fullWidth
                            />
                            <TextField
                                select
                                label="Role"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                fullWidth
                            >
                                <MenuItem value="cashier">Cashier</MenuItem>
                                <MenuItem value="salesman">Salesman</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                            </TextField>
                            <TextField
                                select
                                label="Status"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                fullWidth
                            >
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </TextField>
                        </Box>
                    </AddUserContent>
                    <AddUserActions>
                        <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
                        <Button onClick={handleUpdateUser} variant="contained">Save Changes</Button>
                    </AddUserActions>
                </AddUserDialog>
            </Dialog>
            <CustomDialog {...dialogState} onClose={closeDialog} />
        </>
    );
};

export default UserManagementDialog;
