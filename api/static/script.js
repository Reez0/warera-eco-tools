$(function () {
    $('#openInfoDialog').on('click', function () {
        $('#infoDialogOverlay')
            .addClass('show')
            .hide()
            .fadeIn(150);
    });

    $('#closeInfoDialog, #infoDialogOverlay').on('click', function (e) {
        if (e.target !== this) return;

        $('#infoDialogOverlay').fadeOut(150, function () {
            $(this).removeClass('show');
        });
    });
});

  window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$']]
    }
  };

$(document).ready(function() {
    const table = $('#countryTable').DataTable({
        pageLength: 10,
        order: [[3, 'desc']],
        scrollX: true,
        autoWidth: false,
        language: {
            search: "Search:",
            lengthMenu: "Show _MENU_ countries",
            info: "Showing _START_ to _END_ of _TOTAL_ countries",
            paginate: {
                first: "First",
                last: "Last",
                next: "Next",
                previous: "Previous"
            }
        }
    });

    $('#countryTable tbody').on('click', 'tr', function() {
        if ($(this).hasClass('bg-dark-card-alt')) {
            $(this).removeClass('bg-dark-card-alt');
        } else {
            table.$('tr.bg-dark-card-alt').removeClass('bg-dark-card-alt');
            $(this).addClass('bg-dark-card-alt');
            
            const data = table.row(this).data();
        }
    });
});

window.MathJax = {
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$']]
    }
};

$(document).on('click', '#getProfileData', function () {
    const $button = $(this);
    const $input = $('#playerInput');
    const originalPlaceholder = $input.attr('placeholder');
    const buttonText = $button.text();
    const value = $input.val().trim();

    const hexIdRegex = /^[a-fA-F0-9]{24}$/;
    const urlRegex = /([a-fA-F0-9]{24})(?:\/)?$/;

    let playerId = null;

    if (hexIdRegex.test(value)) {
        playerId = value;
    } else {
        const match = value.match(urlRegex);
        if (match) playerId = match[1];
    }

    if (!playerId) {
        $input.val('')
            .attr('placeholder', 'Invalid player ID or profile URL')
            .addClass('border-accent-red')
            .focus();

        setTimeout(() => {
            $input.attr('placeholder', originalPlaceholder)
                .removeClass('border-accent-red');
        }, 2000);
        return;
    }

    $input.removeClass('border-accent-red').attr('placeholder', originalPlaceholder);
    $button.prop('disabled', true).html('<span class="inline-block w-4 h-4 border-2 border-dark-card-alt/20 border-t-white rounded-full animate-spin align-middle"></span> Please wait...');

    const $hero = $('#hero-section');

    const formatNumber = (num) => {
        const truncated = Math.floor(num * 100) / 100;
        return truncated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    const formatInteger = num => Math.round(num).toLocaleString('en-US');

    const sectionWrapper = (inner, extraClass = '') => `
        <div class="dynamic-content mt-4 mb-6 ${extraClass}">
            ${inner}
        </div>
    `;

    const sectionTitle = text => `<div class="text-xs uppercase tracking-widest text-dark-text-dim mb-2.5 font-semibold mt-5">${text}</div>`;

    fetch(`/get-summary?playerId=${encodeURIComponent(playerId)}`)
        .then(res => res.json())
        .then(data => {
            $hero.find('.dynamic-content').remove();
            let sectionsHtml = '';

            if (data.company_breakdown && data.company_breakdown.length) {
                const companyCards = data.company_breakdown.map(company => {
                    const stats = company.stats;
                    const netProfit = stats.avg_daily_net_profit || 0;
                    const profitClass = netProfit >= 0 ? 'border-l-accent-green' : 'border-l-accent-red';

                    // Employee cards
                    let workersHtml = '';
                    if (company.workers && company.workers.length > 0) {
                        workersHtml = `
                            <div class="text-xs uppercase tracking-widest text-dark-text-dim mt-4 mb-2.5 font-semibold">Workers (${company.workers.length})</div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-2">
                                ${company.workers.map(worker => `
                                    <div class="bg-dark-bg border border-dark-border rounded-md p-2.5">
                                        <div class="font-semibold text-sm mb-2 pb-2 border-b border-dark-card-alt">Worker Name: ${worker.name}</div>
                                        <div class="text-xs text-dark-text-muted mb-1">Current Wage: <strong class="text-dark-text">${formatNumber(worker.wage)}</strong> BTC</div>
                                        <div class="text-xs text-dark-text-muted mb-1">Energy: <strong class="text-dark-text">${worker.energy} ⚡</strong></div>
                                        <div class="text-xs text-dark-text-muted mb-1">Production: <strong class="text-dark-text">${worker.production} ⛏️</strong></div>
                                        <div class="text-xs text-dark-text-muted mb-1">Fidelity Level: <strong class="text-dark-text">${worker.fidelity} 💛</strong></div>
                                        <div class="text-xs text-dark-text-muted">Joined: <strong class="text-dark-text">${new Date(worker.joinedAt).toLocaleDateString()}</strong></div>
                                    </div>
                                `).join('')}
                            </div>
                        `;
                    }

                    // Daily averages section for the company
                    let dailyAveragesHtml = '';
                    const employeeData = data.employee_breakdown?.find(eb => eb.company_id === company.company._id);
                    if (employeeData?.workers && employeeData.workers.length) {
                        const totals = employeeData.workers.reduce((acc, w) => {
                            const s = w.stats || {};
                            acc.productionPoints += s.avg_daily_production_points || 0;
                            acc.unitsProduced += s.avg_daily_units_produced || 0;
                            acc.revenue += s.avg_potential_daily_revenue || 0;
                            acc.wage += s.avg_daily_wage_expenditure || 0;
                            acc.netProfit += s.avg_daily_net_profit || 0;
                            acc.profitMargin += s.avg_daily_profit_margin || 0;
                            acc.breakEven += s.break_even_price || 0;
                            return acc;
                        }, {
                            productionPoints: 0,
                            unitsProduced: 0,
                            revenue: 0,
                            wage: 0,
                            netProfit: 0,
                            profitMargin: 0,
                            breakEven: 0
                        });

                        const count = employeeData.workers.length || 1;
                        const avgNetProfit = totals.netProfit / count;

                        dailyAveragesHtml = `
                            <div class="text-dark-text-muted text-xs mb-2 mt-4">Daily Averages (All Workers)</div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 py-3 mb-3 border-b border-dark-card-alt">
                                <div class="text-dark-text-muted text-[10px]">Production Points: <strong class="text-dark-text">${formatInteger(totals.productionPoints / count)}</strong> PP/day ⛏️</div>
                                <div class="text-dark-text-muted text-[10px]">Units Produced: <strong class="text-dark-text">${formatNumber(totals.unitsProduced / count)}</strong> units/day</div>
                                <div class="text-dark-text-muted text-[10px]">Revenue Generated: <strong class="text-accent-green">~${formatNumber(totals.revenue / count)}</strong> BTC/day</div>
                                <div class="text-dark-text-muted text-[10px]">Wage Expenditure: <strong class="text-accent-red">${formatNumber(totals.wage / count)}</strong> BTC/day</div>
                                <div class="text-dark-text-muted text-[10px]">Net Profit: <strong class="${avgNetProfit >= 0 ? 'text-accent-green' : 'text-accent-red'}">${formatNumber(avgNetProfit)}</strong> BTC/day</div>
                                <div class="text-dark-text-muted text-[10px]">Profit Margin: <strong class="text-dark-text">${formatNumber(totals.profitMargin / count)}</strong>%</div>
                                <div class="text-dark-text-muted text-[10px]">Break-even Price: <strong class="text-dark-text">${formatNumber(totals.breakEven / count)}</strong> BTC/unit</div>
                            </div>
                        `;
                    }

                    return `
                        <div class="bg-dark-card border border-dark-card-alt rounded-lg p-3.5 mb-3 border-l-4 border-t-white ${profitClass}">
                            <div class="flex items-center gap-2 mb-3 pb-3 border-b border-dark-card-alt text-sm">
                                <img src="/static/img/${company.company.itemCode}.png" alt="${company.company.itemCode}" title="${company.company.itemCode}" class="w-6 h-6">
                                <p class="uppercase font-bold">${company.company.name}</p>
                                <small class="ml-auto">Current Market Value: 1  = ${formatNumber(data.market_lookup[company.company.itemCode])} BTC</small>
                            </div>
                            
                            <div class="grid grid-cols-3 gap-3 py-3 mb-3 border-b border-dark-card-alt">
                                <span class="flex flex-col gap-1 text-xs text-dark-text-dim uppercase tracking-wide">
                                    Avg Daily Revenue
                                    <strong class="text-accent-green text-sm normal-case tracking-normal">${formatNumber(stats.avg_daily_revenue_total)} BTC</strong>
                                </span>
                                <span class="flex flex-col gap-1 text-xs text-dark-text-dim uppercase tracking-wide">
                                    Avg Daily Wages
                                    <strong class="text-accent-red text-sm normal-case tracking-normal">${formatNumber(stats.avg_daily_wages_paid)} BTC</strong>
                                </span>
                                <span class="flex flex-col gap-1 text-xs text-dark-text-dim uppercase tracking-wide">
                                    Avg Potential Daily Profit
                                    <strong class="${netProfit >= 0 ? 'text-accent-green' : 'text-accent-red'} text-sm normal-case tracking-normal">${formatNumber(netProfit)} BTC</strong>
                                </span>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 py-3 mb-3 border-b border-dark-card-alt">
                                <div class="text-xs text-dark-text-dim">
                                    <div class="mb-2">Avg Daily Production Points</div>
                                    <div class="text-dark-text-muted text-[10px]">From Workers: <strong class="text-dark-text">${formatInteger(stats.avg_daily_employee_prod)} ⚡</strong></div>
                                    <div class="text-dark-text-muted text-[10px]">From Self Work: <strong class="text-dark-text">${formatInteger(stats.avg_daily_self_work)} ⛏️</strong></div>
                                    <div class="text-dark-text-muted text-[10px]">From Automation: <strong class="text-dark-text">${formatInteger(stats.avg_daily_automation_engine)} ⚙️</strong></div>
                                    <div class="text-dark-text text-xs mt-1">Total: <strong>${formatInteger(stats.avg_daily_total_pp)} PP/day 💸</strong></div>
                                </div>
                                <div class="text-xs text-dark-text-dim">
                                    <div class="mb-2">Avg Daily Units Produced</div>
                                    <div class="text-dark-text-muted text-[10px]">From Workers: <strong class="text-dark-text">${formatNumber(stats.avg_daily_units_employee)}  ⚡</strong></div>
                                    <div class="text-dark-text-muted text-[10px]">From Self Work: <strong class="text-dark-text">${formatNumber(stats.avg_daily_units_self_work)}  ⛏️</strong></div>
                                    <div class="text-dark-text-muted text-[10px]">From Automation: <strong class="text-dark-text">${formatNumber(stats.avg_daily_units_automation)} ⚙️</strong></div>
                                    <div class="text-dark-text text-xs mt-1">Total: <strong>${formatNumber(stats.avg_daily_units_total)} units/day 💸</strong></div>
                                </div>
                            </div>

                            <div class="grid grid-cols-3 gap-3 text-xs text-dark-text-dim">
                                <div>From Workers<div class="text-dark-text font-semibold text-xs mt-1">${formatNumber(stats.avg_daily_revenue_employee)} BTC/day</div></div>
                                <div>From Self Work<div class="text-dark-text font-semibold text-xs mt-1">${formatNumber(stats.avg_daily_revenue_self_work)} BTC/day</div></div>
                                <div>From Automation<div class="text-dark-text font-semibold text-xs mt-1">${formatNumber(stats.avg_daily_revenue_automation)} BTC/day</div></div>
                            </div>

                            ${workersHtml}
                            ${dailyAveragesHtml}
                        </div>
                    `;
                }).join('');

                sectionsHtml += sectionWrapper(`
                    ${sectionTitle('Company overview')}
                    ${companyCards}
                `, "p2 max-h-[500px] overflow-auto");
            }

            // Summary section
            if (data.company_breakdown && data.company_breakdown.length) {
                const totalRevenue = data.company_breakdown.reduce((sum, c) => sum + (c.stats.avg_daily_revenue_total || 0), 0);
                const totalWages = data.company_breakdown.reduce((sum, c) => sum + (c.stats.avg_daily_wages_paid || 0), 0);
                const totalNetProfit = data.company_breakdown.reduce((sum, c) => sum + (c.stats.avg_daily_net_profit || 0), 0);
                const totalCompanies = data.company_breakdown.length;
                const totalWorkers = data.employee_breakdown?.reduce((sum, eb) => sum + (eb.workers?.length || 0), 0) || 0;

                const profitClass = totalNetProfit >= 0 ? 'text-accent-green' : 'text-accent-red';

                sectionsHtml = sectionWrapper(`
                    ${sectionTitle('Summary')}
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                        <div class="text-center">
                            <div class="text-xs text-dark-text-dim uppercase tracking-wide mb-2">Total Companies</div>
                            <div class="text-2xl font-bold">${totalCompanies}</div>
                        </div>
                        <div class="text-center">
                            <div class="text-xs text-dark-text-dim uppercase tracking-wide mb-2">Total Workers</div>
                            <div class="text-2xl font-bold">${totalWorkers}</div>
                        </div>
                        <div class="text-center">
                            <div class="text-xs text-dark-text-dim uppercase tracking-wide mb-2">Avg Daily Revenue</div>
                            <div class="text-2xl font-bold ${profitClass}">${formatNumber(totalRevenue)}</div>
                            <div class="text-[10px] text-dark-text-dim mt-0.5">BTC/day</div>
                        </div>
                        <div class="text-center">
                            <div class="text-xs text-dark-text-dim uppercase tracking-wide mb-2">Avg Daily Wages paid</div>
                            <div class="text-2xl font-bold text-accent-red">${formatNumber(totalWages)}</div>
                            <div class="text-[10px] text-dark-text-dim mt-0.5">BTC/day</div>
                        </div>
                        <div class="text-center">
                            <div class="text-xs text-dark-text-dim uppercase tracking-wide mb-2">Avg Daily Profit</div>
                            <div class="text-2xl font-bold ${profitClass}">${formatNumber(totalNetProfit)}</div>
                            <div class="text-[10px] text-dark-text-dim mt-0.5">BTC/day</div>
                        </div>
                        <div class="text-center">
                            <div class="text-xs text-dark-text-dim uppercase tracking-wide mb-2">Daily wage earn from work</div>
                            <div class="text-2xl font-bold text-accent-green">${formatNumber(data.job_breakdown.average_daily_wage_earn)}</div>
                            <div class="text-[10px] text-dark-text-dim mt-0.5">BTC/day</div>
                        </div>
                    </div>
                `, 'text-center') + sectionsHtml;
            }

            $hero.append(sectionsHtml);
        })
        .catch(err => {
            console.error('Error:', err);
            $hero.find('.dynamic-content').remove();
            $hero.append(`<div class="dynamic-content mt-4 p-3 bg-dark-bg border border-accent-red rounded-lg text-accent-red text-center text-sm">Failed to fetch player data. Please try again.</div>`);
        })
        .finally(() => {
            $button.prop('disabled', false).text(buttonText);
        });
});

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(() => {
        const target = document.querySelector('.border-accent-green.border-2, .border-accent-red.border-2');
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, 300);
});


function loadChart(chartData) {
if (!chartData) {
return 
}
const labels = chartData.map(d => d.day);

const ctx = document.getElementById("wageChart").getContext("2d");

new Chart(ctx, {
  type: "line",
  data: {
    labels,
    datasets: [
      {
        label: "Allowed Avg",
        data: chartData.map(d => d.allowedAvg),
        borderColor: "#4ade80",
        backgroundColor: "rgba(74,222,128,0.15)",
        tension: 0.35,
        fill: true,
        pointRadius: 0,
        borderWidth: 2
      },
      {
        label: "Allowed Min",
        data: chartData.map(d => d.allowedMin),
        borderColor: "#888",
        borderDash: [4, 4],
        tension: 0.35,
        pointRadius: 0
      },
      {
        label: "Allowed Max",
        data: chartData.map(d => d.allowedMax),
        borderColor: "#888",
        borderDash: [4, 4],
        tension: 0.35,
        pointRadius: 0
      },
      {
        label: "Top Offer",
        data: chartData.map(d => d.topOffer),
        borderColor: "#facc15",
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#888",
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: "#0a0a0a",
        borderColor: "#222",
        borderWidth: 1,
        titleColor: "#fff",
        bodyColor: "#ccc",
        padding: 12
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#666" }
      },
      y: {
        grid: {
          color: "rgba(255,255,255,0.05)"
        },
        ticks: {
          color: "#666",
          callback: v => v.toFixed(3)
        }
      }
    }
  }
});
}

$(document).ready(function() {
    const table = $('#usersTable').DataTable({
        order: [[1, 'desc']],
        scrollX: true,
        autoWidth: false,
        pageLength: 25,
        language: {
            search: "Search citizens:",
            lengthMenu: "Show _MENU_ citizens per page",
            info: "Showing _START_ to _END_ of _TOTAL_ citizens",
            infoEmpty: "No citizens found",
            infoFiltered: "(filtered from _MAX_ total citizens)"
        }
    });

    $('#usersTable tbody').on('click', 'tr', function() {
        const userId = $(this).data('user-id');
        if (userId) {
            window.open(`https://app.warera.io/user/${userId}`, '_blank').focus();
        }
    });
});

const countryForm = document.getElementById('countryForm');
const countrySelect = document.getElementById('countries');

countryForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const countryCode = countrySelect.value;
    if (countryCode) {
        window.location.href = `/app/country/${countryCode}`;
    }
});

countrySelect.addEventListener('change', function() {
    if (this.value) {
        window.location.href = `/app/country/${this.value}`;
    }
});



