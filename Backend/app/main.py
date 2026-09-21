from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.routes.transactions import router as transaction_router
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.budget import Budget
from app.models.user import User 
from app.routes.auth import router as auth_router
from app.routes.dashboard import router as dashboard_router
from app.routes.categories import router as category_router
from app.routes.budget import router as budget_router

app = FastAPI()

#Including Auth Router
app.include_router(budget_router)
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(transaction_router)
app.include_router(category_router)

origins = [
    "http://localhost:5173",  # Vite default dev server
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)


with engine.connect() as connection:
    print("PostgreSQL connected successfully!")

@app.get("/")
def root():
    return {"message": "Expense Tracker API is running"}
