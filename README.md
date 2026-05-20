# Proposta de Metodologia de Curadoria para o Catálogo de Normas

**Autor:** Manus AI  
**Data:** 20 de maio de 2026

## Introdução

Este documento descreve uma proposta de metodologia de curadoria para o Catálogo de Normas que regulamentam o uso da força, com base na análise da estrutura e conteúdo do repositório `joaovictors1/catalogo-normas`. O objetivo é formalizar os critérios de inclusão, categorização e manutenção das normas, garantindo a consistência e a qualidade do acervo.

## Princípios Orientadores

A curadoria do catálogo deve ser guiada pelos seguintes princípios:

*   **Relevância:** Inclusão de normas diretamente relacionadas ao uso da força em contextos estaduais (Sergipe), federais e internacionais.
*   **Abrangência:** Busca por uma cobertura ampla de diferentes níveis normativos e temas pertinentes.
*   **Precisão:** Informações corretas e atualizadas sobre cada norma, incluindo título, ano, nível, tema, natureza, descrição, status e link de referência.
*   **Consistência:** Aplicação uniforme dos critérios de categorização e formatação dos dados.
*   **Transparência:** Documentação clara da metodologia para facilitar a colaboração e a compreensão do acervo.

## Etapas da Metodologia de Curadoria

A metodologia de curadoria pode ser dividida nas seguintes etapas:

### 1. Identificação e Seleção de Normas

Esta etapa envolve a pesquisa e identificação de normas relevantes. As fontes podem incluir bases de dados legislativas, tratados internacionais, resoluções de organismos multilaterais, jurisprudência e doutrina especializada.

**Critérios de Inclusão:**

*   Normas que regulamentam, direta ou indiretamente, o uso da força por agentes estatais (militares, policiais, etc.).
*   Normas com aplicabilidade nos níveis internacional, federal (Brasil), estadual (Sergipe) e regional (Interamericano).
*   Documentos com status legal variado (Hard Law, Soft Law, etc.), desde que impactem a regulação do uso da força.

### 2. Coleta e Estruturação de Dados

Uma vez identificada a norma, seus dados devem ser coletados e estruturados no formato JSON, conforme o padrão observado no arquivo `data.js`.

**Campos obrigatórios para cada norma:**

*   `id`: Identificador único (ex: `se-1`, `in-24`).
*   `title`: Título completo da norma.
*   `year`: Ano de promulgação ou ratificação da norma. Em caso de múltiplas datas, priorizar a de entrada em vigor ou ratificação.
*   `level`: Nível de aplicabilidade da norma (ex: 
Internacional, Federal Infralegal, Estadual (Sergipe), Regional Interamericano, Federal Constitucional).
*   `theme`: Tema principal da norma (ex: Desarmamento e Controle de Armas, Direito Internacional Humanitário (DIH), Militarização da Segurança Pública).
*   `nature`: Natureza jurídica da norma (ex: Tratado / Hard Law, Lei Ordinária Federal, Resolução AGNU / Soft Law).
*   `desc`: Descrição concisa do conteúdo e relevância da norma.
*   `status`: Status atual da norma (ex: Vigente, Ratificou, Assinou; não ratificou, Pendente).
*   `link`: Link para o texto completo da norma ou para o decreto de promulgação/ratificação.

### 3. Categorização e Classificação

As normas devem ser categorizadas de forma consistente utilizando os campos `level`, `theme` e `nature`. É fundamental manter um vocabulário controlado para esses campos, evitando a criação de novas categorias sempre que possível e reutilizando as existentes.

### 4. Revisão e Validação

Antes da inclusão no catálogo, cada nova norma ou atualização deve passar por um processo de revisão para garantir a precisão dos dados, a conformidade com os critérios de inclusão e a correta categorização.

### 5. Manutenção e Atualização

O catálogo deve ser periodicamente revisado para garantir que as informações estejam atualizadas, especialmente o `status` das normas. Novas normas devem ser adicionadas e normas revogadas ou alteradas devem ter seus registros atualizados.

## Diretrizes para Inclusão de Novas Normas

Para incluir uma nova norma no catálogo, siga os passos:

1.  **Pesquisa:** Identifique a norma relevante e colete todas as informações necessárias (título, ano, nível, tema, natureza, descrição, status, link).
2.  **Formatação:** Estruture os dados da norma em formato JSON, seguindo o padrão do `data.js`.
3.  **Validação:** Verifique se todos os campos obrigatórios foram preenchidos e se a categorização está consistente com as normas existentes.
4.  **Inclusão:** Adicione o novo objeto JSON ao array `catalogData` no arquivo `data.js`.
5.  **Commit:** Crie um commit descritivo com a inclusão da nova norma e, se aplicável, abra um Pull Request para revisão.

## Referências

[1]: https://github.com/joaovictors1/catalogo-normas "Repositório joaovictors1/catalogo-normas no GitHub"
