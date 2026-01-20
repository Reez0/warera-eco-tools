from flask import Flask, abort, jsonify, request, render_template
from .core.warera_api import get_country_information, get_map_data, gather_data, calculate_best_production_efficiency, decision_engine
import time
import os
import json
import logging
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


@app.route("/")
def home():
    try:
        country_data, market_data, deposit_count = gather_data()
        production_efficiency = calculate_best_production_efficiency(country_data,market_data)
        context = {
            'data':country_data,
            'market_data':market_data,
            'deposit_count':deposit_count, 
            'production_efficiency':production_efficiency,
            'item_icons':ITEM_ICONS
        }
        
        return render_template("index.html",**context)
    except:
        raise
    
@app.route("/get-summary")
def get_summary():
    player_id = request.args.get('playerId')
    result = decision_engine(player_id)
    return jsonify(result)

@app.route("/admin/refresh", methods=["GET"])
def refresh_top_players():
    logging.info("Cron refresh ran")
    print("Looks like it works! Yay")
    return jsonify({'success': True})

