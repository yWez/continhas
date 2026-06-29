const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeboumr1it6uT_7ml6R2W1lQN9TVSwn6ewjhe1XmcbYbjVDzs0mKHrCpXt_8DbpvNth4F4kwI1gB-K/pub?gid=0&single=true&output=csv";

const state = {
  rows: [],
  columns: [],
  filteredRows: []
};

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const numberFormatter = new Intl.NumberFormat("pt-BR");

const statusEl = document.querySelector("#status");
const summaryEl = document.querySelector("#summary");
const tableEl = document.querySelector("#dataTable");
const tableInfoEl = document.querySelector("#tableInfo");
const searchInput = document.querySelector("#searchInput");
const reloadBtn = document.querySelector("#reloadBtn");

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      value += '"';
      i++;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      row.push(value.trim());
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);

  if (!rows.length) return { columns: [], data: [] };

  const columns = rows[0].map((column, index) => column || `Coluna ${index + 1}`);
  const data = rows.slice(1).map(items => {
    return columns.reduce((record, column, index) => {
      record[column] = items[index] || "";
      return record;
    }, {});
  });

  return { columns, data };
}

function parseNumber(value) {
  if (value === null || value === undefined) return 0;

  const raw = String(value)
    .replace(/R\$/g, "")
    .replace(/%/g, "")
    .replace(/\s/g, "")
    .trim();

  if (!raw) return 0;

  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;

  const number = Number(normalized.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function isNumericColumn(column, rows) {
  const sample = rows
    .map(row => row[column])
    .filter(Boolean)
    .slice(0, 12);

  if (!sample.length) return false;

  const numericCount = sample.filter(value => Math.abs(parseNumber(value)) > 0 || /^0([,.]0+)?$/.test(String(value).trim())).length;
  return numericCount / sample.length >= 0.6;
}

function looksLikeMoneyColumn(column) {
  const normalized = normalizeText(column);
  return ["valor", "venda", "liquido", "bruto", "receita", "faturamento", "preco", "ticket"].some(term => normalized.includes(term));
}

function findColumn(possibleNames) {
  return state.columns.find(column => {
    const normalizedColumn = normalizeText(column);
    return possibleNames.some(name => normalizedColumn.includes(normalizeText(name)));
  });
}

function sumColumn(column) {
  return state.rows.reduce((total, row) => total + parseNumber(row[column]), 0);
}

function formatMetric(column, value) {
  return looksLikeMoneyColumn(column) ? moneyFormatter.format(value) : numberFormatter.format(value);
}

function buildCard(label, value) {
  const article = document.createElement("article");
  article.className = "card";
  article.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
  return article;
}

function renderSummary() {
  summaryEl.innerHTML = "";
  summaryEl.appendChild(buildCard("Linhas importadas", numberFormatter.format(state.rows.length)));
  summaryEl.appendChild(buildCard("Colunas encontradas", numberFormatter.format(state.columns.length)));

  const statusColumn = findColumn(["status", "situacao"]);
  if (statusColumn) {
    const approvedCount = state.rows.filter(row => normalizeText(row[statusColumn]).includes("aprov")).length;
    summaryEl.appendChild(buildCard("Aprovados", numberFormatter.format(approvedCount)));
  }

  const priorityColumns = [
    findColumn(["valor venda", "venda", "valor bruto"]),
    findColumn(["valor liquido", "líquido", "liquido"]),
    findColumn(["meta"])
  ].filter(Boolean);

  const numericColumns = state.columns.filter(column => isNumericColumn(column, state.rows));
  const columnsToShow = [...new Set([...priorityColumns, ...numericColumns])].slice(0, 5);

  columnsToShow.forEach(column => {
    const total = sumColumn(column);
    summaryEl.appendChild(buildCard(`Total de ${column}`, formatMetric(column, total)));
  });
}

function renderTable(rows) {
  tableEl.innerHTML = "";

  if (!state.columns.length) {
    tableInfoEl.textContent = "Nenhuma coluna encontrada.";
    return;
  }

  tableInfoEl.textContent = `${numberFormatter.format(rows.length)} linha(s) exibida(s) de ${numberFormatter.format(state.rows.length)} importada(s).`;

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  state.columns.forEach(column => {
    const th = document.createElement("th");
    th.textContent = column;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  const tbody = document.createElement("tbody");
  rows.forEach(row => {
    const tr = document.createElement("tr");
    state.columns.forEach(column => {
      const td = document.createElement("td");
      td.textContent = row[column] || "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  tableEl.appendChild(thead);
  tableEl.appendChild(tbody);
}

function applySearch() {
  const term = normalizeText(searchInput.value);

  state.filteredRows = term
    ? state.rows.filter(row => normalizeText(Object.values(row).join(" ")).includes(term))
    : [...state.rows];

  renderTable(state.filteredRows);
}

async function loadSheet() {
  statusEl.textContent = "Carregando planilha...";
  statusEl.style.color = "#cbd5e1";

  try {
    const response = await fetch(`${SHEET_CSV_URL}&cacheBust=${Date.now()}`);

    if (!response.ok) {
      throw new Error(`Erro ${response.status} ao buscar a planilha.`);
    }

    const text = await response.text();
    const { columns, data } = parseCSV(text);

    state.columns = columns;
    state.rows = data.filter(row => Object.values(row).some(Boolean));
    state.filteredRows = [...state.rows];

    renderSummary();
    renderTable(state.filteredRows);

    statusEl.textContent = `Planilha carregada com sucesso. Última atualização: ${new Date().toLocaleString("pt-BR")}.`;
    statusEl.style.color = "#86efac";
  } catch (error) {
    console.error(error);
    statusEl.textContent = "Não consegui carregar os dados. Confirme se a planilha está publicada na web como CSV e se o link público continua ativo.";
    statusEl.style.color = "#fca5a5";
    summaryEl.innerHTML = "";
    tableEl.innerHTML = "";
    tableInfoEl.textContent = "Sem dados carregados.";
  }
}

searchInput.addEventListener("input", applySearch);
reloadBtn.addEventListener("click", loadSheet);

loadSheet();
