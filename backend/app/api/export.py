from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.core.storage import storage
from app.models.dataset import ExportRequest
import io
import json
import pandas as pd
from datetime import datetime

router = APIRouter()

@router.post("/export/{dataset_id}")
async def export_dataset(dataset_id: str, request: ExportRequest):
    """Export the cleaned dataset in the specified format"""
    
    # Retrieve dataset
    df = storage.get_dataset(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Get metadata
    metadata = storage.get_metadata(dataset_id)
    
    try:
        if request.format.lower() == "csv":
            # Export as CSV
            output = io.StringIO()
            df.to_csv(output, index=False)
            content = output.getvalue()
            
            # Add metadata as comments if requested
            if request.include_metadata and metadata:
                header_lines = [
                    f"# Dataset: {metadata['filename']}",
                    f"# Exported: {datetime.now().isoformat()}",
                    f"# Original shape: {metadata['original_shape']}",
                    f"# Current shape: {df.shape}",
                    f"# Rows: {len(df)}, Columns: {len(df.columns)}",
                    ""
                ]
                content = "\n".join(header_lines) + content
            
            # Create response
            response = StreamingResponse(
                io.StringIO(content),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=cleaned_{metadata['filename'] if metadata else 'dataset.csv'}"
                }
            )
            
            return response
        
        elif request.format.lower() == "json":
            # Export as JSON
            data = {
                "metadata": {
                    "filename": metadata['filename'] if metadata else "unknown",
                    "exported_at": datetime.now().isoformat(),
                    "original_shape": metadata['original_shape'] if metadata else None,
                    "current_shape": list(df.shape),
                    "columns": list(df.columns),
                    "data_types": {col: str(dtype) for col, dtype in df.dtypes.items()}
                } if request.include_metadata else None,
                "data": df.to_dict('records')
            }
            
            content = json.dumps(data, indent=2, default=str)
            
            response = StreamingResponse(
                io.StringIO(content),
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=cleaned_{metadata['filename'].replace('.csv', '.json') if metadata else 'dataset.json'}"
                }
            )
            
            return response
        
        elif request.format.lower() == "excel":
            # Export as Excel
            output = io.BytesIO()
            
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Data', index=False)
                
                if request.include_metadata and metadata:
                    # Create metadata sheet
                    metadata_df = pd.DataFrame([
                        ['Filename', metadata['filename']],
                        ['Exported At', datetime.now().isoformat()],
                        ['Original Rows', metadata['original_shape'][0] if metadata['original_shape'] else 'N/A'],
                        ['Original Columns', metadata['original_shape'][1] if metadata['original_shape'] else 'N/A'],
                        ['Current Rows', len(df)],
                        ['Current Columns', len(df.columns)],
                        ['File Size (bytes)', metadata.get('file_size', 'N/A')]
                    ], columns=['Property', 'Value'])
                    
                    metadata_df.to_excel(writer, sheet_name='Metadata', index=False)
                    
                    # Create data types sheet
                    dtypes_df = pd.DataFrame([
                        [col, str(dtype)] for col, dtype in df.dtypes.items()
                    ], columns=['Column', 'Data Type'])
                    
                    dtypes_df.to_excel(writer, sheet_name='Data Types', index=False)
            
            output.seek(0)
            
            response = StreamingResponse(
                io.BytesIO(output.read()),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={
                    "Content-Disposition": f"attachment; filename=cleaned_{metadata['filename'].replace('.csv', '.xlsx') if metadata else 'dataset.xlsx'}"
                }
            )
            
            return response
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported export format: {request.format}")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export dataset: {str(e)}")

@router.get("/export/{dataset_id}/info")
async def get_export_info(dataset_id: str):
    """Get information about the dataset for export"""
    
    # Retrieve dataset
    df = storage.get_dataset(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Get metadata
    metadata = storage.get_metadata(dataset_id)
    
    # Calculate file sizes for different formats
    csv_size = len(df.to_csv().encode('utf-8'))
    json_size = len(json.dumps(df.to_dict('records')).encode('utf-8'))
    
    return {
        "success": True,
        "export_info": {
            "dataset_id": dataset_id,
            "filename": metadata["filename"] if metadata else "unknown",
            "current_rows": len(df),
            "current_columns": len(df.columns),
            "column_names": list(df.columns),
            "data_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "estimated_sizes": {
                "csv": csv_size,
                "json": json_size,
                "excel": int(csv_size * 1.2)  # Rough estimate
            },
            "available_formats": ["csv", "json", "excel"],
            "last_modified": metadata["upload_timestamp"] if metadata else None,
            "quality_summary": {
                "missing_values": int(df.isnull().sum().sum()),
                "duplicate_rows": int(df.duplicated().sum()),
                "data_completeness": float((1 - df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100)
            }
        }
    }

@router.get("/export/{dataset_id}/preview")
async def get_export_preview(dataset_id: str, format: str = "csv", rows: int = 5):
    """Get a preview of how the exported data will look"""
    
    # Retrieve dataset
    df = storage.get_dataset(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    preview_df = df.head(rows)
    
    try:
        if format.lower() == "csv":
            preview_content = preview_df.to_csv(index=False)
        elif format.lower() == "json":
            preview_content = json.dumps(preview_df.to_dict('records'), indent=2, default=str)
        else:
            preview_content = str(preview_df)
        
        return {
            "success": True,
            "preview": {
                "format": format,
                "content": preview_content,
                "rows_shown": len(preview_df),
                "total_rows": len(df)
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate preview: {str(e)}")