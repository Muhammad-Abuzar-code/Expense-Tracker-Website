from datetime import date

from app.core.database import Base
from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    month = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Prevent duplicate budgets for the same user, category, and month combination
    __table_args__ = (
        UniqueConstraint("user_id", "category_id", "month", name="uq_user_category_month"),
    )

    user = relationship("User")

    category = relationship("Category")