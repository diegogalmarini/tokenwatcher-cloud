# api/app/auth.py

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import get_db
from .config import settings
from .email_utils import send_reset_email, send_verification_email

# Passlib: bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# El tokenUrl "auth/token" es donde FastAPI esperará el login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

router = APIRouter()


# --- Utilidades de Contraseña ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# --- Utilidades de JWT ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


# --- Dependencia “get_current_user” ---
async def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> models.User:
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
    except JWTError:
        raise credentials_exception
    
    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    # Si el email no está verificado (is_active=False), no dejamos pasar
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox.",
        )
    return user


# ─── ENDPOINTS DE AUTH ────────────────────────────────────

@router.post("/register", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED, tags=["Authentication"])
async def register_new_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    1) Si el email ya existe, retorna 400.
    2) Crea el usuario con is_active=False (pendiente de verificación).
    3) Genera un JWT tipo "verify" de corta duración (p. ej. 1 día).
    4) Envía un correo de verificación al usuario.
    5) Devuelve los datos básicos (sin password ni token) del usuario creado.
    """
    db_user = crud.get_user_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # 1) Crear usuario en BD con is_active=False (pendiente de verificación)
    #    Asumimos que crud.create_user setea is_active=False internamente.
    new_user = crud.create_user(db=db, user=user_in, is_active=False)

    # 2) Generar token de verificación (expira en 24 horas)
    expires = timedelta(hours=24)
    verify_token = create_access_token(
        data={"sub": new_user.email, "type": "verify"},
        expires_delta=expires
    )

    # 3) Enviar correo de verificación
    sent = send_verification_email(to_email=new_user.email, verify_token=verify_token)
    if not sent:
        # En caso de fallo de envío, opcionalmente podrías eliminar al usuario recién creado
        # db.delete(new_user); db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not send verification email. Try again later.",
        )

    return new_user


@router.post("/token", response_model=schemas.Token, tags=["Authentication"])
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """
    1) Verificar que exista el usuario y que la contraseña coincida.
    2) Verificar que is_active sea True (email verificado).
    3) Generar JWT y devolverlo.
    """
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Si el email no está verificado, devolvemos 403
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox.",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/users/me", response_model=schemas.UserRead, tags=["Authentication"])
async def read_current_user_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ─── VERIFY EMAIL ────────────────────────────────────────

@router.get("/verify-email", tags=["Authentication"])
async def verify_email(token: str, db: Session = Depends(get_db)):
    """
    Endpoint: GET /auth/verify-email?token=<verify_token>
    1) Decodifica el JWT de tipo "verify".
    2) Si es válido, marca al usuario is_active=True.
    3) Devuelve un mensaje de éxito.
    """
    try:
        payload_jwt = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_type = payload_jwt.get("type")
        email = payload_jwt.get("sub")
        if token_type != "verify" or email is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    user = crud.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.is_active:
        return {"msg": "Account already verified."}

    user.is_active = True
    db.add(user)
    db.commit()
    return {"msg": "Email verified successfully."}


# ─── FORGOT PASSWORD ────────────────────────────────────────

@router.post(
    "/forgot-password",
    response_model=schemas.ForgotPasswordResponse,
    status_code=status.HTTP_200_OK,
    summary="Forgot Password",
    tags=["Authentication"],
)
async def forgot_password(
    payload: schemas.ForgotPasswordRequest = Body(...),
    db: Session = Depends(get_db),
):
    """
    Endpoint: POST /auth/forgot-password
    Recibe { "email": "usuario@ejemplo.com" }.
    Si existe el usuario y está activo, genera un JWT "reset" (15 min) y lo envía por correo.
    Siempre responde 200 OK con mensaje genérico, para no filtrar usuarios inexistentes.
    """
    user = crud.get_user_by_email(db, email=payload.email)
    # Si no existe o no está verificado, devolvemos 200 OK genérico (evitamos filtrar cuentas)
    if not user or not user.is_active:
        return {"msg": "If your email is registered, you will receive a password reset link."}

    # Generar token de reset (tipo "reset", expira en 15 min)
    expires = timedelta(minutes=15)
    reset_token = create_access_token(
        data={"sub": user.email, "type": "reset"},
        expires_delta=expires
    )

    sent = send_reset_email(to_email=user.email, reset_token=reset_token)
    if not sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not send reset email. Try again later."
        )

    return {"msg": "If your email is registered, you will receive a password reset link."}


# ─── RESET PASSWORD ────────────────────────────────────────

@router.post(
    "/reset-password",
    response_model=schemas.ResetPasswordResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset Password",
    tags=["Authentication"],
)
async def reset_password(
    payload: schemas.ResetPasswordRequest = Body(...),
    db: Session = Depends(get_db),
):
    """
    Endpoint: POST /auth/reset-password
    Recibe { "token": "jwt_de_reset", "new_password": "MiClaveNueva123" }.
    1) Decodifica el JWT de tipo "reset".
    2) Valida el sub (email).
    3) Hashea la nueva contraseña y la guarda. Devuelve mensaje de éxito.
    """
    try:
        payload_jwt = jwt.decode(
            payload.token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        token_type = payload_jwt.get("type")
        email = payload_jwt.get("sub")
        if token_type != "reset" or email is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token for password reset")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    user = crud.get_user_by_email(db, email=email)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found or not active")

    # Actualizar la contraseña
    new_hashed = get_password_hash(payload.new_password)
    user.hashed_password = new_hashed
    db.add(user)
    db.commit()

    return {"msg": "Password has been reset successfully."}
