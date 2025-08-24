from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from pydantic import BaseModel

from models.database import UserAccount
from services.config import ConfigCenter

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 365


async def get_secret_key():
    return await ConfigCenter.get_secret_key(
        "SECRET_KEY", None
    )


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None


class User(BaseModel):
    id:int
    username: str
    email: str | None = None
    full_name: str | None = None
    disabled: bool | None = None


class UserInDB(User):
    hashed_password: str


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def get_user(db, username: str):
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)


async def get_user_db(username_or_email: str):
    user = await UserAccount.get_or_none(username=username_or_email)
    if not user:
        user = await UserAccount.get_or_none(email=username_or_email)
    if user:
        return UserInDB(
            id= user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            disabled=user.disabled,
            hashed_password=user.hashed_password,
        )


def authenticate_user(fake_db, username: str, password: str):
    user = get_user(fake_db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


async def authenticate_user_db(username_or_email: str, password: str):
    user = await get_user_db(username_or_email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


async def register_user(username: str, password: str, email: str = None, full_name: str = None):
    if await has_users():
        raise HTTPException(status_code=403, detail="系统已初始化，不允许注册新用户")
    exists = await UserAccount.get_or_none(username=username)
    if exists:
        raise HTTPException(status_code=400, detail="用户名已存在")
    hashed = get_password_hash(password)
    user = await UserAccount.create(
        username=username,
        email=email,
        full_name=full_name,
        hashed_password=hashed,
        disabled=False,
    )
    return user


async def has_users() -> bool:
    """
    检查数据库中是否存在任何用户
    """
    user_count = await UserAccount.all().count()
    return user_count > 0


async def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if "sub" not in to_encode and "username" in to_encode:
        to_encode["sub"] = to_encode["username"]
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    secret_key = await get_secret_key()
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        secret_key = await get_secret_key()
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception
    user = await get_user_db(token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
