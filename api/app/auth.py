# api/app/auth.py
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import crud, models, schemas # Tus módulos
from .database import get_db # Dependencia de sesión de BD
from .config import settings # Para SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

# Configuración de Passlib para hasheo de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2PasswordBearer para obtener el token de la cabecera Authorization
# tokenUrl apunta al endpoint de login que crearemos
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token") # Relativo al prefijo del router

router = APIRouter() # No es necesario prefijo aquí, se añade en main.py

# --- Funciones de Utilidad para Contraseñas ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña plana contra su hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Genera el hash de una contraseña."""
    return pwd_context.hash(password)

# --- Funciones de Utilidad para JWT ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crea un nuevo token de acceso JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# --- Dependencia para Obtener el Usuario Actual Autenticado ---
async def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> models.User:
    """
    Decodifica el token JWT, obtiene el email del usuario (subject 'sub'),
    y devuelve el objeto User de la base de datos.
    Lanza HTTPException si el token es inválido o el usuario no existe/está inactivo.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise credentials_exception
        # Puedes añadir más validaciones al payload del token aquí si es necesario
    except JWTError:
        raise credentials_exception
    
    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    # if not user.is_active: # Descomentar si tienes 'is_active' en tu modelo User y quieres verificarlo
    #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return user

# --- Endpoints de Autenticación (se incluirán en main.py con prefijo /auth) ---
@router.post("/register", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
async def register_new_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """Registra un nuevo usuario."""
    db_user = crud.get_user_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    return crud.create_user(db=db, user=user_in)

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """
    Endpoint de login. Recibe email (como form_data.username) y contraseña.
    Devuelve un token JWT si las credenciales son válidas.
    """
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # if not user.is_active: # Descomentar si tienes 'is_active' y quieres verificarlo
    #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Endpoint de ejemplo para obtener información del usuario autenticado
@router.get("/users/me", response_model=schemas.UserRead)
async def read_current_user_me(current_user: models.User = Depends(get_current_user)):
    """Devuelve la información del usuario actualmente autenticado."""
    return current_user