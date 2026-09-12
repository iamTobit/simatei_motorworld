from marshmallow import Schema, fields, validate


class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=True)
    phone = fields.Str(allow_none=True, validate=validate.Length(max=20))
    role = fields.Str(dump_only=True)
    is_blocked = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)


class ProfileUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(min=2, max=100))
    phone = fields.Str(allow_none=True, validate=validate.Length(max=20))


class RoleUpdateSchema(Schema):
    role = fields.Str(required=True, validate=validate.OneOf(["user", "admin"]))