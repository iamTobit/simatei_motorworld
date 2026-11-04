import os
import traceback
from flask import Flask, jsonify

try:
    from app import create_app

    app = create_app(os.getenv("FLASK_ENV", "production"))
except Exception as exc:
    _startup_error = f"{type(exc).__name__}: {exc}"
    _startup_tb = traceback.format_exc()
    app = Flask(__name__)

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def startup_error_handler(path):
        return (
            jsonify(
                status="error",
                error="Application failed to initialize",
                details=_startup_error,
                traceback=_startup_tb.splitlines()[-10:],
            ),
            500,
        )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=app.config.get("DEBUG", False))