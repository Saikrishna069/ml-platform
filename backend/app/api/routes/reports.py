from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse, Response
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.ml_pipeline.report_generator import ReportGenerator

router = APIRouter()

@router.get("/{experiment_id}/generate")
async def generate_experiment_report(
    experiment_id: int,
    format: str = Query("markdown"),  # markdown, html, json
    db: Session = Depends(get_db)
):
    """Generate and return report for an experiment"""
    
    experiment = db.query(models.Experiment).filter(
        models.Experiment.id == experiment_id
    ).first()
    
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == experiment.dataset_id
    ).first()
    
    dataset_name = dataset.name if dataset else f"Dataset #{experiment.dataset_id}"
    
    model_runs = db.query(models.ModelRun).filter(
        models.ModelRun.experiment_id == experiment_id
    ).all()
    
    results = []
    best_model = None
    best_score = -float('inf')
    
    for run in model_runs:
        results.append({
            "model_name": run.model_name,
            "metrics": run.metrics or {},
            "training_time_seconds": run.training_time_seconds or 0.0,
            "status": run.status
        })
        
        score = (run.metrics or {}).get('f1', (run.metrics or {}).get('r2', -float('inf')))
        if score > best_score:
            best_score = score
            best_model = run.model_name
    
    generator = ReportGenerator(
        experiment_name=experiment.name,
        dataset_name=dataset_name,
        results=results,
        best_model=best_model
    )
    
    if format == "html":
        return HTMLResponse(content=generator.generate_html_report())
    elif format == "json":
        return {
            "experiment_name": experiment.name,
            "dataset_name": dataset_name,
            "best_model": best_model,
            "results": results
        }
    else:
        return Response(content=generator.generate_markdown_report(), media_type="text/markdown")
