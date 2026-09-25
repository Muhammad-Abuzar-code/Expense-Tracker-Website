from datetime import date, time, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.models.category import Category
from app.core.database import get_db
# Models are split across user.py and transaction.py
from app.models.user import User
from app.models.transaction import Transaction

# Schemas (Assuming Transaction schemas are in a transaction.py inside schemas folder)
from app.schemas.transaction import (
    PaginatedTransactionResponse,
    TransactionCreate,
    TransactionUpdate,
    create_TransactionResponse,
    get_TransactionResponse,
)

from app.routes.auth import get_current_user  # Import your dependency function

router = APIRouter(prefix="/api/v1/transactions", tags=["Transactions"])

@router.post("/create", response_model=create_TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction_data: TransactionCreate,
    current_user: User = Depends(get_current_user),  # User extracted from JWT
    db: Session = Depends(get_db)
):

    category = db.query(Category).filter(
        Category.id == transaction_data.category_id,
        Category.user_id == current_user.id
        ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )
    
    # 1. Instantiate new Transaction ORM model
    new_transaction = Transaction(
        amount=transaction_data.amount,
        type=transaction_data.type,
        description=transaction_data.description,
        date=transaction_data.date,
        user_id=current_user.id,  # Enforced directly from authenticated user
        category_id=transaction_data.category_id  # Set the category ID from the request data
    )

    # 2. Save to Database
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    # 3. Return the newly created transaction
    return new_transaction

@router.get("/get", response_model=PaginatedTransactionResponse, status_code=status.HTTP_200_OK)
def get_user_transactions(
    type: Optional[str] = Query(None, description="Filter by transaction type (income/expense)"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    start_date: Optional[date] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter by end date (YYYY-MM-DD)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Base query filtered strictly by the current user's ID
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    # 2. Apply optional filters
    if type:
        query = query.filter(Transaction.type == type)

    if category_id:
        query = query.filter(Transaction.category_id == category_id)

    if start_date:
        query = query.filter(Transaction.date >= start_date)

    if end_date:
        query = query.filter(
            Transaction.date < datetime.combine(
                end_date + timedelta(days=1),
                time.min
            )
        )

    # 3. Calculate total matching items BEFORE applying limit/offset
    total = query.count()

    # 4. Apply Pagination (Offset & Limit)
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()

    # 5. Calculate total pages
    pages = (total + limit - 1) // limit if total > 0 else 0

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }

# PUT /transactions/{transaction_id}
@router.put("/update/{transaction_id}", response_model=get_TransactionResponse, status_code=status.HTTP_200_OK)
def update_transaction(
    transaction_id: int,
    transaction_data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(
         Category.id == transaction_data.category_id,
         Category.user_id == current_user.id
         ).first()

    if not category:
         raise HTTPException(
             status_code=404,
             detail="Category not found"
         )
    
    # 1. Find transaction AND verify ownership in one query
    transaction = (
        db.query(Transaction)
        .filter(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id
        )
        .first()
    )

    # 2. Return 404 if not found or not owned by user
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID {transaction_id} not found"
        )

    # 3. Get only the fields explicitly sent by the user (exclude unset fields)
    update_data = transaction_data.model_dump(exclude_unset=True)

    # 4. Dynamically update model attributes
    for key, value in update_data.items():
        setattr(transaction, key, value)

    # 5. Save changes to DB
    db.commit()
    db.refresh(transaction)

    # 6. Return updated transaction
    return transaction

@router.delete("/delete/{transaction_id}", status_code=status.HTTP_200_OK)
def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Find transaction AND check ownership in a single query
    transaction = (
        db.query(Transaction)
        .filter(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id
        )
        .first()
    )

    # 2. Return 404 if not found or belongs to another user
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID {transaction_id} not found"
        )

    # 3. Delete from DB session
    db.delete(transaction)

    # 4. Commit changes to database
    db.commit()

    # 5. Return success message
    return {"message": f"Transaction {transaction_id} successfully deleted"}