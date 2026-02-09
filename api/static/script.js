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

// NAV

   const toggle = document.getElementById('navToggle');
        const mobileNav = document.getElementById('navMobile');
        
        toggle.addEventListener('click', () => {
            mobileNav.classList.toggle('show');
        });

        document.getElementById('navSearchButton').addEventListener('click', () => {
            handleSearch('navSearchInput', 'navSearchButton');
        });

        document.getElementById('navSearchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch('navSearchInput', 'navSearchButton');
            }
        });

        document.getElementById('navSearchButtonMobile').addEventListener('click', () => {
            handleSearch('navSearchInputMobile', 'navSearchButtonMobile');
        });

        document.getElementById('navSearchInputMobile').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch('navSearchInputMobile', 'navSearchButtonMobile');
            }
        });
        
        function handleSearch(inputId, buttonId) {
            const input = document.getElementById(inputId);
            const button = document.getElementById(buttonId);
            const value = input.value.trim();
            const originalPlaceholder = input.placeholder;
            const buttonText = button.textContent;
            
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
                input.value = '';
                input.placeholder = 'Invalid player ID or profile URL';
                input.style.borderColor = '#f87171';
                input.focus();
                
                setTimeout(() => {
                    input.placeholder = originalPlaceholder;
                    input.style.borderColor = '';
                }, 6000);
                return;
            }
            
            input.style.borderColor = '';
            input.placeholder = originalPlaceholder;
            
            button.disabled = true;
            button.innerHTML = '<span style="display:inline-block; width:1rem; height:1rem; border:2px solid rgba(26,26,26,0.2); border-top-color:white; border-radius:9999px; animation:spin 1s linear infinite; vertical-align:middle;"></span> loading...';
            
            const profileUrl = `/app/player?playerId=${encodeURIComponent(playerId)}`;
            window.location.href = profileUrl
            
            setTimeout(() => {
                button.disabled = false;
                button.textContent = buttonText;
                input.value = '';
            }, 2000);
        }

        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('[data-nav]');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (currentPath === href || (href !== '/app' && currentPath.startsWith(href))) {
                link.classList.add('active');
            }
        });

        document.addEventListener('click', (e) => {
            if (!toggle.contains(e.target) && !mobileNav.contains(e.target)) {
                mobileNav.classList.remove('show');
            }
        });
        
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('show');
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
            window.open(`/app/player?playerId=${userId}`, '_blank').focus();
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



