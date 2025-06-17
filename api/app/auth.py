# api/app/auth.py

import re # Importación para validación de contraseña
from datetime import datetime, timedelta, timezone
from typing import Optional, List

# Se añade Request para el rate limiter
from fastapi import APIRouter, Depends, HTTPException, status, Body, Request 
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import get_db
from .config import settings
from .email_utils import send_reset_email, send_verification_email, send_watcher_limit_update_email
# === IMPORTACIÓN CORREGIDA: Apuntamos a rate_limiter para evitar el error circular ===
from .rate_limiter import limiter

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")
router = APIRouter()

# === FUNCIÓN DE VALIDACIÓN DE CONTRASEÑA AÑADIDA ===
def validate_password_strength(password: str) -> Optional[str]:
    """
    Valida la fortaleza de una contraseña.
    Devuelve un mensaje de error si no es válida, o None si es válida.
    """
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
    return None # La contraseña es válida

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
        if payload.get("type") not in (None, "access") or email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=email)
    if not user:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified.")
    return user

@router.post("/register", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED, tags=["Authentication"])
async def register_new_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # === VALIDACIÓN DE CONTRASEÑA AÑADIDA ===
    password_error = validate_password_strength(user_in.password)
    if password_error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=password_error,
        )
    # =========================================

    db_user = crud.get_user_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    new_user = crud.create_user(db=db, user=user_in, is_active=False)
    verify_token = create_access_token({"sub": new_user.email, "type": "verify"}, expires_delta=timedelta(hours=24))
    if not send_verification_email(new_user.email, verify_token):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not send verification email.")
    return new_user

@router.get("/verify-email", status_code=status.HTTP_200_OK, tags=["Authentication"])
async def verify_email(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "verify" or not payload.get("sub"):
            raise JWTError()
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

# === RATE LIMIT AÑADIDO ===
@router.post("/token", response_model=schemas.Token, tags=["Authentication"])
@limiter.limit("5/minute")
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified.")
    access_token = create_access_token({"sub": user.email}, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=schemas.UserRead, tags=["Authentication"])
async def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user

# --- FUNCIONES PARA ADMINISTRACIÓN ---
def get_current_admin_user(current_user: models.User = Depends(get_current_user)):
    """
    Checks if the current user is the admin.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action."
        )
    return current_user

@router.get("/admin/users", response_model=List[schemas.UserRead], tags=["Admin"])
def read_all_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), admin_user: models.User = Depends(get_current_admin_user)):
    """
    Retrieve all users. Requires admin privileges.
    """
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@router.delete("/admin/users/{user_id}", status_code=status.HTTP_200_OK, tags=["Admin"])
def delete_user(user_id: int, db: Session = Depends(get_db), admin_user: models.User = Depends(get_current_admin_user)):
    """
    Delete a user and all their associated data. Requires admin privileges.
    """
    deleted_user = crud.delete_user_by_id(db=db, user_id=user_id)
    if not deleted_user:
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found")
    
    return {"detail": f"User {deleted_user.email} and all associated data deleted successfully."}

@router.patch("/admin/users/{user_id}", response_model=schemas.UserRead, tags=["Admin"])
def update_user_as_admin(user_id: int, user_update: schemas.UserUpdateAdmin, db: Session = Depends(get_db), admin_user: models.User = Depends(get_current_admin_user)):
    """
    Update a user's details (e.g., watcher_limit, is_active). Requires admin privileges.
    """
    updated_user = crud.update_user_admin(db, user_id=user_id, user_update_data=user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found")
    
    if user_update.watcher_limit is not None:
        send_watcher_limit_update_email(updated_user.email, updated_user.watcher_limit)
        
    return updated_user


# --- RESTO DE ENDPOINTS DE AUTENTICACIÓN ---
@router.post("/forgot-password", response_model=schemas.ForgotPasswordResponse, status_code=status.HTTP_200_OK, tags=["Authentication"])
async def forgot_password(payload: schemas.ForgotPasswordRequest = Body(...), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=payload.email)
    if not user or not user.is_active:
        return {"msg": "If your email is registered, you will receive a password reset link."}
    reset_token = create_access_token({"sub": user.email, "type": "reset"}, expires_delta=timedelta(minutes=15))
    if not send_reset_email(user.email, reset_token):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not send reset email.")
    return {"msg": "If your email is registered, you will receive a password reset link."}

@router.post("/reset-password", response_model=schemas.ResetPasswordResponse, status_code=status.HTTP_200_OK, tags=["Authentication"])
async def reset_password(payload: schemas.ResetPasswordRequest = Body(...), db: Session = Depends(get_db)):
    # === VALIDACIÓN DE CONTRASEÑA AÑADIDA ===
    password_error = validate_password_strength(payload.new_password)
    if password_error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=password_error,
        )
    # =========================================
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