from ..extensions import db
from .models import Enquiry
from ..inventory.models import Car
from ..common.errors import NotFoundError, ForbiddenError
from ..common.validators import whatsapp_link


def create_enquiry(data: dict, user=None) -> Enquiry:
    if data.get("car_id"):
        if not Car.query.get(data["car_id"]):
            raise NotFoundError("Car not found")

    enquiry = Enquiry(
        name=data["name"],
        email=data["email"].lower(),
        phone=data.get("phone"),
        message=data["message"],
        enquiry_type=data["enquiry_type"],
        car_id=data.get("car_id"),
        user_id=user.id if user else None,
    )
    db.session.add(enquiry)
    db.session.commit()
    return enquiry


def list_user_enquiries(user_id: int, page=1, limit=20):
    return (
        Enquiry.query.filter_by(user_id=user_id)
        .order_by(Enquiry.created_at.desc())
        .paginate(page=page, per_page=limit, error_out=False)
    )


def get_enquiry_or_404(enquiry_id: int) -> Enquiry:
    enq = Enquiry.query.get(enquiry_id)
    if not enq:
        raise NotFoundError("Enquiry not found")
    return enq


def update_status(enquiry: Enquiry, new_status: str, actor) -> Enquiry:
    if actor.role != "admin":
        raise ForbiddenError("Only admins can update enquiry status")
    enquiry.status = new_status
    db.session.commit()
    return enquiry


def generate_whatsapp(enquiry: Enquiry) -> str:
    if not enquiry.phone:
        raise NotFoundError("Enquiry has no phone number")
    default = (
        f"Hello {enquiry.name}, thank you for your enquiry at SIMATEI MOTOR WORLD. "
        f"How can we assist you further?"
    )
    return whatsapp_link(enquiry.phone, default)