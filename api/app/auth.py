# api/app/auth.py

import re
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, Body, Request 
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import get_db
from .config import settings
from .email_utils import send_reset_email, send_verification_email
from .rate_limiter import limiter

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")
router = APIRouter()

def validate_password_strength(password: str) -> Optional[str]:
    if len(password) < 8:
        return "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return "Password must contain at least one number."
    if not re.search(r"[!@#$%^&*(),.?:{}|<>]", password):
        return "Password must contain at least one special character (e.g., !@#$%)."
    return None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

async def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: Optional[str] = payload.get("sub")
        # Ensure the token is an access token
        if payload.get("type") not in (None, "access") or email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = crud.get_user_by_email(db, email=email)
    if not user:
        raise credentials_exception

    # Check if user is active *after* getting the user, for login purposes
    if not user.is_active:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Your account has been paused by an administrator. Please contact support."
        )
    return user

@router.post("/register", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED, tags=["Authentication"])
async def register_new_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    password_error = validate_password_strength(user_in.password)
    if password_error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=password_error,
        )

    db_user = crud.get_user_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Create user as inactive, then send verification
    new_user = crud.create_user(db=db, user=user_in, is_active=False) 
    
    verify_token = create_access_token({"sub": new_user.email, "type": "verify"}, expires_delta=timedelta(hours=24))
    
    if not send_verification_email(new_user.email, verify_token):
        # Even if email fails, user is in DB. They can request another verification.
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not send verification email.")
        
    return new_user


@router.get("/verify-email", status_code=status.HTTP_200_OK, tags=["Authentication"])
async def verify_email(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "verify" or not payload.get("sub"):
            raise JWTError("Invalid token type or subject.")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification token")
        
    user = crud.get_user_by_email(db, email=payload["sub"])
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if user.is_active:
        return {"msg": "Account already verified."}
        
    user.is_active = True
    db.commit()
    return {"msg": "Email verified successfully."}


@router.post("/token", response_model=schemas.Token, tags=["Authentication"])
@limiter.limit("5/minute")
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    # Check if the user's email was ever verified by checking the subscription status
    # This is an indirect way. A better way would be a dedicated 'email_verified_at' field.
    if not user.subscription:
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified. Please check your inbox for the verification link.")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your account has been paused by an administrator. Please contact support.")

    access_token = create_access_token({"sub": user.email}, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/users/me", response_model=schemas.UserRead, tags=["User Management"])
async def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.post("/users/me/change-password", status_code=status.HTTP_200_OK, tags=["User Management"])
def change_current_user_password(
    password_data: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")
    
    password_error = validate_password_strength(password_data.new_password)
    if password_error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=password_error)
        
    crud.set_user_password(db=db, user=current_user, new_password=password_data.new_password)
    return {"msg": "Password updated successfully"}

@router.delete("/users/me", status_code=status.HTTP_204_NO_CONTENT, tags=["User Management"])
def delete_current_user_account(
    payload: schemas.DeleteAccountRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Incorrect password")
    
    crud.delete_user_by_id(db, user_id=current_user.id)
    return

def get_current_admin_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action."
        )
    return current_user

@router.post("/forgot-password", response_model=schemas.ForgotPasswordResponse, status_code=status.HTTP_200_OK, tags=["Authentication"])
async def forgot_password(payload: schemas.ForgotPasswordRequest = Body(...), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=payload.email)
    
    if not user:
        # Don't reveal if an email is registered or not
        return {"msg": "If your email is registered, you will receive a password reset link."}

    reset_token = create_access_token({"sub": user.email, "type": "reset"}, expires_delta=timedelta(minutes=15))
    
    if not send_reset_email(user.email, reset_token):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not send reset email.")
        
    return {"msg": "If your email is registered, you will receive a password reset link."}

@router.post("/reset-password", response_model=schemas.ResetPasswordResponse, status_code=status.HTTP_200_OK, tags=["Authentication"])
async def reset_password(payload: schemas.ResetPasswordRequest = Body(...), db: Session = Depends(get_db)):
    password_error = validate_password_strength(payload.new_password)
    if password_error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=password_error,
        )
    try:
        data = jwt.decode(payload.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if data.get("type") != "reset" or not data.get("sub"):
            raise JWTError()
    except JWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")
    
    user = crud.get_user_by_email(db, email=data["sub"])
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    hashed = get_password_hash(payload.new_password)
    user.hashed_password = hashed
    db.commit()
    return {"msg": "Password has been reset successfully."}
