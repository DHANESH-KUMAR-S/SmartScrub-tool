from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import io
from app.core.storage import storage

router = APIRouter()

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload a CSV dataset"""
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        # Read file content
        content = await file.read()
        
        # Parse CSV
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        
        # Validate dataset
        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        
        if len(df.columns) == 0:
            raise HTTPException(status_code=400, detail="No columns found in the dataset")
        
        # Store dataset
        dataset_id = storage.store_dataset(df, file.filename)
        
        return {
            "success": True,
            "dataset_id": dataset_id,
            "filename": file.filename,
            "rows": len(df),
            "columns": len(df.columns),
            "message": f"Successfully uploaded {file.filename}"
        }
    
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="The uploaded file is empty or invalid")
    
    except pd.errors.ParserError as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")
    
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File encoding not supported. Please use UTF-8 encoded CSV files")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while processing the file: {str(e)}")

@router.get("/datasets")
async def list_datasets():
    """List all uploaded datasets"""
    datasets = storage.list_datasets()
    return {
        "datasets": [
            {
                "dataset_id": dataset_id,
                **metadata
            }
            for dataset_id, metadata in datasets.items()
        ]
    }