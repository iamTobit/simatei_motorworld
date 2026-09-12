from PIL import Image
from io import BytesIO
import requests
from celery_worker import celery


@celery.task(name="inventory.optimize_image")
def optimize_image(image_url: str, output_path: str):
    """Download, resize and save an image. Hook this into your upload flow."""
    resp = requests.get(image_url, timeout=15)
    resp.raise_for_status()
    img = Image.open(BytesIO(resp.content))
    img.thumbnail((1200, 1200))
    img.save(output_path, optimize=True, quality=85)
    return output_path