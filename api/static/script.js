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
            if (data.employees && data.employees.length) {
                const cards = [];

                data.employees.forEach(company => {
                    company.workers.forEach(worker => {
                        const profitClass =
                            worker.profit_per_energy >= 0 ? 'positive' : 'negative';

                        cards.push(`
                            <div class="employee-card">
                                <div class="employee-name">${worker.username}</div>
                                <div class="employee-company">
                                    ${company.company} • <img
                                src="/static/img/${company.item}.png"
                                alt="${company.item}"
                                title="${company.item}"
                                class="automation-icon"
                            >
                                </div>
                                <div class="employee-energy">Energy: ${worker.energy}</div>
                                <div class="employee-wage">
                                    Current Wage: <strong>${worker.wage}</strong><br>
                                    Wage for Break-even: <strong>${worker.break_even_wage}</strong>
                                </div>
                                <div class="employee-profit ${profitClass}">
                                    Profit / Energy: ${worker.profit_per_energy}
                                </div>
                                <div class="employee-daily-cost">
                                    Daily Wage Cost: ${worker.daily_wage_cost}
                                </div>
                            </div>
                        `);
                    });
                });

            $hero.append(sectionWrapper(`
                ${sectionTitle('Employee Breakdown')}
                <div class="employee-grid-wrapper">
                    <div class="employee-grid">${cards.join('')}</div>
                </div>
            `));
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
