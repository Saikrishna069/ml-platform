from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.ml_pipeline.data_ingestion import data_ingester
from app.ml_pipeline.nlp import (
    TextPreprocessor, SentimentAnalyzer, TopicModeler,
    KeywordExtractor, TextSummarizer, TextStatistics
)
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd

router = APIRouter()

class NLPAnalysisConfig(BaseModel):
    text_column: str
    analysis_type: str = "sentiment"  # sentiment, keywords, topics, summary
    n_topics: Optional[int] = 5
    n_keywords: Optional[int] = 10
    summary_sentences: Optional[int] = 3

@router.post("/{dataset_id}/sentiment")
async def analyze_sentiment(
    dataset_id: int,
    config: NLPAnalysisConfig,
    db: Session = Depends(get_db)
):
    """Analyze sentiment of text data"""
    try:
        dataset = db.query(models.Dataset).filter(
            models.Dataset.id == dataset_id
        ).first()
        
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        df = data_ingester.load_data(dataset.file_path)
        texts = df[config.text_column].astype(str).tolist()
        
        analyzer = SentimentAnalyzer()
        sentiments = analyzer.batch_analyze(texts)
        
        compounds = [s['compound'] for s in sentiments]
        positive_count = sum(1 for s in sentiments if s['sentiment'] == 'positive')
        negative_count = sum(1 for s in sentiments if s['sentiment'] == 'negative')
        neutral_count = sum(1 for s in sentiments if s['sentiment'] == 'neutral')
        total = max(len(sentiments), 1)
        
        return {
            "dataset_id": dataset_id,
            "total_documents": len(sentiments),
            "summary": {
                "average_compound_score": float(sum(compounds) / total),
                "positive_percentage": (positive_count / total) * 100,
                "negative_percentage": (negative_count / total) * 100,
                "neutral_percentage": (neutral_count / total) * 100
            },
            "samples": sentiments[:10]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/{dataset_id}/keywords")
async def extract_keywords(
    dataset_id: int,
    config: NLPAnalysisConfig,
    db: Session = Depends(get_db)
):
    """Extract keywords from text data"""
    try:
        dataset = db.query(models.Dataset).filter(
            models.Dataset.id == dataset_id
        ).first()
        
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        df = data_ingester.load_data(dataset.file_path)
        texts = df[config.text_column].astype(str).tolist()
        
        extractor = KeywordExtractor()
        all_keywords = extractor.extract_keywords_batch(texts, config.n_keywords or 10)
        
        return {
            "dataset_id": dataset_id,
            "total_documents": len(texts),
            "keywords_per_doc": config.n_keywords or 10,
            "samples": [
                {
                    "text": texts[i][:100] + "...",
                    "keywords": all_keywords[i]
                }
                for i in range(min(5, len(texts)))
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/{dataset_id}/topics")
async def extract_topics(
    dataset_id: int,
    config: NLPAnalysisConfig,
    db: Session = Depends(get_db)
):
    """Extract topics from text data"""
    try:
        dataset = db.query(models.Dataset).filter(
            models.Dataset.id == dataset_id
        ).first()
        
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        df = data_ingester.load_data(dataset.file_path)
        texts = df[config.text_column].astype(str).tolist()
        
        n_topics = config.n_topics or 5
        modeler = TopicModeler(n_topics=n_topics)
        
        if not modeler.fit(texts):
            raise Exception("Failed to fit topic model")
        
        topics = modeler.get_topics()
        topic_distributions = modeler.predict_topics(texts)
        
        return {
            "dataset_id": dataset_id,
            "n_topics": n_topics,
            "topics": topics,
            "sample_distributions": [
                {
                    "text": texts[i][:100] + "...",
                    "distribution": topic_distributions[i]
                }
                for i in range(min(5, len(texts)))
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/{dataset_id}/statistics")
async def get_text_statistics(
    dataset_id: int,
    text_column: str,
    db: Session = Depends(get_db)
):
    """Get text statistics"""
    try:
        dataset = db.query(models.Dataset).filter(
            models.Dataset.id == dataset_id
        ).first()
        
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        df = data_ingester.load_data(dataset.file_path)
        texts = df[text_column].astype(str).tolist()
        
        stats = TextStatistics.get_statistics(texts)
        
        return {
            "dataset_id": dataset_id,
            "statistics": stats
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
