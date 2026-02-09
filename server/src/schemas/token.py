from typing import Literal

from pydantic import BaseModel


class Access_Token_Payload(BaseModel):
    sub: str
    iat: int
    exp: int
    type: Literal["access"] = "access"


class Refresh_Token_Payload(BaseModel):
    sub: str
    iat: int
    exp: int
    type: Literal["refresh"] = "refresh"
    jti: str


class RotateAccessTokenResponse(BaseModel):
    access_token: str
