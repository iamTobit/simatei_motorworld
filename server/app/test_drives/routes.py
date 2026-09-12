from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from .schemas import TestDriveCreateSchema, TestDriveStatusSchema
from .services import (
    book_test_drive,
    list_user_test_drives,
    list_car_test_drives,
    update_status,
)
from ..common.decorators import login_required, role_required
from ..accounts.services import get_user_or_404

test_drives_bp = Blueprint("test_drives", __name__)

create_schema = TestDriveCreateSchema()
status_schema = TestDriveStatusSchema()


@test_drives_bp.post("/test-drives")
@login_required
def book():
    user = get_user_or_404(int(get_jwt_identity()))
    data = create_schema.load(request.get_json() or {})
    td = book_test_drive(user.id, data)
    return jsonify(test_drive=td.to_dict()), 201


@test_drives_bp.get("/test-drives")
@login_required
def my_test_drives():
    user = get_user_or_404(int(get_jwt_identity()))
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)
    result = list_user_test_drives(user.id, page, limit)
    return jsonify(
        total=result.total,
        page=result.page,
        pages=result.pages,
        test_drives=[t.to_dict() for t in result.items],
    )


@test_drives_bp.get("/test-drives/car/<int:car_id>")
@login_required
def car_test_drives(car_id):
    user = get_user_or_404(int(get_jwt_identity()))
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)
    result = list_car_test_drives(car_id, user, page, limit)
    return jsonify(
        total=result.total,
        page=result.page,
        pages=result.pages,
        test_drives=[t.to_dict() for t in result.items],
    )


@test_drives_bp.put("/test-drives/<int:td_id>/status")
@role_required("admin")
def put_status(td_id):
    user = get_user_or_404(int(get_jwt_identity()))
    from .models import TestDrive

    td = TestDrive.query.get(td_id)
    if not td:
        return jsonify(error="Test drive not found"), 404
    data = status_schema.load(request.get_json() or {})
    td = update_status(td, data["status"], user)
    return jsonify(test_drive=td.to_dict())