from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from .schemas import CarSchema, CarUpdateSchema, CarAvailabilityUpdateSchema
from ..common.decorators import login_required
from .services import (
    list_cars,
    get_car_or_404,
    create_car,
    update_car,
    delete_car,
    mark_status,
    get_filter_options,
)
from ..common.decorators import login_required, role_required
from ..accounts.services import get_user_or_404
from ..extensions import db

inventory_bp = Blueprint("inventory", __name__)

car_schema = CarSchema()
car_update_schema = CarUpdateSchema()
availability_schema = CarAvailabilityUpdateSchema()


@inventory_bp.get("/cars")
def get_cars():
    filters = {
        "make": request.args.get("make"),
        "model": request.args.get("model"),
        "year_min": request.args.get("year_min", type=int),
        "year_max": request.args.get("year_max", type=int),
        "price_min": request.args.get("price_min", type=float),
        "price_max": request.args.get("price_max", type=float),
        "fuel_type": request.args.get("fuel_type"),
        "transmission": request.args.get("transmission"),
        "condition": request.args.get("condition"),
        "location": request.args.get("location"),
        "is_available": (
            request.args.get("is_available", type=lambda v: v.lower() == "true")
            if request.args.get("is_available") is not None
            else None
        ),
        "q": request.args.get("q"),
        "sort_by": request.args.get("sort_by", "created_at"),
        "sort_order": request.args.get("sort_order", "desc"),
    }
    page = request.args.get("page", 1, type=int)
    limit = min(request.args.get("limit", 20, type=int), 100)
    pagination = list_cars(filters, page, limit)

    return jsonify(
        total=pagination.total,
        page=pagination.page,
        pages=pagination.pages,
        cars=[c.to_dict() for c in pagination.items],
    )


@inventory_bp.get("/cars/filters")
def filter_options():
    return jsonify(get_filter_options())


@inventory_bp.get("/cars/<int:car_id>")
def get_car(car_id):
    car = get_car_or_404(car_id)
    car.views = (car.views or 0) + 1
    db.session.commit()
    return jsonify(car=car.to_dict())

car_schema = CarSchema()
car_update_schema = CarUpdateSchema()
availability_schema = CarAvailabilityUpdateSchema()


@inventory_bp.post("/cars")
@login_required
def add_car():
    from flask_jwt_extended import get_jwt_identity
    from ..accounts.services import get_user_or_404

    user = get_user_or_404(int(get_jwt_identity()))
    data = car_schema.load(request.get_json() or {})
    car = create_car(user.id, data)
    return jsonify(car=car.to_dict()), 201


@inventory_bp.put("/cars/<int:car_id>")
@login_required
def put_car(car_id):
    from flask_jwt_extended import get_jwt_identity
    from ..accounts.services import get_user_or_404

    user = get_user_or_404(int(get_jwt_identity()))
    car = get_car_or_404(car_id)
    data = car_update_schema.load(request.get_json() or {}, partial=True)
    car = update_car(car, user, data)
    return jsonify(car=car.to_dict())


@inventory_bp.delete("/cars/<int:car_id>")
@login_required
def remove_car(car_id):
    from flask_jwt_extended import get_jwt_identity
    from ..accounts.services import get_user_or_404

    user = get_user_or_404(int(get_jwt_identity()))
    car = get_car_or_404(car_id)
    delete_car(car, user)
    return jsonify(message="Car deleted")


@inventory_bp.patch("/cars/<int:car_id>/status")
@login_required
def patch_status(car_id):
    from flask_jwt_extended import get_jwt_identity
    from ..accounts.services import get_user_or_404

    user = get_user_or_404(int(get_jwt_identity()))
    car = get_car_or_404(car_id)
    data = availability_schema.load(request.get_json() or {})
    car = mark_status(car, user, data.get("is_sold"), data.get("is_available"))
    return jsonify(car=car.to_dict())