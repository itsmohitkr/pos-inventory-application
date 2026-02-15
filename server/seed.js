const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const baseProducts = [
    // Staples & Spices
    { name: "Aashirvaad Shudh Chakki Atta 10kg", barcode: "8901725181222", category: "Staples", mrp: 440, sp: 410, cp: 380 },
    { name: "Aashirvaad Shudh Chakki Atta 5kg", barcode: "8901725181223", category: "Staples", mrp: 220, sp: 205, cp: 190 },
    { name: "Tata Salt 1kg", barcode: "8904043901010", category: "Staples", mrp: 28, sp: 25, cp: 20 },
    { name: "Tata Sampann Tur Dal 1kg", barcode: "8904043925443", category: "Staples", mrp: 160, sp: 145, cp: 130 },
    { name: "Fortune Refined Soyabean Oil 1L", barcode: "8906007280041", category: "Oil", mrp: 155, sp: 140, cp: 125 },
    { name: "Dhara Mustard Oil 1L", barcode: "8906007280111", category: "Oil", mrp: 170, sp: 160, cp: 145 },
    { name: "India Gate Basmati Rice (Classic) 1kg", barcode: "8901535100021", category: "Staples", mrp: 220, sp: 190, cp: 170 },
    { name: "Daawat Rozana Gold Basmati Rice 5kg", barcode: "8901535100055", category: "Staples", mrp: 450, sp: 400, cp: 360 },
    { name: "Madhur Sugar 1kg", barcode: "8906020610013", category: "Staples", mrp: 60, sp: 55, cp: 48 },
    { name: "MDH Haldi Powder 100g", barcode: "8902167000012", category: "Spices", mrp: 35, sp: 32, cp: 28 },
    { name: "MDH Deggi Mirch 100g", barcode: "8902167000029", category: "Spices", mrp: 95, sp: 88, cp: 75 },
    { name: "Everest Chicken Masala 100g", barcode: "8901786081005", category: "Spices", mrp: 82, sp: 75, cp: 65 },
    { name: "Tata Sampann Chana Dal 500g", barcode: "8904043925467", category: "Staples", mrp: 65, sp: 60, cp: 52 },

    // Dairy
    { name: "Amul Taaza Milk 1L", barcode: "8901262010019", category: "Dairy", mrp: 72, sp: 72, cp: 68 },
    { name: "Amul Butter 100g", barcode: "8901262010026", category: "Dairy", mrp: 56, sp: 54, cp: 48 },
    { name: "Amul Butter 500g", barcode: "8901262010033", category: "Dairy", mrp: 275, sp: 265, cp: 240 },
    { name: "Amul Cheese Slices 200g", barcode: "8901262010040", category: "Dairy", mrp: 140, sp: 130, cp: 115 },
    { name: "Mother Dairy Dahi 400g", barcode: "8901802000010", category: "Dairy", mrp: 45, sp: 42, cp: 38 },
    { name: "Nestle Milkmaid 400g", barcode: "8901058100012", category: "Dairy", mrp: 145, sp: 138, cp: 125 },
    { name: "Britannia Cheese Cubes 200g", barcode: "8901063010010", category: "Dairy", mrp: 160, sp: 145, cp: 130 },

    // Snacks & Biscuits
    { name: "Maggi 2-Minute Noodles 70g", barcode: "8901058816111", category: "Snacks", mrp: 14, sp: 14, cp: 11 },
    { name: "Maggi 2-Minute Noodles 420g", barcode: "8901058816210", category: "Snacks", mrp: 84, sp: 78, cp: 68 },
    { name: "Parle-G Biscuits 100g", barcode: "8901063000011", category: "Biscuits", mrp: 10, sp: 10, cp: 8 },
    { name: "Britannia Good Day Butter 200g", barcode: "8901063020026", category: "Biscuits", mrp: 45, sp: 40, cp: 35 },
    { name: "Britannia Marie Gold 200g", barcode: "8901063020040", category: "Biscuits", mrp: 35, sp: 32, cp: 28 },
    { name: "Sunfeast Dark Fantasy Choco Fills 75g", barcode: "8901725134567", category: "Biscuits", mrp: 40, sp: 35, cp: 30 },
    { name: "Oreo Original Vanilla 120g", barcode: "7622201123456", category: "Biscuits", mrp: 35, sp: 32, cp: 27 },
    { name: "Haldiram's Bhujia Sev 400g", barcode: "8904063200020", category: "Snacks", mrp: 110, sp: 100, cp: 85 },
    { name: "Haldiram's Aloo Bhujia 200g", barcode: "8904063200037", category: "Snacks", mrp: 55, sp: 50, cp: 42 },
    { name: "Lays Classic Salted 50g", barcode: "8901491100015", category: "Chips", mrp: 20, sp: 20, cp: 16 },
    { name: "Lays India's Magic Masala 50g", barcode: "8901491100022", category: "Chips", mrp: 20, sp: 20, cp: 16 },
    { name: "Kurkure Masala Munch 90g", barcode: "8901491100053", category: "Chips", mrp: 20, sp: 20, cp: 16 },
    { name: "Doritos Nacho Cheese 60g", barcode: "8901491100152", category: "Chips", mrp: 30, sp: 28, cp: 22 },
    { name: "Bingo Mad Angles 80g", barcode: "8901725198765", category: "Chips", mrp: 20, sp: 18, cp: 15 },

    // Beverages
    { name: "Tata Tea Gold 500g", barcode: "8901052000010", category: "Beverages", mrp: 320, sp: 290, cp: 260 },
    { name: "Red Label Tea 500g", barcode: "8901030556789", category: "Beverages", mrp: 280, sp: 260, cp: 230 },
    { name: "Taj Mahal Tea 250g", barcode: "8901030554321", category: "Beverages", mrp: 210, sp: 190, cp: 170 },
    { name: "Nescafe Classic Coffee 50g", barcode: "8901058823456", category: "Beverages", mrp: 190, sp: 180, cp: 160 },
    { name: "Bru Instant Coffee 50g", barcode: "8901030667890", category: "Beverages", mrp: 110, sp: 100, cp: 85 },
    { name: "Bournvita 500g", barcode: "7622201777888", category: "Beverages", mrp: 250, sp: 230, cp: 200 },
    { name: "Horlicks High Protein 400g", barcode: "8901571001234", category: "Beverages", mrp: 320, sp: 300, cp: 270 },
    { name: "Coca Cola 750ml", barcode: "8901764032109", category: "Beverages", mrp: 45, sp: 42, cp: 36 },
    { name: "Pepsi 750ml", barcode: "8902080000012", category: "Beverages", mrp: 45, sp: 42, cp: 36 },
    { name: "Thums Up 750ml", barcode: "8901764054321", category: "Beverages", mrp: 45, sp: 42, cp: 36 },
    { name: "Sprite 750ml", barcode: "8901764065432", category: "Beverages", mrp: 45, sp: 42, cp: 36 },
    { name: "Real Fruit Power Mixed Fruit 1L", barcode: "8901207000012", category: "Juices", mrp: 120, sp: 105, cp: 90 },
    { name: "Tropicana 100% Orange Juice 1L", barcode: "8902080200018", category: "Juices", mrp: 130, sp: 115, cp: 100 },
    { name: "Frooti Mango Drink 1.2L", barcode: "8902579000015", category: "Juices", mrp: 75, sp: 68, cp: 58 },
    { name: "Bisleri Mineral Water 1L", barcode: "8906017290011", category: "Water", mrp: 20, sp: 20, cp: 12 },

    // Personal Care
    { name: "Dettol Original Soap 125g", barcode: "8901396300010", category: "Personal Care", mrp: 60, sp: 55, cp: 48 },
    { name: "Lux International Creamy Perfection 100g", barcode: "8901030700015", category: "Personal Care", mrp: 38, sp: 35, cp: 28 },
    { name: "Dove Cream Beauty Bar 100g", barcode: "8901030720020", category: "Personal Care", mrp: 65, sp: 60, cp: 50 },
    { name: "Pears Pure & Gentle Soap 100g", barcode: "8901030730035", category: "Personal Care", mrp: 55, sp: 50, cp: 42 },
    { name: "Lifebuoy Total 10 125g", barcode: "8901030740040", category: "Personal Care", mrp: 36, sp: 32, cp: 25 },
    { name: "Cinthol Original Soap 100g", barcode: "8901023000123", category: "Personal Care", mrp: 40, sp: 38, cp: 30 },
    { name: "Santoor Sandal & Turmeric 100g", barcode: "8901098000123", category: "Personal Care", mrp: 38, sp: 35, cp: 28 },
    { name: "Colgate Strong Teeth Toothpaste 100g", barcode: "8901314010010", category: "Personal Care", mrp: 65, sp: 60, cp: 52 },
    { name: "Pepsodent Germi Check 150g", barcode: "8901030810012", category: "Personal Care", mrp: 95, sp: 85, cp: 75 },
    { name: "Sensodyne Fresh Mint 75g", barcode: "8901571020015", category: "Personal Care", mrp: 165, sp: 155, cp: 135 },
    { name: "Close Up Red Hot 150g", barcode: "8901030820025", category: "Personal Care", mrp: 110, sp: 100, cp: 85 },
    { name: "Clinic Plus Strong & Long Shampoo 650ml", barcode: "8901030850010", category: "Personal Care", mrp: 380, sp: 340, cp: 300 },
    { name: "Head & Shoulders Cool Menthol 340ml", barcode: "4902430700012", category: "Personal Care", mrp: 310, sp: 280, cp: 240 },
    { name: "Dove Intense Repair Shampoo 340ml", barcode: "8901030860020", category: "Personal Care", mrp: 320, sp: 290, cp: 250 },
    { name: "Pantene Hair Fall Control 340ml", barcode: "4902430710025", category: "Personal Care", mrp: 300, sp: 270, cp: 235 },
    { name: "Tresemme Keratin Smooth 340ml", barcode: "8901030870030", category: "Personal Care", mrp: 335, sp: 300, cp: 260 },
    { name: "Parachute Coconut Oil 500ml", barcode: "8901088000010", category: "Personal Care", mrp: 215, sp: 200, cp: 180 },
    { name: "Dabur Amla Hair Oil 275ml", barcode: "8901207010010", category: "Personal Care", mrp: 150, sp: 135, cp: 115 },
    { name: "Almond Drops Hair Oil 200ml", barcode: "8901248100015", category: "Personal Care", mrp: 140, sp: 125, cp: 105 },
    { name: "Fair & Lovely Advanced Multi Vitamin 50g", barcode: "8901030910010", category: "Personal Care", mrp: 115, sp: 105, cp: 90 },
    { name: "Ponds White Beauty Cream 50g", barcode: "8901030920020", category: "Personal Care", mrp: 125, sp: 115, cp: 95 },
    { name: "Nivea Soft Cream 100ml", barcode: "4005808123456", category: "Personal Care", mrp: 190, sp: 170, cp: 140 },
    { name: "Vaseline Deep Restore Lotion 400ml", barcode: "8901030930030", category: "Personal Care", mrp: 325, sp: 290, cp: 250 },
    { name: "Gillette Mach 3 Razor", barcode: "4902430600010", category: "Personal Care", mrp: 245, sp: 230, cp: 200 },
    { name: "Old Spice After Shave 100ml", barcode: "4902430610020", category: "Personal Care", mrp: 290, sp: 270, cp: 235 },
    { name: "Axe Dark Temptation Deodorant 150ml", barcode: "8901030950015", category: "Personal Care", mrp: 225, sp: 199, cp: 170 },
    { name: "Fogg Scent Impressio 100ml", barcode: "8908001234567", category: "Personal Care", mrp: 500, sp: 450, cp: 380 },
    { name: "Wild Stone Code Chrome 120ml", barcode: "8904001234567", category: "Personal Care", mrp: 250, sp: 220, cp: 180 },
    { name: "Whisper Ultra Clean XL 15 Pads", barcode: "4902430800015", category: "Personal Care", mrp: 160, sp: 145, cp: 125 },
    { name: "Stayfree Secure Cottony XL 20 Pads", barcode: "8901012300045", category: "Personal Care", mrp: 130, sp: 115, cp: 95 },
    { name: "Himalaya Purifying Neem Face Wash 100ml", barcode: "8901138511234", category: "Personal Care", mrp: 150, sp: 135, cp: 110 },
    { name: "Himalaya Toothpaste 100g", barcode: "8901138515678", category: "Personal Care", mrp: 100, sp: 90, cp: 75 },

    // Household
    { name: "Surf Excel Easy Wash 1kg", barcode: "8901030310010", category: "Household", mrp: 135, sp: 125, cp: 110 },
    { name: "Ariel Matic Front Load 1kg", barcode: "4902430410015", category: "Household", mrp: 260, sp: 240, cp: 210 },
    { name: "Tide Plus Jasmine & Rose 1kg", barcode: "4902430420025", category: "Household", mrp: 115, sp: 105, cp: 90 },
    { name: "Rin Advanced Bar 250g", barcode: "8901030330030", category: "Household", mrp: 25, sp: 22, cp: 18 },
    { name: "Vim Dishwash Gel 750ml", barcode: "8901030340045", category: "Household", mrp: 185, sp: 170, cp: 145 },
    { name: "Vim Bar 300g", barcode: "8901030340050", category: "Household", mrp: 30, sp: 28, cp: 24 },
    { name: "Pril Tamarind Gel 750ml", barcode: "8902102123456", category: "Household", mrp: 175, sp: 160, cp: 140 },
    { name: "Lizol Floor Cleaner Citrus 500ml", barcode: "8901396100012", category: "Household", mrp: 109, sp: 99, cp: 85 },
    { name: "Domex Toilet Cleaner 500ml", barcode: "8901030350055", category: "Household", mrp: 95, sp: 88, cp: 75 },
    { name: "Harpic Original 500ml", barcode: "8901396200025", category: "Household", mrp: 99, sp: 92, cp: 80 },
    { name: "Colin Glass Cleaner 500ml", barcode: "8901396400035", category: "Household", mrp: 104, sp: 98, cp: 85 },
    { name: "Comfort After Wash Blue 860ml", barcode: "8901030360065", category: "Household", mrp: 235, sp: 215, cp: 185 },
    { name: "Odonil Room Freshener Jasmine", barcode: "8901207100015", category: "Household", mrp: 55, sp: 50, cp: 40 },
    { name: "Godrej Hit Mosquito Killer 400ml", barcode: "8901023100025", category: "Household", mrp: 225, sp: 210, cp: 180 },
    { name: "All Out Refill", barcode: "8904060000015", category: "Household", mrp: 85, sp: 80, cp: 65 },
    { name: "Duracell AA Batteries 4pcs", barcode: "5000394000010", category: "Household", mrp: 180, sp: 170, cp: 140 },
    { name: "Scotch Brite Scrub Pad", barcode: "8901361000015", category: "Household", mrp: 20, sp: 18, cp: 12 },

    // Chocolates & Sweets
    { name: "Cadbury Dairy Milk Silk 60g", barcode: "7622201800015", category: "Chocolates", mrp: 80, sp: 75, cp: 60 },
    { name: "Cadbury Dairy Milk 13g", barcode: "7622201800025", category: "Chocolates", mrp: 10, sp: 10, cp: 8 },
    { name: "KitKat 4 Finger 37g", barcode: "8901058840015", category: "Chocolates", mrp: 25, sp: 25, cp: 18 },
    { name: "Munch 10g", barcode: "8901058850025", category: "Chocolates", mrp: 5, sp: 5, cp: 3.5 },
    { name: "Perk 13g", barcode: "7622201810035", category: "Chocolates", mrp: 5, sp: 5, cp: 3.5 },
    { name: "Five Star 24g", barcode: "7622201820045", category: "Chocolates", mrp: 10, sp: 10, cp: 7 },
    { name: "Kinder Joy 20g", barcode: "8000500200055", category: "Chocolates", mrp: 45, sp: 45, cp: 35 },
    { name: "Ferrero Rocher 3 Pack", barcode: "8000500100015", category: "Chocolates", mrp: 149, sp: 145, cp: 120 },
    { name: "Hershey's Chocolate Syrup 623g", barcode: "034000000015", category: "Staples", mrp: 250, sp: 230, cp: 190 },
    { name: "Nutella Hazelnut Spread 350g", barcode: "8000500000025", category: "Staples", mrp: 395, sp: 375, cp: 320 },

    // Baby Care
    { name: "Pampers Diapers Medium 50s", barcode: "4902430900015", category: "Baby Care", mrp: 699, sp: 650, cp: 580 },
    { name: "Mamy Poko Pants Large 46s", barcode: "8903333000025", category: "Baby Care", mrp: 650, sp: 600, cp: 530 },
    { name: "Johnson's Baby Powder 400g", barcode: "8901012100035", category: "Baby Care", mrp: 250, sp: 230, cp: 190 },
    { name: "Johnson's Baby Oil 200ml", barcode: "8901012110045", category: "Baby Care", mrp: 215, sp: 200, cp: 170 },
    { name: "Johnson's No More Tears Shampoo 100ml", barcode: "8901012120055", category: "Baby Care", mrp: 110, sp: 100, cp: 85 },
    { name: "Cerelac Wheat Apple 300g", barcode: "8901058000065", category: "Baby Care", mrp: 290, sp: 280, cp: 255 },

    // Miscellaneous
    { name: "Kissan Tomato Ketchup 500g", barcode: "8901030100015", category: "Staples", mrp: 140, sp: 125, cp: 105 },
    { name: "Chings Dark Soy Sauce 200g", barcode: "8901595100025", category: "Staples", mrp: 55, sp: 50, cp: 40 },
    { name: "Chings Green Chilli Sauce 200g", barcode: "8901595200035", category: "Staples", mrp: 55, sp: 50, cp: 40 },
    { name: "Funfoods Veg Mayonnaise 250g", barcode: "8906002000045", category: "Staples", mrp: 85, sp: 80, cp: 65 },
    { name: "Saffola Oats 400g", barcode: "8901088100055", category: "Staples", mrp: 190, sp: 170, cp: 145 },
    { name: "Kellogg's Corn Flakes 475g", barcode: "8901499000065", category: "Staples", mrp: 330, sp: 290, cp: 250 },
    { name: "Yakult Probiotic Drink 5 Pack", barcode: "8904000100075", category: "Dairy", mrp: 80, sp: 80, cp: 65 }
];

const categories = [
    'Staples',
    'Dairy',
    'Snacks',
    'Biscuits',
    'Beverages',
    'Juices',
    'Water',
    'Personal Care',
    'Household',
    'Chocolates',
    'Baby Care',
    'Chips',
    'Oil',
    'Spices'
];

const productTemplates = {
    Staples: [
        'Basmati Rice',
        'Toor Dal',
        'Chana Dal',
        'Sugar',
        'Atta',
        'Poha',
        'Suji',
        'Besan',
        'Ketchup',
        'Oats',
        'Corn Flakes'
    ],
    Dairy: [
        'Milk',
        'Butter',
        'Cheese Slices',
        'Dahi',
        'Paneer',
        'Flavored Milk'
    ],
    Snacks: [
        'Noodles',
        'Bhujia Sev',
        'Namkeen Mix',
        'Khakhra',
        'Roasted Chana'
    ],
    Biscuits: [
        'Marie Gold',
        'Butter Cookies',
        'Cream Biscuits',
        'Glucose Biscuits',
        'Choco Cookies'
    ],
    Beverages: [
        'Tea',
        'Coffee',
        'Health Drink',
        'Energy Drink'
    ],
    Juices: [
        'Orange Juice',
        'Mixed Fruit Juice',
        'Mango Drink',
        'Apple Juice'
    ],
    Water: [
        'Mineral Water'
    ],
    'Personal Care': [
        'Soap',
        'Toothpaste',
        'Shampoo',
        'Hair Oil',
        'Face Wash',
        'Body Lotion',
        'Deodorant'
    ],
    Household: [
        'Detergent Powder',
        'Dishwash Gel',
        'Floor Cleaner',
        'Toilet Cleaner',
        'Glass Cleaner'
    ],
    Chocolates: [
        'Milk Chocolate',
        'Chocolate Bar',
        'Choco Wafer',
        'Choco Spread'
    ],
    'Baby Care': [
        'Baby Powder',
        'Baby Oil',
        'Diapers',
        'Baby Shampoo',
        'Baby Wipes'
    ],
    Chips: [
        'Potato Chips',
        'Masala Chips',
        'Nacho Chips',
        'Corn Puffs'
    ],
    Oil: [
        'Refined Oil',
        'Mustard Oil',
        'Groundnut Oil'
    ],
    Spices: [
        'Turmeric Powder',
        'Chilli Powder',
        'Garam Masala',
        'Coriander Powder'
    ]
};

const brands = [
    'Tata',
    'Amul',
    'Britannia',
    'Nestle',
    'Dabur',
    'Haldiram',
    'ITC',
    'Godrej',
    'Patanjali',
    'Parle',
    'Hershey',
    'Kissan',
    'Saffola',
    'Fortune',
    'Aashirvaad',
    'Nivea'
];

const sizes = [
    '50g',
    '100g',
    '200g',
    '250g',
    '500g',
    '1kg',
    '2kg',
    '200ml',
    '500ml',
    '1L',
    '1.5L'
];

const priceBands = {
    Staples: [40, 220],
    Dairy: [30, 220],
    Snacks: [10, 90],
    Biscuits: [10, 80],
    Beverages: [50, 350],
    Juices: [60, 180],
    Water: [10, 40],
    'Personal Care': [25, 350],
    Household: [30, 260],
    Chocolates: [5, 200],
    'Baby Care': [60, 750],
    Chips: [10, 60],
    Oil: [120, 300],
    Spices: [25, 120]
};

const getRandomItem = (items) => items[Math.floor(Math.random() * items.length)];

const generateMrp = (category) => {
    const band = priceBands[category] || [30, 150];
    const value = Math.random() * (band[1] - band[0]) + band[0];
    return Math.round(value / 5) * 5;
};

const generateProducts = (count, startBarcode) => {
    const products = [];
    let barcodeCounter = startBarcode;

    for (let i = 0; i < count; i += 1) {
        const category = getRandomItem(categories);
        const template = getRandomItem(productTemplates[category]);
        const brand = getRandomItem(brands);
        const size = getRandomItem(sizes);
        const mrp = generateMrp(category);
        const sp = Math.max(1, Math.round(mrp * (0.9 + Math.random() * 0.08)));
        const cp = Math.max(1, Math.round(mrp * (0.7 + Math.random() * 0.1)));

        products.push({
            name: `${brand} ${template} ${size}`,
            barcode: String(barcodeCounter),
            category,
            mrp,
            sp,
            cp
        });

        barcodeCounter += 1;
    }

    return products;
};

async function main() {
    const targetCount = 500;
    const generated = generateProducts(
        Math.max(0, targetCount - baseProducts.length),
        9900000000000
    );
    const products = [...baseProducts, ...generated];

    console.log(`Start seeding ${products.length} products...`);

    for (const p of products) {
        // Create Product
        const product = await prisma.product.upsert({
            where: { barcode: p.barcode },
            update: {},
            create: {
                name: p.name,
                barcode: p.barcode,
                category: p.category,
            },
        });

        // Add a Batch
        const batchCode = `B${Math.floor(Math.random() * 1000)}`;
        await prisma.batch.create({
            data: {
                productId: product.id,
                batchCode: batchCode,
                quantity: Math.floor(Math.random() * 50) + 10, // 10-60 items
                mrp: p.mrp,
                costPrice: p.cp,
                sellingPrice: p.sp
            }
        });
        console.log(`Created ${p.name} with batch ${batchCode}`);
    }

    // Create default users
    console.log('Creating default users...');
    
    // Check if admin already exists
    const adminExists = await prisma.user.findUnique({
        where: { username: 'admin' }
    });

    if (!adminExists) {
        await prisma.user.create({
            data: {
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                status: 'active'
            }
        });
        console.log('Created admin user: admin / admin123');
    }

    const cashierExists = await prisma.user.findUnique({
        where: { username: 'cashier' }
    });

    if (!cashierExists) {
        await prisma.user.create({
            data: {
                username: 'cashier',
                password: 'cashier123',
                role: 'cashier',
                status: 'active'
            }
        });
        console.log('Created cashier user: cashier / cashier123');
    }

    const salesmanExists = await prisma.user.findUnique({
        where: { username: 'salesman' }
    });

    if (!salesmanExists) {
        await prisma.user.create({
            data: {
                username: 'salesman',
                password: 'salesman123',
                role: 'salesman',
                status: 'active'
            }
        });
        console.log('Created salesman user: salesman / salesman123');
    }

    console.log(`Seeding finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
