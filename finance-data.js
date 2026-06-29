const FINANCE_DATA = {
  source: "[Financeiro] Cartão de Cida",
  updatedAt: "2026-06-29",
  monthlyOverview: [
    { mes: "Junho", valor: 3706.88, wesley: 1839.74, analu: 1389.50, casal: 1548.02, loja: 477.64 },
    { mes: "Julho", valor: 4621.44, wesley: 2600.07, analu: 1365.32, casal: 2268.53, loja: 656.06 }
  ],
  tabs: {
    "Fatura Junho": `Data,Estabelecimento,Valor,Categoria,Local,Dono
12/09/2025,Shopee,123.17,Compras Online,João Pessoa,Papelaria
20/09/2025,Casa Mix,100.00,Compras Online,João Pessoa,Papelaria
19/03/2026,Mercado Livre,59.29,Compras Online,João Pessoa,Papelaria
21/03/2026,Freitas Varejo,40.53,Mercado,João Pessoa,Analu
21/03/2026,Ferreira Costa,110.87,Mercado,João Pessoa,Analu
24/03/2026,Viagem Wesley,183.55,Viagem,João Pessoa,Wesley
11/04/2026,Vinni,146.71,Barbearia,João Pessoa,Wesley
24/04/2026,Otica Cruz,100.00,Outros,João Pessoa,Analu
05/05/2026,99,7.65,Locomoção,João Pessoa,Wesley
16/05/2026,Rida Sushi,76.60,Alimentação,João Pessoa,Wesley
16/05/2026,Americanas,100.96,Mercado,João Pessoa,Analu
16/05/2026,SantaFarra,112.00,Alimentação,João Pessoa,Analu
17/05/2026,99,14.20,Locomoção,João Pessoa,Wesley
17/05/2026,99,20.90,Locomoção,João Pessoa,Wesley
17/05/2026,Lar da Pizza,59.95,Alimentação,João Pessoa,Casal
18/05/2026,Espaço da Beleza,75.16,Outros,João Pessoa,Analu
18/05/2026,ChefeChama,94.78,Alimentação,João Pessoa,Casal
19/05/2026,99,28.60,Locomoção,João Pessoa,Wesley
19/05/2026,99,28.82,Locomoção,João Pessoa,Wesley
20/05/2026,Chef Adailton,29.80,Alimentação,João Pessoa,Wesley
20/05/2026,Hamburgueria Blitz,45.86,Alimentação,João Pessoa,Wesley
20/05/2026,Atacadão,287.86,Mercado,João Pessoa,Casal
21/05/2026,99,15.50,Locomoção,João Pessoa,Wesley
21/05/2026,Nel Farma,40.44,Outros,João Pessoa,Wesley
21/05/2026,Farmacia do Trabalhador,48.49,Outros,João Pessoa,Analu
21/05/2026,Julia Alves,79.20,Alimentação,João Pessoa,Casal
22/05/2026,99,14.00,Locomoção,João Pessoa,Wesley
23/05/2026,Gulliver,468.90,Alimentação,João Pessoa,Casal
25/05/2026,99,4.80,Locomoção,João Pessoa,Wesley
25/05/2026,99,18.14,Locomoção,João Pessoa,Wesley
26/05/2026,MP Acai Fit,15.00,Alimentação,João Pessoa,Wesley
26/05/2026,MP Osasco,72.90,Outros,João Pessoa,Papelaria
27/05/2026,Conveniência Posto,12.99,Alimentação,João Pessoa,Wesley
27/05/2026,Sudipel,108.68,Compras Online,João Pessoa,Papelaria
28/05/2026,Erick Matheus,52.02,Alimentação,João Pessoa,Wesley
29/05/2026,Julia Alves,7.00,Alimentação,João Pessoa,Casal
29/05/2026,99,9.90,Locomoção,João Pessoa,Wesley
29/05/2026,99,11.10,Locomoção,João Pessoa,Wesley
29/05/2026,Sueli,13.60,Outros,João Pessoa,Papelaria
29/05/2026,99,14.78,Locomoção,João Pessoa,Wesley
29/05/2026,Barbearia,67.00,Barbearia,João Pessoa,Wesley
29/05/2026,Sal e Brasa,127.27,Alimentação,João Pessoa,Wesley
30/05/2026,Lanchonete do Vicente,13.00,Alimentação,João Pessoa,Wesley
30/05/2026,99,17.10,Locomoção,João Pessoa,Wesley
30/05/2026,Supermercado Vitoria,27.48,Outros,João Pessoa,Analu
30/05/2026,Posto Cowboy,50.00,Locomoção,João Pessoa,Wesley
31/05/2026,Emporium dos Alimentos,43.26,Alimentação,João Pessoa,Casal
31/05/2026,Jose Pere,65.45,Alimentação,João Pessoa,Casal
31/05/2026,Latam,441.62,Viagem,João Pessoa,Casal`,
    "Fatura Julho": `Data,Estabelecimento,Valor,Categoria,Local,Dono
13/09/2025,Shopee,123.17,Compras Online,João Pessoa,Papelaria
20/09/2025,CasaMix,100.00,Compras Online,João Pessoa,Papelaria
21/03/2026,FerreiraCosta,110.87,Mercado,João Pessoa,Papelaria
24/03/2026,Passagem - SP,183.55,Viagem,João Pessoa,Wesley
11/04/2026,Vinni,146.71,Barbearia,João Pessoa,Wesley
24/04/2026,Otica Cluz,100.00,Outros,João Pessoa,Analu
18/05/2026,Espaco da Beleza,75.15,Outros,João Pessoa,Analu
27/05/2026,Sudipel,108.67,Outros,João Pessoa,Papelaria
07/06/2026,Uber,17.80,Locomoção,João Pessoa,Wesley
08/06/2026,Uber,6.20,Locomoção,João Pessoa,Wesley
08/06/2026,Uber,15.90,Locomoção,João Pessoa,Wesley
08/06/2026,Uber,24.90,Locomoção,João Pessoa,Wesley
09/06/2026,Uber,17.59,Locomoção,João Pessoa,Wesley
09/06/2026,AcaiFit,21.00,Alimentação,João Pessoa,Wesley
10/06/2026,Uber,5.00,Locomoção,João Pessoa,Wesley
10/06/2026,ChefAdailton,20.67,Alimentação,João Pessoa,Wesley
10/06/2026,Julia Alves,35.20,Alimentação,João Pessoa,Wesley
10/06/2026,Pizzaria,50.12,Alimentação,João Pessoa,Casal
11/06/2026,Uber,7.50,Locomoção,João Pessoa,Wesley
11/06/2026,Uber,16.78,Locomoção,João Pessoa,Wesley
12/06/2026,Mercado,30.00,Mercado,João Pessoa,Wesley
12/06/2026,Churrasco,38.80,Alimentação,João Pessoa,Wesley
12/06/2026,ChefAdailton,60.00,Alimentação,João Pessoa,Casal
13/06/2026,Uber,13.11,Locomoção,João Pessoa,Wesley
13/06/2026,Mercado,30.00,Mercado,João Pessoa,Casal
13/06/2026,Posto,200.00,Locomoção,Natal,Casal
14/06/2026,Show,10.00,Outros,Natal,Wesley
15/06/2026,Viagem Natal,32.50,Outros,Natal,Casal
15/06/2026,iFood,79.70,Alimentação,João Pessoa,Casal
15/06/2026,Gasolina,100.01,Locomoção,Natal,Casal
16/06/2026,Uber,27.20,Locomoção,João Pessoa,Wesley
16/06/2026,Uber,29.16,Locomoção,João Pessoa,Wesley
16/06/2026,Vinni,40.00,Barbearia,João Pessoa,Wesley
16/06/2026,Café,64.24,Alimentação,João Pessoa,Casal
16/06/2026,Jardim CaboBranco,84.00,Alimentação,João Pessoa,Casal
17/06/2026,Uber,11.00,Locomoção,João Pessoa,Wesley
17/06/2026,Panificadora,28.00,Viagem,Florianópolis,Wesley
17/06/2026,ChefAdailton,31.89,Alimentação,João Pessoa,Wesley
17/06/2026,Airbnb,115.20,Viagem,Florianópolis,Casal
18/06/2026,Starbucks,32.90,Viagem,Florianópolis,Casal
18/06/2026,Guna,59.00,Viagem,Florianópolis,Wesley
18/06/2026,Aeroporto,113.60,Viagem,Florianópolis,Casal
19/06/2026,LaBrasaria,6.00,Viagem,Florianópolis,Wesley
19/06/2026,Alambique,9.00,Viagem,Florianópolis,Casal
19/06/2026,LaBrasaria,35.00,Viagem,Florianópolis,Wesley
19/06/2026,Alambique,52.97,Viagem,Florianópolis,Casal
19/06/2026,Alambique,117.89,Viagem,Florianópolis,Casal
19/06/2026,RecantoMaurilio,130.19,Viagem,Florianópolis,Casal
20/06/2026,Kopenhagen,14.90,Viagem,Florianópolis,Wesley
20/06/2026,Uber,35.07,Viagem,Florianópolis,Casal
20/06/2026,Uber,35.30,Viagem,Florianópolis,Wesley
20/06/2026,LaBrasaria,40.00,Viagem,Florianópolis,Wesley
20/06/2026,Alambique,40.47,Viagem,Florianópolis,Casal
20/06/2026,Capone,149.60,Viagem,Florianópolis,Casal
21/06/2026,Chiclete,10.90,Viagem,Florianópolis,Wesley
21/06/2026,Posto - Lanche,17.99,Viagem,Florianópolis,Wesley
21/06/2026,Uber,39.10,Viagem,Florianópolis,Wesley
21/06/2026,Posto,50.00,Viagem,Florianópolis,Wesley
21/06/2026,Farmacia,57.25,Viagem,Florianópolis,Wesley
23/06/2026,Armazem,23.75,Viagem,Florianópolis,Casal
23/06/2026,Cantinho da Pamonha,24.00,Alimentação,João Pessoa,Edilma
23/06/2026,Google,50.00,Compras Online,João Pessoa,Wesley
23/06/2026,Cantinho da Castanha,57.50,Alimentação,João Pessoa,Edilma
23/06/2026,Farmacia,68.25,Viagem,Florianópolis,Casal
24/06/2026,Nina,14.00,Viagem,Florianópolis,Wesley
24/06/2026,DiMarcos,34.27,Viagem,Florianópolis,Casal
25/06/2026,Jardim Mangeuiera,13.60,Outros,Florianópolis,Edilma
25/06/2026,Armazem,24.90,Viagem,Florianópolis,Casal
25/06/2026,GPT,99.90,Compras Online,João Pessoa,Wesley
26/06/2026,IOF,3.50,Viagem,Florianópolis,Wesley
26/06/2026,Rolê,23.00,Viagem,Florianópolis,Wesley
26/06/2026,Rolê,23.00,Viagem,Florianópolis,Wesley
26/06/2026,Sushi,55.90,Viagem,Florianópolis,Analu
26/06/2026,Hamburger,75.00,Viagem,Florianópolis,Wesley
27/06/2026,Night Club,6.00,Viagem,Florianópolis,Wesley
27/06/2026,Bruno,13.50,Viagem,Florianópolis,Casal
27/06/2026,Rolê,30.00,Viagem,Florianópolis,Casal
27/06/2026,Posto,60.00,Viagem,Florianópolis,Casal
27/06/2026,Cintia Helena,80.90,Viagem,Florianópolis,Casal
27/06/2026,Sao Joao,198.00,Viagem,Florianópolis,Casal
28/06/2026,Restaurante,9.00,Viagem,Florianópolis,Casal
28/06/2026,Armazem,14.00,Viagem,João Pessoa,Wesley
28/06/2026,Armazem,14.00,Viagem,João Pessoa,Wesley
28/06/2026,Supermercado Vitoria,34.46,Alimentação,João Pessoa,Edilma
28/06/2026,Alambique,35.50,Viagem,Florianópolis,Casal
28/06/2026,Ricardo,41.00,Outros,João Pessoa,Edilma
28/06/2026,Supermercado Vitoria,42.79,Alimentação,João Pessoa,Edilma
28/06/2026,Restaurante,193.00,Viagem,Florianópolis,Casal`
  }
};
