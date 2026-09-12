import bcrypt
from datetime import datetime
from ..extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="user", nullable=False)  # user | admin
    is_blocked = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    cars = db.relationship(
        "Car", back_populates="seller", cascade="all, delete-orphan", lazy="dynamic"
    )
    enquiries = db.relationship(
        "Enquiry", back_populates="user", cascade="all, delete-orphan", lazy="dynamic"
    )
    test_drives = db.relationship(
        "TestDrive", back_populates="user", cascade="all, delete-orphan", lazy="dynamic"
    )
    favourites = db.relationship(
        "Favourite", back_populates="user", cascade="all, delete-orphan", lazy="dynamic"
    )

    def set_password(self, plain: str):
        rounds = 10
        self.password_hash = bcrypt.hashpw(
            plain.encode("utf-8"), bcrypt.gensalt(rounds)
        ).decode("utf-8")

    def check_password(self, plain: str) -> bool:
        return bcrypt.checkpw(
            plain.encode("utf-8"), self.password_hash.encode("utf-8")
        )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "is_blocked": self.is_blocked,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<User {self.email}>"