from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from .schemas import EnquiryCreateSchema, EnquiryStatusUpdateSchema
from .services import (
    create_enquiry,
    list_user_enquiries,
    get_enquiry_or_404,
    update_status,
    generate_whatsapp,
)
from ..common.decorators import login_required, optional_auth, role_required
from ..accounts.services import get_user_or_404

enquiries_bp = Blueprint("enquiries", __name__)

create_schema = EnquiryCreateSchema()
status_schema = EnquiryStatusUpdateSchema()


@enquiries_bp.post("/enquiries")
@optional_auth
def post_enquiry():
    data = create_schema.load(request.get_json() or {})
    user = None
    try:
        uid = get_jwt_identity()
        if uid:
            user = get_user_or_404(int(uid))
    except Exception:
        user = None

    enquiry = create_enquiry(data, user)
    return jsonify(enquiry=enquiry.to_dict()), 201


@enquiries_bp.get("/enquiries")
@login_required
def my_enquiries():
    user = get_user_or_404(int(get_jwt_identity()))
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)
    result = list_user_enquiries(user.id, page, limit)
    return jsonify(
        total=result.total,
        page=result.page,
        pages=result.pages,
        enquiries=[e.to_dict() for e in result.items],
    )


@enquiries_bp.get("/enquiries/<int:enquiry_id>")
@login_required
def get_enquiry(enquiry_id):
    user = get_user_or_404(int(get_jwt_identity()))
    enquiry = get_enquiry_or_404(enquiry_id)
    if user.role != "admin" and enquiry.user_id != user.id:
        return jsonify(error="Forbidden"), 403
    return jsonify(enquiry=enquiry.to_dict())


@enquiries_bp.put("/enquiries/<int:enquiry_id>/status")
@role_required("admin")
def put_enquiry_status(enquiry_id):
    user = get_user_or_404(int(get_jwt_identity()))
    enquiry = get_enquiry_or_404(enquiry_id)
    data = status_schema.load(request.get_json() or {})
    enquiry = update_status(enquiry, data["status"], user)
    return jsonify(enquiry=enquiry.to_dict())


@enquiries_bp.post("/enquiries/<int:enquiry_id>/whatsapp")
@login_required
def enquiry_whatsapp(enquiry_id):
    enquiry = get_enquiry_or_404(enquiry_id)
    link = generate_whatsapp(enquiry)
    return jsonify(whatsapp_url=link)