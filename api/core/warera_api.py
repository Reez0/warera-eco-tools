import requests
import os
from collections import Counter

API_KEY = os.getenv('API_KEY')

WORK_MAP = {
    "lightAmmo": {"quantity": 1, "work": 1},
    "ammo": {"quantity": 4, "work": 4},
    "heavyAmmo": {"quantity": 16, "work": 16},
    "bread": {"quantity": 10, "work": 10},
    "concrete": {"quantity": 10, "work": 10},
    "steel": {"quantity": 10, "work": 10},
    "oil": {"quantity": 1, "work": 1},
    "steak": {"quantity": 1, "work": 20},
    "cookedFish": {"quantity": 1, "work": 40},
    "fish": {"quantity": 1, "work": 40},
    "iron": {"quantity": 1,"work":1 },
    "limestone": {"quantity": 1,"work":1},
    "petroleum": {"quantity":1, "work":1},
    "livestock": {"quantity": 1,"work":20},
    "grain": {"quantity":1, "work":1},
    "coca": {"quantity":1, "work":1},
    "cocain":{"quantity":200, "work":200},
    "lead": {"quantity":1, "work":1}
}

def get_market_data():
    try:
        payloads = [
            """{"0":{"itemCode":"concrete","limit":1},"1":{"itemCode":"iron","limit":1},"2":{"itemCode":"limestone","limit":1}}""",
            """{"0":{"itemCode":"cookedFish","limit":1},"1":{"itemCode":"petroleum","limit":1},"2":{"itemCode":"steak","limit":1}}""",
            """{"0":{"itemCode":"livestock","limit":1},"1":{"itemCode":"grain","limit":1},"2":{"itemCode":"coca","limit":1}}""",
            """{"0":{"itemCode":"cocain","limit":1},"1":{"itemCode":"bread","limit":1},"2":{"itemCode":"fish","limit":1}}""",
            """{"0":{"itemCode":"ammo","limit":1},"1":{"itemCode":"heavyAmmo","limit":1},"2":{"itemCode":"lightAmmo","limit":1}}""",
            """{"0":{"itemCode":"lead","limit":1},"1":{"itemCode":"oil","limit":1},"2":{"itemCode":"steel","limit":1}}"""
        ]
        url = "https://api2.warera.io/trpc/tradingOrder.getTopOrders,tradingOrder.getTopOrders,tradingOrder.getTopOrders?batch=1"
        headers = {
            'authorization': API_KEY,
            'Origin': 'https://app.warera.io',
            }
        all_market_data = []
        for payload in payloads:
            url2 = url+f"&input={payload}"
            response = requests.get(url2, headers=headers, allow_redirects=False)
            maket_data_response = response.json()
            for i in maket_data_response:
                data = {}
                data['top_buy_order'] = i['result']['data']['buyOrders'][0]
                data['top_sell_order'] = i['result']['data']['sellOrders'][0]
                all_market_data.append(data)
        return all_market_data
    except Exception as e:
        raise Exception(f'Unable to retrieve country information {e}')

def get_map_data():
    try:
        url = "https://api2.warera.io/trpc/map.getMapData"
        headers = {
            'authorization': API_KEY,
            'Origin': 'https://app.warera.io',
            }
        response = requests.get(url, headers=headers, allow_redirects=False)
        map_data = response.json()
        region_data = map_data['result']['data']['map']['objects']['regionLabels']['geometries']
        filtered = []
        for region in region_data:
             if region['type'] == 'Point':
                 if region.get('properties').get('depositType',None) is not None:
                    micro_map_data = {}
                    micro_map_data['region_name'] = region['properties']['name']
                    micro_map_data['code'] = region['properties']['countryCode']
                    micro_map_data['deposit_type'] = region['properties']['depositType']
                    micro_map_data['deposit_time_remaining'] = region['properties']['depositTimeRemaining']
                    micro_map_data['country_id'] = region['properties']['regionId']
                    filtered.append(micro_map_data)
        region_data = get_region_data(filtered)
        return region_data
    except Exception as e:
        raise Exception(f'Unable to retrieve country information {e}')

def get_region_data(filtered_map_data):
    try:
        url = """https://api2.warera.io/trpc/region.getRegionsObject"""
        headers = {
            'authorization': API_KEY,
            'Origin': 'https://app.warera.io',
            }
        response = requests.get(url, headers=headers, allow_redirects=False)
        region_data = response.json()
        for i in filtered_map_data:
            region = region_data['result']['data'][i['country_id']]['initialCountry']
            i['country_id'] = region
             
        return filtered_map_data
    except Exception as e:
        raise Exception(f'Unable to retrieve region information {e}')    

def get_country_information():
    try:
        url = "https://api2.warera.io/countries"
        headers = {
            'authorization': API_KEY,
            'Origin': 'https://app.warera.io',
            }
        response = requests.get(url, headers=headers, allow_redirects=False)
        country_data = response.json()
        filtered = []
        for country in country_data:
            micro_country_data = {}
            micro_country_data['taxes'] = country['taxes']
            micro_country_data['name'] = country['name']
            micro_country_data['specialization'] = country.get('specializedItem',None)
            micro_country_data['code'] = country['code']
            micro_country_data['production_bonus'] = country['rankings']['countryProductionBonus']['value']
            micro_country_data['country_id'] = country["_id"]
            filtered.append(micro_country_data)
        return filtered
    except Exception as e:
        raise Exception(f'Unable to retrieve country information {e}')

    
def gather_data():
    try:
        map_data = get_map_data()
        country_data = get_country_information()
        for i in country_data:
            for j in map_data:
                if i['country_id'] == j['country_id']:
                    i.update(j)
        count_deposits = dict(Counter(k['deposit_type'] for k in map_data if k.get('deposit_type')).most_common())
        market_data = get_market_data()
        return country_data, market_data,count_deposits
    except Exception as e:
        raise Exception(f'Unable to retrieve data from warera API {e}')
    
def calculate_best_production_efficiency(country_data, market_data):
    # Build items with WORK_MAP
    items = {}
    for i in market_data:
        item_code = i['top_buy_order']['itemCode']
        base = WORK_MAP[item_code].copy()
        base['sell'] = i['top_sell_order']['price']
        base['raw_cost'] = 0  # producing in own company
        items[item_code] = base

    # Build country info
    countries = {}
    for i in country_data:
        countries[i['name']] = {
            'special': i['specialization'],
            'bonus': i['production_bonus']  
        }

    entrepreneurship_per_hour = 10

    def profit_per_hour_normalized(item_name, item_data, country_data):
        profit_per_craft = (item_data["sell"] - item_data["raw_cost"]) * item_data["quantity"]

        bonus_applies = item_name == country_data["special"] or (
            item_name == "ammo" and country_data["special"] == "ammo"
        )
        bonus_multiplier = 1 + (country_data["bonus"] / 100) if bonus_applies else 1
        profit_per_craft *= bonus_multiplier

        crafts_per_hour = entrepreneurship_per_hour / item_data["work"]

        profit_hour = profit_per_craft * crafts_per_hour

        profit_hour_normalized = profit_hour / item_data["quantity"]

        explanation_parts = []
        if bonus_applies:
            explanation_parts.append(
                f"This country specializes in {item_name} giving a {(country_data['bonus'] / 100):.2%} production bonus"
            )
        else:
            explanation_parts.append("no production bonus applied")
        explanation_parts.append(f"sell price per unit = {item_data['sell']} BTC, work per craft = {item_data['work']}")
        explanation_parts.append(f"normalized profit per hour = {profit_hour_normalized:.3f} BTC/hr")
        explanation = "; ".join(explanation_parts)

        return profit_hour_normalized, explanation

    results = []
    for country_name, country_data_item in countries.items():
        for item_name, item_data in items.items():
            profit, explanation = profit_per_hour_normalized(item_name, item_data, country_data_item)
            results.append({
                "country": country_name,
                "item": item_name,
                "profit_per_hour": round(profit, 3),
                "result": explanation
            })
    for i in results:
        for j in country_data:
            if i['country'] == j['name']:
                i['country_id'] = j['country_id']
    
    results_sorted = sorted(results, key=lambda x: x["profit_per_hour"], reverse=True)
    return results_sorted[:10]

def calculate_automated_engine_profit(country_data, market_data, engine_level=1):
    work_per_day = 24 * engine_level
    work_per_hour = work_per_day / 24 

    items = {}
    for i in market_data:
        item_code = i['top_buy_order']['itemCode']
        base = WORK_MAP[item_code].copy()
        base['sell'] = i['top_sell_order']['price']
        base['raw_cost'] = 0 
        items[item_code] = base

    countries = {}
    for i in country_data:
        countries[i['name']] = {
            'special': i['specialization'],
            'bonus': i['production_bonus']
        }

    def engine_profit_per_hour(item_name, item_data, country_data):
        profit_per_craft = (item_data["sell"] - item_data["raw_cost"]) * item_data["quantity"]

        # Apply country bonus if applicable
        bonus_applies = item_name == country_data["special"] or (
            item_name == "ammo" and country_data["special"] == "ammo"
        )
        bonus_multiplier = 1 + (country_data["bonus"] / 100) if bonus_applies else 1
        profit_per_craft *= bonus_multiplier

        # Crafts per hour contributed by engine
        crafts_per_hour = work_per_hour / item_data["work"]

        # Profit per hour
        profit_hour = profit_per_craft * crafts_per_hour

        # Explanation
        explanation_parts = [
            f"Automated engine level {engine_level} contributes {work_per_hour:.2f} work/hour",
        ]
        if bonus_applies:
            explanation_parts.append(
                f"this country specializes in {item_name} giving a {(country_data['bonus']/100):.2%} production bonus"
            )
        else:
            explanation_parts.append("no production bonus applied")
        explanation_parts.append(f"sell price per unit = {item_data['sell']} BTC, work per craft = {item_data['work']}")
        explanation_parts.append(f"automated profit per hour = {profit_hour:.3f} BTC/hr")
        explanation = "; ".join(explanation_parts)

        return profit_hour, explanation

    results = []
    for country_name, country_data_item in countries.items():
        for item_name, item_data in items.items():
            profit, explanation = engine_profit_per_hour(item_name, item_data, country_data_item)
            results.append({
                "country": country_name,
                "item": item_name,
                "profit_per_hour": round(profit, 3),
                "result": explanation
            })

    results_sorted = sorted(results, key=lambda x: x["profit_per_hour"], reverse=True)

    return results_sorted[:10]