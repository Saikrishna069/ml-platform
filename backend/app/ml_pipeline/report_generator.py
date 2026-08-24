import pandas as pd
import numpy as np
from typing import Dict, Any, List
from datetime import datetime

class ReportGenerator:
    """Generate comprehensive reports for ML experiments"""
    
    def __init__(self, experiment_name: str, dataset_name: str, results: List[Dict[str, Any]], best_model: str = None):
        self.experiment_name = experiment_name
        self.dataset_name = dataset_name
        self.results = results
        self.best_model = best_model
        self.timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    def generate_json_report(() -> Dict[str, Any]:
        pass

    def generate_markdown_report(self) -> str:
        """Generate Markdown executive report"""
        md = []
        md.append(f"# Executive ML Experiment Report: {self.experiment_name}")
        md.append(f"**Dataset**: `{self.dataset_name}`  ")
        md.append(f"**Generated At**: {self.timestamp}  ")
        if self.best_model:
            md.append(f"**Top Performer**: 🏆 `{self.best_model}`\n")
        
        md.append("---")
        md.append("## 📊 Evaluated Models & Key Metrics\n")
        md.append("| Model Name | Primary Score | Training Time (s) | Status |")
        md.append("|:-----------|--------------:|------------------:|:-------|")
        
        for res in self.results:
            model_name = res.get('model_name', 'Unknown')
            metrics = res.get('metrics', {})
            primary = metrics.get('f1', metrics.get('r2', metrics.get('accuracy', 0.0)))
            time_sec = res.get('training_time_seconds', 0.0)
            status = '✅ Completed' if 'error' not in res else '❌ Failed'
            
            val_str = f"{primary*100:.1f}%" if primary <= 1.0 else f"{primary:.4f}"
            md.append(f"| {model_name} | {val_str} | {time_sec:.2f}s | {status} |")
        
        md.append("\n---")
        md.append("## 💡 Executive Insights & Next Steps")
        md.append("1. **Production Deployment**: Recommended model for deployment is `" + (self.best_model or "Top Ranked") + "`.")
        md.append("2. **Hyperparameter Tuning**: Perform randomized or grid search to further refine parameters.")
        md.append("3. **Feature Selection**: Use feature importance metrics to eliminate uninformative columns.")
        
        return "\n".join(md)

    def generate_html_report(self) -> str:
        """Generate HTML report for browser viewing / download"""
        md_content = self.generate_markdown_report()
        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>{self.experiment_name} - ML Report</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #1f2937; }}
        h1 {{ color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }}
        h2 {{ color: #374151; margin-top: 30px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 15px; }}
        th, td {{ border: 1px solid #e5e7eb; padding: 12px; text-align: left; }}
        th {{ background-color: #f3f4f6; font-weight: 600; }}
        tr:nth-child(even) {{ background-color: #f9fafb; }}
        .badge {{ background-color: #dbeafe; color: #1e40af; padding: 4px 8px; rounded: 4px; font-size: 0.85em; font-weight: bold; }}
    </style>
</head>
<body>
    <pre style="white-space: pre-wrap; font-family: inherit;">{md_content}</pre>
</body>
</html>"""
        return html
