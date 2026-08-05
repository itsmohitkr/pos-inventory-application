import React, { useState, useMemo, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import inventoryService from '@/shared/api/inventoryService';
import { getApiErrorMessage } from '@/shared/api/api';
import { getResponseArray } from '@/shared/utils/responseGuards';
import type { CategoryNode } from '@/shared/types/models';

/** Where the category right-click menu is anchored, in viewport pixels. */
export interface CategoryContextMenu {
  mouseX: number;
  mouseY: number;
}

export const useCategoryManagement = (
  categoryFilter: string,
  onCategoryChange: (path: string) => void,
  fetchProducts: () => void,
  fetchSummary: () => void,
  showError: (message: string) => void,
  showConfirm: (message: string, title?: string) => Promise<boolean> | boolean
) => {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [categorySortOrder, setCategorySortOrder] = useState('asc');
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<number, boolean>>({});
  const [contextMenu, setContextMenu] = useState<CategoryContextMenu | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryNode | null>(null);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryDialogMode, setCategoryDialogMode] = useState('add');
  const [categoryDialogParent, setCategoryDialogParent] = useState<CategoryNode | null>(null);
  const [categoryDialogTarget, setCategoryDialogTarget] = useState<CategoryNode | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await inventoryService.fetchCategories();
      setCategories(getResponseArray<CategoryNode>(data));
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'inventory-fetch-categories' } });
      console.error(error);
    }
  }, []);

  const sortedCategoryTree = useMemo(() => {
    const sort = (nodes: CategoryNode[]): CategoryNode[] =>
      [...nodes]
        .sort((a, b) =>
          categorySortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        )
        .map((node) => ({ ...node, children: node.children ? sort(node.children) : [] }));
    return sort(categories);
  }, [categories, categorySortOrder]);

  const handleToggleExpand = useCallback((id: number) => {
    setExpandedCategoryIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const openCategoryMenu = (event: React.MouseEvent, category: CategoryNode) => {
    event.preventDefault();
    setActiveCategory(category);
    setContextMenu({ mouseX: event.clientX - 2, mouseY: event.clientY - 4 });
  };

  const closeCategoryMenu = useCallback(() => setContextMenu(null), []);

  const openAddCategoryDialog = (parent: CategoryNode | null) => {
    setCategoryDialogMode('add');
    setCategoryDialogParent(parent);
    setCategoryDialogTarget(null);
    setNewCategoryName('');
    setAddCategoryOpen(true);
  };

  const openEditCategoryDialog = (category: CategoryNode) => {
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
      Sentry.captureException(error, { tags: { feature: 'inventory-save-category' } });
      showError('Failed to save category: ' + getApiErrorMessage(error));
    }
  };

  const handleCategorySelect = useCallback((path: string) => {
    onCategoryChange(path);
  }, [onCategoryChange]);

  const handleCategorySortToggle = useCallback(() => {
    setCategorySortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const handleDeleteCategory = async (category: CategoryNode | null) => {
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
      Sentry.captureException(error, { tags: { feature: 'inventory-delete-category' } });
      showError('Failed to delete category: ' + getApiErrorMessage(error));
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
