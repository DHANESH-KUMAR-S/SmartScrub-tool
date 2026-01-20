#!/usr/bin/env python3
"""
Quick setup script to verify GCS configuration
"""
import os
import sys
from pathlib import Path

def check_env_file():
    """Check if .env file exists and has required variables"""
    env_path = Path('.env')
    
    if not env_path.exists():
        print("❌ .env file not found!")
        print("   Create one by copying .env.example:")
        print("   copy .env.example .env")
        return False
    
    print("✓ .env file found")
    
    # Read and check required variables
    required_vars = ['GCS_PROJECT_ID', 'GCS_BUCKET_NAME', 'GOOGLE_APPLICATION_CREDENTIALS']
    env_content = env_path.read_text()
    
    missing = []
    for var in required_vars:
        if var not in env_content or f"{var}=" not in env_content:
            missing.append(var)
    
    if missing:
        print(f"⚠ Missing environment variables: {', '.join(missing)}")
        return False
    
    print("✓ All required environment variables present")
    return True

def check_credentials_file():
    """Check if GCS credentials file exists"""
    # Try to load from .env
    env_path = Path('.env')
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith('GOOGLE_APPLICATION_CREDENTIALS='):
                creds_path = line.split('=', 1)[1].strip()
                creds_file = Path(creds_path)
                
                if creds_file.exists():
                    print(f"✓ Credentials file found: {creds_path}")
                    return True
                else:
                    print(f"❌ Credentials file not found: {creds_path}")
                    print("   Download your service account key from GCP Console")
                    return False
    
    print("⚠ Could not verify credentials file path")
    return False

def check_dependencies():
    """Check if required Python packages are installed"""
    try:
        import google.cloud.storage
        print("✓ google-cloud-storage installed")
        return True
    except ImportError:
        print("❌ google-cloud-storage not installed")
        print("   Install with: pip install -r requirements.txt")
        return False

def test_gcs_connection():
    """Test connection to GCS"""
    try:
        from google.cloud import storage
        from dotenv import load_dotenv
        
        load_dotenv()
        
        project_id = os.getenv('GCS_PROJECT_ID')
        bucket_name = os.getenv('GCS_BUCKET_NAME')
        
        if not project_id or not bucket_name:
            print("⚠ Cannot test connection - missing project ID or bucket name")
            return False
        
        print(f"\nTesting connection to GCS...")
        print(f"  Project: {project_id}")
        print(f"  Bucket: {bucket_name}")
        
        client = storage.Client(project=project_id)
        bucket = client.bucket(bucket_name)
        
        # Try to check if bucket exists
        if bucket.exists():
            print(f"✓ Successfully connected to bucket: {bucket_name}")
            
            # Try to list some blobs
            blobs = list(bucket.list_blobs(max_results=5))
            print(f"  Current objects in bucket: {len(blobs)}")
            
            return True
        else:
            print(f"❌ Bucket does not exist: {bucket_name}")
            print("   Create it in GCP Console: https://console.cloud.google.com/storage")
            return False
            
    except Exception as e:
        print(f"❌ Connection test failed: {str(e)}")
        return False

def main():
    """Run all checks"""
    print("=" * 60)
    print("SmartScrub GCS Setup Verification")
    print("=" * 60)
    print()
    
    checks = [
        ("Environment file", check_env_file),
        ("Credentials file", check_credentials_file),
        ("Python dependencies", check_dependencies),
    ]
    
    all_passed = True
    for name, check_func in checks:
        print(f"\nChecking {name}...")
        if not check_func():
            all_passed = False
    
    print("\n" + "=" * 60)
    
    if all_passed:
        print("✓ All basic checks passed!")
        print("\nTesting GCS connection...")
        if test_gcs_connection():
            print("\n🎉 Setup complete! You're ready to use GCS storage.")
            print("\nStart your server with: python main.py")
        else:
            print("\n⚠ Basic setup OK, but connection test failed.")
            print("   Check your GCP credentials and bucket configuration.")
    else:
        print("❌ Some checks failed. Please fix the issues above.")
        print("\nRefer to GCP_SETUP_GUIDE.md for detailed instructions.")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
