from fastapi import APIRouter, HTTPException
import pandas as pd
import numpy as np
from app.core.storage import storage
from app.services.profiler import DataProfiler

router = APIRouter()

@router.get("/profile/{dataset_id}")
async def get_dataset_profile(dataset_id: str):
    """Get comprehensive data profiling for a dataset"""
    
    # Retrieve dataset
    df = storage.get_dataset(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Get metadata
    metadata = storage.get_metadata(dataset_id)
    if metadata is None:
        raise HTTPException(status_code=404, detail="Dataset metadata not found")
    
    try:
        # Generate profile
        profile = DataProfiler.profile_dataset(df, dataset_id, metadata["filename"])
        
        return {
            "success": True,
            "profile": profile.dict()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate profile: {str(e)}")

@router.get("/profile/{dataset_id}/column/{column_name}")
async def get_column_profile(dataset_id: str, column_name: str):
    """Get detailed profiling for a specific column"""
    
    # Retrieve dataset
    df = storage.get_dataset(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Check if column exists
    if column_name not in df.columns:
        raise HTTPException(status_code=404, detail=f"Column '{column_name}' not found")
    
    try:
        # Generate column profile
        column_profile = DataProfiler.profile_column(df[column_name], column_name)
        
        return {
            "success": True,
            "column_profile": column_profile.dict()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate column profile: {str(e)}")

@router.get("/profile/{dataset_id}/preview")
async def get_dataset_preview(dataset_id: str, rows: int = 10):
    """Get a preview of the dataset (first N rows)"""
    
    # Retrieve dataset
    df = storage.get_dataset(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        # Get preview data
        preview_df = df.head(rows)
        
        # Convert to records and handle NaN values
        records = []
        for _, row in preview_df.iterrows():
            record = {}
            for col, val in row.items():
                # Check for NaN/None first
                if pd.isna(val):
                    record[col] = None
                elif isinstance(val, (np.integer, np.floating)):
                    # For numeric types, check if finite
                    try:
                        if not np.isfinite(val):
                            record[col] = None
                        else:
                            record[col] = float(val) if isinstance(val, np.floating) else int(val)
                    except (ValueError, TypeError):
                        record[col] = None
                else:
                    record[col] = str(val)
            records.append(record)
        
        return {
            "success": True,
            "preview": {
                "columns": list(df.columns),
                "data": records,
                "total_rows": len(df),
                "preview_rows": len(preview_df)
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate preview: {str(e)}")