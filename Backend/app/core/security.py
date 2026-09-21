from datetime import timedelta,timezone, datetime
from fastapi import HTTPException, status
from jose import JWTError, ExpiredSignatureError, jwt
from dotenv import load_dotenv
import os
from fastapi.params import Depends
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.user import User

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login") 

# Initialize password hash context (Argon2id is the modern standard recommended for FastAPI/Python)
pwd_context = PasswordHash((Argon2Hasher(),))


def hash_password(password: str) -> str:
    """Hashes a plain text password using Argon2id."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against a stored hash."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # 1. Decode JWT into a standard Python dictionary
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # 2. Grab the user ID straight from the dictionary key "sub"
        user_id: str = payload.get("sub")
        
        # Reject if "sub" is missing
        if user_id is None:
            raise credentials_exception

        # Convert the string user_id into an integer for the DB query
        user_id_int = int(user_id)

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please login again."
        )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    # 3. Query DB table 'User' directly using the extracted user_id_int
    user = db.query(User).filter(User.id == user_id_int).first()

    # 4. If user doesn't exist in DB, raise 401
    if user is None:
        raise credentials_exception

    # 5. Return the User database instance
    return user