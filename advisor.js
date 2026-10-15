(function advisorModule() {
  "use strict";

  const money = value => moneyFormatter.format(Number(value) || 0);
  const txt = value => String(value ?? "");
  const esc = value => txt(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const compact = value => `R$ ${new Intl.NumberFormat("pt-BR", {
    notation: "compact", maximumFractionDigits: 1
  }).format(value)}`;
  const percent = (value, base) => base ? `${(100 * value / base).toFixed(1).replace(".", ",")}%` : "0%";
  const sum = rows => rows.reduce((total, row) => total + (Number(row.Valor) || 0), 0);
  const keys = [...monthKeys];
  const reports = keys.map(key => ({ key, month: getMonthName(key), rows: DATA.months[key] || [], total: sum(DATA.months[key] || []) }));
  const palette = ["#2563eb", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#94a3b8"];
  const purchaseCategories = new Set([
    "compras online", "alimentacao", "locomocao", "assinaturas",
    "lazer", "entretenimento", "barbearia", "delivery", "restaurante", "restaurantes"
  ]);

  function currentReport() {
    return reports.find(report => report.key === state.currentMonth) || reports[reports.length - 1];
  }

  function merchantName(original) {
    let clean = txt(original).trim()
      .replace(/(?:\s*[-–]\s*|\s+)\d{1,2}\s*\/\s*\d{1,2}\b/gi, "")
      .replace(/\s*,\s*(?:JOAO PESSOA|SÃO PAULO|SAO PAULO|FLORIANOPOLIS|RECIFE)\b.*$/i, "")
      .replace(/\s+/g, " ").trim();
    if (!clean) clean = "Não informado";
    const norm = normalizeText(clean).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    if (/^99(?:\s|$)/.test(norm) || norm === "99pop" || norm === "99app") return { key: "99", name: "99" };
    if (/^uber\b/.test(norm)) return { key: "uber", name: "Uber" };
    if (/^ifood\b/.test(norm)) return { key: "ifood", name: "iFood" };
    if (/^amazon\b/.test(norm)) return { key: "amazon", name: "Amazon" };
    if (/^shopee\b/.test(norm)) return { key: "shopee", name: "Shopee" };
    return { key: norm, name: clean };
  }

  function detectRecurring() {
    const found = new Map();
    for (const report of reports) {
      for (const row of report.rows) {
        if (!row.Estabelecimento || Number(row.Valor) <= 0) continue;
        const merchant = merchantName(row.Estabelecimento);
        if (!merchant.key || merchant.key === "nao informado") continue;
        if (!found.has(merchant.key)) {
          found.set(merchant.key, { name: merchant.name, total: 0, count: 0, invoices: new Set(), installment: false, latest: "" });
        }
        const record = found.get(merchant.key);
        record.total += Number(row.Valor);
        record.count += 1;
        record.invoices.add(report.key);
        record.latest = report.month;
        record.installment ||= /\b\d{1,2}\s*\/\s*\d{1,2}\b/.test(txt(row.Estabelecimento));
      }
    }
    return [...found.values()]
      .filter(record => record.invoices.size >= 2 || record.count >= 3)
      .sort((a, b) => b.total - a.total || b.invoices.size - a.invoices.size || b.count - a.count);
  }

  function categoryTotals(rows) {
    const totals = new Map();
    for (const row of rows) {
      const name = txt(row.Categoria).trim() || "Sem categoria";
      totals.set(name, (totals.get(name) || 0) + Number(row.Valor || 0));
    }
    return [...totals].sort((a, b) => b[1] - a[1]);
  }

  function drawTrend(selected) {
    const el = document.querySelector("#trendChart");
    if (!el) return;
    if (!reports.length) {
      el.textContent = "Ainda não há faturas para construir a evolução.";
      return;
    }
    const w = 850, h = 282, left = 75, right = 22, top = 39, bottom = 54;
    const baseY = h - bottom, plotH = baseY - top, plotW = w - left - right;
    const max = Math.max(1, ...reports.map(report => report.total));
    const ceiling = Math.ceil(max * 1.18 / 500) * 500 || 1000;
    const x = i => left + (reports.length === 1 ? plotW / 2 : i * plotW / (reports.length - 1));
    const y = val => baseY - (val / ceiling) * plotH;
    const pointList = reports.map((report, i) => [x(i), y(report.total)]);
    const coords = pointList.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
    const fill = `${coords} L${x(reports.length - 1)},${baseY} L${x(0)},${baseY} Z`;
    const guides = [0, 0.25, 0.5, 0.75, 1].map(step => {
      const ypos = y(ceiling * step);
      return `<line x1="${left}" y1="${ypos}" x2="${w - right}" y2="${ypos}" stroke="#e8eef5" stroke-width="1"/>
        <text x="${left - 12}" y="${ypos + 4}" text-anchor="end" fill="#8491a5" font-size="12">${esc(compact(ceiling * step))}</text>`;
    }).join("");
    const points = reports.map((report, i) => {
      const [px, py] = pointList[i];
      const active = report.key === selected.key;
      const labelY = Math.max(top - 10, py - 16);
      return `<g>
        <circle cx="${px}" cy="${py}" r="${active ? 8 : 6}" fill="${active ? "#2563eb" : "#fff"}" stroke="#2563eb" stroke-width="3">
          <title>${esc(report.month)}: ${esc(money(report.total))}</title>
        </circle>
        <text x="${px}" y="${labelY}" text-anchor="middle" fill="${active ? "#1d4ed8" : "#475569"}" font-weight="${active ? 800 : 600}" font-size="12">${esc(compact(report.total))}</text>
        <text x="${px}" y="${baseY + 26}" text-anchor="middle" fill="${active ? "#1d4ed8" : "#64748b"}" font-size="13" font-weight="${active ? 800 : 500}">${esc(report.month.slice(0, 3))}</text>
      </g>`;
    }).join("");
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Evolução do valor total das faturas: ${esc(reports.map(r => `${r.month} ${money(r.total)}`).join("; "))}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="advisorArea" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#2563eb" stop-opacity=".21"/>
        <stop offset="100%" stop-color="#2563eb" stop-opacity="0"/>
      </linearGradient></defs>
      ${guides}
      <path d="${fill}" fill="url(#advisorArea)"/>
      <path d="${coords}" fill="none" stroke="#2563eb" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${points}
    </svg>`;
    const average = reports.reduce((total, r) => total + r.total, 0) / reports.length;
    const previous = reports[reports.indexOf(selected) - 1];
    const delta = previous ? selected.total - previous.total : 0;
    const metric = document.querySelector("#trendContext");
    if (metric) metric.textContent = `Média das ${reports.length} faturas: ${money(average)}. ${previous ? `${selected.month} ficou ${delta > 0 ? "acima" : delta < 0 ? "abaixo" : "no mesmo valor que"} ${previous.month}${delta ? ` em ${money(Math.abs(delta))}` : ""}.` : "Primeira fatura disponível."}`;
  }

  function drawMix(selected) {
    const chart = document.querySelector("#mixDonut");
    const legend = document.querySelector("#mixLegend");
    if (!chart || !legend) return;
    const all = categoryTotals(selected.rows);
    const total = selected.total;
    if (!total || !all.length) {
      chart.style.background = "#e2e8f0";
      legend.innerHTML = '<p class="advisor-empty">Ainda não há dados nesta fatura.</p>';
      return;
    }
    const main = all.slice(0, 5);
    const other = all.slice(5).reduce((acc, entry) => acc + entry[1], 0);
    if (other > 0) main.push(["Demais categorias", other]);
    let progress = 0;
    const steps = main.map(([label, value], i) => {
      const begin = progress, end = progress + (value / total) * 100;
      progress = end;
      return { label, value, color: palette[i], begin, end };
    });
    chart.style.background = `conic-gradient(${steps.map(step => `${step.color} ${step.begin.toFixed(3)}% ${step.end.toFixed(3)}%`).join(", ")})`;
    chart.setAttribute("aria-label", `Distribuição de gastos em ${selected.month}: ${all.map(([label, value]) => `${label} ${money(value)}`).join("; ")}`);
    const center = document.querySelector("#mixCenter");
    if (center) center.innerHTML = `<strong>${esc(money(total))}</strong><small>Total da fatura</small>`;
    legend.innerHTML = steps.map(step => `<div class="advisor-legend-row">
      <span class="advisor-legend-name"><i class="advisor-dot" style="background:${step.color}"></i>${esc(step.label)}</span>
      <span class="advisor-legend-val"><strong>${esc(percent(step.value, total))}</strong><small>${esc(money(step.value))}</small></span>
    </div>`).join("");
  }

  function drawRecurring() {
    const el = document.querySelector("#recurringTable");
    const context = document.querySelector("#recurringContext");
    if (!el || !context) return;
    const records = detectRecurring();
    const top = records.slice(0, 10);
    context.textContent = `Histórico de ${reports.length} faturas. Mesmo estabelecimento em 2+ faturas ou 3+ lançamentos. Repetição não comprova assinatura.`;
    if (!top.length) {
      el.innerHTML = '<p class="advisor-empty">Ainda não há histórico suficiente para identificar padrões.</p>';
      return;
    }
    el.innerHTML = `<div class="table-wrap"><table class="advisor-table">
      <thead><tr><th>Estabelecimento</th><th>Faturas</th><th>Compras</th><th>Total histórico</th><th>Leitura</th></tr></thead>
      <tbody>${top.map(entry => `<tr>
        <td><strong>${esc(entry.name)}</strong></td>
        <td>${entry.invoices.size} de ${reports.length}</td>
        <td>${entry.count}</td>
        <td><strong>${esc(money(entry.total))}</strong></td>
        <td><span class="advisor-tag ${entry.installment ? "advisor-tag-amber" : ""}">${entry.installment ? "Parcela identificada" : entry.invoices.size >= 2 ? "Repete em faturas" : "Frequente na fatura"}</span></td>
      </tr>`).join("")}</tbody></table></div>`;
  }

  function generateAdvice(selected) {
    const totals = categoryTotals(selected.rows);
    const normalized = Object.fromEntries(totals.map(([name, value]) => [normalizeText(name), value]));
    const get = name => normalized[normalizeText(name)] || 0;
    const available = [];
    const online = get("Compras Online");
    const other = get("Outros") + get("Sem categoria");
    const mobility = get("Locomoção");
    const food = get("Alimentação");
    const subscriptions = get("Assinaturas");
    if (other > selected.total * 0.10) available.push({
      title: "Primeiro, dar nome aos gastos",
      metric: `${money(other)} em “Outros”`,
      body: `Essa categoria representa ${percent(other, selected.total)} da fatura. Sem saber o que há nela, qualquer meta de corte seria pouco confiável.`,
      action: "Reclassifique os maiores lançamentos de “Outros” na planilha para encontrar oportunidades reais."
    });
    if (online > 0) available.push({
      title: "Revisar compras online",
      metric: `${money(online)} na fatura`,
      body: `São ${percent(online, selected.total)} do total. Pode incluir itens essenciais, compras para o negócio ou parcelas antigas.`,
      action: "Separe compras necessárias, da Papelaria, parceladas e adiáveis antes de definir um teto."
    });
    if (mobility > 0) available.push({
      title: "Investigar deslocamentos",
      metric: `${money(mobility)} em locomoção`,
      body: `A categoria equivale a ${percent(mobility, selected.total)} da fatura. Corridas de aplicativo repetidas merecem atenção.`,
      action: "Compare uma semana de corridas, trajetos agrupados e alternativas que não prejudiquem trabalho ou segurança."
    });
    if (subscriptions > 0) available.push({
      title: "Auditar assinaturas",
      metric: `${money(subscriptions)} registrados`,
      body: "Cobranças recorrentes não são necessariamente desperdício; algumas podem ser essenciais para o trabalho.",
      action: "Cheque frequência de uso, planos duplicados, renovação e possibilidade de downgrade."
    });
    if (food > 0) available.push({
      title: "Separar alimentação do dia a dia",
      metric: `${money(food)} em alimentação`,
      body: `Essa rubrica representa ${percent(food, selected.total)} do total, mas não sabemos quanto é mercado, refeição ou delivery.`,
      action: "Diferencie refeições fora de casa de alimentação essencial; só depois negocie um limite semanal."
    });
    return available.slice(0, 4);
  }

  function drawAdvice(selected) {
    const el = document.querySelector("#insights");
    if (!el) return;
    const recommendations = generateAdvice(selected);
    el.innerHTML = recommendations.length
      ? recommendations.map((item, index) => `<article class="insight advisor-insight">
          <div class="advisor-insight-index">Análise ${index + 1}</div>
          <h3>${esc(item.title)}</h3>
          <strong class="advisor-insight-metric">${esc(item.metric)}</strong>
          <p>${esc(item.body)}</p>
          <div class="advisor-next"><strong>Próxima ação</strong><span>${esc(item.action)}</span></div>
        </article>`).join("")
      : '<article class="insight">Ainda não há lançamentos suficientes para recomendações específicas.</article>';
  }

  function adjustableBase(selected) {
    return selected.rows.reduce((total, row) => {
      const category = normalizeText(row.Categoria);
      const owner = normalizeText(row.Dono);
      if (!purchaseCategories.has(category) || owner === "papelaria" || owner === "loja") return total;
      return total + Math.max(0, Number(row.Valor) || 0);
    }, 0);
  }

  function drawSignals(selected) {
    const el = document.querySelector("#advisorSignals");
    if (!el) return;
    const average = reports.reduce((acc, report) => acc + report.total, 0) / Math.max(1, reports.length);
    const prev = reports[reports.indexOf(selected) - 1];
    const others = categoryTotals(selected.rows)
      .filter(([category]) => ["outros", "sem categoria"].includes(normalizeText(category)))
      .reduce((acc, [, value]) => acc + value, 0);
    const set = [
      { title: "Média das faturas", value: money(average), note: `${reports.length} meses disponíveis` },
      { title: "Mudança da fatura", value: prev ? `${selected.total >= prev.total ? "+" : "−"}${percent(Math.abs(selected.total - prev.total), prev.total)}` : "—", note: prev ? `vs. ${prev.month}` : "Sem fatura anterior" },
      { title: "Gastos sem classificação clara", value: percent(others, selected.total), note: `${money(others)} em “Outros”` }
    ];
    el.innerHTML = set.map(metric => `<div class="advisor-metric">
      <span>${esc(metric.title)}</span><strong>${esc(metric.value)}</strong><small>${esc(metric.note)}</small>
    </div>`).join("");
  }

  function drawPlanning() {
    const selected = currentReport();
    if (!selected) return;
    const slider = document.querySelector("#savingPercent");
    const incomeField = document.querySelector("#monthlyIncome");
    const outsideField = document.querySelector("#otherBills");
    const plan = document.querySelector("#savingResult");
    const health = document.querySelector("#healthResult");
    if (!slider || !incomeField || !outsideField || !plan || !health) return;
    const cut = Number(slider.value || 15);
    const base = adjustableBase(selected);
    const scenario = base * cut / 100;
    document.querySelector("#savingPercentValue").textContent = `${cut}%`;
    plan.innerHTML = `<div><span>Economia hipotética por fatura</span><strong>${esc(money(scenario))}</strong></div>
      <div><span>Em 12 faturas semelhantes</span><strong>${esc(money(scenario * 12))}</strong></div>
      <p>Simulação de ${cut}% sobre ${esc(money(base))} em categorias que merecem revisão, excluindo Papelaria/Loja. Não é economia garantida nem orientação para cortar necessidades.</p>`;
    const income = Number(incomeField.value);
    const bills = Number(outsideField.value) || 0;
    if (!Number.isFinite(income) || income <= 0) {
      health.innerHTML = `<strong>Diagnóstico parcial</strong>
        <p>O painel enxerga as faturas, mas não conhece sua renda, despesas pagas fora do cartão, dívidas ou reservas. Informe a renda mensal para calcular uma folga estimada.</p>`;
      return;
    }
    const balance = income - bills - selected.total;
    const share = selected.total / income;
    const colorClass = balance < 0 ? "advisor-negative" : "advisor-positive";
    health.innerHTML = `<span>Saldo estimado após despesas informadas</span>
      <strong class="${colorClass}">${esc(money(balance))}</strong>
      <p>Fatura de ${esc(selected.month)} = ${esc(percent(selected.total, income))} da renda informada. Despesas fora do cartão = ${esc(money(bills))}. ${balance < 0 ? "Saídas acima da renda declarada; priorize fechar essa diferença e evitar juros." : "Saldo positivo estimado; confira despesas não cadastradas antes de destinar a investimentos."}</p>
      <small>Estimativa mensal, não saldo bancário. Evite contar novamente nas despesas externas itens já lançados no cartão.</small>`;
  }

  function render() {
    const selected = currentReport();
    if (!selected) return;
    drawTrend(selected);
    drawMix(selected);
    drawSignals(selected);
    drawRecurring();
    drawAdvice(selected);
    drawPlanning();
  }

  const slider = document.querySelector("#savingPercent");
  const incomeField = document.querySelector("#monthlyIncome");
  const outsideField = document.querySelector("#otherBills");
  slider?.addEventListener("input", drawPlanning);
  incomeField?.addEventListener("input", drawPlanning);
  outsideField?.addEventListener("input", drawPlanning);
  monthSelect.addEventListener("change", render);
  render();
})();
