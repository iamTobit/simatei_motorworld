from datetime import datetime
from ..extensions import db


class Enquiry(db.Model):
    __tablename__ = "enquiries"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    message = db.Column(db.Text, nullable=False)
    enquiry_type = db.Column(db.String(20), nullable=False)  # Buy | Sell | Test Drive | General
    status = db.Column(db.String(20), default="Pending", nullable=False)  # Pending | Replied | Closed
    car_id = db.Column(db.Integer, db.ForeignKey("cars.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    car = db.relationship("Car", back_populates="enquiries")
    user = db.relationship("User", back_populates="enquiries")

    __table_args__ = (
        db.Index("ix_enquiries_status_created", "status", "created_at"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "message": self.message,
            "enquiry_type": self.enquiry_type,
            "status": self.status,
            "car_id": self.car_id,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat(),
        }