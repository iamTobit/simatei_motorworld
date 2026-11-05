import os
from flask import Flask, jsonify
from .config import config_by_name
from .extensions import db, migrate, jwt, cache, cors


def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")
    app = Flask(__name__)
    config_cls = config_by_name.get(config_name, config_by_name["production"])
    app.config.from_object(config_cls)
    if os.getenv("DATABASE_URL"):
        from .config import _normalize_db_url

        app.config["SQLALCHEMY_DATABASE_URI"] = _normalize_db_url(os.getenv("DATABASE_URL"))

    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cache.init_app(app)
    cors_origins = app.config.get("CORS_ORIGINS", "*")
    cors.init_app(
        app,
        resources={
            r"/*": {
                "origins": cors_origins,
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
            }
        },
    )

    _orig_wsgi_app = app.wsgi_app

    def _prefix_api_middleware(environ, start_response):
        path = environ.get("PATH_INFO", "")
        if path and path not in ("/", "/health", "/api") and not path.startswith(("/api/", "/static/")):
            environ["PATH_INFO"] = f"/api{path}"
        return _orig_wsgi_app(environ, start_response)

    app.wsgi_app = _prefix_api_middleware

    # Register blueprints
    from .auth.routes import auth_bp
    from .accounts.routes import accounts_bp
    from .inventory.routes import inventory_bp
    from .enquiries.routes import enquiries_bp
    from .test_drives.routes import test_drives_bp
    from .favourites.routes import favourites_bp
    from .admin.routes import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(accounts_bp, url_prefix="/api")
    app.register_blueprint(inventory_bp, url_prefix="/api")
    app.register_blueprint(enquiries_bp, url_prefix="/api")
    app.register_blueprint(test_drives_bp, url_prefix="/api")
    app.register_blueprint(favourites_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api")

    # Error handlers
    from .common.errors import register_error_handlers
    register_error_handlers(app)

    _db_ready = {"initialized": False}

    def _ensure_db_initialized():
        if _db_ready["initialized"] or not os.getenv("DATABASE_URL"):
            return
        db.create_all()
        from .accounts.models import User
        from .inventory.models import Car, CarImage

        if User.query.count() == 0:
            admin = User(name="Admin", email="admin@simat.com", role="admin", phone="0740892332")
            admin.set_password("Admin123!")
            seller = User(name="John Seller", email="seller@simat.com", role="user", phone="+254712345678")
            seller.set_password("Seller123!")
            db.session.add_all([admin, seller])
            db.session.flush()
            car = Car(
                make="Toyota",
                model="Land Cruiser Prado",
                year=2020,
                price=6500000,
                condition="Used",
                fuel_type="Petrol",
                transmission="Automatic",
                location="Nairobi",
                description="Well maintained, one owner, full service history.",
                seller_id=seller.id,
            )
            db.session.add(car)
            db.session.flush()
            db.session.add_all([
                CarImage(url="https://images.pexels.com/photos/34166839/pexels-photo-34166839.jpeg", is_primary=True, car_id=car.id),
                CarImage(url="https://images.pexels.com/photos/26442876/pexels-photo-26442876.jpeg", car_id=car.id),
            ])
            db.session.commit()
        _db_ready["initialized"] = True

    @app.before_request
    def _auto_init_tables():
        if not _db_ready["initialized"]:
            try:
                _ensure_db_initialized()
            except Exception:
                db.session.rollback()

    @app.get("/")
    def home():
        return jsonify(
            status="ok",
            msg="Simatei world api is running",
            database_configured=bool(os.getenv("DATABASE_URL")),
        )

    @app.get("/health")
    def health():
        from sqlalchemy import text
        from .common.uploads import ensure_supabase_bucket

        db_ok = False
        db_error = None
        tables_initialized = False
        if not os.getenv("DATABASE_URL"):
            db_error = "DATABASE_URL environment variable is not set"
        else:
            try:
                db.session.execute(text("SELECT 1"))
                db_ok = True
                db.create_all()
                tables_initialized = True
                from .accounts.models import User
                from .inventory.models import Car, CarImage

                if User.query.count() == 0:
                    admin = User(name="Admin", email="admin@simat.com", role="admin", phone="0740892332")
                    admin.set_password("Admin123!")
                    seller = User(name="John Seller", email="seller@simat.com", role="user", phone="+254712345678")
                    seller.set_password("Seller123!")
                    db.session.add_all([admin, seller])
                    db.session.flush()
                    car = Car(
                        make="Toyota",
                        model="Land Cruiser Prado",
                        year=2020,
                        price=6500000,
                        condition="Used",
                        fuel_type="Petrol",
                        transmission="Automatic",
                        location="Nairobi",
                        description="Well maintained, one owner, full service history.",
                        seller_id=seller.id,
                    )
                    db.session.add(car)
                    db.session.flush()
                    db.session.add_all([
                        CarImage(url="https://images.pexels.com/photos/34166839/pexels-photo-34166839.jpeg", is_primary=True, car_id=car.id),
                        CarImage(url="https://images.pexels.com/photos/26442876/pexels-photo-26442876.jpeg", car_id=car.id),
                    ])
                    db.session.commit()
            except Exception as exc:
                db.session.rollback()
                db_error = str(exc)

        storage_info = ensure_supabase_bucket()

        return jsonify(
            status="ok" if db_ok else "degraded",
            database_connected=db_ok,
            database_error=db_error,
            tables_initialized=tables_initialized,
            supabase_storage=storage_info,
        )

    return app