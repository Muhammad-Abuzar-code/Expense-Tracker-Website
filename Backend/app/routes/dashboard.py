from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.category import Category
from app.models.user import User
from app.models.transaction import Transaction
from app.routes.auth import get_current_user

router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["Dashboard"]
)

@router.get("/summary")
def dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .all()
    )

    total_income = sum(
        transaction.amount
        for transaction in transactions
            if transaction.type == "income"
    )   

    total_expenses = sum(
        transaction.amount
        for transaction in transactions
            if transaction.type == "expense"
    )

    balance = total_income - total_expenses

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": balance
    }

@router.get("/category-breakdown")
def category_breakdown(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    results = (
        db.query(
            Category.name,
            func.sum(Transaction.amount)
        )
        .join(
            Transaction,
            Transaction.category_id == Category.id
        )
        .filter(Transaction.user_id == current_user.id)
        .filter(Transaction.type == "expense")
        .group_by(Category.name)
        .all()
    )

    return {
        category_name: total
        for category_name, total in results
    }