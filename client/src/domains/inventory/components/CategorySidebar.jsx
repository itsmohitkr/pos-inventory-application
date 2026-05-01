import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Collapse,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  SortByAlpha as SortByAlphaIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

const CategorySidebar = ({
  sortedCategoryTree,
  categoryCounts,
  expandedCategoryIds,
  categoryFilter,
  totalCount,
  uncategorizedCount,
  hasUncategorized,
  categorySortOrder,
  isResizingLeft,
  contextMenu,
  activeCategory,
  addCategoryOpen,
  newCategoryName,
  categoryDialogMode,
  categoryDialogParent,
  onCategorySelect,
  onCategorySortToggle,
  onAddCategoryDialog,
  onCategoryDragOver,
  onCategoryDrop,
  onToggleExpand,
  onOpenCategoryMenu,
  onCloseContextMenu,
  onAddSubcategory,
  onEditCategory,
  onDeleteCategory,
  onCategoryDialogClose,
  onCategoryNameChange,
  onSaveCategory,
  onResizeStart,
  onDoubleClick,
}) => {
  const renderCategoryNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedCategoryIds[node.id];
    const isSelected = categoryFilter === node.path;

    return (
      <Box key={node.id}>
        <ListItemButton
          selected={isSelected}
          onClick={() => onCategorySelect(node.path)}
          onContextMenu={(event) => onOpenCategoryMenu(event, node)}
          onDragOver={onCategoryDragOver}
          onDrop={(event) => onCategoryDrop(event, node.path)}
          sx={{ borderRadius: 1.5, mb: 0.5, pl: 2 + depth * 2 }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            {isSelected ? (
              <FolderOpenIcon fontSize="small" color="primary" />
            ) : (
              <FolderIcon fontSize="small" color="action" />
            )}
          </ListItemIcon>
          <ListItemText primary={node.name} secondary={`${categoryCounts[node.path] || 0} items`} />
          {hasChildren && (
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                onToggleExpand(node.id);
              }}
            >
              {isExpanded ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
            </IconButton>
          )}
        </ListItemButton>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List disablePadding>
              {node.children.map((child) => renderCategoryNode(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <>
      <Paper
        elevation={0}
        onDoubleClick={onDoubleClick}
        sx={{
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            Categories
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              size="small"
              onClick={onCategorySortToggle}
              title={`Sort ${categorySortOrder === 'asc' ? 'A-Z' : 'Z-A'}`}
            >
              <SortByAlphaIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => onAddCategoryDialog(null)} title="Add category">
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Divider sx={{ borderColor: '#e2e8f0' }} />
        <List disablePadding sx={{ overflow: 'auto', flex: 1, px: 1, pt: 1 }}>
          <ListItemButton
            selected={categoryFilter === 'all'}
            onClick={() => onCategorySelect('all')}
            sx={{ borderRadius: 1.5, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {categoryFilter === 'all' ? (
                <FolderOpenIcon fontSize="small" color="primary" />
              ) : (
                <FolderIcon fontSize="small" color="action" />
              )}
            </ListItemIcon>
            <ListItemText primary="All Categories" secondary={`${totalCount} items`} />
          </ListItemButton>
          {hasUncategorized && (
            <ListItemButton
              selected={categoryFilter === 'uncategorized'}
              onClick={() => onCategorySelect('uncategorized')}
              onDragOver={onCategoryDragOver}
              onDrop={(event) => onCategoryDrop(event, 'uncategorized')}
              sx={{ borderRadius: 1.5, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {categoryFilter === 'uncategorized' ? (
                  <FolderOpenIcon fontSize="small" color="primary" />
                ) : (
                  <FolderIcon fontSize="small" color="action" />
                )}
              </ListItemIcon>
              <ListItemText primary="Uncategorized" secondary={`${uncategorizedCount} items`} />
            </ListItemButton>
          )}
          {sortedCategoryTree.map((category) => renderCategoryNode(category))}
        </List>
        <Box
          onMouseDown={(e) => {
            e.preventDefault();
            onResizeStart();
          }}
          sx={{
            display: { xs: 'none', lg: 'flex' },
            position: 'absolute',
            top: 0,
            right: 0,
            width: '8px',
            height: '100%',
            cursor: 'col-resize',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover .handle': {
              bgcolor: 'primary.main',
              width: '4px',
            },
            zIndex: 10,
          }}
        >
          <Box
            className="handle"
            sx={{
              width: '2px',
              height: '60px',
              bgcolor: isResizingLeft ? 'primary.main' : 'divider',
              borderRadius: '4px',
              transition: 'all 0.2s',
              ...(isResizingLeft && { width: '4px' }),
            }}
          />
        </Box>
      </Paper>

      <Menu
        open={Boolean(contextMenu)}
        onClose={onCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
        }
      >
        <MenuItem
          onClick={() => {
            onCloseContextMenu();
            if (activeCategory) onAddSubcategory(activeCategory);
          }}
        >
          Add subcategory
        </MenuItem>
        <MenuItem
          onClick={() => {
            onCloseContextMenu();
            if (activeCategory) onEditCategory(activeCategory);
          }}
        >
          Edit category
        </MenuItem>
        <MenuItem
          onClick={() => {
            onCloseContextMenu();
            if (activeCategory) onDeleteCategory(activeCategory);
          }}
        >
          Delete category
        </MenuItem>
      </Menu>

      <Dialog
        open={addCategoryOpen}
        onClose={onCategoryDialogClose}
        onKeyDown={(event) => {
          if (event.defaultPrevented) return;
          if (event.key !== 'Enter') return;
          if (event.shiftKey) return;
          if (event.target?.tagName === 'TEXTAREA') return;
          event.preventDefault();
          onSaveCategory();
        }}
      >
        <DialogTitle>
          {categoryDialogMode === 'edit' ? 'Edit Category' : 'Add Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category name"
            fullWidth
            value={newCategoryName}
            onChange={(event) => onCategoryNameChange(event.target.value)}
            helperText={
              categoryDialogMode === 'add' && categoryDialogParent
                ? `Parent: ${categoryDialogParent.name}`
                : 'The / character is reserved for nesting'
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCategoryDialogClose}>Cancel</Button>
          <Button variant="contained" onClick={onSaveCategory}>
            {categoryDialogMode === 'edit' ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default React.memo(CategorySidebar);
