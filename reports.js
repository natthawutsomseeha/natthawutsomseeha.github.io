// Sample data for reports: number of near‑empty bag alerts per day (sample data)
const reportData = [2, 1, 3, 5, 2, 4, 1];

// Global variable to hold the Chart.js instance
let reportChart;

/**
 * Initialise the reports chart. Creates a new Chart instance and stores it
 * globally so it can be updated when the language changes. The labels and
 * titles are translated using the global `t()` function.
 */
function initReportChart() {
  const ctx = document.getElementById('reportsChart').getContext('2d');
  // Prepare translated labels for days of week
  const labels = [
    t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')
  ];
  reportChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: t('alertCount'),
        data: reportData,
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: t('alertNumber')
          }
        },
        x: {
          title: {
            display: true,
            text: t('day')
          }
        }
      },
      plugins: {
        legend: {
          display: true
        },
        title: {
          display: true,
          text: t('trendTitle')
        }
      }
    }
  });
}

/**
 * Update the existing reports chart with new translations. This function
 * reassigns labels, dataset labels and titles based on the current
 * language and then calls Chart.js update to redraw the chart.
 */
function updateReportChart() {
  if (!reportChart) return;
  reportChart.data.labels = [
    t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')
  ];
  reportChart.data.datasets[0].label = t('alertCount');
  reportChart.options.scales.y.title.text = t('alertNumber');
  reportChart.options.scales.x.title.text = t('day');
  reportChart.options.plugins.title.text = t('trendTitle');
  reportChart.update();
}

// Initialise chart on page load
window.addEventListener('load', initReportChart);

// Register dynamic update on language change
if (window.languageChangeHandlers) {
  window.languageChangeHandlers.push(() => {
    updateReportChart();
  });
}