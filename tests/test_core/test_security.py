import pytest
from jose import JWTError
from app.core.security import (
    hash_password,
    verify_password, 
    create_access_token,
    decode_access_token,
)

def test_hash_password_returns_string():
    password = "admin123"
    hashed = hash_password(password)

    assert isinstance(hashed, str)

def test_hash_password_is_not_plain_test():
    password = "admin123"
    hashed = hash_password(password)

    assert hashed != password

def test_verify_password_success():
    password = "admin123"
    hashed = hash_password(password)
    result = verify_password(password, hashed)

    assert result

def test_verify_password_failure():
    password = "admin123"
    hashed = hash_password(password)
    result = verify_password("admin1234", hashed)

    assert not result

def test_create_access_token_return_string():
    result = create_access_token(
        {"sub" :"1",
        "email": "admin@gmail.com", }
    )
    assert isinstance(result, str)

def test_decode_access_token():
    payload = {
        "sub" : "1",
        "email" : "admin@gmail.com"
    }
    token = create_access_token(payload)
    decode = decode_access_token(token)

    assert decode["sub"] == "1"
    assert decode["email"] == "admin@gmail.com"

def test_decode_invalid_token():
    with pytest.raises(JWTError):
        decode_access_token("This is not a valid token.")

