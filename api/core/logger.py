import requests
import datetime
import traceback
import  os

LOGFLARE_INGEST_KEY = os.getenv('LOGFLARE_INGEST_KEY')
LOGFLARE_SOURCE_ID = os.getenv('LOGFLARE_SOURCE_ID')


def log_exception(e: Exception, **context):
    payload = {
        "event_message": f"{type(e).__name__}: {e}",
        "metadata": {
            "traceback": traceback.format_exc(),
            **context,
        },
    }

    try:
        requests.post(
            f"https://api.logflare.app/logs?source={LOGFLARE_SOURCE_ID}",
            headers={
                "X-API-KEY": LOGFLARE_INGEST_KEY,
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=2,
        )
    except Exception:
        pass