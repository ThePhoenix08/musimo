"""
Postprocessing module
Handles formatting and enhancing prediction results
"""
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class ResultPostprocessor:
    """Postprocess and format prediction results"""
    
    def __init__(self):
        """Initialize postprocessor"""
        logger.info("ResultPostprocessor initialized")
    
    def format_for_api(self, results: Dict, processing_time: float = None) -> Dict:
        """
        Format results for API response
        
        Args:
            results: Raw prediction results
            processing_time: Time taken for processing (seconds)
            
        Returns:
            Formatted API response
        """
        response = {
            "success": True,
            "data": {
                "detected_instruments": results['detected'],
                "top_predictions": results['top_5'],
                "statistics": {
                    "total_detected": results['total_detected'],
                    "detection_threshold": results['threshold'],
                    "confidence_range": self._get_confidence_range(results['detected'])
                }
            }
        }
        
        if processing_time is not None:
            response["data"]["processing_time_seconds"] = round(processing_time, 3)
        
        return response
    
    def _get_confidence_range(self, detected: List[Dict]) -> Dict:
        """Calculate confidence statistics"""
        if not detected:
            return {"min": 0, "max": 0, "average": 0}
        
        confidences = [item['confidence'] for item in detected]
        return {
            "min": round(min(confidences), 3),
            "max": round(max(confidences), 3),
            "average": round(sum(confidences) / len(confidences), 3)
        }
    
    def format_detailed_response(
        self, 
        results: Dict, 
        include_all: bool = False,
        audio_info: Dict = None
    ) -> Dict:
        """
        Create detailed response with additional information
        
        Args:
            results: Prediction results
            include_all: Include all predictions
            audio_info: Optional audio metadata
            
        Returns:
            Detailed response dictionary
        """
        response = {
            "success": True,
            "summary": {
                "total_instruments_detected": results['total_detected'],
                "detection_threshold": results['threshold'],
                "instruments_detected": [
                    item['instrument'] for item in results['detected']
                ]
            },
            "detected_instruments": self._enrich_detections(results['detected']),
            "top_5_predictions": results['top_5']
        }
        
        if include_all:
            response["all_predictions"] = results['all_predictions']
        
        if audio_info:
            response["audio_metadata"] = audio_info
        
        return response
    
    def _enrich_detections(self, detections: List[Dict]) -> List[Dict]:
        """
        Enrich detection results with additional information
        
        Args:
            detections: List of detected instruments
            
        Returns:
            Enriched detection list
        """
        enriched = []
        
        for detection in detections:
            enriched_item = {
                **detection,
                "confidence_label": self._get_confidence_label(
                    detection['confidence']
                ),
                "reliability": self._assess_reliability(detection['confidence'])
            }
            enriched.append(enriched_item)
        
        return enriched
    
    def _get_confidence_label(self, confidence: float) -> str:
        """
        Convert confidence score to human-readable label
        
        Args:
            confidence: Confidence score (0-1)
            
        Returns:
            Confidence label
        """
        if confidence >= 0.9:
            return "Very High"
        elif confidence >= 0.75:
            return "High"
        elif confidence >= 0.6:
            return "Medium"
        elif confidence >= 0.5:
            return "Low"
        else:
            return "Very Low"
    
    def _assess_reliability(self, confidence: float) -> str:
        """
        Assess reliability of prediction
        
        Args:
            confidence: Confidence score
            
        Returns:
            Reliability assessment
        """
        if confidence >= 0.85:
            return "Highly reliable"
        elif confidence >= 0.7:
            return "Reliable"
        elif confidence >= 0.55:
            return "Moderately reliable"
        else:
            return "Low reliability - verify manually"
    
    def create_summary_text(self, results: Dict) -> str:
        """
        Create human-readable summary text
        
        Args:
            results: Prediction results
            
        Returns:
            Summary text
        """
        detected = results['detected']
        
        if not detected:
            return f"No instruments detected above threshold {results['threshold']}"
        
        summary_parts = [
            f"Detected {len(detected)} instrument(s):",
            ""
        ]
        
        for item in detected:
            summary_parts.append(
                f"  • {item['instrument']}: "
                f"{item['percentage']}% confidence "
                f"({self._get_confidence_label(item['confidence'])})"
            )
        
        return "\n".join(summary_parts)
    
    def format_error_response(self, error_message: str, error_type: str = "ProcessingError") -> Dict:
        """
        Format error response
        
        Args:
            error_message: Error message
            error_type: Type of error
            
        Returns:
            Error response dictionary
        """
        return {
            "success": False,
            "error": {
                "type": error_type,
                "message": error_message
            }
        }