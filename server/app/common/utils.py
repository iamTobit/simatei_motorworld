def coerce_form(raw: dict) -> dict:
    """
    Normalise multipart/form-data values (all strings) into
    the types Marshmallow expects. Mutates a copy and returns it.
    """
    out = dict(raw)

    # Booleans — accept common truthy/falsy strings
    for field in ("is_negotiable", "is_available", "is_sold"):
        if field in out:
            out[field] = str(out[field]).lower() in ("true", "1", "yes", "on")

    # Integers — empty string means "not provided"
    for field in ("year", "mileage"):
        if field in out:
            if out[field] in ("", None):
                out[field] = None
            else:
                out[field] = int(out[field])

    # Decimals — strip thousands separators, keep as string for Marshmallow
    if "price" in out:
        if out["price"] in ("", None):
            out["price"] = None
        else:
            out["price"] = str(out["price"]).replace(",", "").strip()

    # Optional strings — empty string → None
    for field in ("color", "description"):
        if out.get(field) == "":
            out[field] = None

    return out