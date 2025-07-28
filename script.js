let parsedData = [];
let charts = [];

document.getElementById("fileInput").addEventListener("change", (e) => handleFile(e.target.files[0]));
document.getElementById("themeSelector").addEventListener("change", (e) => {
  document.body.setAttribute('data-theme', e.target.value);
});
document.getElementById("chartType").addEventListener("change", renderCharts);
document.getElementById("downloadChart").addEventListener("click", downloadAllCharts);

// Drag-and-drop support
const dropArea = document.getElementById("drop-area");
dropArea.addEventListener("dragover", e => { e.preventDefault(); dropArea.classList.add("highlight"); });
dropArea.addEventListener("dragleave", () => dropArea.classList.remove("highlight"));
dropArea.addEventListener("drop", e => {
  e.preventDefault();
  handleFile(e.dataTransfer.files[0]);
});

function handleFile(file) {
  const reader = new FileReader();
  const ext = file.name.split(".").pop().toLowerCase();

  reader.onload = (e) => {
    if (ext === "csv") parsedData = parseCSV(e.target.result);
    else if (ext === "json") parsedData = parseJSON(e.target.result);
    else return alert("Unsupported format");
    renderCharts();
    renderTable();
  };

  reader.readAsText(file);
}

function parseCSV(text) {
  const [header, ...rows] = text.trim().split("\n");
  const keys = header.split(",");
  return rows.map(row => {
    const values = row.split(",");
    return Object.fromEntries(keys.map((k, i) => [k.trim(), values[i].trim()]));
  });
}

function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    alert("Invalid JSON");
    return [];
  }
}

function renderCharts() {
  const chartType = document.getElementById("chartType").value;
  const container = document.getElementById("chartsContainer");
  container.innerHTML = "";
  charts.forEach(c => c.destroy());

  if (!parsedData.length) return;

  const keys = Object.keys(parsedData[0]);
  const xKey = keys[0];
  const yKeys = keys.slice(1).filter(k => !isNaN(parsedData[0][k]));

  yKeys.forEach((yKey, index) => {
    const labels = parsedData.map(item => item[xKey]);
    const values = parsedData.map(item => parseFloat(item[yKey]));
    const canvas = document.createElement("canvas");
    const chartBox = document.createElement("div");
    chartBox.className = "chart-box";
    chartBox.appendChild(canvas);
    container.appendChild(chartBox);

    const ctx = canvas.getContext("2d");
    const newChart = new Chart(ctx, {
      type: chartType,
      data: {
        labels,
        datasets: [{
          label: yKey,
          data: values,
          backgroundColor: getColor(index, 0.7),
          borderColor: getColor(index),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              color: getComputedStyle(document.body).getPropertyValue('--text-color')
            }
          }
        },
        scales: chartType !== 'pie' ? {
          x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-color') } },
          y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-color') } }
        } : {}
      }
    });
    charts.push(newChart);
  });
}

function getColor(i, alpha = 1) {
  const colors = [
    `rgba(255, 99, 132, ${alpha})`,
    `rgba(54, 162, 235, ${alpha})`,
    `rgba(255, 206, 86, ${alpha})`,
    `rgba(75, 192, 192, ${alpha})`,
    `rgba(153, 102, 255, ${alpha})`,
    `rgba(255, 159, 64, ${alpha})`
  ];
  return colors[i % colors.length];
}

function renderTable() {
  const tableDiv = document.getElementById("dataTable");
  if (!parsedData.length) return (tableDiv.innerHTML = "");

  const keys = Object.keys(parsedData[0]);
  const table = document.createElement("table");
  const thead = table.insertRow();
  keys.forEach(k => {
    const th = document.createElement("th");
    th.innerText = k;
    thead.appendChild(th);
  });

  parsedData.forEach(row => {
    const tr = table.insertRow();
    keys.forEach(k => {
      const td = tr.insertCell();
      td.innerText = row[k];
    });
  });

  tableDiv.innerHTML = "";
  tableDiv.appendChild(table);
}

function downloadAllCharts() {
  charts.forEach((chart, i) => {
    const link = document.createElement('a');
    link.href = chart.toBase64Image();
    link.download = `chart-${i + 1}.png`;
    link.click();
  });
}
