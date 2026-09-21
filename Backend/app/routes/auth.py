# app/routes/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session


from app.core.security import get_current_user, hash_password,verify_password, create_access_token
from app.core.database import get_db
from app.models.user import User  # Your SQLAlchemy User model
from app.schemas.user import CurrentUserResponse, TokenResponse, UserCreate, UserLogin, UserResponse  # Your Pydantic models

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    # 1. Check whether email already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # 2. Hash password
    hashed_pwd = hash_password(user_in.password)

    # 3. Create User object
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed_pwd,
    )

    # 4. Save to database & Commit
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 5. Return safe user information (Pydantic converts to UserResponse)
    return new_user

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
)
def login(payload: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Query the 'User' database table by email
    user = db.query(User).filter(User.email == payload.username).first()

    # 2. Verify user exists and password matches
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Create JWT token using DB user values
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )

    # 4. Return response
    return {"access_token": access_token, "token_type": "bearer"}

@router.get(
    "/me",
    response_model=CurrentUserResponse, 
    status_code=status.HTTP_200_OK
)
def get_logged_in_user(current_user: User = Depends(get_current_user)):
    return{
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
    }