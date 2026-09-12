from datetime import date, datetime
from marshmallow import Schema, fields, validates, ValidationError


class TestDriveCreateSchema(Schema):
    car_id = fields.Int(required=True)
    preferred_date = fields.Date(required=True)
    preferred_time = fields.Time(required=True)

    @validates("preferred_date")
    def validate_date(self, value, **kwargs):
        if value < date.today():
            raise ValidationError("Preferred date must be in the future")

    @validates("preferred_time")
    def validate_time(self, value, **kwargs):
        hour = value.hour
        if hour < 8 or hour >= 18:
            raise ValidationError("Preferred time must be between 8 AM and 6 PM")


class TestDriveStatusSchema(Schema):
    status = fields.Str(
        required=True,
        validate=lambda s: s in {"Requested", "Confirmed", "Completed", "Cancelled"},
    )