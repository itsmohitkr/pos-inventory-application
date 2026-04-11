const prisma = require('../../config/prisma');

const buildPathMap = (categories) => {
    const byId = new Map();
    categories.forEach((category) => byId.set(category.id, category));

    const cache = new Map();
    const buildPath = (id) => {
        if (cache.has(id)) return cache.get(id);
        const category = byId.get(id);
        if (!category) return '';
        const parentPath = category.parentId ? buildPath(category.parentId) : '';
        const path = parentPath ? `${parentPath}/${category.name}` : category.name;
        cache.set(id, path);
        return path;
    };

    categories.forEach((category) => buildPath(category.id));
    return cache;
};

const buildTree = (categories, pathMap) => {
    const nodes = new Map();
    categories.forEach((category) => {
        nodes.set(category.id, {
            id: category.id,
            name: category.name,
            parentId: category.parentId,
            path: pathMap.get(category.id) || category.name,
            children: []
        });
    });

    const roots = [];
    nodes.forEach((node) => {
        if (node.parentId && nodes.has(node.parentId)) {
            nodes.get(node.parentId).children.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
};

const ensureCategoriesFromProducts = async () => {
    // 1. Get distinct category strings from products (fast with index)
    const products = await prisma.product.findMany({
        where: { category: { not: null, not: "" } },
        distinct: ['category'],
        select: { category: true }
    });

    if (products.length === 0) return;

    // 2. Fetch all existing categories once to build a path map
    const existingCategories = await prisma.category.findMany();
    const byId = new Map();
    existingCategories.forEach(c => byId.set(c.id, c));

    // Helper to get full path for a category ID
    const getPath = (catId, cache = new Map()) => {
        if (!catId) return "";
        if (cache.has(catId)) return cache.get(catId);
        const cat = byId.get(catId);
        if (!cat) return "";
        const parentPath = getPath(cat.parentId, cache);
        const fullPath = parentPath ? `${parentPath}/${cat.name}` : cat.name;
        cache.set(catId, fullPath);
        return fullPath;
    };

    const pathCache = new Map();
    const existingPaths = new Map(); // path -> id
    existingCategories.forEach(c => {
        const p = getPath(c.id, pathCache);
        existingPaths.set(p, c.id);
    });

    // 3. Process each distinct category string from products
    for (const product of products) {
        const fullCategoryString = product.category;
        if (existingPaths.has(fullCategoryString)) continue;

        // Missing path, create it segment by segment
        const parts = fullCategoryString.split('/').map(p => p.trim()).filter(Boolean);
        let currentPath = "";
        let parentId = null;

        for (const part of parts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            if (existingPaths.has(currentPath)) {
                parentId = existingPaths.get(currentPath);
            } else {
                // Create missing segment
                const created = await prisma.category.create({
                    data: { name: part, parentId }
                });
                parentId = created.id;
                existingPaths.set(currentPath, parentId);
                // Also add to byId for getPath consistency if needed (though existingPaths is enough for this loop)
                byId.set(parentId, { id: parentId, name: part, parentId: created.parentId });
            }
        }
    }
};

const getCategoryTree = async () => {
    // Synchronous sync removed to make sidebar instant
    const categories = await prisma.category.findMany();
    const pathMap = buildPathMap(categories);
    return buildTree(categories, pathMap);
};

const createCategory = async ({ name, parentId }) => {
    const trimmedName = name?.trim();
    if (!trimmedName || trimmedName.includes('/')) {
        throw new Error('Invalid category name');
    }
    const exists = await prisma.category.findFirst({
        where: { name: trimmedName, parentId: parentId || null }
    });
    if (exists) {
        return exists;
    }
    return prisma.category.create({
        data: { name: trimmedName, parentId: parentId || null }
    });
};

const updateCategory = async (id, { name }) => {
    const trimmedName = name?.trim();
    if (!trimmedName || trimmedName.includes('/')) {
        throw new Error('Invalid category name');
    }
    const categories = await prisma.category.findMany();
    const pathMap = buildPathMap(categories);
    const oldPath = pathMap.get(Number(id));
    if (!oldPath) {
        throw new Error('Category not found');
    }

    const updated = await prisma.category.update({
        where: { id: Number(id) },
        data: { name: trimmedName }
    });

    const oldParts = oldPath.split('/');
    oldParts[oldParts.length - 1] = trimmedName;
    const newPath = oldParts.join('/');

    // Find products linked to this category or its subcategories
    const productsToUpdate = await prisma.product.findMany({
        where: {
            OR: [
                { category: oldPath },
                { category: { startsWith: `${oldPath}/` } }
            ]
        }
    });

    for (const product of productsToUpdate) {
        let nextCategory;
        // Case-insensitive check for exact match or path prefix
        if (product.category.toLowerCase() === oldPath.toLowerCase()) {
            nextCategory = newPath;
        } else if (product.category.toLowerCase().startsWith(oldPath.toLowerCase() + '/')) {
            nextCategory = newPath + product.category.slice(oldPath.length);
        } else {
            // Should not happen with current where clause, but safe fallback
            continue;
        }

        await prisma.product.update({
            where: { id: product.id },
            data: { category: nextCategory }
        });
    }

    return updated;
};

const deleteCategory = async (id) => {
    const categories = await prisma.category.findMany();
    const pathMap = buildPathMap(categories);
    const targetPath = pathMap.get(Number(id));
    if (!targetPath) {
        throw new Error('Category not found');
    }

    const idsToDelete = categories
        .filter((category) => {
            const path = pathMap.get(category.id) || '';
            return path === targetPath || path.startsWith(`${targetPath}/`);
        })
        .map((category) => category.id);

    await prisma.$transaction([
        prisma.product.updateMany({
            where: { category: { startsWith: targetPath } },
            data: { category: null }
        }),
        prisma.category.deleteMany({
            where: { id: { in: idsToDelete } }
        })
    ]);
};

module.exports = {
    getCategoryTree,
    createCategory,
    updateCategory,
    deleteCategory,
    ensureCategoriesFromProducts
};
