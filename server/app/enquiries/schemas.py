from marshmallow import Schema, fields, validate


class EnquiryCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    email = fields.Email(required=True)
    phone = fields.Str(allow_none=True)
    message = fields.Str(required=True, validate=validate.Length(min=10, max=1000))
    enquiry_type = fields.Str(
        required=True, validate=validate.OneOf(["Buy", "Sell", "Test Drive", "General"])
    )
    car_id = fields.Int(allow_none=True)


class EnquiryStatusUpdateSchema(Schema):
    status = fields.Str(
        required=True, validate=validate.OneOf(["Pending", "Replied", "Closed"])
    )