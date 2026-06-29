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
    `A maior concentração está em ${topCategory[0]}, com ${moneyFormatter.format(topCategory[1])}, equivalente a ${pct(topCategory[1], total)} da fatura selecionada. Aqui é onde o controle precisa começar, porque é a categoria que mais mexe no total.`,
    `${topOwner[0]} é o maior centro de custo da fatura, somando ${moneyFormatter.format(topOwner[1])}. Isso não é necessariamente ruim, mas precisa virar orçamento mensal por dono para parar de depender só da percepção.`,
    `O local que mais pesa é ${topLocal[0]}, com ${moneyFormatter.format(topLocal[1])}. Quando o gasto muda de cidade, principalmente em viagem, ele sobe rápido porque mistura transporte, comida, passeio e compra pequena.`,
    `Alimentação soma ${moneyFormatter.format(food)} e locomoção soma ${moneyFormatter.format(mobility)}. São duas categorias de vazamento silencioso, porque várias compras pequenas parecem inofensivas, mas acumulam.`,
    travel > total * 0.35 ? `Viagem está muito acima do normal nesta fatura: ${moneyFormatter.format(travel)}. Para melhorar, o ideal é criar um teto separado de viagem antes de viajar, com limite diário para comida, transporte e rolê.` : `Viagem está sob controle relativo nesta fatura, mas ainda deve ficar separada do gasto comum para não bagunçar a leitura do mês.`,
    `Compras de até R$ 30 somaram ${moneyFormatter.format(smallPurchases)}. Esse é o tipo de gasto que vale atacar com regra simples: juntar deslocamentos, reduzir delivery impulsivo e definir um limite de compra pequena por dia.`
  ];

  insightsEl.innerHTML = ideas.map(text => `<article class="insight">${text}</article>`).join("");
}

function renderDashboard() {
  const rows = parseStaticCSV(FINANCE_DATA.tabs[state.currentMonth], state.currentMonth);
  state.rows = rows;
  state.filteredRows = [...rows];

  const total = rows.reduce((sum, row) => sum + row.Valor, 0);
  const byCategory = groupSum(rows, "Categoria");
  const byOwner = groupSum(rows, "Dono");
  const byLocal = groupSum(rows, "Local");
  const topPurchase = [...rows].sort((a, b) => b.Valor - a.Valor)[0];
  const avgTicket = total / rows.length;

  summaryEl.innerHTML = "";
  summaryEl.appendChild(buildCard("Fatura analisada", state.currentMonth.replace("Fatura ", ""), `${rows.length} lançamentos`));
  summaryEl.appendChild(buildCard("Total de gastos", moneyFormatter.format(total), `Ticket médio: ${moneyFormatter.format(avgTicket)}`));
  summaryEl.appendChild(buildCard("Maior compra", moneyFormatter.format(topPurchase.Valor), `${topPurchase.Estabelecimento} · ${topPurchase.Categoria}`));
  summaryEl.appendChild(buildCard("Categorias", numberFormatter.format(Object.keys(byCategory).length), "grupos de consumo"));

  const overview = FINANCE_DATA.monthlyOverview.find(item => state.currentMonth.includes(item.mes));
  if (overview) {
    summaryEl.appendChild(buildCard("Resumo da aba geral", moneyFormatter.format(overview.valor), `Wesley ${moneyFormatter.format(overview.wesley)} · Analu ${moneyFormatter.format(overview.analu)} · Casal ${moneyFormatter.format(overview.casal)}`));
  }

  renderBars(categoryChart, sortEntries(byCategory), total);
  renderBars(ownerChart, sortEntries(byOwner), total);
  renderInsights(rows, total, byCategory, byOwner, byLocal);
  renderTable(state.filteredRows);

  statusEl.textContent = `Dados carregados de ${FINANCE_DATA.source}. Base estática atualizada em ${FINANCE_DATA.updatedAt}.`;
  statusEl.style.color = "#86efac";
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
