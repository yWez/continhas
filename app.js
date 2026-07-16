const moneyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numberFormatter = new Intl.NumberFormat("pt-BR");

const statusEl = document.querySelector("#status");
const summaryEl = document.querySelector("#summary");
const tableEl = document.querySelector("#dataTable");
const tableInfoEl = document.querySelector("#tableInfo");
const searchInput = document.querySelector("#searchInput");
const reloadBtn = document.querySelector("#reloadBtn");
const monthSelect = document.querySelector("#monthSelect");
const categoryChart = document.querySelector("#categoryChart");
const ownerChart = document.querySelector("#ownerChart");
const insightsEl = document.querySelector("#insights");
const monthComparisonEl = document.querySelector("#monthComparison");

const MONTH_ORDER = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function normalizeText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function parseLegacyCSV(text, month) {
  if (!text) return [];
  const lines = text.trim().split(/\n+/);
  const headers = lines.shift().split(",");
  return lines.map(line => {
    const parts = line.split(",");
    const row = headers.reduce((acc, header, index) => {
      acc[header] = parts[index] || "";
      return acc;
    }, {});
    return {
      Data: row.Data || "",
      Estabelecimento: row.Estabelecimento || "",
      Valor: Number(row.Valor || 0),
      Categoria: row.Categoria || "",
      Local: row.Local || "",
      Dono: row.Dono || "",
      Mes: month
    };
  }).filter(row => row.Estabelecimento || row.Valor);
}

function normalizeArrayRows(rows, month) {
  return (rows || []).map(item => ({
    Data: item[0] || "",
    Estabelecimento: item[1] || "",
    Valor: Number(item[2] || 0),
    Categoria: item[3] || "Sem categoria",
    Local: item[4] || "Não informado",
    Dono: item[5] || "Não informado",
    Mes: month
  })).filter(row => row.Estabelecimento || row.Valor);
}

function getMonthName(month) {
  return String(month).replace("Fatura ", "");
}

function sortMonthKeys(keys) {
  return [...keys].sort((a, b) => {
    const aIndex = MONTH_ORDER.indexOf(getMonthName(a));
    const bIndex = MONTH_ORDER.indexOf(getMonthName(b));
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b, "pt-BR");
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

function buildDataStore() {
  const months = {};

  if (typeof FINANCE_DATA !== "undefined" && FINANCE_DATA.tabs) {
    Object.entries(FINANCE_DATA.tabs).forEach(([month, csv]) => {
      months[month] = parseLegacyCSV(csv, month);
    });
  }

  if (typeof FINANCE_DATA !== "undefined" && FINANCE_DATA.months) {
    Object.entries(FINANCE_DATA.months).forEach(([month, rows]) => {
      months[month] = normalizeArrayRows(rows, month);
    });
  }

  if (typeof LATEST_FINANCE_DATA !== "undefined" && LATEST_FINANCE_DATA.months) {
    Object.entries(LATEST_FINANCE_DATA.months).forEach(([month, rows]) => {
      months[month] = normalizeArrayRows(rows, month);
    });
  }

  const overview = typeof LATEST_FINANCE_DATA !== "undefined" && LATEST_FINANCE_DATA.monthlyOverview
    ? LATEST_FINANCE_DATA.monthlyOverview
    : (FINANCE_DATA.monthlyOverview || []);

  const updatedAt = typeof LATEST_FINANCE_DATA !== "undefined" && LATEST_FINANCE_DATA.updatedAt
    ? LATEST_FINANCE_DATA.updatedAt
    : FINANCE_DATA.updatedAt;

  return {
    source: FINANCE_DATA.source || "Google Sheets",
    months,
    overview,
    updatedAt
  };
}

const DATA = buildDataStore();
const monthKeys = sortMonthKeys(Object.keys(DATA.months));

const state = {
  currentMonth: monthKeys[monthKeys.length - 1],
  rows: [],
  filteredRows: []
};

function groupSum(rows, key) {
  return rows.reduce((acc, row) => {
    const label = row[key] || "Não informado";
    acc[label] = (acc[label] || 0) + row.Valor;
    return acc;
  }, {});
}

function sortEntries(object) {
  return Object.entries(object).sort((a, b) => b[1] - a[1]);
}

function pct(value, total) {
  if (!total) return "0%";
  return `${((value / total) * 100).toFixed(1).replace(".", ",")}%`;
}

function diffLabel(value) {
  if (Math.abs(value) < 0.01) return "Estável";
  return value > 0 ? `+${moneyFormatter.format(value)}` : `-${moneyFormatter.format(Math.abs(value))}`;
}

function diffPercent(value, base) {
  if (!base) return value ? "Novo gasto" : "0%";
  const result = (value / base) * 100;
  return `${result > 0 ? "+" : ""}${result.toFixed(1).replace(".", ",")}%`;
}

function diffClass(value) {
  if (Math.abs(value) < 0.01) return "neutral";
  return value > 0 ? "up" : "down";
}

function buildCard(label, value, helper = "") {
  const article = document.createElement("article");
  article.className = "card";
  article.innerHTML = `<span>${label}</span><strong>${value}</strong>${helper ? `<small>${helper}</small>` : ""}`;
  return article;
}

function renderBars(container, entries, total) {
  container.innerHTML = "";
  entries.forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "bar-row";
    const width = total ? Math.min((value / total) * 100, 100) : 0;
    item.innerHTML = `
      <div class="bar-top"><strong>${label}</strong><span>${moneyFormatter.format(value)} · ${pct(value, total)}</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
    `;
    container.appendChild(item);
  });
}

function getMonthStats(month) {
  const rows = DATA.months[month] || [];
  return {
    month,
    label: getMonthName(month),
    rows,
    total: rows.reduce((sum, row) => sum + row.Valor, 0),
    byCategory: groupSum(rows, "Categoria"),
    byOwner: groupSum(rows, "Dono")
  };
}

function comparisonRows(current, previous, key) {
  const labels = [...new Set([...Object.keys(previous[key]), ...Object.keys(current[key])])];
  return labels.map(label => {
    const before = previous[key][label] || 0;
    const now = current[key][label] || 0;
    return { label, before, now, diff: now - before };
  }).sort((a, b) => b.now - a.now);
}

function renderComparison() {
  const stats = monthKeys.map(getMonthStats);
  const current = stats[stats.length - 1];
  const previous = stats[stats.length - 2] || current;
  const totalDiff = current.total - previous.total;

  const monthlyCards = stats.map((item, index) => {
    const prior = stats[index - 1];
    const difference = prior ? item.total - prior.total : 0;
    const helper = prior
      ? `${diffLabel(difference)} em relação a ${prior.label}`
      : `${item.rows.length} lançamentos`;
    return `<article class="mini-card"><span>${item.label}</span><strong>${moneyFormatter.format(item.total)}</strong><small>${helper}</small></article>`;
  }).join("");

  if (stats.length < 2) {
    monthComparisonEl.innerHTML = `<div class="comparison-cards">${monthlyCards}</div>`;
    return;
  }

  const categories = comparisonRows(current, previous, "byCategory");
  const owners = comparisonRows(current, previous, "byOwner");
  const biggestRise = [...categories].sort((a, b) => b.diff - a.diff)[0];
  const biggestDrop = [...categories].sort((a, b) => a.diff - b.diff)[0];

  monthComparisonEl.innerHTML = `
    <div class="comparison-cards">
      ${monthlyCards}
      <article class="mini-card"><span>Variação mais recente</span><strong class="${diffClass(totalDiff)}">${diffLabel(totalDiff)}</strong><small>${diffPercent(totalDiff, previous.total)} · ${previous.label} → ${current.label}</small></article>
    </div>
    <div class="comparison-grid">
      <div class="comparison-box">
        <h3>Evolução mensal</h3>
        <table class="compact-table">
          <thead><tr><th>Mês</th><th>Total</th><th>Lançamentos</th><th>Variação</th></tr></thead>
          <tbody>
            ${stats.map((item, index) => {
              const prior = stats[index - 1];
              const difference = prior ? item.total - prior.total : 0;
              return `<tr><td>${item.label}</td><td>${moneyFormatter.format(item.total)}</td><td>${item.rows.length}</td><td class="${prior ? diffClass(difference) : "neutral"}">${prior ? diffLabel(difference) : "Base"}</td></tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
      <div class="comparison-box">
        <h3>Categorias: ${previous.label} × ${current.label}</h3>
        <table class="compact-table">
          <thead><tr><th>Categoria</th><th>${previous.label}</th><th>${current.label}</th><th>Dif.</th></tr></thead>
          <tbody>
            ${categories.map(row => `<tr><td>${row.label}</td><td>${moneyFormatter.format(row.before)}</td><td>${moneyFormatter.format(row.now)}</td><td class="${diffClass(row.diff)}">${diffLabel(row.diff)}</td></tr>`).join("")}
          </tbody>
        </table>
        <div class="comparison-note">Maior alta: <strong>${biggestRise.label}</strong> (${diffLabel(biggestRise.diff)}). ${biggestDrop && biggestDrop.diff < 0 ? `Maior queda: <strong>${biggestDrop.label}</strong> (${diffLabel(biggestDrop.diff)}).` : "Não houve queda relevante entre as categorias."}</div>
      </div>
      <div class="comparison-box">
        <h3>Donos: ${previous.label} × ${current.label}</h3>
        <table class="compact-table">
          <thead><tr><th>Dono</th><th>${previous.label}</th><th>${current.label}</th><th>Dif.</th></tr></thead>
          <tbody>
            ${owners.map(row => `<tr><td>${row.label}</td><td>${moneyFormatter.format(row.before)}</td><td>${moneyFormatter.format(row.now)}</td><td class="${diffClass(row.diff)}">${diffLabel(row.diff)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderTable(rows) {
  const columns = ["Data", "Estabelecimento", "Valor", "Categoria", "Local", "Dono"];
  tableEl.innerHTML = "";
  tableInfoEl.textContent = `${numberFormatter.format(rows.length)} compra(s) exibida(s) de ${numberFormatter.format(state.rows.length)} analisada(s).`;

  const thead = document.createElement("thead");
  thead.innerHTML = `<tr>${columns.map(column => `<th>${column}</th>`).join("")}</tr>`;

  const tbody = document.createElement("tbody");
  rows.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = columns.map(column => {
      const value = column === "Valor" ? moneyFormatter.format(row[column]) : row[column];
      return `<td>${value || ""}</td>`;
    }).join("");
    tbody.appendChild(tr);
  });

  tableEl.appendChild(thead);
  tableEl.appendChild(tbody);
}

function renderInsights(rows, total, byCategory, byOwner, byLocal) {
  const topCategory = sortEntries(byCategory)[0] || ["Sem dados", 0];
  const topOwner = sortEntries(byOwner)[0] || ["Sem dados", 0];
  const topLocal = sortEntries(byLocal)[0] || ["Sem dados", 0];
  const food = byCategory["Alimentação"] || 0;
  const travel = byCategory["Viagem"] || 0;
  const mobility = byCategory["Locomoção"] || 0;
  const smallPurchases = rows.filter(row => row.Valor <= 30).reduce((sum, row) => sum + row.Valor, 0);

  const ideas = [
    `A maior concentração está em ${topCategory[0]}, com ${moneyFormatter.format(topCategory[1])}, equivalente a ${pct(topCategory[1], total)} da fatura selecionada. Esse é o primeiro ponto para definir teto mensal.`,
    `${topOwner[0]} é o maior centro de custo da fatura, somando ${moneyFormatter.format(topOwner[1])}. O ideal é separar orçamento por dono para não misturar gasto individual, casal e loja.`,
    `O local que mais pesa é ${topLocal[0]}, com ${moneyFormatter.format(topLocal[1])}. Quando entra viagem ou troca de cidade, vale trabalhar com limite diário para não perder controle.`,
    `Alimentação soma ${moneyFormatter.format(food)} e locomoção soma ${moneyFormatter.format(mobility)}. São categorias de compra recorrente, então o ganho vem de regra simples, não de corte radical.`,
    travel > total * 0.35 ? `Viagem está alta nesta fatura: ${moneyFormatter.format(travel)}. A recomendação é separar viagem do mês comum e definir limite por dia.` : `Viagem está sob controle relativo nesta fatura, mas ainda deve ficar separada do gasto comum para não distorcer o mês.`,
    `Compras de até R$ 30 somaram ${moneyFormatter.format(smallPurchases)}. Esse gasto parece pequeno isolado, mas vira vazamento quando repete muitas vezes.`
  ];

  insightsEl.innerHTML = ideas.map(text => `<article class="insight">${text}</article>`).join("");
}

function renderDashboard() {
  const rows = DATA.months[state.currentMonth] || [];
  state.rows = rows;
  state.filteredRows = [...rows];

  const total = rows.reduce((sum, row) => sum + row.Valor, 0);
  const byCategory = groupSum(rows, "Categoria");
  const byOwner = groupSum(rows, "Dono");
  const byLocal = groupSum(rows, "Local");
  const topPurchase = [...rows].sort((a, b) => b.Valor - a.Valor)[0] || { Valor: 0, Estabelecimento: "Sem dados", Categoria: "" };
  const avgTicket = rows.length ? total / rows.length : 0;

  summaryEl.innerHTML = "";
  summaryEl.appendChild(buildCard("Fatura analisada", getMonthName(state.currentMonth), `${rows.length} lançamentos`));
  summaryEl.appendChild(buildCard("Total de gastos", moneyFormatter.format(total), `Ticket médio: ${moneyFormatter.format(avgTicket)}`));
  summaryEl.appendChild(buildCard("Maior compra", moneyFormatter.format(topPurchase.Valor), `${topPurchase.Estabelecimento} · ${topPurchase.Categoria}`));
  summaryEl.appendChild(buildCard("Categorias", numberFormatter.format(Object.keys(byCategory).length), "grupos de consumo"));

  const overview = DATA.overview.find(item => state.currentMonth.includes(item.mes));
  if (overview) {
    summaryEl.appendChild(buildCard("Resumo da aba geral", moneyFormatter.format(overview.valor), `Wesley ${moneyFormatter.format(overview.wesley)} · Analu ${moneyFormatter.format(overview.analu)} · Casal ${moneyFormatter.format(overview.casal)}`));
  }

  renderComparison();
  renderBars(categoryChart, sortEntries(byCategory), total);
  renderBars(ownerChart, sortEntries(byOwner), total);
  renderInsights(rows, total, byCategory, byOwner, byLocal);
  renderTable(state.filteredRows);

  statusEl.textContent = `Dados carregados de ${DATA.source}. Base sincronizada em ${DATA.updatedAt}. Novos meses aparecem automaticamente após a sincronização do GitHub.`;
}

function applySearch() {
  const term = normalizeText(searchInput.value);
  state.filteredRows = term
    ? state.rows.filter(row => normalizeText(Object.values(row).join(" ")).includes(term))
    : [...state.rows];
  renderTable(state.filteredRows);
}

function init() {
  monthSelect.innerHTML = "";
  monthKeys.forEach(month => {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month;
    monthSelect.appendChild(option);
  });
  monthSelect.value = state.currentMonth;
  renderDashboard();
}

monthSelect.addEventListener("change", event => {
  state.currentMonth = event.target.value;
  searchInput.value = "";
  renderDashboard();
});

searchInput.addEventListener("input", applySearch);
reloadBtn.addEventListener("click", () => window.location.reload());

init();
