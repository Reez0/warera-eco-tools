import requests
import os
from collections import Counter
from pymongo import MongoClient, ASCENDING
import json
from datetime import datetime, timezone, timedelta
from .logger import log_exception

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
        log_exception(
            e,
            function="get_market_data",
            service="warera_api",
        )
        raise Exception(f'Unable to retrieve country information {e}')
    
def get_events():
    try:
        url = """https://api2.warera.io/trpc/event.getEventsPaginated?batch=1&input={"0":{"limit":16,"eventTypes":["depositDiscovered"],"direction":"forward"}}"""
        headers = {
            'authorization': API_KEY,
            'Origin': 'https://app.warera.io',
            }
        response = requests.get(url, headers=headers, allow_redirects=False)
        event_data = response.json()[0]['result']['data']['items']
        filtered = []
        for event in event_data:
            micro_map_data = {}
            for country in event['countries']:
                micro_map_data['region_name'] = event['data']['region']
                micro_map_data['deposit_type'] = event['data']['itemCode']
                micro_map_data['deposit_time_remaining'] = event['data']['durationDays']
                micro_map_data['country_id'] = country
                filtered.append(micro_map_data)
        return filtered
    except Exception as e:
        log_exception(
            e,
            function="get_events",
            service="warera_api",
        )
        raise Exception(f'Unable to retrieve country information {e}')
    
def get_wage_stats():
    try:
        url = """https://api2.warera.io/trpc//trpc/workOffer.getWageStats,worker.getWorkers?batch=1&input={"0":{},"1":{"companyId":"6937d8cd98e203f35a31b063"}}"""
        headers = {
            'authorization': API_KEY,
            'Origin': 'https://app.warera.io',
            }
        response = requests.get(url, headers=headers, allow_redirects=False)
        wage_data = response.json()[0]['result']['data']
        return wage_data
    except Exception as e:
        log_exception(
            e,
            function="get_wage_stats",
            service="warera_api",
        )
        raise Exception(f'Unable to retrieve wage information {e}')

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
        log_exception(
            e,
            function="get_map_data",
            service="warera_api",
        )
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
        log_exception(
            e,
            function="get_region_data",
            service="warera_api",
        )
        raise Exception(f'Unable to retrieve region information {e}')
    
def get_region_data_raw():
    try:
        url = """https://api2.warera.io/trpc/region.getRegionsObject"""
        headers = {
            'authorization': API_KEY,
            'Origin': 'https://app.warera.io',
            }
        response = requests.get(url, headers=headers, allow_redirects=False)
        region_data = response.json()['result']['data']
             
        return region_data
    except Exception as e:
        log_exception(
            e,
            function="get_region_data_raw",
            service="warera_api",
        )
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
        log_exception(
            e,
            function="get_country_information",
            service="warera_api",
        )
        raise Exception(f'Unable to retrieve country information {e}')


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
            'entrepreneurship': user['skills']['entrepreneurship'],
            'management': user['skills']['management'],
            'last_work_time': user['dates']['lastWorkAt']
        }
        return user_detail, user_companies_workers
    except Exception as e:
        log_exception(
            e,
            function="get_user_companies_workers",
            service="warera_api",
        )
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
        log_exception(
            e,
            function="get_company_by_id",
            service="warera_api",
        )
        raise Exception(f'Unable to retrieve company by ID {e}')
    
def get_country_by_id(country_id):
    try:
        url = "https://api2.warera.io/trpc/country.getCountryById,government.getByCountryId?batch=1&"
        payload = f'''input={{
                        "0":{{"countryId":"{country_id}"}},
                        "1":{{"countryId":"{country_id}"}}
                       }}
                        '''
        url = url+payload
        headers = {
            'authorization': API_KEY,
            'Origin': 'https://app.warera.io',
            }
        response = requests.get(url, headers=headers, allow_redirects=False)
        data = response.json()
        country = data[0]['result']['data']
        return country
    except Exception as e:
        log_exception(
            e,
            function="get_country_by_id",
            service="warera_api",
        )
        raise Exception(f'Unable to retrieve company by ID {e}')

def get_player_transactions(player_id):
    try:
        url = "https://api2.warera.io/trpc/transaction.getPaginatedTransactions?batch=1&"
        payload = f'''input={{
            "0": {{
                "limit": 100,
                "transactionType": ["wage"],
                "direction": "forward",
                "userId": "{player_id}"
            }}
        }}'''
        url = url+payload
        headers = {
            'authorization': API_KEY,
            'Origin': 'https://app.warera.io',
            }
        response = requests.get(url, headers=headers, allow_redirects=False)
        data = response.json()
        wage_transactions = data[0]['result']['data']['items']
        return wage_transactions
    except Exception as e:
        log_exception(
            e,
            function="get_player_transactions",
            service="warera_api",
        )
        raise Exception(f'Unable to retrieve player_transactions {e}')  
    
def get_stats_by_company(company_id):
    try:
        url = "https://api2.warera.io/trpc/work.getStatsByCompany?batch=1&"
        payload = f'''input={{
            "0": {{"companyId":"{company_id}","days":60,"timezone":"Africa/Johannesburg"}}
        }}'''
        url = url+payload
        headers = {
            'authorization': API_KEY,
            'Origin': 'https://app.warera.io',
            }
        response = requests.get(url, headers=headers, allow_redirects=False)
        data = response.json()
        stats_by_company = data[0]['result']['data']
        return stats_by_company
    except Exception as e:
        log_exception(
            e,
            function="get_stats_by_company",
            service="warera_api",
        )
        raise Exception(f'Unable to retrieve stats by company {e}')  

def get_stats_by_worker(worker_id, company_id):
    try:
        url = "https://api2.warera.io/trpc/work.getStatsByCompany?batch=1&"
        payload = f'''input={{
            "0": {{"workerId":"{worker_id}","companyId":"{company_id}","days":60,"timezone":"Africa/Johannesburg"}}
        }}'''
        url = url+payload
        headers = {
            'authorization': API_KEY,
            'Origin': 'https://app.warera.io',
            }
        response = requests.get(url, headers=headers, allow_redirects=False)
        data = response.json()
        stats_by_worker = data[0]['result']['data']
        return stats_by_worker
    except Exception as e:
        log_exception(
            e,
            function="get_stats_by_worker",
            service="warera_api",
        )
        raise Exception(f'Unable to retrieve stats by worker {e}')  
    
def get_user_profile_info(player_id):
    try:
        url = "https://api2.warera.io/trpc/user.getUserById?batch=1&"
        payload = f'''input={{
            "0": {{"userId":"{player_id}"}}
        }}'''
        url = url+payload
        headers = {
            'authorization': API_KEY,
            'Origin': 'https://app.warera.io',
            }
        response = requests.get(url, headers=headers, allow_redirects=False)
        data = response.json()
        user_profile = data[0]['result']['data']
        return user_profile
    except Exception as e:
        log_exception(
            e,
            function="get_user_profile_info",
            service="warera_api",
        )
        raise Exception(f'Unable to retrieve stats by company: {e}') 
    
def get_item_trading():
    try:
        item_trading = []
        for item_code in list(WORK_MAP.keys()):
            url = "https://api2.warera.io/trpc/itemTrading.getItemTrading?batch=1&"
            payload = f'''input={{
                "0": {{"itemCode":"{item_code}"}}
            }}'''
            url = url+payload
            headers = {
                'authorization': API_KEY,
                'Origin': 'https://app.warera.io',
                }
            response = requests.get(url, headers=headers, allow_redirects=False)
            data = response.json()
            item_trading_response = data[0]['result']['data']
            item_trading.append({'item': item_code,'stats':item_trading_response['values'][-7:],'current_value':round(item_trading_response['currentValue'],2)})
        return item_trading
    except Exception as e:
        log_exception(
            e,
            function="get_item_trading",
            service="warera_api",
        )
        raise Exception(f'Unable to retrieve item trading: {e}')  
    
def get_user_by_country(country_id):
    try:
        base_url = "https://api2.warera.io/trpc/user.getMe,user.getUsersByCountry?batch=1&"
        headers = {
            'authorization': API_KEY,
            'Origin': 'https://app.warera.io',
        }

        all_data = []
        cursor = None

        while True:
            if cursor:
                payload = f'''input={{
                    "1": {{"countryId":"{country_id}","cursor":"{cursor}"}},
                    "direction": "forward"
                }}'''
            else:
                payload = f'''input={{
                    "1": {{"countryId":"{country_id}"}},
                    "direction": "forward"
                }}'''

            url = base_url + payload

            response = requests.get(url, headers=headers, allow_redirects=False)
            data = response.json()

            user_list = data[1]['result']['data']['items']
            all_data.extend(user_list)

            cursor = data[1]['result']['data'].get('nextCursor')
            if not cursor:
                break

        return all_data
    except Exception as e:
        log_exception(
            e,
            function="get_user_profile_info",
            service="warera_api",
        )
        raise Exception(f'Unable to retrieve stats by company: {e}') 
    
def get_workers(player_id):
    try:
        url = "https://api2.warera.io/trpc/worker.getWorkers?batch=1&"
        payload = f'''input={{
            "0": {{"userId":"{player_id}"}}
        }}'''
        url = url+payload
        headers = {
            'authorization': API_KEY,
            'Origin': 'https://app.warera.io',
            }
        response = requests.get(url, headers=headers, allow_redirects=False)
        data = response.json()
        workers = data[0]['result']['data']
        return workers
    except Exception as e:
        log_exception(
            e,
            function="get_workers",
            service="warera_api",
        )
        raise Exception(f'Unable to retrieve stats by worker {e}')