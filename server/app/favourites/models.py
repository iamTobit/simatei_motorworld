from datetime import datetime
from ..extensions import db


class Favourite(db.Model):
    __tablename__ = "favourites"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    car_id = db.Column(
        db.Integer, db.ForeignKey("cars.id", ondelete="CASCADE"), nullable=False
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="favourites")
    car = db.relationship("Car", back_populates="favourites")

    __table_args__ = (
        db.UniqueConstraint("user_id", "car_id", name="uq_favourite_user_car"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "car_id": self.car_id,
            "created_at": self.created_at.isoformat(),
        }