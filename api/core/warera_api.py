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
        sell = item_data["sell"]
        work = item_data["work"]

        bonus_applies = (
            item_name == country_data["special"] or
            (item_name == "ammo" and country_data["special"] == "ammo")
        )

        bonus_multiplier = 1 + (country_data["bonus"] / 100) if bonus_applies else 1
        btc_per_pp = (sell * bonus_multiplier) / work
        profit_per_hour = btc_per_pp * entrepreneurship_per_hour
        explanation = (
            f"Current selling price={sell}, Required PP={work}, "
            f"bonus={'yes' if bonus_applies else 'no'} ({country_data['bonus']}%), "
            f"BTC/PP={btc_per_pp:.4f}"
        )

        return profit_per_hour, explanation

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

def get_user_companies_workers(user_id):
    try:
        url = "https://api2.warera.io/trpc/user.getUserLite,company.getCompaniesCount,company.getActiveCompaniesCount,worker.getWorkers?batch=1&"
        payload = f'''input={{
            "0":{{"userId":"{user_id}"}},
            "1":{{"userId":"{user_id}"}},
            "2":{{"userId":"{user_id}"}},
            "3":{{"userId":"{user_id}"}}}}
            '''
        url = url+payload
        headers = {
            'authorization': API_KEY,
            'Origin': 'https://app.warera.io',
            }
        response = requests.get(url, headers=headers, allow_redirects=False)
        data = response.json()
        user = data[0]['result']['data']
        user_companies_workers = data[3]['result']['data']
        user_detail = {
            'id': user_id,
            'username': user['username'],
            'country': user['country'],
            'energy': user['skills']['energy'],
            'production': user['skills']['production'],
            'entrepreneurship': user['skills']['entrepreneurship']
        }
        return user_detail, user_companies_workers
    except Exception as e:
        raise Exception(f'Unable to retrieve user and company info {e}')
    
def get_company_by_id(company_id):
    try:
        url = "https://api2.warera.io/trpc/user.getMe,company.getById?batch=1&"
        payload = f'''input={{
                        "1":{{"companyId":"{company_id}"}}
                       }}
                        '''
        url = url+payload
        headers = {
            'authorization': API_KEY,
            'Origin': 'https://app.warera.io',
            }
        response = requests.get(url, headers=headers, allow_redirects=False)
        data = response.json()
        company = data[1]['result']['data']
        return company
    except Exception as e:
        raise Exception(f'Unable to retrieve company by ID {e}')

def build_market_lookup(market_data):
    prices = {}
    for i in market_data:
        code = i['top_sell_order']['itemCode']
        prices[code] = i['top_sell_order']['price']
    return prices


def build_country_bonus_map(country_data, user_country):
    bonus_map = {}
    for c in country_data:
        if c['code'] == user_country and c['specialization']:
            bonus_map[c['specialization']] = c['production_bonus'] / 100
    return bonus_map


def automation_btc_per_day(engine_level, storage_pp, item_code, market_prices, country_bonus_map):
    if (
        engine_level <= 0
        or item_code not in market_prices
        or item_code not in WORK_MAP
    ):
        return 0

    pp_per_day = engine_level * 24
    effective_pp = min(pp_per_day, storage_pp)

    pp_per_unit = WORK_MAP[item_code]['work']
    units_per_day = effective_pp / pp_per_unit

    price = market_prices[item_code]
    bonus = country_bonus_map.get(item_code, 0)

    return units_per_day * price * (1 + bonus)


def decision_engine(player_id):
    user_detail, user_companies_workers = get_user_companies_workers(player_id)
    country_data, market_data, _ = gather_data()

    market_prices = build_market_lookup(market_data)
    country_bonus_map = build_country_bonus_map(country_data, user_detail['country'])

    user_companies = []
    for entry in user_companies_workers['workersPerCompany']:
        company_data = get_company_by_id(entry['company']['_id'])

        storage_level = company_data['activeUpgradeLevels'].get('storage', 1)
        automated_level = company_data['activeUpgradeLevels'].get('automatedEngine', 0)

        user_companies.append({
            'name': company_data['name'],
            'item_code': company_data['itemCode'],
            'automated_engine_level': automated_level,
            'storage_pp': storage_level * 200,
            'workers': entry['workers']
        })

    auto_btc = 0
    auto_breakdown = []

    for c in user_companies:
        btc = automation_btc_per_day(
            c['automated_engine_level'],
            c['storage_pp'],
            c['item_code'],
            market_prices,
            country_bonus_map
        )

        auto_btc += btc
        auto_breakdown.append({
            'company': c['name'],
            'item': c['item_code'],
            'btc_per_day': round(btc, 2),
            'engine_level': c['automated_engine_level']
        })

    summary_blurb = (
        f"With your current setup, your automated engines are generating roughly "
        f"{round(auto_btc, 2)} BTC per day in total."
    )

    best_item = calculate_best_production_efficiency(country_data, market_data)[0]
    optimal_item_code = best_item['item']

    producing_optimal = any(
        c['item_code'] == optimal_item_code for c in user_companies
    )

    optimal_result = None

    if not producing_optimal:
        optimal_btc = 0

        for c in user_companies:
            btc = automation_btc_per_day(
                c['automated_engine_level'],
                c['storage_pp'],
                optimal_item_code,
                market_prices,
                country_bonus_map
            )
            optimal_btc += btc

        if auto_btc > 0:
            increase_pct = ((optimal_btc - auto_btc) / auto_btc) * 100
            delta_btc = optimal_btc - auto_btc
        else:
            increase_pct = 100
            delta_btc = optimal_btc

        optimal_result = {
            "item": optimal_item_code,
            "btc_per_day_if_switched": round(optimal_btc, 2),
            "blurb": (
                f"You currently do not produce the most optimal resource. "
                f"By switching the remaining companies, you could increase BTC/day by "
                f"{round(increase_pct, 2)}%, or ~{round(delta_btc, 2)} BTC more than your current setup."
            )
        }

    return {
        "summary": summary_blurb,
        "automation": auto_breakdown,
        "optimal_switch": optimal_result
    }