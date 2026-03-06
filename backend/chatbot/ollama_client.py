"""
Ollama Client
Handles communication with local Ollama server
"""

import requests
from django.conf import settings


class OllamaClient:

    def __init__(self):
        self.base_url = getattr(settings, 'OLLAMA_BASE_URL', 'http://localhost:11434')
        self.model    = getattr(settings, 'OLLAMA_MODEL', 'llama3.2:1b-instruct-q4_K_M')
        self.api_url  = f"{self.base_url}/api/generate"

    def generate(self, prompt, system_prompt):
        """
        Send prompt to Ollama and return response text.
        Returns error string on failure — never raises.
        """
        payload = {
            "model":  self.model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False,
            "options": {
                "num_predict": 350,
                "temperature": 0.1,
                "num_ctx": 1024,
                "num_thread":  4,
                "repeat_penalty": 1.1,
            }
        }

        try:
            response = requests.post(self.api_url, json=payload, timeout=300)
            response.raise_for_status()
            return response.json().get('response', '').strip()

        except requests.exceptions.Timeout:
            return "I'm taking too long to respond right now. Please try again."
        except requests.exceptions.ConnectionError:
            return "I can't connect to the AI model right now. Please ensure Ollama is running."
        except Exception as e:
            return f"Something went wrong: {str(e)}"

    def is_healthy(self):
        """Check if Ollama server is reachable."""
        try:
            r = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return r.status_code == 200
        except Exception:
            return False