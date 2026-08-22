from sqlalchemy.orm import Session
from app.db.mlops_models import ABTestConfig
from typing import Dict, Any, Optional, List
import numpy as np
from scipy import stats
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class ExperimentationFramework:
    """Advanced A/B testing and experimentation"""
    
    @staticmethod
    def calculate_sample_size(
        baseline_rate: float,
        min_effect_size: float = 0.05,
        alpha: float = 0.05,
        beta: float = 0.20
    ) -> int:
        """Calculate required sample size for A/B test"""
        
        try:
            # Using normal approximation for proportions
            z_alpha = stats.norm.ppf(1 - alpha/2)
            z_beta = stats.norm.ppf(1 - beta)
            
            p_control = baseline_rate
            p_variant = baseline_rate * (1 + min_effect_size)
            
            p_avg = (p_control + p_variant) / 2
            
            sample_size = (
                ((z_alpha + z_beta) ** 2) * 
                (2 * p_avg * (1 - p_avg)) / 
                ((p_variant - p_control) ** 2)
            )
            
            return int(np.ceil(sample_size))
        
        except Exception as e:
            logger.error(f"Sample size calculation failed: {str(e)}")
            return 10000
    
    @staticmethod
    def power_analysis(
        baseline_rate: float,
        effect_size: float,
        sample_size: int,
        alpha: float = 0.05
    ) -> Dict[str, float]:
        """Analyze statistical power of test"""
        
        try:
            p_control = baseline_rate
            p_variant = baseline_rate * (1 + effect_size)
            p_avg = (p_control + p_variant) / 2
            
            se = np.sqrt(2 * p_avg * (1 - p_avg) / sample_size)
            effect = abs(p_variant - p_control)
            
            z_stat = effect / se if se > 0 else 0
            power = 1 - stats.norm.cdf(
                stats.norm.ppf(1 - alpha/2) - z_stat
            )
            
            return {
                "power": float(power),
                "beta": float(1 - power),
                "required_samples_per_group": sample_size,
                "total_samples": sample_size * 2,
                "min_detectable_effect": effect_size
            }
        
        except Exception as e:
            logger.error(f"Power analysis failed: {str(e)}")
            return {}
    
    @staticmethod
    def analyze_test_results(
        control_data: List[float],
        variant_data: List[float],
        metric_type: str = "continuous"
    ) -> Dict[str, Any]:
        """Comprehensive test analysis"""
        
        try:
            control_mean = float(np.mean(control_data))
            variant_mean = float(np.mean(variant_data))
            
            # T-test for continuous metrics
            if metric_type == "continuous":
                t_stat, p_value = stats.ttest_ind(control_data, variant_data)
                effect_size = (variant_mean - control_mean) / np.std(control_data) if np.std(control_data) > 0 else 0
            
            # Chi-square for binary/proportions
            elif metric_type == "binary":
                control_successes = sum(control_data)
                variant_successes = sum(variant_data)
                
                contingency = np.array([
                    [control_successes, len(control_data) - control_successes],
                    [variant_successes, len(variant_data) - variant_successes]
                ])
                
                chi2, p_value, dof, expected = stats.chi2_contingency(contingency)
                effect_size = chi2 / (sum(control_data) + sum(variant_data)) if (sum(control_data) + sum(variant_data)) > 0 else 0
            
            # Calculate confidence intervals
            ci_control = stats.t.interval(
                0.95,
                len(control_data) - 1,
                loc=control_mean,
                scale=stats.sem(control_data)
            ) if len(control_data) > 1 else (control_mean, control_mean)
            
            ci_variant = stats.t.interval(
                0.95,
                len(variant_data) - 1,
                loc=variant_mean,
                scale=stats.sem(variant_data)
            ) if len(variant_data) > 1 else (variant_mean, variant_mean)
            
            # Calculate lift
            lift = ((variant_mean - control_mean) / control_mean * 100) if control_mean != 0 else 0
            
            return {
                "control_mean": float(control_mean),
                "variant_mean": float(variant_mean),
                "lift_percent": float(lift),
                "p_value": float(p_value),
                "statistically_significant": bool(p_value < 0.05),
                "effect_size": float(effect_size),
                "confidence_interval_control": (float(ci_control[0]), float(ci_control[1])),
                "confidence_interval_variant": (float(ci_variant[0]), float(ci_variant[1])),
                "control_samples": len(control_data),
                "variant_samples": len(variant_data),
                "recommendation": ExperimentationFramework._get_recommendation(
                    float(p_value), float(lift), len(control_data)
                )
            }
        
        except Exception as e:
            logger.error(f"Results analysis failed: {str(e)}")
            return {}
    
    @staticmethod
    def _get_recommendation(p_value: float, lift: float, sample_size: int) -> str:
        """Get recommendation based on test results"""
        
        if p_value < 0.05:
            if abs(lift) > 2:
                return "Launch variant (significant lift)"
            else:
                return "Continue test (statistically significant but small lift)"
        else:
            if sample_size > 10000:
                return "Stop test (no significant difference)"
            else:
                return "Continue test (insufficient samples)"
    
    @staticmethod
    def sequential_analysis(
        control_values: List[float],
        variant_values: List[float],
        stopping_rule: str = "pocock"
    ) -> Dict[str, Any]:
        """Sequential analysis for early stopping"""
        
        try:
            n = min(len(control_values), len(variant_values))
            
            if stopping_rule == "pocock":
                z_critical = 1.96
            elif stopping_rule == "obf":
                z_critical = 2.797
            else:
                z_critical = 1.96
            
            control_mean = float(np.mean(control_values[:n]))
            variant_mean = float(np.mean(variant_values[:n]))
            
            pooled_se = np.sqrt(
                (np.var(control_values[:n]) + np.var(variant_values[:n])) / n
            ) if n > 0 else 0
            
            z_stat = (variant_mean - control_mean) / pooled_se if pooled_se > 0 else 0
            crosses_boundary = bool(abs(z_stat) > z_critical)
            
            return {
                "z_statistic": float(z_stat),
                "z_critical": float(z_critical),
                "crosses_boundary": crosses_boundary,
                "can_stop": crosses_boundary,
                "samples_analyzed": n,
                "direction": "variant wins" if z_stat > z_critical else "control wins" if z_stat < -z_critical else "inconclusive"
            }
        
        except Exception as e:
            logger.error(f"Sequential analysis failed: {str(e)}")
            return {}
