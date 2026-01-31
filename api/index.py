from threading import Lock

from flask import Flask, jsonify, request, render_template
from .core.eco_tools import gather_data, company_breakdown, employee_breakdown, job_breakdown, build_market_lookup, get_biggest_winner_loser, store_daily_wage_snapshot,get_weekly_wage_snapshot
from .core.warera_api import get_item_trading
from concurrent.futures import ThreadPoolExecutor
import time
from .core.logger import log_exception
app = Flask(__name__)

ITEM_ICONS = {
    "concrete": "img/concrete.png",
    "iron": "img/iron.png",
    "limestone": "img/limestone.png",
    "cookedFish": "img/cookedFish.png",
    "petroleum": "img/petroleum.png",
    "steak": "img/steak.png",
    "livestock": "img/livestock.png",
    "grain": "img/grain.png",
    "coca": "img/coca.png",
    "cocain": "img/cocain.png",
    "bread": "img/bread.png",
    "fish": "img/fish.png",
    "ammo": "img/ammo.png",
    "heavyAmmo": "img/heavyAmmo.png",
    "lightAmmo": "img/lightAmmo.png",
    "lead": "img/lead.png",
    "oil": "img/oil.png",
    "steel": "img/steel.png"
}

@app.route("/health")
def health():
    return {"status": "ok"}

@app.route("/")
def loading_page():
    return render_template("loading.html")

@app.route("/app")
def home():
    try:
        country_data, market_data, deposit_count = gather_data()
        winner, loser = get_biggest_winner_loser(market_data)
        snapshot = get_weekly_wage_snapshot()
        chart_data = [
            {
                "day": d["day"].strftime("%Y-%m-%d"),
                "allowedMin": d["allowedMin"],
                "allowedMax": d["allowedMax"],
                "allowedAvg": round(d["allowedAvg"], 4),
                "topOffer": d["topOffer"],
                "topEligibleOffer": d["topEligibleOffer"],
            }
            for d in snapshot
        ]
        context = {
            "data": country_data,
            "market_data": market_data,
            "deposit_count": deposit_count,
            "item_icons": ITEM_ICONS,
            "winner": winner,
            "loser": loser,
            "wage_snapshot": chart_data
        }
    
        store_daily_wage_snapshot()
        
        return render_template("index.html", **context)

    except Exception as e:
        log_exception(e, function="/home", service="index")
        return render_template(
            "error.html",
            error_message="An unexpected error occurred. Please try again.",
        )
    
@app.route("/get-summary")
def get_summary():
    try:
        start = time.perf_counter()
        player_id = request.args.get('playerId')
        market_data = get_item_trading()
        market_lookup = build_market_lookup(market_data)
        with ThreadPoolExecutor(max_workers=4) as executor:
            future_company = executor.submit(company_breakdown, player_id)
            future_employee = executor.submit(employee_breakdown, player_id)
            future_job = executor.submit(job_breakdown, player_id)

            result = {
                'employee_breakdown': future_employee.result(),
                'company_breakdown': future_company.result(),
                'job_breakdown': future_job.result(),
                'market_lookup': market_lookup
            }
        return jsonify(result)
    except Exception as e:
        log_exception(
            e,
            function="/get-summary",
            service="index",
        )
        raise
    finally:
        elapsed = time.perf_counter() - start
        print(f"/ summary executed in {elapsed:.3f}s")
        