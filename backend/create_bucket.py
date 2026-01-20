"""Create GCS bucket for SmartScrub"""
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

project_id = os.getenv("GCS_PROJECT_ID")
bucket_name = os.getenv("GCS_BUCKET_NAME")

print(f"Project ID: {project_id}")
print(f"Bucket Name: {bucket_name}")
print(f"Credentials: {credentials_path}")

try:
    # Initialize client
    client = storage.Client(project=project_id)
    print("\n✓ GCS Client initialized")
    
    # Try to get the bucket
    try:
        bucket = client.get_bucket(bucket_name)
        print(f"✓ Bucket '{bucket_name}' already exists!")
        print(f"  Location: {bucket.location}")
        print(f"  Storage Class: {bucket.storage_class}")
    except Exception as e:
        if "404" in str(e):
            print(f"\nBucket '{bucket_name}' does not exist. Creating...")
            
            # Create bucket
            bucket = client.create_bucket(
                bucket_name,
                location="us-central1"  # Change to your preferred location
            )
            
            print(f"✓ Bucket '{bucket_name}' created successfully!")
            print(f"  Location: {bucket.location}")
            print(f"  Storage Class: {bucket.storage_class}")
        else:
            print(f"✗ Error accessing bucket: {e}")
            raise
    
    # Test write access
    print("\nTesting write access...")
    test_blob = bucket.blob("test/connection_test.txt")
    test_blob.upload_from_string("SmartScrub GCS connection test")
    print("✓ Write access confirmed")
    
    # Clean up test file
    test_blob.delete()
    print("✓ Delete access confirmed")
    
    print("\n" + "="*60)
    print("GCS Setup Complete!")
    print("="*60)
    print("Your SmartScrub app is now configured to use Google Cloud Storage")
    print(f"Bucket: gs://{bucket_name}")
    print("="*60)
    
except Exception as e:
    print(f"\n✗ Error: {e}")
    print("\nPossible solutions:")
    print("1. Make sure the service account has 'Storage Admin' role")
    print("2. Grant permissions via GCP Console:")
    print(f"   https://console.cloud.google.com/iam-admin/iam?project={project_id}")
    print("3. Or use gcloud command:")
    print(f"   gcloud projects add-iam-policy-binding {project_id} \\")
    print(f"     --member='serviceAccount:smartscrub-storage@{project_id}.iam.gserviceaccount.com' \\")
    print(f"     --role='roles/storage.admin'")
