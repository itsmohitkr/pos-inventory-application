import { useState, useMemo, useCallback } from 'react';
import inventoryService from '@/shared/api/inventoryService';
import { getResponseArray } from '@/shared/utils/responseGuards';

export const useCategoryManagement = (categoryFilter, onCategoryChange, fetchProducts, fetchSummary, showError, showConfirm) => {
  const [categories, setCategories] = useState([]);
  const [categorySortOrder, setCategorySortOrder] = useState('asc');
  const [expandedCategoryIds, setExpandedCategoryIds] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryDialogMode, setCategoryDialogMode] = useState('add');
  const [categoryDialogParent, setCategoryDialogParent] = useState(null);
  const [categoryDialogTarget, setCategoryDialogTarget] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await inventoryService.fetchCategories();
      setCategories(getResponseArray(data));
    } catch (error) {
      console.error(error);
    }
  }, []);

  const sortedCategoryTree = useMemo(() => {
    const sort = (nodes) =>
      [...nodes]
        .sort((a, b) =>
          categorySortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        )
        .map((node) => ({ ...node, children: node.children ? sort(node.children) : [] }));
    return sort(categories);
  }, [categories, categorySortOrder]);

  const handleToggleExpand = useCallback((id) => {
    setExpandedCategoryIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const openCategoryMenu = (event, category) => {
    event.preventDefault();
    setActiveCategory(category);
    setContextMenu({ mouseX: event.clientX - 2, mouseY: event.clientY - 4 });
  };

  const closeCategoryMenu = useCallback(() => setContextMenu(null), []);

  const openAddCategoryDialog = (parent) => {
    setCategoryDialogMode('add');
    setCategoryDialogParent(parent);
    setCategoryDialogTarget(null);
    setNewCategoryName('');
    setAddCategoryOpen(true);
  };

  const openEditCategoryDialog = (category) => {
    setCategoryDialogMode('edit');
    setCategoryDialogParent(null);
    setCategoryDialogTarget(category);
    setNewCategoryName(category?.name || '');
    setAddCategoryOpen(true);
  };

  const handleSaveCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (trimmed.includes('/')) {
      showError('Category name cannot include "/"');
      return;
    }
    const isRename = categoryDialogMode === 'edit';
    const oldPath = categoryDialogTarget?.path;
    try {
      if (isRename && categoryDialogTarget) {
        await inventoryService.updateCategory(categoryDialogTarget.id, { name: trimmed });
        if (categoryFilter === oldPath) {
          const parts = oldPath.split('/');
          parts[parts.length - 1] = trimmed;
          onCategoryChange(parts.join('/'));
        }
      } else {
        await inventoryService.createCategory({
          name: trimmed,
          parentId: categoryDialogParent?.id || null,
        });
      }
      setAddCategoryOpen(false);
      setNewCategoryName('');
      fetchCategories();
      if (fetchProducts) fetchProducts();
      if (fetchSummary) fetchSummary();
    } catch (error) {
      showError('Failed to save category: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCategorySelect = useCallback((path) => {
    onCategoryChange(path);
  }, [onCategoryChange]);

  const handleCategorySortToggle = useCallback(() => {
    setCategorySortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const handleDeleteCategory = async (category) => {
    if (!category) return;
    const confirmed = await showConfirm(`Delete category "${category.name}" and all subcategories?`);
    if (!confirmed) return;
    try {
      await inventoryService.deleteCategory(category.id);
      if (categoryFilter === category.path || categoryFilter.startsWith(`${category.path}/`)) {
        onCategoryChange('all');
      }
      fetchCategories();
      if (fetchProducts) fetchProducts();
      if (fetchSummary) fetchSummary();
    } catch (error) {
      showError('Failed to delete category: ' + (error.response?.data?.error || error.message));
    }
  };

  return {
    categories,
    sortedCategoryTree,
    categorySortOrder,
    setCategorySortOrder,
    expandedCategoryIds,
    setExpandedCategoryIds,
    handleToggleExpand,
    contextMenu,
    setContextMenu,
    activeCategory,
    openCategoryMenu,
    closeCategoryMenu,
    addCategoryOpen,
    setAddCategoryOpen,
    newCategoryName,
    setNewCategoryName,
    categoryDialogMode,
    categoryDialogParent,
    openAddCategoryDialog,
    openEditCategoryDialog,
    handleCategorySelect,
    handleCategorySortToggle,
    handleSaveCategory,
    handleDeleteCategory,
    fetchCategories,
  };
};
