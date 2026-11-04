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

    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cache.init_app(app)
    cors_origins = app.config.get("CORS_ORIGINS", "*")
    cors.init_app(app, resources={r"/api/*": {"origins": cors_origins}})

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

    @app.get("/")
    def home():
        return jsonify(status="ok",
                        msg="Simatei world api is running")
    
    @app.get("/health")
    def health():
        return jsonify(status="ok")

    return app