# run.py
# Run this instead of `uvicorn main:app --reload`
# This binds to 0.0.0.0 so the app is accessible on your local network IP
#
# Usage:
#   python run.py
#
# Then open from any device on the same network:
#   http://<YOUR_IP>:8000/api/genai/lhsgpt/dashboard
#
# Find your IP:
#   Windows: ipconfig  → look for IPv4 Address
#   Linux  : hostname -I

import uvicorn
import socket

def get_local_ip():
    """Auto-detect the machine's local network IP."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "0.0.0.0"

if __name__ == "__main__":
    ip   = get_local_ip()
    port = 8000

    print(f"""
╔══════════════════════════════════════════════════════╗
║              LHSGPT — Lighthouse India AI            ║
╠══════════════════════════════════════════════════════╣
║  Local:    http://127.0.0.1:{port}                    ║
║  Network:  http://{ip}:{port}                  ║
║                                                      ║
║  Dashboard:                                          ║
║  http://{ip}:{port}/api/genai/lhsgpt/dashboard  ║
║                                                      ║
║  API Docs:                                           ║
║  http://{ip}:{port}/docs                        ║
╚══════════════════════════════════════════════════════╝
    """)

    uvicorn.run(
        "main:app",
        host    = "0.0.0.0",    # binds to all interfaces → accessible on your IP
        port    = port,
        reload  = True,
        workers = 1,
    )