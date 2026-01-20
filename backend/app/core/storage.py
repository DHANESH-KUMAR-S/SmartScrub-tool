import pandas as pd
from typing import Dict, Optional
import uuid
from datetime import datetime
import os
import tempfile
import json
import io

# Try to import GCS, fallback to in-memory if not available
try:
    from google.cloud import storage as gcs_storage
    GCS_AVAILABLE = True
except ImportError:
    GCS_AVAILABLE = False

class DatasetStorage:
    """Storage for datasets with GCS support and in-memory fallback"""
    
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
        
        # GCS configuration
        self.use_gcs = False
        self.gcs_bucket_name = os.getenv("GCS_BUCKET_NAME")
        self.gcs_project_id = os.getenv("GCS_PROJECT_ID")
        
        # Set credentials path
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if credentials_path and not os.path.isabs(credentials_path):
            # If relative path, make it relative to backend directory
            credentials_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), credentials_path)
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path
        
        # Initialize GCS if credentials are available
        if GCS_AVAILABLE and self.gcs_bucket_name:
            try:
                self.gcs_client = gcs_storage.Client(project=self.gcs_project_id)
                self.bucket = self.gcs_client.bucket(self.gcs_bucket_name)
                
                # Test connection by checking if bucket exists
                if self.bucket.exists():
                    self.use_gcs = True
                    print(f"✓ GCS Storage initialized: {self.gcs_bucket_name}")
                else:
                    print(f"⚠ GCS bucket '{self.gcs_bucket_name}' does not exist. Using in-memory storage.")
                    self.use_gcs = False
            except Exception as e:
                print(f"⚠ GCS initialization failed: {e}. Using in-memory storage.")
                self.use_gcs = False
        else:
            if not GCS_AVAILABLE:
                print("⚠ google-cloud-storage not installed. Using in-memory storage.")
            else:
                print("⚠ GCS not configured. Using in-memory storage.")
        
        # Fallback in-memory storage
        if not self.use_gcs:
            self.datasets: Dict[str, pd.DataFrame] = {}
            self.metadata: Dict[str, dict] = {}
    
    def _get_blob_path(self, dataset_id: str, file_type: str = "data") -> str:
        """Generate GCS blob path"""
        if file_type == "data":
            return f"datasets/{dataset_id}/data.parquet"
        elif file_type == "metadata":
            return f"datasets/{dataset_id}/metadata.json"
        return f"datasets/{dataset_id}/{file_type}"
    
    def store_dataset(self, df: pd.DataFrame, filename: str, user_id: Optional[str] = None) -> str:
        """Store a dataset and return its ID"""
        dataset_id = str(uuid.uuid4())
        
        metadata = {
            "filename": filename,
            "upload_timestamp": datetime.now().isoformat(),
            "original_shape": list(df.shape),
            "file_size": len(df.to_csv().encode('utf-8')),
            "user_id": user_id
        }
        
        if self.use_gcs:
            try:
                print(f"Storing dataset {dataset_id} to GCS...")
                # Store dataset as parquet in GCS
                parquet_buffer = io.BytesIO()
                df.to_parquet(parquet_buffer, index=False)
                parquet_buffer.seek(0)
                
                data_blob = self.bucket.blob(self._get_blob_path(dataset_id, "data"))
                data_blob.upload_from_file(parquet_buffer, content_type='application/octet-stream')
                print(f"✓ Data uploaded to GCS")
                
                # Store metadata as JSON in GCS
                metadata_blob = self.bucket.blob(self._get_blob_path(dataset_id, "metadata"))
                metadata_blob.upload_from_string(
                    json.dumps(metadata),
                    content_type='application/json'
                )
                print(f"✓ Metadata uploaded to GCS")
                print(f"✓ Dataset {dataset_id} stored in GCS successfully")
            except Exception as e:
                print(f"✗ GCS storage failed: {e}")
                print(f"Falling back to in-memory storage for this dataset")
                # Fallback to in-memory for this dataset
                if not hasattr(self, 'datasets'):
                    self.datasets = {}
                    self.metadata = {}
                self.datasets[dataset_id] = df.copy()
                self.metadata[dataset_id] = metadata
        else:
            # In-memory storage
            self.datasets[dataset_id] = df.copy()
            self.metadata[dataset_id] = metadata
            print(f"✓ Dataset {dataset_id} stored in memory")
        
        return dataset_id
    
    def get_dataset(self, dataset_id: str) -> Optional[pd.DataFrame]:
        """Retrieve a dataset by ID"""
        if self.use_gcs:
            try:
                blob = self.bucket.blob(self._get_blob_path(dataset_id, "data"))
                if not blob.exists():
                    return None
                
                parquet_data = blob.download_as_bytes()
                df = pd.read_parquet(io.BytesIO(parquet_data))
                return df
            except Exception as e:
                print(f"✗ Failed to retrieve dataset from GCS: {e}")
                return None
        else:
            return self.datasets.get(dataset_id)
    
    def get_metadata(self, dataset_id: str) -> Optional[dict]:
        """Retrieve dataset metadata by ID"""
        if self.use_gcs:
            try:
                blob = self.bucket.blob(self._get_blob_path(dataset_id, "metadata"))
                if not blob.exists():
                    return None
                
                metadata_json = blob.download_as_text()
                return json.loads(metadata_json)
            except Exception as e:
                print(f"✗ Failed to retrieve metadata from GCS: {e}")
                return None
        else:
            return self.metadata.get(dataset_id)
    
    def update_dataset(self, dataset_id: str, df: pd.DataFrame) -> bool:
        """Update an existing dataset"""
        if self.use_gcs:
            try:
                # Check if dataset exists
                blob = self.bucket.blob(self._get_blob_path(dataset_id, "data"))
                if not blob.exists():
                    return False
                
                # Update dataset
                parquet_buffer = io.BytesIO()
                df.to_parquet(parquet_buffer, index=False)
                parquet_buffer.seek(0)
                
                blob.upload_from_file(parquet_buffer, content_type='application/octet-stream')
                
                # Update metadata with new shape
                metadata = self.get_metadata(dataset_id)
                if metadata:
                    metadata["original_shape"] = list(df.shape)
                    metadata["last_modified"] = datetime.now().isoformat()
                    
                    metadata_blob = self.bucket.blob(self._get_blob_path(dataset_id, "metadata"))
                    metadata_blob.upload_from_string(
                        json.dumps(metadata),
                        content_type='application/json'
                    )
                
                return True
            except Exception as e:
                print(f"✗ Failed to update dataset in GCS: {e}")
                return False
        else:
            if dataset_id in self.datasets:
                self.datasets[dataset_id] = df.copy()
                return True
            return False
    
    def delete_dataset(self, dataset_id: str) -> bool:
        """Delete a dataset and its metadata"""
        if self.use_gcs:
            try:
                # Delete all blobs for this dataset
                blobs = self.bucket.list_blobs(prefix=f"datasets/{dataset_id}/")
                for blob in blobs:
                    blob.delete()
                return True
            except Exception as e:
                print(f"✗ Failed to delete dataset from GCS: {e}")
                return False
        else:
            if dataset_id in self.datasets:
                del self.datasets[dataset_id]
                del self.metadata[dataset_id]
                return True
            return False
    
    def list_datasets(self, user_id: Optional[str] = None) -> Dict[str, dict]:
        """List all stored datasets with metadata"""
        if self.use_gcs:
            try:
                datasets = {}
                # List all metadata files
                blobs = self.bucket.list_blobs(prefix="datasets/")
                
                for blob in blobs:
                    if blob.name.endswith("metadata.json"):
                        metadata_json = blob.download_as_text()
                        metadata = json.loads(metadata_json)
                        
                        # Filter by user_id if provided
                        if user_id is None or metadata.get("user_id") == user_id:
                            dataset_id = blob.name.split("/")[1]
                            datasets[dataset_id] = metadata
                
                return datasets
            except Exception as e:
                print(f"✗ Failed to list datasets from GCS: {e}")
                return {}
        else:
            if user_id is None:
                return self.metadata.copy()
            else:
                return {
                    k: v for k, v in self.metadata.items()
                    if v.get("user_id") == user_id
                }
    
    def save_temp_file(self, dataset_id: str, content: bytes, extension: str = "csv") -> str:
        """Save content to a temporary file and return the path"""
        filename = f"{dataset_id}.{extension}"
        filepath = os.path.join(self.temp_dir, filename)
        with open(filepath, 'wb') as f:
            f.write(content)
        return filepath

# Global storage instance
storage = DatasetStorage()