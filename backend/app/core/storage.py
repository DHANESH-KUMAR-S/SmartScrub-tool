import pandas as pd
from typing import Dict, Optional
import uuid
from datetime import datetime
import os
import tempfile

class DatasetStorage:
    """In-memory storage for datasets and metadata"""
    
    def __init__(self):
        self.datasets: Dict[str, pd.DataFrame] = {}
        self.metadata: Dict[str, dict] = {}
        self.temp_dir = tempfile.mkdtemp()
    
    def store_dataset(self, df: pd.DataFrame, filename: str) -> str:
        """Store a dataset and return its ID"""
        dataset_id = str(uuid.uuid4())
        self.datasets[dataset_id] = df.copy()
        self.metadata[dataset_id] = {
            "filename": filename,
            "upload_timestamp": datetime.now().isoformat(),
            "original_shape": df.shape,
            "file_size": len(df.to_csv().encode('utf-8'))
        }
        return dataset_id
    
    def get_dataset(self, dataset_id: str) -> Optional[pd.DataFrame]:
        """Retrieve a dataset by ID"""
        return self.datasets.get(dataset_id)
    
    def get_metadata(self, dataset_id: str) -> Optional[dict]:
        """Retrieve dataset metadata by ID"""
        return self.metadata.get(dataset_id)
    
    def update_dataset(self, dataset_id: str, df: pd.DataFrame) -> bool:
        """Update an existing dataset"""
        if dataset_id in self.datasets:
            self.datasets[dataset_id] = df.copy()
            return True
        return False
    
    def delete_dataset(self, dataset_id: str) -> bool:
        """Delete a dataset and its metadata"""
        if dataset_id in self.datasets:
            del self.datasets[dataset_id]
            del self.metadata[dataset_id]
            return True
        return False
    
    def list_datasets(self) -> Dict[str, dict]:
        """List all stored datasets with metadata"""
        return self.metadata.copy()
    
    def save_temp_file(self, dataset_id: str, content: bytes, extension: str = "csv") -> str:
        """Save content to a temporary file and return the path"""
        filename = f"{dataset_id}.{extension}"
        filepath = os.path.join(self.temp_dir, filename)
        with open(filepath, 'wb') as f:
            f.write(content)
        return filepath

# Global storage instance
storage = DatasetStorage()