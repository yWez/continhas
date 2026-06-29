# Continhas

Dashboard simples conectado a uma planilha pública do Google Sheets.

## O que ele faz

- Lê os dados diretamente da planilha publicada em CSV.
- Mostra quantidade de linhas e colunas importadas.
- Soma automaticamente colunas numéricas, principalmente campos com nomes como valor, venda, líquido, bruto, receita, faturamento, preço, ticket e meta.
- Exibe uma tabela pesquisável com todos os dados da planilha.
- Funciona como site estático, pronto para GitHub Pages.

## Planilha conectada

```txt
https://docs.google.com/spreadsheets/d/e/2PACX-1vQeboumr1it6uT_7ml6R2W1lQN9TVSwn6ewjhe1XmcbYbjVDzs0mKHrCpXt_8DbpvNth4F4kwI1gB-K/pub?gid=0&single=true&output=csv
```

## Como publicar no GitHub Pages

1. Entre nas configurações do repositório.
2. Vá em **Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**.
4. Selecione a branch **main** e a pasta **/** root.
5. Salve.

Depois disso, o GitHub vai gerar uma URL pública para acessar o dashboard.
