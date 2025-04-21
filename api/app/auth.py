# api/app/auth.py

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
router = APIRouter()

@router.post("/token", tags=["Auth"])
async def login(form_data: dict = Depends(oauth2_scheme)):
    # TODO: valida credenciales, genera JWT
    raise HTTPException(501, "Not implemented")
