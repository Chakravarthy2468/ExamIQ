import os
import json
import requests
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class AIProvider(ABC):
    @abstractmethod
    def generate_response(self, prompt: str, system_prompt: Optional[str] = None, json_format: bool = False) -> str:
        pass

class OllamaProvider(AIProvider):
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model = os.getenv("OLLAMA_MODEL", "qwen3:8b")
        
    def generate_response(self, prompt: str, system_prompt: Optional[str] = None, json_format: bool = False) -> str:
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }
        if system_prompt:
            payload["system"] = system_prompt
        if json_format:
            payload["format"] = "json"
            
        try:
            response = requests.post(url, json=payload, timeout=120)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
        except requests.exceptions.RequestException as e:
            # Handle graceful degradation
            raise Exception(f"Ollama AI Provider Error: {str(e)}")

class MockAIProvider(AIProvider):
    """For unit testing without requiring a live Ollama instance."""
    def generate_response(self, prompt: str, system_prompt: Optional[str] = None, json_format: bool = False) -> str:
        if json_format:
            return json.dumps({
                "obtained_marks": 7.5,
                "completeness": 80.0,
                "missing_concepts": "Did not mention X",
                "feedback": "Good answer overall.",
                "confidence": 0.9
            })
        return "This is a mock AI response."

# Factory function
def get_ai_provider(is_test: bool = False) -> AIProvider:
    if is_test or os.getenv("USE_MOCK_AI", "false").lower() == "true":
        return MockAIProvider()
    return OllamaProvider()
