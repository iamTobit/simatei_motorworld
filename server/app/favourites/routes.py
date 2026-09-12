from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from .models import Favourite
from .schemas import FavouriteCreateSchema
from ..inventory.models import Car
from ..common.decorators import login_required
from ..accounts.services import get_user_or_404
from ..extensions import db
from ..common.errors import NotFoundError, ConflictError

favourites_bp = Blueprint("favourites", __name__)
fav_schema = FavouriteCreateSchema()


@favourites_bp.post("/favourites")
@login_required
def add_favourite():
    user = get_user_or_404(int(get_jwt_identity()))
    data = fav_schema.load(request.get_json() or {})
    if not Car.query.get(data["car_id"]):
        raise NotFoundError("Car not found")

    existing = Favourite.query.filter_by(user_id=user.id, car_id=data["car_id"]).first()
    if existing:
        raise ConflictError("Already in favourites")

    fav = Favourite(user_id=user.id, car_id=data["car_id"])
    db.session.add(fav)
    db.session.commit()
    return jsonify(favourite=fav.to_dict()), 201


@favourites_bp.delete("/favourites/<int:car_id>")
@login_required
def remove_favourite(car_id):
    user = get_user_or_404(int(get_jwt_identity()))
    fav = Favourite.query.filter_by(user_id=user.id, car_id=car_id).first()
    if not fav:
        raise NotFoundError("Favourite not found")
    db.session.delete(fav)
    db.session.commit()
    return jsonify(message="Removed from favourites")


@favourites_bp.get("/favourites")
@login_required
def list_favourites():
    user = get_user_or_404(int(get_jwt_identity()))
    favs = Favourite.query.filter_by(user_id=user.id).all()
    return jsonify(
        favourites=[
            {**f.to_dict(), "car": f.car.to_dict()} for f in favs
        ]
    )