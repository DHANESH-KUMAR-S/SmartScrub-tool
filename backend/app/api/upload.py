from fastapi import APIRouter, UploadFile, File, HTTPException, Header
import pandas as pd
import io
from app.core.storage import storage
from typing import Optional

router = APIRouter()

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """Upload a CSV dataset"""
    
    print(f"\n{'='*60}")
    print(f"Upload request received: {file.filename}")
    print(f"User ID: {user_id}")
    print(f"{'='*60}\n")
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        # Read file content
        print("Reading file content...")
        content = await file.read()
        print(f"✓ File read: {len(content)} bytes")
        
        # Parse CSV
        print("Parsing CSV...")
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        print(f"✓ CSV parsed: {len(df)} rows, {len(df.columns)} columns")
        
        # Validate dataset
        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        
        if len(df.columns) == 0:
            raise HTTPException(status_code=400, detail="No columns found in the dataset")
        
        # Store dataset with user_id
        print("Storing dataset...")
        dataset_id = storage.store_dataset(df, file.filename, user_id=user_id)
        print(f"✓ Dataset stored with ID: {dataset_id}")
        
        response = {
            "success": True,
            "dataset_id": dataset_id,
            "filename": file.filename,
            "rows": len(df),
            "columns": len(df.columns),
            "message": f"Successfully uploaded {file.filename}"
        }
        
        print(f"✓ Upload complete!\n")
        return response
    
    except pd.errors.EmptyDataError:
        print("✗ Error: Empty data")
        raise HTTPException(status_code=400, detail="The uploaded file is empty or invalid")
    
    except pd.errors.ParserError as e:
        print(f"✗ Error: Parser error - {e}")
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")
    
    except UnicodeDecodeError:
        print("✗ Error: Encoding issue")
        raise HTTPException(status_code=400, detail="File encoding not supported. Please use UTF-8 encoded CSV files")
    
    except Exception as e:
        print(f"✗ Error: {type(e).__name__} - {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred while processing the file: {str(e)}")

@router.get("/datasets")
async def list_datasets(user_id: Optional[str] = Header(None, alias="X-User-ID")):
    """List all uploaded datasets for a user"""
    datasets = storage.list_datasets(user_id=user_id)
    return {
        "datasets": [
            {
                "dataset_id": dataset_id,
                **metadata
            }
            for dataset_id, metadata in datasets.items()
        ]
    }