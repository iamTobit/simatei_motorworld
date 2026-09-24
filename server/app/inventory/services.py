from sqlalchemy import or_
from ..extensions import db, cache
from .models import Car, CarImage
from ..common.errors import ForbiddenError, NotFoundError, APIError
from ..common.uploads import save_image, delete_image


def list_cars(filters: dict, page: int, limit: int):
    query = Car.query

    if filters.get("make"):
        query = query.filter(Car.make.ilike(f"%{filters['make']}%"))
    if filters.get("model"):
        query = query.filter(Car.model.ilike(f"%{filters['model']}%"))
    if filters.get("year_min"):
        query = query.filter(Car.year >= filters["year_min"])
    if filters.get("year_max"):
        query = query.filter(Car.year <= filters["year_max"])
    if filters.get("price_min"):
        query = query.filter(Car.price >= filters["price_min"])
    if filters.get("price_max"):
        query = query.filter(Car.price <= filters["price_max"])
    if filters.get("fuel_type"):
        query = query.filter(Car.fuel_type == filters["fuel_type"])
    if filters.get("transmission"):
        query = query.filter(Car.transmission == filters["transmission"])
    if filters.get("condition"):
        query = query.filter(Car.condition == filters["condition"])
    if filters.get("location"):
        query = query.filter(Car.location.ilike(f"%{filters['location']}%"))
    if filters.get("is_available") is not None:
        query = query.filter(Car.is_available == filters["is_available"])
    if filters.get("q"):
        term = f"%{filters['q']}%"
        query = query.filter(
            or_(Car.description.ilike(term), Car.make.ilike(term), Car.model.ilike(term))
        )

    sort_field = filters.get("sort_by", "created_at")
    if sort_field not in {"price", "year", "created_at", "views"}:
        sort_field = "created_at"
    order_col = getattr(Car, sort_field)
    if filters.get("sort_order", "desc").lower() == "asc":
        query = query.order_by(order_col.asc())
    else:
        query = query.order_by(order_col.desc())

    return query.paginate(page=page, per_page=limit, error_out=False)


def get_car_or_404(car_id: int) -> Car:
    car = Car.query.get(car_id)
    if not car:
        raise NotFoundError("Car not found")
    return car


from ..common.uploads import save_image, delete_image

def create_car(seller_id: int, image_files: list, data: dict) -> Car:
    """
    image_files: list[FileStorage] from request.files.getlist("images")
    data:        the rest of the car fields (no 'images' key)
    """
    car = Car(seller_id=seller_id, **data)
    db.session.add(car)
    db.session.flush()  # get car.id

    saved_paths = []
    try:
        for i, file in enumerate(image_files):
            rel_path = save_image(file)
            saved_paths.append(rel_path)
            db.session.add(
                CarImage(url=rel_path, is_primary=(i == 0), car_id=car.id)
            )
        db.session.commit()
    except Exception:
        # Roll back DB AND clean up any files already written
        db.session.rollback()
        for p in saved_paths:
            delete_image(p)
        raise

    return car

def update_car(car: Car, actor, data: dict) -> Car:
    if car.seller_id != actor.id and actor.role != "admin":
        raise ForbiddenError("Not authorised to edit this car")

    images = data.pop("images", None)
    for field, value in data.items():
        setattr(car, field, value)

    if images is not None:
        CarImage.query.filter_by(car_id=car.id).delete()
        for i, url in enumerate(images):
            db.session.add(CarImage(url=url, is_primary=(i == 0), car_id=car.id))

    db.session.commit()
    return car


def delete_car(car: Car, actor):
    if car.seller_id != actor.id and actor.role != "admin":
        raise ForbiddenError("Not authorised to delete this car")
    db.session.delete(car)
    db.session.commit()


def mark_status(car: Car, actor, is_sold=None, is_available=None) -> Car:
    if car.seller_id != actor.id and actor.role != "admin":
        raise ForbiddenError("Not authorised")

    if is_sold is True and is_available is True:
        raise APIError("Car cannot be both available and sold", status_code=400)

    if is_sold is not None:
        car.is_sold = is_sold
    if is_available is not None:
        car.is_available = is_available
    if car.is_sold:
        car.is_available = False

    db.session.commit()
    return car


def get_filter_options():
    cached = cache.get("car_filter_options")
    if cached:
        return cached

    makes = [r[0] for r in db.session.query(Car.make).distinct().all() if r[0]]
    models = [r[0] for r in db.session.query(Car.model).distinct().all() if r[0]]
    years = [r[0] for r in db.session.query(Car.year).distinct().all() if r[0]]
    locations = [r[0] for r in db.session.query(Car.location).distinct().all() if r[0]]

    result = {
        "makes": sorted(makes),
        "models": sorted(models),
        "years": sorted(years, reverse=True),
        "locations": sorted(locations),
    }
    cache.set("car_filter_options", result, timeout=600)
    return result