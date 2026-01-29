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
                    if ($(this).hasClass('selected')) {
                        $(this).removeClass('selected');
                    } else {
                        table.$('tr.selected').removeClass('selected');
                        $(this).addClass('selected');
                        
                        const data = table.row(this).data();
                    }
                });
            });

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
            .addClass('input-error')
            .focus();

        setTimeout(() => {
            $input.attr('placeholder', originalPlaceholder)
                .removeClass('input-error');
        }, 2000);
        return;
    }

    $input.removeClass('input-error').attr('placeholder', originalPlaceholder);
    $button.prop('disabled', true).html('<span class="btn-spinner"></span> Please wait...');

    const $hero = $('.optimal-hero');

    const formatNumber = (num) => {
        const truncated = Math.floor(num * 100) / 100;
        return truncated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    const formatInteger = num => Math.round(num).toLocaleString('en-US');

    const sectionWrapper = (inner, extraClass = '') => `
        <div class="dynamic-section ${extraClass}">
            ${inner}
        </div>
    `;

    const sectionTitle = text => `<div class="section-title">${text}</div>`;

    fetch(`/get-summary?playerId=${encodeURIComponent(playerId)}`)
        .then(res => res.json())
        .then(data => {
            $hero.find('.dynamic-section').remove();
            let sectionsHtml = '';

            if (data.company_breakdown && data.company_breakdown.length) {
                const companyCards = data.company_breakdown.map(company => {
                    const stats = company.stats;
                    const netProfit = stats.avg_daily_net_profit || 0;
                    const profitClass = netProfit >= 0 ? 'profit' : 'loss';

                    // Employee cards
                    let workersHtml = '';
                    if (company.workers && company.workers.length > 0) {
                        workersHtml = `
                            <div class="section-title workers-title">Workers (${company.workers.length})</div>
                            <div class="workers-section">
                                ${company.workers.map(worker => `
                                    <div class="employee-card">
                                        <div class="employee-name">Worker Name: ${worker.name}</div>
                                        <div>Current Wage: <strong>${formatNumber(worker.wage)}</strong> BTC</div>
                                        <div>Energy: <strong>${worker.energy} ⚡</strong></div>
                                        <div>Production: <strong>${worker.production} ⛏️</strong></div>
                                        <div>Fidelity Level: <strong>${worker.fidelity} 💛</strong></div>
                                        <div>Joined: <strong>${new Date(worker.joinedAt).toLocaleDateString()}</strong></div>
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

                        dailyAveragesHtml = `
                        <div class="stat-label">Daily Averages (All Workers)</div>
                            <div class="company-stats-grid two-columns">
                                
                                <div class="stat-detail">Production Points: <strong>${formatInteger(totals.productionPoints / count)}</strong> PP/day ⛏️</div>
                                <div class="stat-detail">Units Produced: <strong>${formatNumber(totals.unitsProduced / count)}</strong> units/day</div>
                                <div class="stat-detail">Revenue Generated: <strong class="green">~${formatNumber(totals.revenue / count)}</strong> BTC/day</div>
                                <div class="stat-detail">Wage Expenditure: <strong class="red">${formatNumber(totals.wage / count)}</strong> BTC/day</div>
                                <div class="stat-detail">Net Profit: <strong class="${totals.netProfit / count >= 0 ? 'green' : 'red'}">${formatNumber(totals.netProfit / count)}</strong> BTC/day</div>
                                <div class="stat-detail">Profit Margin: <strong>${formatNumber(totals.profitMargin / count)}</strong>%</div>
                                <div class="stat-detail">Break-even Price: <strong>${formatNumber(totals.breakEven / count)}</strong> BTC/unit</div>
                            </div>
                        `;
                    }

                    return `
                        <div class="company-card ${profitClass}">
                            <div class="company-header">
                                <img src="/static/img/${company.company.itemCode}.png" alt="${company.company.itemCode}" title="${company.company.itemCode}" class="company-icon">
                                <p class="company-header-name">${company.company.name}</p>
                                <small>Current Market Value: 1  = ${formatNumber(data.market_lookup[company.company.itemCode])} BTC</small>
                            </div>
                            
                            <div class="company-totals">
                                <span>
                                    Avg Daily Revenue
                                    <strong class="green">${formatNumber(stats.avg_daily_revenue_total)} BTC</strong>
                                </span>
                                <span>
                                    Avg Daily Wages
                                    <strong class="red">${formatNumber(stats.avg_daily_wages_paid)} BTC</strong>
                                </span>
                                <span>
                                    Avg Potential Daily Profit
                                    <strong class="${profitClass === 'profit' ? 'green' : 'red'}">${formatNumber(netProfit)} BTC</strong>
                                </span>
                            </div>

                            <div class="company-stats-grid two-columns">
                                <div class="stat-column">
                                    <div class="stat-label">Avg Daily Production Points</div>
                                    <div class="stat-detail">From Workers: <strong>${formatInteger(stats.avg_daily_employee_prod)} ⚡</strong></div>
                                    <div class="stat-detail">From Self Work: <strong>${formatInteger(stats.avg_daily_self_work)} ⛏️</strong></div>
                                    <div class="stat-detail">From Automation: <strong>${formatInteger(stats.avg_daily_automation_engine)} ⚙️</strong></div>
                                    <div class="stat-total">Total: <strong>${formatInteger(stats.avg_daily_total_pp)} PP/day 💸</strong></div>
                                </div>
                                <div class="stat-column">
                                    <div class="stat-label">Avg Daily Units Produced</div>
                                    <div class="stat-detail">From Workers: <strong>${formatNumber(stats.avg_daily_units_employee)}  ⚡</strong></div>
                                    <div class="stat-detail">From Self Work: <strong>${formatNumber(stats.avg_daily_units_self_work)}  ⛏️</strong></div>
                                    <div class="stat-detail">From Automation: <strong>${formatNumber(stats.avg_daily_units_automation)} ⚙️</strong></div>
                                    <div class="stat-total">Total: <strong>${formatNumber(stats.avg_daily_units_total)} units/day 💸</strong></div>
                                </div>
                            </div>

                            <div class="company-stats-grid three-columns">
                                <div>From Workers<div class="stat-value">${formatNumber(stats.avg_daily_revenue_employee)} BTC/day</div></div>
                                <div>From Self Work<div class="stat-value">${formatNumber(stats.avg_daily_revenue_self_work)} BTC/day</div></div>
                                <div>From Automation<div class="stat-value">${formatNumber(stats.avg_daily_revenue_automation)} BTC/day</div></div>
                            </div>

                            ${workersHtml}
                            ${dailyAveragesHtml}
                        </div>
                    `;
                }).join('');

                sectionsHtml += sectionWrapper(`
                    ${sectionTitle('Company overview')}
                    ${companyCards}
                `);
            }

            // Summary section
            if (data.company_breakdown && data.company_breakdown.length) {
                const totalRevenue = data.company_breakdown.reduce((sum, c) => sum + (c.stats.avg_daily_revenue_total || 0), 0);
                const totalWages = data.company_breakdown.reduce((sum, c) => sum + (c.stats.avg_daily_wages_paid || 0), 0);
                const totalNetProfit = data.company_breakdown.reduce((sum, c) => sum + (c.stats.avg_daily_net_profit || 0), 0);
                const totalCompanies = data.company_breakdown.length;
                const totalWorkers = data.employee_breakdown?.reduce((sum, eb) => sum + (eb.workers?.length || 0), 0) || 0;

                const profitClass = totalNetProfit >= 0 ? 'green' : 'red';

                sectionsHtml = sectionWrapper(`
                    ${sectionTitle('Summary')}
                    <div class="summary-grid">
                        <div class="summary-card">
                            <div class="summary-label">Total Companies</div>
                            <div class="summary-value">${totalCompanies}</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Total Workers</div>
                            <div class="summary-value">${totalWorkers}</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Avg Daily Revenue</div>
                            <div class="summary-value ${profitClass}">${formatNumber(totalRevenue)}</div>
                            <div class="summary-subvalue">BTC/day</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Avg Daily Wages paid</div>
                            <div class="summary-value red">${formatNumber(totalWages)}</div>
                            <div class="summary-subvalue">BTC/day</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Avg Daily Profit</div>
                            <div class="summary-value ${profitClass}">${formatNumber(totalNetProfit)}</div>
                            <div class="summary-subvalue">BTC/day</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Daily wage earn from work</div>
                            <div class="summary-value green">${formatNumber(data.job_breakdown.average_daily_wage_earn)}</div>
                            <div class="summary-subvalue">BTC/day</div>
                        </div>
                    </div>
                `, 'centered') + sectionsHtml;
            }

            $hero.append(sectionsHtml);
        })
        .catch(err => {
            console.error('Error:', err);
            $hero.find('.dynamic-section').remove();
            $hero.append(`<div class="dynamic-section error">Failed to fetch player data. Please try again.</div>`);
        })
        .finally(() => {
            $button.prop('disabled', false).text(buttonText);
        });
});

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(() => {
        const target = document.querySelector('.green-border, .red-border');
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, 300);
});


window.addEventListener('load', function() {
    const loadingOverlay = document.getElementById('loading-overlay');
    
    loadingOverlay.classList.add('fade-out');
    
    setTimeout(function() {
        loadingOverlay.style.display = 'none';
    }, 300);
});
setTimeout(function() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay && loadingOverlay.style.display !== 'none') {
        loadingOverlay.classList.add('fade-out');
        setTimeout(function() {
            loadingOverlay.style.display = 'none';
        }, 300);
    }
}, 30000);