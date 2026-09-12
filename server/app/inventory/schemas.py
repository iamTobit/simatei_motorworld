from marshmallow import Schema, fields, validate, validates_schema, ValidationError


class CarImageSchema(Schema):
    id = fields.Int(dump_only=True)
    url = fields.Url(required=True)
    is_primary = fields.Bool(dump_only=True)


class CarSchema(Schema):
    id = fields.Int(dump_only=True)
    make = fields.Str(required=True, validate=validate.Length(max=50))
    model = fields.Str(required=True, validate=validate.Length(max=50))
    year = fields.Int(required=True)
    price = fields.Decimal(required=True, as_string=False)
    currency = fields.Str(load_default="KES", validate=validate.Length(equal=3))
    mileage = fields.Int(allow_none=True, validate=validate.Range(min=0))
    condition = fields.Str(
        required=True, validate=validate.OneOf(["New", "Used", "Certified Pre-Owned"])
    )
    fuel_type = fields.Str(
        required=True, validate=validate.OneOf(["Petrol", "Diesel", "Electric", "Hybrid"])
    )
    transmission = fields.Str(
        required=True, validate=validate.OneOf(["Manual", "Automatic", "CVT"])
    )
    color = fields.Str(allow_none=True, validate=validate.Length(max=30))
    description = fields.Str(allow_none=True, validate=validate.Length(max=2000))
    location = fields.Str(required=True, validate=validate.Length(max=100))
    is_negotiable = fields.Bool(load_default=False)
    images = fields.List(fields.Url(), required=True, validate=validate.Length(min=1, max=10))
    seller_id = fields.Int(dump_only=True)
    is_available = fields.Bool(dump_only=True)
    is_sold = fields.Bool(dump_only=True)
    views = fields.Int(dump_only=True)
    created_at = fields.DateTime(dump_only=True)

    @validates_schema
    def validate_year(self, data, **kwargs):
        from datetime import datetime

        if "year" in data:
            max_year = datetime.utcnow().year + 1
            if not (1900 <= data["year"] <= max_year):
                raise ValidationError({"year": [f"Year must be between 1900 and {max_year}"]})


class CarUpdateSchema(CarSchema):
    # All fields optional for updates
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.required = False


class CarAvailabilityUpdateSchema(Schema):
    is_sold = fields.Bool(load_default=None)
    is_available = fields.Bool(load_default=None)