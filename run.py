"""
Quick runner for Hues & Cues Party application.
Usage: python run.py
"""

import sys
import uvicorn
from server.main import get_local_ip

if __name__ == "__main__":
    local_ip = get_local_ip()
    port = 8000
    print("=" * 65)
    print("🎨 Hues & Cues Party - Multiplayer Offline & SaaS")
    print("=" * 65)
    print(f"Local URL:   http://localhost:{port}")
    print(f"Network URL: http://{local_ip}:{port} (Scan on phones to join!)")
    print("=" * 65)
    print("Press Ctrl+C to stop the server.\n")

    uvicorn.run("server.main:app", host="0.0.0.0", port=port, reload=False)
