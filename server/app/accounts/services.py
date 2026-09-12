from .models import User
from ..common.errors import ForbiddenError, NotFoundError


def get_user_or_404(user_id: int) -> User:
    user = User.query.get(user_id)
    if not user:
        raise NotFoundError("User not found")
    return user


def update_profile(user: User, data: dict) -> User:
    if "name" in data and data["name"]:
        user.name = data["name"]
    if "phone" in data:
        user.phone = data["phone"]
    from ..extensions import db

    db.session.commit()
    return user


def change_role(actor: User, target_id: int, new_role: str) -> User:
    if actor.role != "admin":
        raise ForbiddenError("Only admins can change roles")
    target = get_user_or_404(target_id)
    target.role = new_role
    from ..extensions import db

    db.session.commit()
    return target


def list_users(page=1, limit=20):
    return User.query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=limit, error_out=False
    )