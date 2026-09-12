from flask import Blueprint, jsonify
from .services import dashboard_stats, popular_cars
from ..common.decorators import role_required

admin_bp = Blueprint("admin", __name__)


@admin_bp.get("/admin/analytics")
@role_required("admin")
def analytics():
    return jsonify(dashboard_stats())


@admin_bp.get("/admin/cars/popular")
@role_required("admin")
def popular():
    return jsonify(popular_cars())