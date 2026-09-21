from datetime import date, datetime

from pydantic import BaseModel, Field


class BudgetCreate(BaseModel):
    category_id: int
    amount: float = Field(gt=0)
    month: date


class BudgetResponse(BaseModel):
    id: int
    category_id: int
    amount: float
    month: date
    created_at: datetime

    class Config:
        from_attributes = True

class BudgetSummary(BaseModel):
    id: int
    category_id: int
    amount: float
    month: date
    actual_spending: float
    remaining: float
    status: str 