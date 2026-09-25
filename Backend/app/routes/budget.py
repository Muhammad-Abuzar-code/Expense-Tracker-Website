from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetSummary
from app.core.security import get_current_user
from app.models.user import User
from app.models.category import Category

def get_next_month(month: date) -> date:
    if month.month == 12:
        return date(month.year + 1, 1, 1)

    return date(month.year, month.month + 1, 1)


router = APIRouter(
    prefix="/api/v1/budgets",
    tags=["Budgets"]
)

@router.post(
    "/create",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED
)
def create_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
    ):

    category = db.query(Category).filter(
        Category.id == budget.category_id,
        Category.user_id == current_user.id
        ).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    existing_budget = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category_id == budget.category_id,
        Budget.month == budget.month
        ).first()

    if existing_budget:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Budget already exists for this category and month"
        )

    new_budget = Budget(
        user_id=current_user.id,
        category_id=budget.category_id,
        amount=budget.amount,
        month=budget.month
    )

    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)

    return new_budget

@router.get(
    "/get",
    response_model=list[BudgetSummary]
)
def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id
    ).all()

    results = []

    for budget in budgets:

        start_date = budget.month
        end_date = get_next_month(budget.month)

        actual_spending = db.query(
        func.coalesce(
            func.sum(Transaction.amount),
            0
        )
        ).filter(
            Transaction.user_id == current_user.id,
            Transaction.category_id == budget.category_id,
            Transaction.type == "expense",
            Transaction.date >= start_date,
            Transaction.date < end_date
        ).scalar()

        actual_spending = float(actual_spending)  # ✅ fix: Decimal -> float
        remaining = budget.amount - actual_spending

        if remaining < 0:
            status = "over_budget"
        else:
            status = "within_budget"

        results.append(
            BudgetSummary(
                id=budget.id,
                category_id=budget.category_id,
                amount=budget.amount,
                month=budget.month,
                actual_spending=actual_spending,
                remaining=remaining,
                status=status
            )
        )

    return results

@router.delete(
    "/{budget_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()

    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )

    db.delete(budget)
    db.commit()

    return None