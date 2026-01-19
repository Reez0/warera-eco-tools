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

    fetch(`/get-summary?playerId=${encodeURIComponent(playerId)}`)
        .then(res => res.json())
        .then(data => {
            const $hero = $('.optimal-hero');
            $hero.find('.dynamic-section').remove();

            // ===== SUMMARY =====
            if (data.summary) {
                const $summaryDiv = $('<div>')
                    .addClass('dynamic-section')
                    .css({
                        marginTop: '16px',
                        padding: '12px 16px',
                        background: '#000',
                        border: '1px solid #333',
                        borderRadius: '8px'
                    });

                $summaryDiv.append(
                    $('<div>').css({
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: '#666',
                        marginBottom: '8px',
                        fontWeight: '600'
                    }).text('Player Summary'),
                    $('<div>').css({
                        color: '#fff',
                        fontSize: '0.85rem',
                        lineHeight: '1.5'
                    }).text(data.summary)
                );

                $hero.append($summaryDiv);
            }

            // ===== AUTOMATION (3 COLUMNS, EACH COLUMN HAS 3 VALUES) =====
            if (data.automation && data.automation.length) {
                const $automationDiv = $('<div>')
                    .addClass('dynamic-section')
                    .css({
                        marginTop: '16px',
                        padding: '12px 16px',
                        background: '#000',
                        border: '1px solid #333',
                        borderRadius: '8px'
                    });

                $automationDiv.append(
                    $('<div>').css({
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: '#666',
                        marginBottom: '10px',
                        fontWeight: '600'
                    }).text('Automation Data')
                );

                const $grid = $('<div>').css({
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px'
                });

                data.automation.forEach(item => {
                    const $column = $('<div>').css({
                        background: '#0a0a0a',
                        border: '1px solid #1a1a1a',
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    });

                    // BTC per day
                    $column.append(
                        $('<div>').append(
                            $('<div>').css({
                                fontSize: '0.65rem',
                                color: '#777',
                                textTransform: 'uppercase'
                            }).text('BTC per day'),
                            $('<div>').css({
                                fontSize: '0.95rem',
                                fontWeight: '700',
                                color: '#facc15'
                            }).text(item.btc_per_day)
                        )
                    );

                    // Company
                    $column.append(
                        $('<div>').append(
                            $('<div>').css({
                                fontSize: '0.65rem',
                                color: '#777',
                                textTransform: 'uppercase'
                            }).text('Company'),
                            $('<div>').css({
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                color: '#fff'
                            }).text(item.company+ " (level "+item.engine_level+")")
                        )
                    );

                const iconPath = `/static/img/${item.item}.png`;

                $column.append(
                    $('<div>').append(
                        $('<div>').css({
                            fontSize: '0.65rem',
                            color: '#777',
                            textTransform: 'uppercase'
                        }).text('Resource Produced'),

                        $('<img>', {
                            src: iconPath,
                            alt: item.item,
                            title: item.item
                        }).css({
                            width: '32px',
                            height: '32px',
                            marginBottom: '4px'
                        }),

                        
                    )
                );

                    $grid.append($column);
                });

                $automationDiv.append($grid);
                $hero.append($automationDiv);
            }

            if (data.optimal_switch !== undefined && data.optimal_switch !== null) {
                const $switchDiv = $('<div>')
                    .addClass('dynamic-section')
                    .css({
                        marginTop: '16px',
                        padding: '12px 16px',
                        background: '#000',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        textAlign: 'center'
                    });

                $switchDiv.append(
                    $('<div>').css({
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: '#666',
                        marginBottom: '6px',
                        fontWeight: '600'
                    }).text('Recommendation'),
                    $('<div>').css({
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: '#fff'
                    }).text(data.optimal_switch.blurb + " You're missing out on a potential " +data.optimal_switch.btc_per_day_if_switched + " BTC per day")
                );

                $hero.append($switchDiv);
            }
        })
        .catch(() => {
            $('.optimal-hero').find('.dynamic-section').remove();
            $('.optimal-hero').append(
                $('<div>')
                    .addClass('dynamic-section')
                    .css({
                        marginTop: '16px',
                        padding: '12px 16px',
                        background: '#000',
                        border: '1px solid #f87171',
                        borderRadius: '8px',
                        color: '#f87171',
                        textAlign: 'center',
                        fontSize: '0.85rem'
                    })
                    .text('Failed to fetch player data. Please try again.')
            );
        })
        .finally(() => {
            $button.prop('disabled', false).text(buttonText);
        });
});
