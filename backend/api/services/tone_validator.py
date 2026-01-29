"""
Norwegian Tone Validation Service

Validates text for Norwegian market tone compliance.
Ensures no hype language, no US-style exaggeration, professional tone.
"""

from typing import Dict, List, Tuple
import re

# Forbidden words and phrases (hype language)
FORBIDDEN_WORDS = [
    # Superlatives without evidence
    "amazing", "incredible", "revolutionary", "game-changing", "life-changing",
    "groundbreaking", "mind-blowing", "unbelievable", "phenomenal", "extraordinary",
    
    # Exaggerated claims
    "guaranteed", "instant results", "overnight success", "miracle", "magic",
    "secret formula", "hidden trick", "ultimate solution", "perfect system",
    
    # US-style urgency
    "act now", "limited time only", "don't miss out", "last chance",
    "exclusive offer", "once in a lifetime",
    
    # Hype adjectives
    "insane", "crazy", "epic", "massive", "huge gains", "explosive growth",
    
    # Absolute claims
    "never fail", "always works", "100% guaranteed", "risk-free",
    "no effort required", "effortless"
]

# Warning phrases (use sparingly)
WARNING_PHRASES = [
    "best", "greatest", "ultimate", "perfect", "easiest", "fastest",
    "most powerful", "most effective", "number one", "#1"
]

# Positive indicators (Norwegian style)
POSITIVE_INDICATORS = [
    "proven", "tested", "documented", "research shows", "studies indicate",
    "evidence suggests", "data shows", "results demonstrate",
    "practical", "realistic", "achievable", "structured", "systematic",
    "professional", "trustworthy", "reliable", "consistent"
]


class NorwegianToneValidator:
    """Validates text for Norwegian market tone compliance."""
    
    def __init__(self):
        self.forbidden_pattern = re.compile(
            r'\b(' + '|'.join(re.escape(word) for word in FORBIDDEN_WORDS) + r')\b',
            re.IGNORECASE
        )
        self.warning_pattern = re.compile(
            r'\b(' + '|'.join(re.escape(phrase) for phrase in WARNING_PHRASES) + r')\b',
            re.IGNORECASE
        )
        self.positive_pattern = re.compile(
            r'\b(' + '|'.join(re.escape(indicator) for indicator in POSITIVE_INDICATORS) + r')\b',
            re.IGNORECASE
        )
    
    def validate(self, text: str) -> Dict:
        """
        Validate text for Norwegian tone compliance.
        
        Returns:
            {
                "passed": bool,
                "score": int (1-10),
                "violations": List[str],
                "warnings": List[str],
                "positive_indicators": List[str],
                "suggestions": str
            }
        """
        if not text or len(text.strip()) < 10:
            return {
                "passed": False,
                "score": 0,
                "violations": [],
                "warnings": [],
                "positive_indicators": [],
                "suggestions": "Text too short to validate"
            }
        
        # Find violations
        violations = self.forbidden_pattern.findall(text)
        violations = list(set(violations))  # Remove duplicates
        
        # Find warnings
        warnings = self.warning_pattern.findall(text)
        warnings = list(set(warnings))
        
        # Find positive indicators
        positive = self.positive_pattern.findall(text)
        positive = list(set(positive))
        
        # Calculate score (1-10)
        score = 10
        
        # Deduct for violations (critical)
        score -= len(violations) * 2
        
        # Deduct for warnings (minor)
        score -= len(warnings) * 0.5
        
        # Add for positive indicators
        score += min(len(positive) * 0.5, 2)  # Max +2 bonus
        
        # Clamp score between 1-10
        score = max(1, min(10, int(score)))
        
        # Determine pass/fail
        passed = score >= 7 and len(violations) == 0
        
        # Generate suggestions
        suggestions = self._generate_suggestions(violations, warnings, positive, score)
        
        return {
            "passed": passed,
            "score": score,
            "violations": violations,
            "warnings": warnings,
            "positive_indicators": positive,
            "suggestions": suggestions
        }
    
    def _generate_suggestions(
        self, 
        violations: List[str], 
        warnings: List[str], 
        positive: List[str],
        score: int
    ) -> str:
        """Generate improvement suggestions based on validation results."""
        suggestions = []
        
        if violations:
            suggestions.append(
                f"Remove hype language: {', '.join(violations)}. "
                "Use evidence-based, professional tone instead."
            )
        
        if warnings:
            suggestions.append(
                f"Avoid superlatives without evidence: {', '.join(warnings)}. "
                "Support claims with data or research."
            )
        
        if len(positive) < 2:
            suggestions.append(
                "Add more evidence-based language (e.g., 'proven', 'tested', 'research shows'). "
                "Norwegian audiences value trustworthy, documented claims."
            )
        
        if score < 7:
            suggestions.append(
                "Overall tone needs improvement. Focus on: "
                "professional language, realistic claims, evidence-based statements, "
                "and understated confidence."
            )
        
        if not suggestions:
            suggestions.append(
                "Tone is compliant with Norwegian market standards. "
                "Continue using professional, evidence-based language."
            )
        
        return " ".join(suggestions)
    
    def get_guidelines(self) -> Dict:
        """Return Norwegian tone guidelines."""
        return {
            "forbidden": {
                "description": "Words and phrases to avoid (hype language)",
                "examples": FORBIDDEN_WORDS[:10]  # First 10 examples
            },
            "warnings": {
                "description": "Use sparingly and only with evidence",
                "examples": WARNING_PHRASES[:5]
            },
            "recommended": {
                "description": "Preferred Norwegian-style language",
                "examples": POSITIVE_INDICATORS[:10]
            },
            "principles": [
                "Professional and trustworthy tone",
                "Evidence-based claims (research, data, studies)",
                "Understated confidence (not boastful)",
                "Practical and realistic promises",
                "Respectful and humble approach",
                "Clear and direct communication"
            ],
            "examples": {
                "bad": "This AMAZING system will REVOLUTIONIZE your business overnight!",
                "good": "This proven method has helped businesses improve their results through structured implementation."
            }
        }


# Singleton instance
tone_validator = NorwegianToneValidator()


def validate_norwegian_tone(text: str) -> Dict:
    """
    Convenience function to validate Norwegian tone.
    
    Args:
        text: Text to validate
        
    Returns:
        Validation result dict
    """
    return tone_validator.validate(text)


def get_tone_guidelines() -> Dict:
    """
    Get Norwegian tone guidelines.
    
    Returns:
        Guidelines dict
    """
    return tone_validator.get_guidelines()
