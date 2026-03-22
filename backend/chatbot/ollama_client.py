"""
Ollama Client
Handles communication with local Ollama server.
Supports dynamic token limits based on query type and truncation detection.
"""

import requests
from django.conf import settings


class OllamaClient:

    # Token limits by query type — itineraries need more room
    TOKEN_LIMITS = {
        'itinerary':  512,
        'transport':  384,
        'default':    384,
    }

    def __init__(self):
        self.base_url = getattr(settings, 'OLLAMA_BASE_URL', 'http://localhost:11434')
        self.model    = getattr(settings, 'OLLAMA_MODEL', 'llama3.2:3b-instruct-q4_K_M')
        self.api_url  = f"{self.base_url}/api/generate"

    def generate(self, prompt, system_prompt, query_type='default'):
        """
        Send prompt to Ollama and return response text.

        Args:
            prompt:        The user prompt with context.
            system_prompt: System-level instructions.
            query_type:    One of 'itinerary', 'transport', 'default'.
                           Controls num_predict (max output tokens).

        Returns error string on failure — never raises.
        """
        num_predict = self.TOKEN_LIMITS.get(query_type, self.TOKEN_LIMITS['default'])

        payload = {
            "model":  self.model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False,
            "options": {
                "num_predict":    num_predict,
                "temperature":    0.1,
                "num_ctx":        2048,     
                "num_thread":     4,
                "repeat_penalty": 1.1,
            }
        }

        try:
            response = requests.post(self.api_url, json=payload, timeout=300)
            response.raise_for_status()
            data = response.json()

            answer = data.get('response', '').strip()

            # Truncation detection: Ollama sets done_reason="length" when
            # output was cut off by num_predict limit
            done_reason = data.get('done_reason', '')
            if done_reason == 'length' and answer:
                # Clean up: remove trailing incomplete sentence
                answer = self._trim_incomplete_sentence(answer)
                answer += "\n\n(Response trimmed for brevity. Ask a follow-up for more detail.)"

            return answer

        except requests.exceptions.Timeout:
            return "I'm taking too long to respond right now. Please try again."
        except requests.exceptions.ConnectionError:
            return "I can't connect to the AI model right now. Please ensure Ollama is running."
        except Exception as e:
            return f"Something went wrong: {str(e)}"

    def _trim_incomplete_sentence(self, text):
        """Remove trailing incomplete sentence after the last sentence-ending punctuation."""
        # Find last complete sentence (ends with . ! ? or newline before incomplete text)
        for i in range(len(text) - 1, -1, -1):
            if text[i] in '.!?\n':
                return text[:i + 1]
        return text  # no sentence boundary found — return as-is

    def is_healthy(self):
        """Check if Ollama server is reachable."""
        try:
            r = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return r.status_code == 200
        except Exception:
            return False
