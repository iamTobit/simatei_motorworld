from sqlalchemy import func
from ..extensions import db
from ..inventory.models import Car
from ..enquiries.models import Enquiry
from ..favourites.models import Favourite


def dashboard_stats():
    total_cars = Car.query.count()
    available_cars = Car.query.filter_by(is_available=True).count()
    sold_cars = Car.query.filter_by(is_sold=True).count()
    total_enquiries = Enquiry.query.count()
    pending_enquiries = Enquiry.query.filter_by(status="Pending").count()
    total_users = db.session.query(func.count("users.id")).scalar()  # placeholder

    return {
        "total_cars": total_cars,
        "available_cars": available_cars,
        "sold_cars": sold_cars,
        "total_enquiries": total_enquiries,
        "pending_enquiries": pending_enquiries,
    }


def popular_cars(limit=10):
    # By views
    by_views = (
        Car.query.order_by(Car.views.desc()).limit(limit).all()
    )

    # By favourites count
    fav_counts = (
        db.session.query(Favourite.car_id, func.count(Favourite.id).label("fav_count"))
        .group_by(Favourite.car_id)
        .order_by(func.count(Favourite.id).desc())
        .limit(limit)
        .all()
    )
    fav_car_ids = [row[0] for row in fav_counts]
    fav_cars = Car.query.filter(Car.id.in_(fav_car_ids)).all() if fav_car_ids else []

    return {
        "most_viewed": [c.to_dict(include_images=False) for c in by_views],
        "most_favourited": [c.to_dict(include_images=False) for c in fav_cars],
    }