export const TOOLTIPS_SCORES: Record<string, string> = {
  cardiovascular:
    "Avalia a eficiência do seu coração e do sistema nervoso autônomo. Combina capacidade aeróbia, variabilidade cardíaca, frequência de repouso e recuperação pós-exercício.",
  metabolic:
    "Reflete a composição corporal e a tendência metabólica do cliente. Considera gordura corporal, massa magra, circunferência abdominal e variação de peso.",
  recovery:
    "Mede a qualidade da recuperação diária com base no sono e na regulação autonômica noturna. Sono insuficiente ou superficial impacta diretamente o desempenho e a longevidade.",
  functional:
    "Avalia a capacidade física aplicada ao dia a dia. Combina velocidade de caminhada, volume de treino, força e estabilidade ao caminhar.",
};

export const TOOLTIPS_COMPONENTES: Record<string, string> = {
  hrv: "Variabilidade da frequência cardíaca medida pelo Apple Watch durante o sono. Reflete a capacidade do sistema nervoso de se adaptar a estímulos. Valores mais altos indicam melhor regulação autonômica. Comparado com sua própria média de 90 dias.",
  fcr: "Frequência cardíaca mais baixa registrada em momentos de repouso ao longo do dia. Uma FC de repouso menor geralmente indica melhor condicionamento cardiovascular.",
  vo2: "Estimativa da capacidade máxima de consumo de oxigênio, calculada pelo Apple Watch durante caminhadas e corridas ao ar livre. É o preditor isolado mais forte de longevidade cardiovascular.",
  recuperacao:
    "Queda da frequência cardíaca no primeiro minuto após parar de se exercitar. Quanto maior a queda, melhor a capacidade de recuperação do coração. Média das últimas 5 sessões de exercício.",

  gordura:
    "Percentual de gordura em relação ao peso total, medido pela balança inteligente. Valores entre 15% e 20% são considerados ótimos para homens; 20% a 25% para mulheres.",
  cintura:
    "Circunferência abdominal em centímetros. É um dos melhores indicadores de gordura visceral e risco cardiometabólico, independente do peso total.",
  massa_magra:
    "Peso de tudo que não é gordura: músculos, ossos, órgãos e água. Manter ou aumentar a massa magra é um dos pilares da longevidade funcional.",
  tendencia_peso:
    "Variação do peso corporal nos últimos 30 dias. Valores positivos indicam ganho, negativos indicam perda. Pequenas oscilações são normais.",

  sono_total:
    "Média de horas dormidas por noite nos últimos 7 dias, medida pelo Apple Watch. A recomendação para adultos é de 7 a 9 horas por noite.",
  sono_rem_profundo:
    "Soma das fases de sono REM e sono profundo (média 7 dias). São as fases mais restauradoras — essenciais para consolidação de memória, reparo muscular e regulação hormonal.",
  hrv_noturna:
    "Variabilidade cardíaca medida exclusivamente durante o sono. É o indicador mais puro de recuperação autonômica, livre da influência de atividade, estresse e estimulantes.",
  fc_noturna:
    "Frequência cardíaca média durante o sono nos últimos 7 dias. Valores mais baixos indicam melhor recuperação. Aumentos persistentes podem sinalizar fadiga acumulada ou overtraining.",

  velocidade_caminhada:
    "Velocidade média ao caminhar nos últimos 30 dias, estimada pelo iPhone via GPS e acelerômetro. Estudos associam velocidade de caminhada a expectativa de vida e capacidade funcional.",
  volume_treino:
    "Total de minutos em que a frequência cardíaca esteve elevada por atividade física nos últimos 7 dias. Inclui treinos formais, deslocamento ativo e caminhadas.",
  forca:
    "Avaliação de força muscular registrada manualmente pelo profissional. Quando disponível, contribui para uma visão mais completa da capacidade funcional.",
  estabilidade:
    "Estimativa de estabilidade ao caminhar, medida pelo iPhone. Avalia o equilíbrio e a consistência da marcha. Valores altos indicam baixo risco de quedas.",
};
