from marshmallow import Schema, fields


class FavouriteCreateSchema(Schema):
    car_id = fields.Int(required=True)