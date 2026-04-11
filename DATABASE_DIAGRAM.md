# POS Application Database ERD

This diagram visualizes the relationships between the different entities in your POS system.

```mermaid
erDiagram
    User {
        int id PK
        string username
        string password
        string role
        string status
        datetime createdAt
    }

    Category {
        int id PK
        string name
        int parentId FK
        datetime createdAt
    }

    Product {
        int id PK
        string name
        string barcode
        string category
        boolean batchTrackingEnabled
        int lowStockThreshold
        datetime createdAt
    }

    Batch {
        int id PK
        int productId FK
        string batchCode
        int quantity
        float mrp
        float costPrice
        float sellingPrice
        boolean wholesaleEnabled
        datetime expiryDate
        datetime createdAt
    }

    Sale {
        int id PK
        float totalAmount
        float discount
        float extraDiscount
        string paymentMethod
        datetime createdAt
    }

    SaleItem {
        int id PK
        int saleId FK
        int batchId FK
        int quantity
        int returnedQuantity
        float sellingPrice
        float costPrice
        float mrp
    }

    StockMovement {
        int id PK
        int productId FK
        int batchId FK
        string type
        int quantity
        string note
        datetime createdAt
    }

    LooseSale {
        int id PK
        string itemName
        float price
        datetime createdAt
    }

    Promotion {
        int id PK
        string name
        datetime startDate
        datetime endDate
        boolean isActive
    }

    PromotionItem {
        int id PK
        int promotionId FK
        int productId FK
        float promoPrice
    }

    Expense {
        int id PK
        float amount
        string category
        string description
        datetime date
    }

    Purchase {
        int id PK
        string vendor
        float totalAmount
        datetime date
        string paymentStatus
    }

    PurchaseItem {
        int id PK
        int purchaseId FK
        int batchId FK
        int productId FK
        int quantity
        float costPrice
    }

    Product ||--o{ Batch : "has"
    Product ||--o{ StockMovement : "tracks"
    Product ||--o{ PromotionItem : "featured in"
    Product ||--o{ PurchaseItem : "bought in"

    Batch ||--o{ SaleItem : "sold in"
    Batch ||--o{ StockMovement : "tracks"
    Batch ||--o{ PurchaseItem : "received in"

    Sale ||--o{ SaleItem : "containing"

    Promotion ||--o{ PromotionItem : "defines"

    Purchase ||--o{ PurchaseItem : "includes"
    Purchase ||--o{ PurchasePayment : "paid by"

    Category ||--o{ Category : "parent of"
```

## Key Modules Description

### 1. Inventory Core

- **Product**: The base definition of an item.
- **Batch**: Physical stock instances. This supports multiple batches for the same product (e.g., different expiry dates or purchase prices).

### 2. Sales & Transactions

- **Sale**: The header record for a transaction.
- **SaleItem**: Links a specific quantity of a **Batch** to a **Sale**.
- **LooseSale**: Simplified sales for items not in formal inventory.

### 3. Purchasing & Stock Control

- **Purchase**: Records of stock coming in from vendors.
- **StockMovement**: Audits every single stock change (Sale, Return, Adjustment).

### 4. Marketing & Misc

- **Promotion**: Temporary price overrides.
- **Expense**: Business costs (Rent, Electricity, etc.) not related to inventory.
- **Setting**: Application-level configurations.
