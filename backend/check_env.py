"""Check environment variables"""
import os
from dotenv import load_dotenv

print("Before load_dotenv:")
print(f"  GCS_BUCKET_NAME: {os.getenv('GCS_BUCKET_NAME')}")
print(f"  GCS_PROJECT_ID: {os.getenv('GCS_PROJECT_ID')}")
print(f"  GOOGLE_APPLICATION_CREDENTIALS: {os.getenv('GOOGLE_APPLICATION_CREDENTIALS')}")

load_dotenv()

print("\nAfter load_dotenv:")
print(f"  GCS_BUCKET_NAME: {os.getenv('GCS_BUCKET_NAME')}")
print(f"  GCS_PROJECT_ID: {os.getenv('GCS_PROJECT_ID')}")
print(f"  GOOGLE_APPLICATION_CREDENTIALS: {os.getenv('GOOGLE_APPLICATION_CREDENTIALS')}")

# Check if .env file exists
env_path = os.path.join(os.path.dirname(__file__), '.env')
print(f"\n.env file exists: {os.path.exists(env_path)}")
print(f".env file path: {env_path}")
