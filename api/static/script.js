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
            .css('border-color', '#f87171')
            .focus();

        setTimeout(() => {
            $input.attr('placeholder', originalPlaceholder)
                .css('border-color', '#333');
        }, 2000);
        return;
    }

    $input.css('border-color', '#333').attr('placeholder', originalPlaceholder);
    $button.prop('disabled', true).html('<span class="btn-spinner"></span> Please wait...');

    const $hero = $('.optimal-hero');

    // ---------- TEMPLATES ----------
    const sectionWrapper = (inner, extraClass = '') => `
        <div class="dynamic-section ${extraClass}">
            ${inner}
        </div>
    `;

    const sectionTitle = text => `
        <div class="section-title">${text}</div>
    `;

    fetch(`/get-summary?playerId=${encodeURIComponent(playerId)}`)
        .then(res => res.json())
        .then(data => {
            $hero.find('.dynamic-section').remove();

            // ===== SUMMARY =====
            if (data.summary) {
                $hero.append(sectionWrapper(`
                    ${sectionTitle('Player Summary')}
                    <div class="summary-text">${data.summary}</div>
                `));
            }

            // ===== AUTOMATION =====
            if (data.automation && data.automation.length) {
                const columns = data.automation.map(item => `
                    <div class="automation-card">
                        <div>
                            <div class="automation-label">BTC per day</div>
                            <div class="automation-value-btc">${item.btc_per_day}</div>
                        </div>

                        <div>
                            <div class="automation-label">Company</div>
                            <div class="automation-value-company">
                                ${item.company} (level ${item.engine_level})
                            </div>
                        </div>

                        <div>
                            <div class="automation-label">Resource Produced</div>
                            <img
                                src="/static/img/${item.item}.png"
                                alt="${item.item}"
                                title="${item.item}"
                                class="automation-icon"
                            >
                        </div>
                    </div>
                `).join('');

                $hero.append(sectionWrapper(`
                    ${sectionTitle('Automation Data')}
                    <div class="automation-grid">${columns}</div>
                `));
            }

            // ===== EMPLOYEES =====
            if (data.employees && data.employees.some(c => c.workers && c.workers.length > 0)) {
                const cards = [];

                // Only include companies that have workers
                data.employees
                    .filter(company => company.workers && company.workers.length > 0)
                    .forEach(company => {
                        const companyProfitClass = company.net_btc_per_day >= 0 ? 'profit' : 'loss';
                        const redGreenClass = company.net_btc_per_day >= 0 ? 'green' : 'red';

                        cards.push(`
                            <div class="company-card ${companyProfitClass}">
                                <div class="company-header">
                                    <strong>${company.company}</strong> • 
                                    <img src="/static/img/${company.item}.png" alt="${company.item}" title="${company.item}" class="automation-icon">
                                </div>
                                <div class="company-totals">
                                    <span>Revenue: <strong>${company.revenue}</strong> BTC</span>
                                    <span>Wages Paid: <strong>${company.wages}</strong> BTC</span>
                                    <span>Net BTC/Day: <strong class="${redGreenClass}">${company.net_btc_per_day}</strong> BTC</span>
                                </div>
                                <div class="workers-section">
                                    ${company.workers.map(worker => `
                                        <div class="employee-card">
                                            <div class="employee-name">${worker.username}</div>
                                            <div>
                                            ⚡ ${worker.energy} 
                                            ⛏️ ${worker.production} 
                                            Daily Work: ~${worker.daily_work} *
                                            </div>
                                            <div class="revenue"> 
                                                <div class="revenue-item">
                                                    <p>Daily Revenue: </p>
                                                    <p><strong>${worker.revenue_per_day}</strong> BTC</p>
                                                </div>
                                                <div class="revenue-item">
                                                    <p>Daily Wage: </p>
                                                    <p><strong>${worker.daily_wage_cost}</strong> BTC</p>
                                                </div>
                                                <div class="revenue-item">
                                                    <p>Current Wage: </p>
                                                    <p><strong>${worker.current_wage}</strong></p>
                                                </div>
                                                <div class="revenue-item">
                                                    <p>Break-even: </p>
                                                    <p><strong>${worker.break_even_wage}</strong></p>
                                                </div>
                                                 <div class="revenue-item">
                                                    <p>Last work: </p>
                                                    <p><strong>${worker.last_work_time} UTC</strong></p>
                                                </div>
                                            </div>
 
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `);
                    });

                if (cards.length > 0) {
                    $hero.append(sectionWrapper(`
                        ${sectionTitle('Employee Breakdown')}
                        <div class="employee-grid-wrapper">
                            <div class="employee-grid">${cards.join('')}</div>
                        </div>
                    `));
                    $hero.append(`
                        <small class="small-text">* We assume the worker starts the day with a full energy bar and uses energy consistently throughout the day whenever possible.

                            Energy regenerates at a constant hourly rate.

                            Each work action costs 10 energy.

                            Whenever the worker reaches >=10 energy, they immediately perform work.

                            For example:

                            A worker with 30 max energy, 10 production, and 0.089 wage earns
                            0.089 * 10 = 0.89 BTC per work

                            Over a normal day, energy regeneration plus starting energy allows multiple work actions.

                            Any leftover energy below 10 is carried forward and contributes to future work.

                            This model estimates average daily output, not exact click timing.
                        </small>
                        `)
                }
            }


            // ===== RECOMMENDATION =====
            if (data.optimal_switch) {
                $hero.append(sectionWrapper(`
                    ${sectionTitle('Recommendation')}
                    <div class="recommendation-text">
                        ${data.optimal_switch.blurb}
                        You're missing out on a potential
                        ${data.optimal_switch.btc_per_day_if_switched}
                        BTC per day
                    </div>
                `, 'centered'));
            }
        })
        .catch(() => {
            $hero.find('.dynamic-section').remove();
            $hero.append(`
                <div class="dynamic-section error">
                    Failed to fetch player data. Please try again.
                </div>
            `);
        })
        .finally(() => {
            $button.prop('disabled', false).text(buttonText);
        });
});
