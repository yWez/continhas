const state = {
  currentMonth: "Fatura Julho",
  rows: [],
  filteredRows: []
};

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

function normalizeText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function parseStaticCSV(text, month) {
  const lines = text.trim().split(/\n+/);
  const headers = lines.shift().split(",");
  return lines.map(line => {
    const parts = line.split(",");
    const row = headers.reduce((acc, header, index) => {
      acc[header] = parts[index] || "";
      return acc;
    }, {});
    row.Mes = month;
    row.Valor = Number(row.Valor || 0);
    return row;
  });
}

function getRows(month) {
  return parseStaticCSV(FINANCE_DATA.tabs[month], month);
}

function getMonthName(month) {
  return month.replace("Fatura ", "");
}

function groupSum(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] || 0) + row.Valor;
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
    item.innerHTML = `
      <div class="bar-top"><strong>${label}</strong><span>${moneyFormatter.format(value)} · ${pct(value, total)}</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.min((value / total) * 100, 100)}%"></div></div>
    `;
    container.appendChild(item);
  });
}

function renderComparison() {
  const months = Object.keys(FINANCE_DATA.tabs);
  const parsed = months.map(month => {
    const rows = getRows(month);
    return {
      month,
      label: getMonthName(month),
      rows,
      total: rows.reduce((sum, row) => sum + row.Valor, 0),
      byCategory: groupSum(rows, "Categoria"),
      byOwner: groupSum(rows, "Dono")
    };
  });

  const [first, second] = parsed;
  const totalDiff = second.total - first.total;
  const categoryNames = [...new Set([...Object.keys(first.byCategory), ...Object.keys(second.byCategory)])];
  const ownerNames = [...new Set([...Object.keys(first.byOwner), ...Object.keys(second.byOwner)])];
  const biggestRise = categoryNames
    .map(name => ({ name, diff: (second.byCategory[name] || 0) - (first.byCategory[name] || 0), second: second.byCategory[name] || 0, first: first.byCategory[name] || 0 }))
    .sort((a, b) => b.diff - a.diff)[0];
  const biggestDrop = categoryNames
    .map(name => ({ name, diff: (second.byCategory[name] || 0) - (first.byCategory[name] || 0), second: second.byCategory[name] || 0, first: first.byCategory[name] || 0 }))
    .sort((a, b) => a.diff - b.diff)[0];
  const ownerRows = ownerNames.map(name => ({ name, first: first.byOwner[name] || 0, second: second.byOwner[name] || 0, diff: (second.byOwner[name] || 0) - (first.byOwner[name] || 0) })).sort((a, b) => b.second - a.second);

  monthComparisonEl.innerHTML = `
    <div class="comparison-cards">
      <article class="mini-card"><span>${first.label}</span><strong>${moneyFormatter.format(first.total)}</strong><small>${first.rows.length} lançamentos</small></article>
      <article class="mini-card"><span>${second.label}</span><strong>${moneyFormatter.format(second.total)}</strong><small>${second.rows.length} lançamentos</small></article>
      <article class="mini-card"><span>Variação</span><strong class="${diffClass(totalDiff)}">${diffLabel(totalDiff)}</strong><small>${totalDiff > 0 ? "Aumento de gasto" : "Redução de gasto"}</small></article>
      <article class="mini-card"><span>Maior alta</span><strong>${biggestRise.name}</strong><small>${diffLabel(biggestRise.diff)}</small></article>
    </div>
    <div class="comparison-grid">
      <div class="comparison-box">
        <h3>Categorias: ${first.label} vs ${second.label}</h3>
        <table class="compact-table">
          <thead><tr><th>Categoria</th><th>${first.label}</th><th>${second.label}</th><th>Dif.</th></tr></thead>
          <tbody>
            ${categoryNames.map(name => {
              const firstValue = first.byCategory[name] || 0;
              const secondValue = second.byCategory[name] || 0;
              const diff = secondValue - firstValue;
              return `<tr><td>${name}</td><td>${moneyFormatter.format(firstValue)}</td><td>${moneyFormatter.format(secondValue)}</td><td class="${diffClass(diff)}">${diffLabel(diff)}</td></tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
      <div class="comparison-box">
        <h3>Dono: ${first.label} vs ${second.label}</h3>
        <table class="compact-table">
          <thead><tr><th>Dono</th><th>${first.label}</th><th>${second.label}</th><th>Dif.</th></tr></thead>
          <tbody>
            ${ownerRows.map(row => `<tr><td>${row.name}</td><td>${moneyFormatter.format(row.first)}</td><td>${moneyFormatter.format(row.second)}</td><td class="${diffClass(row.diff)}">${diffLabel(row.diff)}</td></tr>`).join("")}
          </tbody>
        </table>
        <div class="comparison-note">Principal leitura: ${biggestRise.name} foi a categoria que mais cresceu. ${biggestDrop && biggestDrop.diff < 0 ? `${biggestDrop.name} foi a que mais caiu.` : "Não houve queda relevante entre as categorias."}</div>
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
  const topCategory = sortEntries(byCategory)[0];
  const topOwner = sortEntries(byOwner)[0];
  const topLocal = sortEntries(byLocal)[0];
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
  const rows = getRows(state.currentMonth);
  state.rows = rows;
  state.filteredRows = [...rows];

  const total = rows.reduce((sum, row) => sum + row.Valor, 0);
  const byCategory = groupSum(rows, "Categoria");
  const byOwner = groupSum(rows, "Dono");
  const byLocal = groupSum(rows, "Local");
  const topPurchase = [...rows].sort((a, b) => b.Valor - a.Valor)[0];
  const avgTicket = total / rows.length;

  summaryEl.innerHTML = "";
  summaryEl.appendChild(buildCard("Fatura analisada", getMonthName(state.currentMonth), `${rows.length} lançamentos`));
  summaryEl.appendChild(buildCard("Total de gastos", moneyFormatter.format(total), `Ticket médio: ${moneyFormatter.format(avgTicket)}`));
  summaryEl.appendChild(buildCard("Maior compra", moneyFormatter.format(topPurchase.Valor), `${topPurchase.Estabelecimento} · ${topPurchase.Categoria}`));
  summaryEl.appendChild(buildCard("Categorias", numberFormatter.format(Object.keys(byCategory).length), "grupos de consumo"));

  const overview = FINANCE_DATA.monthlyOverview.find(item => state.currentMonth.includes(item.mes));
  if (overview) {
    summaryEl.appendChild(buildCard("Resumo da aba geral", moneyFormatter.format(overview.valor), `Wesley ${moneyFormatter.format(overview.wesley)} · Analu ${moneyFormatter.format(overview.analu)} · Casal ${moneyFormatter.format(overview.casal)}`));
  }

  renderComparison();
  renderBars(categoryChart, sortEntries(byCategory), total);
  renderBars(ownerChart, sortEntries(byOwner), total);
  renderInsights(rows, total, byCategory, byOwner, byLocal);
  renderTable(state.filteredRows);

  statusEl.textContent = `Dados carregados de ${FINANCE_DATA.source}. Base estática atualizada em ${FINANCE_DATA.updatedAt}.`;
}

function applySearch() {
  const term = normalizeText(searchInput.value);
  state.filteredRows = term
    ? state.rows.filter(row => normalizeText(Object.values(row).join(" ")).includes(term))
    : [...state.rows];
  renderTable(state.filteredRows);
}

function init() {
  Object.keys(FINANCE_DATA.tabs).forEach(month => {
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
reloadBtn.addEventListener("click", renderDashboard);

init();
