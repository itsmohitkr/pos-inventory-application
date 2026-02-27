const fs = require('fs');
const schemaPath = 'server/prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

if (!schema.includes('model PriceHistory')) {
    const priceHistoryModel = `
model PriceHistory {
  id              Int      @id @default(autoincrement())
  batchId         Int
  mrp             Float
  costPrice       Float
  sellingPrice    Float
  wholesalePrice  Float?
  wholesaleMinQty Int?
  vendorName      String?
  createdAt       DateTime @default(now())
  batch           Batch    @relation(fields: [batchId], references: [id], onDelete: Cascade)
}
`;
    schema += priceHistoryModel;
}

if (!schema.includes('vendorName      String?')) {
    schema = schema.replace(
        'saleItems        SaleItem[]',
        'vendorName       String?\n  history          PriceHistory[]\n  saleItems        SaleItem[]'
    );
}
fs.writeFileSync(schemaPath, schema);
