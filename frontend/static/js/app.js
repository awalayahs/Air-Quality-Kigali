document.addEventListener('DOMContentLoaded', () => {
    fetchMetadata();
    fetchForecasts();
    fetchModelComparison();
});

async function fetchMetadata() {
    try {
        const response = await fetch('/api/metadata');
        const data = await response.json();
        document.getElementById('target-var').innerText = `Target Variable: ${data.target_variable}`;
        document.getElementById('selected-model').innerText = data.selected_model;
        document.getElementById('data-source').innerText = data.data_source;
        document.getElementById('last-trained').innerText = new Date(data.trained_at).toLocaleDateString();
    } catch (err) {
        console.error('Error fetching metadata:', err);
    }
}

async function fetchForecasts() {
    try {
        const [nativeRes, demoRes] = await Promise.all([
            fetch('/api/forecast/native'),
            fetch('/api/forecast/demo')
        ]);
        
        const nativeData = await nativeRes.json();
        const demoData = await demoRes.json();

        const labels = nativeData.map(item => item.timestamp.split(' ')[1]);
        const nativePm25 = nativeData.map(item => item.pm25);
        const demoPm25 = demoData.map(item => item.pm25);

        renderForecastChart(labels, nativePm25, demoPm25);
    } catch (err) {
        console.error('Error fetching forecast data:', err);
    }
}

function renderForecastChart(labels, nativeData, demoData) {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Native Forecast (PM2.5)',
                    data: nativeData,
                    borderColor: '#3182ce',
                    backgroundColor: 'rgba(49, 130, 206, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Demo Benchmark (PM2.5)',
                    data: demoData,
                    borderColor: '#dd6b20',
                    backgroundColor: 'rgba(221, 107, 32, 0.1)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { title: { display: true, text: 'µg/m³' } },
                x: { title: { display: true, text: 'Time' } }
            }
        }
    });
}

async function fetchModelComparison() {
    try {
        const response = await fetch('/api/comparison');
        const data = await response.json();

        const labels = data.map(m => m.model_name);
        const maeValues = data.map(m => m.mae);

        renderMetricsChart(labels, maeValues);
    } catch (err) {
        console.error('Error fetching model comparison:', err);
    }
}

function renderMetricsChart(labels, maeValues) {
    const ctx = document.getElementById('metricsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Mean Absolute Error (MAE)',
                data: maeValues,
                backgroundColor: ['#319795', '#4299e1', '#ed8936', '#e53e3e']
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'MAE' } }
            }
        }
    });
}
