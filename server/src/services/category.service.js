const prisma = require('../config/prisma');

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
    const products = await prisma.product.findMany({
        select: { category: true }
    });

    for (const product of products) {
        if (!product.category) continue;
        const parts = product.category.split('/').map(p => p.trim()).filter(Boolean);
        let parentId = null;
        for (const part of parts) {
            const existing = await prisma.category.findFirst({
                where: { name: part, parentId }
            });
            if (existing) {
                parentId = existing.id;
                continue;
            }
            const created = await prisma.category.create({
                data: { name: part, parentId }
            });
            parentId = created.id;
        }
    }
};

const getCategoryTree = async () => {
    await ensureCategoriesFromProducts();
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

    const productsToUpdate = await prisma.product.findMany({
        where: { category: { startsWith: oldPath } }
    });

    for (const product of productsToUpdate) {
        const nextCategory = product.category.replace(oldPath, newPath);
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
    deleteCategory
};
