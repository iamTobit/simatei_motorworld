from ..extensions import db
from .models import TestDrive
from ..inventory.models import Car
from ..common.errors import NotFoundError, APIError, ForbiddenError


def book_test_drive(user_id: int, data: dict) -> TestDrive:
    car = Car.query.get(data["car_id"])
    if not car:
        raise NotFoundError("Car not found")
    if not car.is_available:
        raise APIError("Car is not available for test drive", status_code=400)

    # Conflict check: only allow one active booking per car per slot
    conflict = TestDrive.query.filter_by(
        car_id=data["car_id"],
        preferred_date=data["preferred_date"],
        preferred_time=data["preferred_time"],
    ).filter(TestDrive.status.in_(["Requested", "Confirmed"])).first()

    if conflict:
        raise APIError("This slot is already booked", status_code=409)

    td = TestDrive(
        user_id=user_id,
        car_id=data["car_id"],
        preferred_date=data["preferred_date"],
        preferred_time=data["preferred_time"],
        status="Requested",
    )
    db.session.add(td)
    db.session.commit()
    return td


def list_user_test_drives(user_id: int, page=1, limit=20):
    return (
        TestDrive.query.filter_by(user_id=user_id)
        .order_by(TestDrive.created_at.desc())
        .paginate(page=page, per_page=limit, error_out=False)
    )


def list_car_test_drives(car_id: int, actor, page=1, limit=20):
    car = Car.query.get(car_id)
    if not car:
        raise NotFoundError("Car not found")
    if car.seller_id != actor.id and actor.role != "admin":
        raise ForbiddenError("Not authorised")
    return (
        TestDrive.query.filter_by(car_id=car_id)
        .order_by(TestDrive.preferred_date.desc())
        .paginate(page=page, per_page=limit, error_out=False)
    )


def update_status(td: TestDrive, new_status: str, actor) -> TestDrive:
    if actor.role != "admin":
        raise ForbiddenError("Only admins can update test drive status")
    td.status = new_status
    db.session.commit()
    return td