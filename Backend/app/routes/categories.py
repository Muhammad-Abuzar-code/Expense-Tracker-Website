from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.category import Category
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.schemas.category import CategoryCreate, CategoryResponse
from app.models.user import User
from app.core.security import get_current_user


router = APIRouter(
    prefix="/api/v1/categories",
    tags=["Categories"]
)


@router.post("/create", response_model=CategoryResponse)
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    new_category = Category(
        name=category.name,
        user_id=current_user.id
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category

@router.get("/get", response_model=list[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return current_user.categories

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    category = (
        db.query(Category)
        .filter(
            Category.id == category_id,
            Category.user_id == current_user.id
        )
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    category.name = category_data.name

    db.commit()
    db.refresh(category)

    return category

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category = (
        db.query(Category)
        .filter(
            Category.id == category_id,
            Category.user_id == current_user.id
        )
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    try:
        # Delete budgets belonging to this category
        db.query(Budget).filter(
            Budget.category_id == category.id,
            Budget.user_id == current_user.id
        ).delete(synchronize_session=False)

        # Remove category from transactions
        db.query(Transaction).filter(
            Transaction.category_id == category.id,
            Transaction.user_id == current_user.id
        ).update(
            {"category_id": None},
            synchronize_session=False
        )

        # Delete category
        db.delete(category)

        db.commit()

        return {
            "message": "Category deleted successfully"
        }

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete category: {str(e)}"
        )