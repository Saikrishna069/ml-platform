import io
import base64
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from datetime import datetime

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

class ReportGenerator:
    """Generate comprehensive reports & Matplotlib/Seaborn plot charts for ML experiments"""
    
    def __init__(self, experiment_name: str, dataset_name: str, results: List[Dict[str, Any]], best_model: str = None):
        self.experiment_name = experiment_name
        self.dataset_name = dataset_name
        self.results = results
        self.best_model = best_model
        self.timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    @staticmethod
    def generate_seaborn_heatmap(corr_df: pd.DataFrame) -> str:
        """Generate Seaborn correlation heatmap base64 PNG image string"""
        plt.figure(figsize=(8, 6))
        sns.heatmap(corr_df, annot=True, fmt=".2f", cmap="magma", cbar=True, square=True)
        plt.title("Seaborn Feature Correlation Matrix", fontsize=12, fontweight='bold')
        plt.tight_layout()

        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=150)
        plt.close()
        buf.seek(0)
        return base64.b64encode(buf.getvalue()).decode('utf-8')

    @staticmethod
    def generate_feature_importance_plot(feature_names: List[str], importances: List[float]) -> str:
        """Generate Seaborn feature importance barplot base64 PNG image string"""
        plt.figure(figsize=(8, 5))
        df_imp = pd.DataFrame({'Feature': feature_names, 'Importance': importances})
        df_imp = df_imp.sort_values(by='Importance', ascending=True)

        sns.barplot(x='Importance', y='Feature', data=df_imp, palette='viridis')
        plt.title("Seaborn Feature Importance Plot", fontsize=12, fontweight='bold')
        plt.xlabel("Relative Importance (%)")
        plt.tight_layout()

        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=150)
        plt.close()
        buf.seek(0)
        return base64.b64encode(buf.getvalue()).decode('utf-8')

    @staticmethod
    def generate_confusion_matrix_plot(tp: int, fp: int, tn: int, fn: int) -> str:
        """Generate Seaborn confusion matrix heatmap base64 PNG image string"""
        cm = np.array([[tp, fp], [fn, tn]])
        plt.figure(figsize=(6, 5))
        sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", cbar=False,
                    xticklabels=['Predicted Positive', 'Predicted Negative'],
                    yticklabels=['Actual Positive', 'Actual Negative'])
        plt.title("Seaborn Confusion Matrix Plot", fontsize=12, fontweight='bold')
        plt.tight_layout()

        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=150)
        plt.close()
        buf.seek(0)
        return base64.b64encode(buf.getvalue()).decode('utf-8')

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
        md.append("2. **Hyperparameter Tuning**: Perform Optuna randomized search to further refine parameters.")
        md.append("3. **Feature Selection**: Use Seaborn feature importance plots to eliminate uninformative columns.")
        
        return "\n".join(md)
