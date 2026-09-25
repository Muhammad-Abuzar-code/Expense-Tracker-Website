from pydantic import Field,BaseModel
from datetime import date
from typing import List, Literal, Optional
from decimal import Decimal



# Request Schema (What the client sends)
class TransactionCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    category_id: Optional[int] = None  # Optional category ID
    type: Literal["income", "expense"]  # Restricts values strictly to 'income' or 'expense'
    description: Optional[str] = None
    date: date

# Response Schema (What the backend returns)
class create_TransactionResponse(TransactionCreate):
    id: int
    user_id: int

    class Config:
        from_attributes = True  # Allows ORM model conversion (SQLAlchemy)

class get_TransactionResponse(BaseModel):
    id: int
    amount: Decimal = Field(gt=0)
    type: str
    description: Optional[str] = None
    date: date
    category_id: Optional[int] = None
    user_id: int

    class Config:
        from_attributes = True  # Converts SQLAlchemy models into Pydantic models

# Schema for updating a transaction (all fields optional)
class TransactionUpdate(BaseModel):
    amount: Decimal = Field(gt=0)
    type: Literal["income", "expense"]
    category_id: Optional[int] = None
    description: Optional[str] = None
    date: date

class PaginatedTransactionResponse(BaseModel):
    items: List[get_TransactionResponse]
    total: int
    page: int
    limit: int
    pages: int