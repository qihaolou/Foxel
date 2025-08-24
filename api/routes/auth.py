from typing import Annotated
from fastapi import APIRouter, HTTPException, Depends, Form
from fastapi.security import OAuth2PasswordRequestForm
from services.auth import (
    authenticate_user_db,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    register_user,
    Token,
)
from pydantic import BaseModel
from datetime import timedelta
from api.response import success

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    username: str
    password: str
    email: str | None = None
    full_name: str | None = None

@router.post("/register", summary="注册第一个管理员用户")
async def register(data: RegisterRequest):
    """
    仅当系统中没有用户时，才允许注册。
    """
    user = await register_user(
        username=data.username,
        password=data.password,
        email=data.email,
        full_name=data.full_name,
    )
    return success({"username": user.username}, msg="初始用户注册成功")


@router.post("/login")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    user = await authenticate_user_db(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = await create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")
