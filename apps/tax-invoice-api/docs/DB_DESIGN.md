## DATABASE DESIGN

```mermaid
classDiagram
  %% ===== User Collection =====
  class User {
    +*string email  // KEY
    +string password
    +string role  // 'user' | 'admin'
    +Date createdAt
    +Date updatedAt
  }

  %% ===== Invoice Collection =====
  class Invoice {
    +*string invoiceNumber  // KEY
    +string userEmail
    +string status  // 'draft' | 'submitted' | 'approved' | 'rejected'
    +number amount
    +number tax
    +string description
    +boolean isDeleted
    +InvoiceHistory[] histories  // embedded subdocument
    +Date createdAt
    +Date updatedAt
  }

  %% ===== Subdocument inside Invoice =====
  class InvoiceHistory {
    +string description
    +object changes
    +Date createdAt
  }

  %% ===== Relationships =====
  Invoice *-- InvoiceHistory : embedded histories
```
