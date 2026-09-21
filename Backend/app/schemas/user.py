from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, example="John Doe")
    email: EmailStr = Field(..., example="user@example.com")
    password: str = Field(..., min_length=8, max_length=128, example="Secret123!")

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    email: EmailStr = Field(..., example="user@example.com")
    password: str = Field(..., min_length=8, max_length=128, example="Secret123!")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class CurrentUserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)

