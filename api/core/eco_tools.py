from collections import Counter
from .warera_api import (
    get_company_by_id,
    get_map_data,
    get_country_information,
    get_item_trading,
    get_user_companies_workers,
    get_market_data,
    get_stats_by_worker,
    get_stats_by_company,
    get_user_profile_info,
    store_daily_market_snapshot,
    store_daily_wage_snapshot
)
from .logger import log_exception

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

RECIPES = {
    "concrete": {"materials": {"limestone": 10}, "pp": 10},
    "bread": {"materials": {"grain": 1}, "pp": 10},
    "lightAmmo": {"materials": {"lead": 1}, "pp": 1},
    "ammo": {"materials": {"lead": 4}, "pp": 4},
    "heavyAmmo": {"materials": {"lead": 16}, "pp": 16},
    "steak": {"materials": {"livestock": 1}, "pp": 20},
    "cookedFish": {"materials": {"fish": 1}, "pp": 40},
    "oil": {"materials": {"petroleum": 1}, "pp": 1},
    "cocain":{"materials": {"coca": 200}, "pp": 200},
    "steel":{"materials": {"iron": 10}, "pp": 200}
}


ENERGY_REGEN_RATE = 0.10
HOURS_PER_DAY = 16
ENERGY_PER_WORK = 10

def gather_data():
    try:
        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=4) as executor:
            future_map = executor.submit(get_map_data)
            future_country = executor.submit(get_country_information)
            future_market = executor.submit(get_item_trading)

            map_data = future_map.result()
            country_data = future_country.result()
            market_data = future_market.result()

        for country in country_data:
            country['deposits'] = []
            country['max_bonus_applies'] = {'value': None}

            for deposit in map_data:
                if country['code'] == deposit['code']:
                    country['deposits'].append(deposit)

            if country['deposits']:
                for deposit in country['deposits']:
                    if deposit['deposit_type'] == country['specialization']:
                        country['max_bonus_applies'] = {
                            'value': int(country['production_bonus']) + 30
                        }

        count_deposits = dict(
            Counter(
                d['deposit_type']
                for d in map_data
                if d.get('deposit_type')
            ).most_common()
        )

        market_data_summary = summarize_market_data(market_data)

        return country_data, market_data_summary, count_deposits

    except Exception as e:
        log_exception(
            e,
            function="gather_data",
            service="eco_tools",
        )
        raise Exception(f'Unable to retrieve data from warera API {e}')
    
def build_market_lookup(market_data):
    prices = {}
    for i in market_data:
        code = i['item']
        prices[code] = i['current_value']
    return prices


def build_country_bonus_map(country_data, user_country):
    bonus_map = {}
    for c in country_data:
        if c['code'] == user_country and c['specialization']:
            bonus_map[c['specialization']] = c['production_bonus'] / 100
    return bonus_map

def build_market_lookup(market_data):
    prices = {}
    for i in market_data:
        code = i['item']
        prices[code] = i['current_value']
    return prices

def employee_breakdown(user_id):
    _, user_companies = get_user_companies_workers(user_id)
    market_prices = get_item_trading()
    market_lookup_table = build_market_lookup(market_prices)
    company_worker_pairings = []
    for company_detail in user_companies['workersPerCompany']:
        pairing = {'company_id': company_detail['company']['_id'],
                   'company_name': company_detail['company']['name'],
                   'item_code': company_detail['company']['itemCode'],
                   'workers': [{'id':i['user'],'stats':None} for i in company_detail['workers']]
                }
        company_worker_pairings.append(pairing)
    # for company_worker_pairing in company_worker_pairings:
    #     for worker in company_worker_pairing['workers']:
    #         worker_detail = get_user_profile_info(worker['id'])
    #         worker['name'] = worker_detail['username']
    #         worker['energy'] = worker_detail['skills']['energy']['value']
    #         worker['production'] = worker_detail['skills']['production']['value']
    for company_worker_pairing in company_worker_pairings:
        for worker in company_worker_pairing['workers']:
            
            stats_by_worker = get_stats_by_worker(worker['id'],company_worker_pairing['company_id'])[-7:]
            days = len(stats_by_worker)
            work_required = WORK_MAP[company_worker_pairing['item_code']]['work']
            price = market_lookup_table[company_worker_pairing['item_code']]
            total_wages = sum(i['wage'] for i in stats_by_worker)
            total_pp = sum(i['employeeProd'] for i in stats_by_worker)

            avg_daily_wage_expenditure = total_wages / days
            avg_daily_production_points = total_pp / days

            avg_daily_units = avg_daily_production_points / work_required
            avg_potential_daily_revenue = avg_daily_units * price

            avg_daily_net_profit = avg_potential_daily_revenue - avg_daily_wage_expenditure

            worker['stats'] = {
                'avg_daily_wage_expenditure': avg_daily_wage_expenditure,
                'avg_daily_production_points': avg_daily_production_points,
                'avg_daily_units_produced': avg_daily_units,
                'avg_potential_daily_revenue': avg_potential_daily_revenue,
                'avg_daily_net_profit': avg_daily_net_profit,
                'avg_daily_profit_margin': (
                    avg_daily_net_profit / avg_potential_daily_revenue * 100
                    if avg_potential_daily_revenue > 0 else 0
                ),
                'avg_daily_revenue_to_btc_ratio': (
                    avg_potential_daily_revenue / avg_daily_wage_expenditure
                    if avg_daily_wage_expenditure > 0 else 0
                ),
                'break_even_price': (
                    avg_daily_wage_expenditure / avg_daily_units
                    if avg_daily_units > 0 else 0
                )
            }
    return company_worker_pairings

def get_biggest_winner_loser(market_data):
    winners = [x for x in market_data if x['price_change_pct_7day'] > 0]
    losers = [x for x in market_data if x['price_change_pct_7day'] < 0]
    biggest_winner = sorted(winners, key=lambda x: x['price_change_pct_7day'], reverse=True)[0]
    biggest_loser = sorted(losers, key=lambda x: x['price_change_pct_7day'])[0]
    
    return biggest_winner, biggest_loser

def company_breakdown(user_id):
    _, user_companies = get_user_companies_workers(user_id)
    market_prices = get_item_trading()
    market_lookup_table = build_market_lookup(market_prices)
    result = []

    for company_detail in user_companies['workersPerCompany']:
        for worker in company_detail['workers']:
            worker_detail = get_user_profile_info(worker['user'])
            worker['name'] = worker_detail['username']
            worker['energy'] = worker_detail['skills']['energy']['value']
            worker['production'] = worker_detail['skills']['production']['value']
        company_id = company_detail['company']['_id']
        company_stats = get_stats_by_company(company_id)[-7:]
        days = len(company_stats)
        work_required = WORK_MAP[company_detail['company']['itemCode']]['work']
        price = market_lookup_table[company_detail['company']['itemCode']]
        avg_daily_employee_prod = sum(i.get('employeeProd',0) for i in company_stats) / days
        avg_daily_self_work = sum(i.get('selfWork',0) for i in company_stats) / days
        avg_daily_automation_engine = sum(i.get('automatedEngine',0) for i in company_stats) / days
        avg_daily_total_pp = avg_daily_employee_prod + avg_daily_self_work + avg_daily_automation_engine

        avg_daily_wages_paid = sum(i.get('wage',0) for i in company_stats) / days

        avg_daily_units_employee = avg_daily_employee_prod / work_required
        avg_daily_units_self_work = avg_daily_self_work / work_required
        avg_daily_units_automation = avg_daily_automation_engine / work_required
        avg_daily_units_total = avg_daily_units_employee + avg_daily_units_self_work + avg_daily_units_automation

        avg_daily_revenue_employee = avg_daily_units_employee * price
        avg_daily_revenue_self_work = avg_daily_units_self_work * price
        avg_daily_revenue_automation = avg_daily_units_automation * price
        avg_daily_revenue_total = avg_daily_revenue_employee + avg_daily_revenue_self_work + avg_daily_revenue_automation

        avg_daily_net_profit = avg_daily_revenue_total - avg_daily_wages_paid

        company_detail['stats'] = {
            'avg_daily_wages_paid': avg_daily_wages_paid,
            'avg_daily_employee_prod': avg_daily_employee_prod,
            'avg_daily_self_work': avg_daily_self_work,
            'avg_daily_automation_engine': avg_daily_automation_engine,
            'avg_daily_units_employee': avg_daily_units_employee,
            'avg_daily_units_self_work': avg_daily_units_self_work,
            'avg_daily_units_automation': avg_daily_units_automation,
            'avg_daily_units_total': avg_daily_units_total,
            'avg_daily_revenue_employee': avg_daily_revenue_employee,
            'avg_daily_revenue_self_work': avg_daily_revenue_self_work,
            'avg_daily_revenue_automation': avg_daily_revenue_automation,
            'avg_daily_revenue_total': avg_daily_revenue_total,
            'avg_daily_net_profit': avg_daily_net_profit,
            'avg_daily_total_pp': avg_daily_total_pp
        }
        result.append(company_detail)
    return result

def summarize_market_data(item_trading):
    summary = []

    for item_entry in item_trading:
        item = item_entry["item"]
        stats = item_entry["stats"]

        if len(stats) < 2:
            continue

        first_day = stats[0]["avgValue"]
        last_day = stats[-1]["avgValue"]
        price_change_pct = (last_day - first_day) / first_day * 100

        avg_daily_transactions = sum(d["transactionsCount"] for d in stats) / len(stats)
        avg_daily_quantity = sum(d["totalQuantity"] for d in stats) / len(stats)

        summary.append({
            "item": item,
            "price_change_pct_7day": round(price_change_pct, 2),
            "avg_daily_transactions": round(avg_daily_transactions, 1),
            "avg_daily_quantity": round(avg_daily_quantity, 1)
        })

    summary.sort(key=lambda x: x["avg_daily_transactions"], reverse=True)
    return summary

def job_breakdown(player_id):
    user_profile = get_user_profile_info(player_id)
    user_company = user_profile['company']
    job_stats = get_stats_by_worker(player_id,user_company)[-7:]
    job_detail = {}
    job_detail['average_daily_wage_earn'] = sum([i['wage'] for i in job_stats])/len(job_stats)
    return job_detail

def store_snapshots(market_data):
    store_daily_market_snapshot(market_data)
    store_daily_wage_snapshot()