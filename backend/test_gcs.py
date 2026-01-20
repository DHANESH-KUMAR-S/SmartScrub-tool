"""Test GCS connection and bucket access"""
import os
from dotenv import load_dotenv
from google.cloud import storage

# Load environment variables
load_dotenv()

# Set credentials
credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if credentials_path and not os.path.isabs(credentials_path):
    credentials_path = os.path.join(os.path.dirname(__file__), credentials_path)
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path

print(f"Credentials path: {credentials_path}")
print(f"Credentials exist: {os.path.exists(credentials_path)}")

# Test connection
try:
    project_id = os.getenv("GCS_PROJECT_ID")
    bucket_name = os.getenv("GCS_BUCKET_NAME")
    
    print(f"\nProject ID: {project_id}")
    print(f"Bucket Name: {bucket_name}")
    
    # Initialize client
    client = storage.Client(project=project_id)
    print("✓ GCS Client initialized successfully")
    
    # Check bucket
    bucket = client.bucket(bucket_name)
    if bucket.exists():
        print(f"✓ Bucket '{bucket_name}' exists and is accessible")
        
        # List some blobs
        blobs = list(client.list_blobs(bucket_name, max_results=5))
        print(f"  Files in bucket: {len(blobs)}")
        for blob in blobs:
            print(f"    - {blob.name}")
    else:
        print(f"✗ Bucket '{bucket_name}' does not exist")
        print("\nTo create the bucket, run:")
        print(f"  gsutil mb -p {project_id} -l us-central1 gs://{bucket_name}")
        print("\nOr create it in the GCP Console:")
        print(f"  https://console.cloud.google.com/storage/browser?project={project_id}")
        
except Exception as e:
    print(f"✗ Error: {e}")
    print("\nMake sure:")
    print("1. The service account has Storage Admin permissions")
    print("2. The bucket exists in your GCP project")
    print("3. The credentials file is valid")
