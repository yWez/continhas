# Continhas

Dashboard financeiro pessoal em HTML, CSS e JavaScript, publicado pelo GitHub Pages e sincronizado com uma planilha do Google Sheets.

## O que oferece

- Comparação histórica das faturas, com gráficos de evolução mensal e distribuição por categoria.
- Categorias e responsáveis por gasto, além de tabela de lançamentos com busca.
- Lista dos estabelecimentos que mais se repetem entre as faturas, com sinalização quando o nome indica parcela.
- Plano de ação contextualizado (compras online, transporte, assinaturas e lançamentos classificados como "Outros").
- Simulador **hipotético** de redução de gastos revisáveis, que exclui lançamentos identificados como Papelaria/Loja.
- Cálculo opcional de folga mensal com renda e despesas fora do cartão informadas na própria tela.
- Visão responsiva, sem dependências externas para os gráficos.

## Origem e atualização

A sincronização está em `.github/workflows/sync-finance-data.yml` e é executada periodicamente pelo GitHub Actions, usando `scripts/sync_sheet.py`. O script lê as abas publicadas `Cartão - Geral` e `Compras - <mês>`, gerando `latest-data.js`. A interface usa `finance-data.js` como base legada e prioriza `latest-data.js`.

Quando uma nova aba `Compras - <mês>` for adicionada ao Google Sheets, o script tentará descobri-la automaticamente. Caso a listagem pública não funcione, adicione seu GID ao mapa `KNOWN_SHEETS` de `scripts/sync_sheet.py`. A publicação da planilha deve incluir a nova aba.

## Limitações importantes

- **Faturas não são meses de consumo.** As compras podem ter datas anteriores e podem representar parcelas. A análise agrupa pela fatura em que estão lançadas.
- **Repetição não significa assinatura.** Um estabelecimento encontrado em várias faturas pode refletir compras diferentes ou parcelas. Antes de cortar, confirme os registros originais.
- **Simulação não é promessa de economia.** O percentual é aplicado sobre grupos revisáveis; parte dessas despesas pode ser indispensável.
- **O diagnóstico de saúde financeira é parcial.** Faltam renda, despesas não feitas no cartão, dívidas, patrimônio e reserva de emergência. Os campos opcionais são calculados no navegador e não são enviados nem persistidos pelo código do site.
- **Privacidade:** o repositório e o arquivo de dados são públicos. Não inclua dados financeiros sensíveis identificáveis na planilha publicada se não desejar expô-los.

## Publicação

Em **Settings → Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`. A página passa a refletir o deploy dos arquivos de frontend.
