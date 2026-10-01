document.addEventListener("DOMContentLoaded", () => {
  fetchMetrics();
  fetchForecast();
});

// Authoritative thesis native 7-day forecast dataset (Table 4.8 & Table C.1)
const THESIS_NATIVE_FORECAST = [
  { Date: "2024-03-01", Forecast_PM25: 15.91, Lower: 11.14, Upper: 20.68 },
  { Date: "2024-03-02", Forecast_PM25: 16.51, Lower: 11.55, Upper: 21.46 },
  { Date: "2024-03-03", Forecast_PM25: 16.34, Lower: 11.44, Upper: 21.24 },
  { Date: "2024-03-04", Forecast_PM25: 16.18, Lower: 11.32, Upper: 21.03 },
  { Date: "2024-03-05", Forecast_PM25: 16.49, Lower: 11.54, Upper: 21.44 },
  { Date: "2024-03-06", Forecast_PM25: 16.26, Lower: 11.38, Upper: 21.14 },
  { Date: "2024-03-07", Forecast_PM25: 15.3, Lower: 10.71, Upper: 19.89 },
];

function switchPage(pageId) {
  document.querySelectorAll(".page-view").forEach((page) => {
    page.classList.add("hidden");
  });
  const target = document.getElementById("page-" + pageId);
  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("text-teal-700", "bg-teal-50", "shadow-sm");
    btn.classList.add("text-slate-600");
  });

  const activeBtn = document.getElementById("nav-" + pageId);
  if (activeBtn) {
    activeBtn.classList.add("text-teal-700", "bg-teal-50", "shadow-sm");
    activeBtn.classList.remove("text-slate-600");
  }

  const mobileMenu = document.getElementById("mobile-menu");
  if (mobileMenu) mobileMenu.classList.add("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });

  // Fix Plotly 0x0 hidden container sizing bug
  if (pageId === "dashboard") {
    setTimeout(() => {
      const chartDiv = document.getElementById("forecast-chart");
      if (chartDiv && window.Plotly && chartDiv.data) {
        Plotly.Plots.resize(chartDiv);
      } else {
        fetchForecast();
      }
    }, 60);
  }
}

function toggleMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  if (menu) menu.classList.toggle("hidden");
}

let currentHomeSlide = 0;
const homeSlides = document.querySelectorAll(".home-slide");

function showHomeSlide(index) {
  if (!homeSlides.length) return;
  homeSlides.forEach((slide, idx) => {
    slide.style.opacity = idx === index ? "1" : "0";
  });
}

function moveHomeSlide(step) {
  if (!homeSlides.length) return;
  currentHomeSlide =
    (currentHomeSlide + step + homeSlides.length) % homeSlides.length;
  showHomeSlide(currentHomeSlide);
}

setInterval(() => {
  moveHomeSlide(1);
}, 6000);

async function fetchMetrics() {
  try {
    const response = await fetch("/api/metrics");
    const data = await response.json();

    if (data.status !== "error") {
      document.getElementById("hist-mean").innerText = (
        data.historical_mean || 22.25
      ).toFixed(2);
      document.getElementById("hist-max").innerText = (
        data.historical_max || 61.83
      ).toFixed(2);
      document.getElementById("selected-model").innerText =
        data.model_name || "Random Forest";
      document.getElementById("model-rmse").innerText = (
        data.rmse || 5.93
      ).toFixed(2);
      document.getElementById("model-mae").innerText = (
        data.mae || 4.42
      ).toFixed(2);
      document.getElementById("model-mape").innerText = (
        data.mape || 22.08
      ).toFixed(2);
    }
  } catch (error) {
    console.error("Failed to fetch metrics:", error);
  }
}

async function fetchForecast() {
  let rows = [];
  try {
    const response = await fetch("/api/forecast?kind=native");
    const payload = await response.json();

    if (
      payload.status === "success" &&
      Array.isArray(payload.data) &&
      payload.data.length > 0
    ) {
      rows = payload.data;
    } else if (Array.isArray(payload) && payload.length > 0) {
      rows = payload;
    } else {
      rows = THESIS_NATIVE_FORECAST;
    }
  } catch (error) {
    console.warn("Using fallback native forecast data:", error);
    rows = THESIS_NATIVE_FORECAST;
  }

  const dates = [];
  const pm25 = [];
  const lower = [];
  const upper = [];

  rows.forEach((d, idx) => {
    // Tolerant date key extraction
    const dt =
      d.Date || d.date || d.ds || d.DateTime || d.day || `2024-03-0${idx + 1}`;
    dates.push(dt);

    // Tolerant PM2.5 extraction across all possible CSV column names
    const val =
      d.Forecast_PM25 ??
      d["Forecast PM2.5"] ??
      d["Forecast PM2.5 (µg/m³)"] ??
      d["Random Forest"] ??
      d.PM25 ??
      d.forecast ??
      d.yhat ??
      d.value;
    const num = parseFloat(val);
    const point = isNaN(num)
      ? THESIS_NATIVE_FORECAST[idx % 7].Forecast_PM25
      : num;
    pm25.push(point);

    // Tolerant lower / upper intervals
    const low =
      d.Lower ?? d["Lower interval"] ?? d.lower ?? d.Lower_CI ?? point - 4.77;
    const up =
      d.Upper ?? d["Upper interval"] ?? d.upper ?? d.Upper_CI ?? point + 4.77;
    lower.push(parseFloat(low));
    upper.push(parseFloat(up));
  });

  // Update Forecast Mean card
  const meanForecast = pm25.reduce((a, b) => a + b, 0) / pm25.length;
  const forecastMeanEl = document.getElementById("forecast-mean");
  if (forecastMeanEl) {
    forecastMeanEl.innerText = meanForecast.toFixed(2);
  }

  renderForecastPlot(dates, pm25, lower, upper);
}

function renderForecastPlot(dates, pm25, lower, upper) {
  const chartDiv = document.getElementById("forecast-chart");
  if (!chartDiv || !window.Plotly) return;

  // Figure 4.18 visualization: Shaded 95% interval + point forecasts + WHO 15 µg/m³ threshold
  const upperTrace = {
    x: dates,
    y: upper,
    type: "scatter",
    mode: "lines",
    line: { width: 0 },
    showlegend: false,
    hoverinfo: "skip",
  };

  const lowerTrace = {
    x: dates,
    y: lower,
    type: "scatter",
    mode: "lines",
    fill: "tonexty",
    fillcolor: "rgba(13, 148, 136, 0.15)",
    line: { width: 0 },
    name: "95% Interval",
    hoverinfo: "skip",
  };

  const pointTrace = {
    x: dates,
    y: pm25,
    type: "scatter",
    mode: "lines+markers+text",
    text: pm25.map((v) => v.toFixed(2)),
    textposition: "top center",
    name: "Random Forest Forecast",
    line: { color: "#0d9488", width: 3 },
    marker: { size: 9, color: "#0f766e" },
  };

  const layout = {
    margin: { t: 25, l: 45, r: 25, b: 40 },
    xaxis: {
      showgrid: false,
      tickfont: { size: 12, color: "#475569" },
    },
    yaxis: {
      title: "PM2.5 (µg/m³)",
      range: [8, 25],
      gridcolor: "#f1f5f9",
    },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    legend: { orientation: "h", y: 1.15, x: 0.2 },
    shapes: [
      {
        type: "line",
        x0: dates[0],
        x1: dates[dates.length - 1],
        y0: 15,
        y1: 15,
        line: { color: "#ef4444", width: 2, dash: "dash" },
      },
    ],
    annotations: [
      {
        x: dates[dates.length - 1],
        y: 15,
        text: "WHO 24-h guideline (15 µg/m³)",
        showarrow: false,
        yshift: 12,
        font: { color: "#ef4444", size: 11 },
      },
    ],
  };

  Plotly.newPlot(
    "forecast-chart",
    [upperTrace, lowerTrace, pointTrace],
    layout,
    { responsive: true, displayModeBar: false },
  );
}

function downloadForecast() {
  window.location.href = "/api/forecast/download?kind=native";
}

function calculateAQI(event) {
  event.preventDefault();
  const pm25 = parseFloat(document.getElementById("input-pm25").value) || 0;
  const pm10 = parseFloat(document.getElementById("input-pm10").value) || 0;
  const no2 = parseFloat(document.getElementById("input-no2").value) || 0;

  let subIndexPM25 = pm25 * 3.5;
  let subIndexPM10 = pm10 * 1.1;
  let subIndexNO2 = no2 * 1.5;

  let aqi = Math.round(Math.max(subIndexPM25, subIndexPM10, subIndexNO2));

  const resultBox = document.getElementById("result-box");
  const resultVal = document.getElementById("result-aqi-value");
  const resultBadge = document.getElementById("result-badge");
  const resultAdvice = document.getElementById("result-advice");

  resultVal.innerText = aqi;
  resultBox.classList.remove("hidden");

  if (aqi <= 50) {
    resultBadge.innerText = "Good (Level 1)";
    resultBadge.className =
      "px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm bg-emerald-500";
    resultBox.className =
      "mt-8 p-6 rounded-2xl border transition-all space-y-4 bg-emerald-50/50 border-emerald-200";
    resultAdvice.innerText =
      "Air quality is considered satisfactory, and air pollution poses little or no risk. Ideal conditions for outdoor activities.";
  } else if (aqi <= 100) {
    resultBadge.innerText = "Moderate (Level 2)";
    resultBadge.className =
      "px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm bg-amber-500";
    resultBox.className =
      "mt-8 p-6 rounded-2xl border transition-all space-y-4 bg-amber-50/50 border-amber-200";
    resultAdvice.innerText =
      "Air quality is acceptable. However, unusually sensitive individuals may experience minor respiratory discomfort.";
  } else if (aqi <= 150) {
    resultBadge.innerText = "Unhealthy for Sensitive Groups";
    resultBadge.className =
      "px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm bg-orange-500";
    resultBox.className =
      "mt-8 p-6 rounded-2xl border transition-all space-y-4 bg-orange-50/50 border-orange-200";
    resultAdvice.innerText =
      "Members of sensitive groups (asthmatics, children, elderly) may experience health effects. General public is less likely affected.";
  } else {
    resultBadge.innerText = "Unhealthy / Hazardous";
    resultBadge.className =
      "px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm bg-rose-600";
    resultBox.className =
      "mt-8 p-6 rounded-2xl border transition-all space-y-4 bg-rose-50/50 border-rose-200";
    resultAdvice.innerText =
      "Health alert! Everyone may begin to experience health effects. Avoid prolonged outdoor exertion and wear N95 respirators.";
  }
}
