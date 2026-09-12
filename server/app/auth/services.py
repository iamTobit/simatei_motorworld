from flask_jwt_extended import create_access_token
from ..accounts.models import User
from ..extensions import db
from ..common.errors import ConflictError, UnauthorizedError


def register_user(data: dict) -> User:
    if User.query.filter_by(email=data["email"].lower()).first():
        raise ConflictError("Email already registered")
    user = User(
        name=data["name"],
        email=data["email"].lower(),
        phone=data.get("phone"),
        role="user",
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    return user


def authenticate(email: str, password: str) -> User:
    user = User.query.filter_by(email=email.lower()).first()
    if not user or not user.check_password(password):
        raise UnauthorizedError("Invalid credentials")
    if user.is_blocked:
        raise UnauthorizedError("Account blocked")
    return user


def issue_token(user: User) -> str:
    return create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "email": user.email},
    )