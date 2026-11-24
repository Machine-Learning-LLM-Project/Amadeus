
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

# Find the directory containing this Python script
BASE_DIR = Path(__file__).resolve().parent.parent

# Explicitly load .env from that directory
ENV_FILE = BASE_DIR / ".env"

# Load environment variables
load_dotenv(
    dotenv_path=str(ENV_FILE)
)

CANVAS_URL = os.getenv("CANVAS_URL")
API_TOKEN = os.getenv("CANVAS_API_TOKEN")

if CANVAS_URL is None or API_TOKEN is None:
    raise ValueError("Missing Canvas URL or API token in .env file")


def get_student_tasks(course_id, student_id):
    url = (
        f"{CANVAS_URL}/api/v1/courses/"
        f"{course_id}/analytics/users/"
        f"{student_id}/assignments"
    )

    headers = {
        "Authorization": f"Bearer {API_TOKEN}"
    }

    response = requests.get(
        url,
        headers=headers,
        timeout=30
    )

    response.raise_for_status()
    return response.json()

headers = {
    "Authorization": f"Bearer {API_TOKEN}"
}

response = requests.get(
    f"{CANVAS_URL}/api/v1/users/self",
    headers=headers
)
print(response.status_code)
print(response.text)

response = requests.get(
    f"{CANVAS_URL}/api/v1/courses",
    headers=headers
)
print(response.status_code)
print(response.text)

# Example usage
# tasks = get_student_tasks(123, 456)

# for task in tasks:
#     print({
#         "title": task.get("title"),
#         "due_date": task.get("due_at"),
#         "points": task.get("points_possible"),
#         "submission": task.get("submission")
#     })
