const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  'Staples', 'Dairy', 'Snacks', 'Biscuits', 'Beverages', 'Juices', 
  'Water', 'Personal Care', 'Household', 'Chocolates', 'Baby Care', 
  'Chips', 'Oil', 'Spices'
];

const brands = [
  'Tata', 'Amul', 'Britannia', 'Nestle', 'Dabur', 'Haldiram', 'ITC', 
  'Godrej', 'Patanjali', 'Parle', 'Aashirvaad', 'Hindustan Unilever'
];

const productNames = {
  'Staples': ['Rice', 'Sugar', 'Atta', 'Dal', 'Poha', 'Salt'],
  'Dairy': ['Milk', 'Butter', 'Cheese', 'Ghee', 'Paneer'],
  'Snacks': ['Maggi', 'Bhujia', 'Namkeen', 'Pasta'],
  'Beverages': ['Tea', 'Coffee', 'Bournvita', 'Coke', 'Pepsi'],
  'Personal Care': ['Soap', 'Shampoo', 'Toothpaste', 'Face Wash'],
  'Household': ['Detergent', 'Dishwash', 'Floor Cleaner', 'Lizol'],
};

async function seed() {
  console.log('🚀 Starting Historical Data Seed...');

  // 1. Create Products & Batches
  console.log('📦 Creating Products & Batches...');
  const products = [];
  for (let i = 0; i < 150; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const type = (productNames[category] || ['Item'])[Math.floor(Math.random() * (productNames[category]?.length || 1))];
    const name = `${brand} ${type} ${Math.floor(Math.random() * 500) + 50}g`;
    
    const p = await prisma.product.create({
      data: {
        name,
        barcode: `890${Math.floor(Math.random() * 1000000000)}`,
        category,
        lowStockThreshold: 10,
        lowStockWarningEnabled: true,
      }
    });

    // Create a batch for each product
    const isLowStock = Math.random() < 0.15; // 15% chance of low stock
    const isExpiring = Math.random() < 0.15; // 15% chance of expiring soon/expired
    
    let quantity = Math.floor(Math.random() * 100) + 20;
    if (isLowStock) quantity = Math.floor(Math.random() * 8) + 1;

    let expiryDate = null;
    if (isExpiring) {
      const days = Math.floor(Math.random() * 120) - 60; // -60 to +60 days
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
    }

    const mrp = Math.floor(Math.random() * 500) + 20;
    const cp = mrp * 0.7;
    const sp = mrp * 0.9;

    const batch = await prisma.batch.create({
      data: {
        productId: p.id,
        batchCode: `BN-${Math.floor(Math.random() * 9000) + 1000}`,
        quantity,
        mrp,
        costPrice: cp,
        sellingPrice: sp,
        expiryDate,
      }
    });
    products.push({ id: p.id, batchId: batch.id, cp, sp, mrp });
  }

  // 2. Create Sales for the last 180 days
  console.log('💰 Generating Sales History (180 days)...');
  for (let d = 0; d < 180; d++) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    
    // 5 to 15 sales per day
    const salesCount = Math.floor(Math.random() * 10) + 5;
    for (let s = 0; s < salesCount; s++) {
      // Each sale has 1-4 items
      const itemCount = Math.floor(Math.random() * 4) + 1;
      const saleItems = [];
      let totalAmount = 0;

      for (let i = 0; i < itemCount; i++) {
        const p = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        saleItems.push({
          batchId: p.batchId,
          quantity: qty,
          sellingPrice: p.sp,
          costPrice: p.cp,
          mrp: p.mrp
        });
        totalAmount += p.sp * qty;
      }

      await prisma.sale.create({
        data: {
          totalAmount,
          paymentMethod: ['Cash', 'UPI', 'Card'][Math.floor(Math.random() * 3)],
          createdAt: date,
          items: {
            create: saleItems
          }
        }
      });
    }

    // 3. Loose Sales
    if (Math.random() < 0.3) {
      const looseCount = Math.floor(Math.random() * 3) + 1;
      for (let l = 0; l < looseCount; l++) {
        await prisma.looseSale.create({
          data: {
            itemName: ['Plastic Bag', 'Open Container', 'Service Fee'][Math.floor(Math.random() * 3)],
            price: Math.floor(Math.random() * 50) + 5,
            createdAt: date
          }
        });
      }
    }

    // 4. Expenses (Weekly/Monthly)
    if (d % 30 === 0) { // Monthly Rent & Electricity
      await prisma.expense.create({
        data: {
          amount: 15000,
          category: 'Rent',
          description: 'Monthly Shop Rent',
          date: date,
          paymentMethod: 'Cash'
        }
      });
      await prisma.expense.create({
        data: {
          amount: Math.floor(Math.random() * 2000) + 1500,
          category: 'Electricity',
          description: 'Electricity Bill',
          date: date,
          paymentMethod: 'UPI'
        }
      });
    }

    if (d % 7 === 0) { // Weekly Maintenance
       await prisma.expense.create({
        data: {
          amount: Math.floor(Math.random() * 500) + 200,
          category: 'Maintenance',
          description: 'Weekly cleaning and repairs',
          date: date,
          paymentMethod: 'Cash'
        }
      });
    }

    // 5. Purchases (Inventory Investment)
    if (d % 15 === 0) {
      const purchaseAmount = Math.floor(Math.random() * 20000) + 5000;
      await prisma.purchase.create({
        data: {
          vendor: ['Local Distributor', 'Main Wholesaler', 'Direct Brand'][Math.floor(Math.random() * 3)],
          totalAmount: purchaseAmount,
          date: date,
          paymentMethod: 'UPI'
        }
      });
    }
  }

  console.log('✅ Historical Data Seeded Successfully!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
