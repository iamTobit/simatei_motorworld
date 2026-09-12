from datetime import datetime
from ..extensions import db


class TestDrive(db.Model):
    __tablename__ = "test_drives"

    id = db.Column(db.Integer, primary_key=True)
    preferred_date = db.Column(db.Date, nullable=False, index=True)
    preferred_time = db.Column(db.Time, nullable=False)
    status = db.Column(db.String(20), default="Requested", nullable=False)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    car_id = db.Column(
        db.Integer, db.ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="test_drives")
    car = db.relationship("Car", back_populates="test_drives")

    def to_dict(self):
        return {
            "id": self.id,
            "preferred_date": self.preferred_date.isoformat(),
            "preferred_time": self.preferred_time.strftime("%H:%M"),
            "status": self.status,
            "user_id": self.user_id,
            "car_id": self.car_id,
            "created_at": self.created_at.isoformat(),
        }