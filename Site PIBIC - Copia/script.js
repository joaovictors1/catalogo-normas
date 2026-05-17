// ==========================================================================
// Gerenciamento de Estado da Aplicação (SPA)
// ==========================================================================
let state = {
  view: 'home', // 'home', 'catalog', 'detail', 'timeline'
  currentNorm: null,
  searchQuery: '',
  filterLevel: 'Todos',
  timelineFilter: 'Todos', // Novo estado para controlar o filtro da linha do tempo
  timelineInstance: null
};

const appContainer = document.getElementById('app-content');

// ==========================================================================
// Sistema de Navegação Principal
// ==========================================================================
function render() {
  if (state.timelineInstance) {
    state.timelineInstance.destroy();
    state.timelineInstance = null;
  }

  if (state.view === 'home') renderHome();
  else if (state.view === 'catalog') renderCatalog();
  else if (state.view === 'detail') renderDetail();
  else if (state.view === 'timeline') renderTimeline();

  // Inicializar animações de scroll sempre que a view mudar
  initScrollAnimations();
}

function navigateTo(view, normId = null) {
  state.view = view;
  if (normId) state.currentNorm = catalogData.find(n => n.id === normId);
  window.scrollTo(0, 0);
  render();
}

// Ouvintes de evento do Menu
document.getElementById('nav-home').addEventListener('click', (e) => { e.preventDefault(); navigateTo('home'); });
document.getElementById('nav-catalog').addEventListener('click', () => navigateTo('catalog'));
document.getElementById('nav-timeline').addEventListener('click', () => navigateTo('timeline'));
document.getElementById('nav-about').addEventListener('click', () => {
  alert("Projeto de Pesquisa Acadêmica.\nLevantamento documental baseado no acervo de Maio/2026.\nTodos os dados foram extraídos estritamente das fontes fornecidas.");
});

// ==========================================================================
// Views (Renderização de Conteúdo)
// ==========================================================================

function renderHome() {
  appContainer.innerHTML = `
    <div class="hero fade-in">
      <h2>Catálogo Sistemático de Normas sobre Uso da Força</h2>
      <p>Um levantamento exaustivo e rigoroso das normas estaduais (Sergipe), federais e internacionais que regulam, limitam ou impactam o uso da força e a militarização.</p>
      
      <div style="display:flex; gap:1rem; justify-content:center; margin-bottom:3rem;">
        <button class="btn-primary" onclick="navigateTo('catalog')"><i class="ph ph-magnifying-glass-plus"></i> Explorar o Acervo Completo</button>
        <button class="btn-primary" style="background: rgba(15, 23, 42, 0.5); border-color: rgba(56, 189, 248, 0.5);" onclick="navigateTo('timeline')"><i class="ph ph-clock-counter-clockwise"></i> Ver Evolução Temporal</button>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card reveal">
          <h3 id="count-total">${catalogData.length}</h3>
          <p>Normas Catalogadas</p>
        </div>
        <div class="stat-card reveal">
          <h3>3</h3>
          <p>Níveis Jurisdicionais</p>
        </div>
        <div class="stat-card reveal">
          <h3>1928-2025</h3>
          <p>Período Histórico</p>
        </div>
      </div>
    </div>
  `;
}

function renderCatalog() {
  let filtered = catalogData;
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.desc.toLowerCase().includes(q) ||
      n.theme.toLowerCase().includes(q)
    );
  }
  if (state.filterLevel !== 'Todos') {
    filtered = filtered.filter(n => n.level.includes(state.filterLevel));
  }

  const cardsHtml = filtered.length > 0 ? filtered.map(n => `
    <div class="norm-card reveal">
      <div class="badges">
        <span class="badge level">${n.level}</span>
        <span class="badge">${n.nature}</span>
      </div>
      <h3>${n.title}</h3>
      <p style="font-size: 0.9rem; margin-bottom: 1rem; color: var(--text-muted);"><i class="ph ph-tag"></i> ${n.theme} | Ano: ${n.year}</p>
      <p>${n.desc.substring(0, 150)}...</p>
      <button class="btn-text" style="margin-left: 0; margin-top: 1rem; color: var(--secondary-color); font-weight: bold; padding:0;" onclick="navigateTo('detail', '${n.id}')">Ler Documento Completo <i class="ph ph-arrow-right"></i></button>
    </div>
  `).join('') : '<p>Nenhuma norma encontrada com os critérios atuais. <br><em style="font-size:0.9rem; color:var(--text-muted);">Informação não disponível no documento de origem.</em></p>';

  const countHtml = `${filtered.length} normas encontradas no acervo.`;

  // Se já estamos no catálogo, apenas atualizamos a grid e a contagem para não perder o foco do input
  const existingGrid = document.querySelector('.grid-cards');
  if (existingGrid && state.view === 'catalog') {
    existingGrid.innerHTML = cardsHtml;
    document.getElementById('catalog-count').innerHTML = countHtml;
    
    // Reaplicar observer para as novas cartas geradas
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          obs.unobserve(entry.target);
        }
      });
    }, { root: null, rootMargin: '0px', threshold: 0.1 });
    document.querySelectorAll('.grid-cards .reveal').forEach(el => observer.observe(el));
    return;
  }

  // Caso seja o primeiro carregamento da página de catálogo:
  appContainer.innerHTML = `
    <div class="catalog-layout fade-in">
      <aside class="filters">
        <h4>Filtros</h4>
        <div class="filter-group">
          <label>Nível Normativo</label>
          <select id="select-level" onchange="updateFilters()">
            <option value="Todos" ${state.filterLevel === 'Todos' ? 'selected' : ''}>Todos</option>
            <option value="Estadual" ${state.filterLevel === 'Estadual' ? 'selected' : ''}>Estadual (Sergipe)</option>
            <option value="Federal" ${state.filterLevel === 'Federal' ? 'selected' : ''}>Federal (Brasil)</option>
            <option value="Internacional" ${state.filterLevel === 'Internacional' ? 'selected' : ''}>Internacional</option>
            <option value="Regional" ${state.filterLevel === 'Regional' ? 'selected' : ''}>Regional (Interamericano)</option>
          </select>
        </div>
        <button class="btn-text" onclick="clearFilters()" style="margin:0; padding:0; color:var(--text-muted); font-size:0.9rem;"><i class="ph ph-x"></i> Limpar Filtros</button>
      </aside>
      
      <div class="results-area">
        <input type="text" id="search-input" class="search-bar" placeholder="Buscar por palavra-chave, título ou tema..." value="${state.searchQuery}" oninput="updateSearch(event)">
        <p id="catalog-count" style="margin-bottom: 1rem; color: var(--text-muted); font-size:0.9rem;">${countHtml}</p>
        
        <div class="grid-cards">
          ${cardsHtml}
        </div>
      </div>
    </div>
  `;
  document.getElementById('search-input').focus();
}

function renderDetail() {
  const n = state.currentNorm;
  if (!n) return navigateTo('catalog');

  appContainer.innerHTML = `
    <div class="detail-view fade-in">
      <button class="btn-back" onclick="navigateTo('catalog')"><i class="ph ph-arrow-left"></i> Voltar ao Catálogo</button>
      <h2>${n.title}</h2>
      
      <div class="meta-grid">
        <div class="meta-item"><strong>Ano de Adoção:</strong> ${n.year}</div>
        <div class="meta-item"><strong>Nível Jurisdicional:</strong> ${n.level}</div>
        <div class="meta-item"><strong>Natureza Jurídica:</strong> ${n.nature}</div>
        <div class="meta-item"><strong>Tema Principal / Incidência:</strong> ${n.theme}</div>
        <div class="meta-item"><strong>Status / Situação no Brasil:</strong> ${n.status}</div>
        <div class="meta-item"><strong>Acesso Oficial / Internalização:</strong> <em style="word-break: break-all;">${n.link}</em></div>
      </div>
      
      <h4 style="margin-bottom: 1rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; color:var(--primary-color);">Principais Disposições Regulatórias</h4>
      <p style="font-size: 1.1rem; line-height: 1.8; color:var(--text-main); white-space: pre-line;">${n.desc}</p>
      
      <div style="margin-top: 3rem; padding: 1.5rem; background: rgba(245, 158, 11, 0.15); border-left: 4px solid var(--secondary-color); font-size: 0.95rem; border-radius:4px; color: #cbd5e1;">
        <strong style="color: var(--secondary-color);">Nota Metodológica Acadêmica:</strong><br>
        Os dados desta ficha foram extraídos sistematicamente do levantamento documental realizado em Maio de 2026. A exatidão do resumo e a classificação dos metadados baseiam-se estritamente e exclusivamente nas informações constantes na planilha original fornecida.
      </div>
    </div>
  `;
}

// ==========================================================================
// SEÇÃO ATUALIZADA: Linha do Tempo (Com Filtros)
// ==========================================================================
function renderTimeline() {
  appContainer.innerHTML = `
    <div class="timeline-section reveal active">
      <h2>Evolução Diacrônica da Tendência Normativa (1928 - 2025)</h2>
      <p style="text-align:center; color:var(--text-muted); max-width:600px; margin: 0 auto 1.5rem;">
        Visualize a cronologia dos instrumentos jurídicos catalogados. Navegue arrastando para os lados e use o scroll do mouse para afastar ou aproximar os anos.
      </p>

      <div style="text-align:center; margin-bottom: 2rem;">
        <label style="font-weight:600; color:var(--primary-color); margin-right: 0.5rem;">Filtrar Visualização:</label>
        <select id="timeline-filter" onchange="updateTimelineFilter()" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); font-family:var(--font-sans); background:var(--card-bg); color:var(--text-main); cursor:pointer; min-width: 250px;">
          <option value="Todos" ${state.timelineFilter === 'Todos' ? 'selected' : ''}>Mostrar Todas as Normas</option>
          <option value="Estadual" ${state.timelineFilter === 'Estadual' ? 'selected' : ''}>Apenas Estadual (Sergipe)</option>
          <option value="Federal" ${state.timelineFilter === 'Federal' ? 'selected' : ''}>Apenas Federal (Brasil)</option>
          <option value="Internacional" ${state.timelineFilter === 'Internacional' ? 'selected' : ''}>Apenas Internacional</option>
          <option value="Regional" ${state.timelineFilter === 'Regional' ? 'selected' : ''}>Apenas Regional (Interamericano)</option>
        </select>
      </div>

      <div id="visualization"></div>
    </div>
  `;

  const yearDistribution = {};

  // Filtra os dados antes de montar a linha do tempo com base na escolha do usuário
  let dadosFiltrados = catalogData;
  if (state.timelineFilter !== 'Todos') {
    dadosFiltrados = dadosFiltrados.filter(n => n.level.includes(state.timelineFilter));
  }

  const timelineItems = dadosFiltrados.map(norm => {
    if (!norm.year || norm.year === "Informação não disponível") return null;

    const yearMatch = norm.year.match(/\d{4}/);
    if (!yearMatch) return null;
    const year = yearMatch[0];

    if (!yearDistribution[year]) yearDistribution[year] = 0;
    const month = String((yearDistribution[year] % 12) + 1).padStart(2, '0');
    yearDistribution[year]++;

    const spreadDate = `${year}-${month}-01`;

    return {
      id: norm.id,
      content: `
        <div class="vis-item-content" title="${norm.title}">
          <strong>${year}</strong> - ${norm.title.substring(0, 35)}${norm.title.length > 35 ? '...' : ''}
          <br><span class="badge level" style="font-size:0.7rem; padding:1px 4px; margin-top:4px; display:inline-block;">${norm.level}</span>
        </div>
      `,
      start: spreadDate,
      className: norm.level.includes('Internacional') ? 'item-internacional' : 'item-nacional'
    };
  }).filter(item => item !== null);

  const items = new vis.DataSet(timelineItems);

  const container = document.getElementById('visualization');
  const options = {
    locale: 'pt-br',
    height: '100%',
    min: '1920-01-01',
    max: '2030-12-31',
    zoomMin: 1000 * 60 * 60 * 24 * 30 * 12,
    selectable: true,
    editable: false,
    margin: { item: { horizontal: 15, vertical: 10 }, axis: 5 },
    stack: true,
    showCurrentTime: true,
    orientation: 'bottom',
    format: {
      minorLabels: { year: 'YYYY' },
      majorLabels: { year: '' }
    }
  };

  state.timelineInstance = new vis.Timeline(container, items, options);

  state.timelineInstance.on('select', function (properties) {
    if (properties.items && properties.items.length > 0) {
      const selectedId = properties.items[0];
      navigateTo('detail', selectedId);
    }
  });
}

// ==========================================================================
// Manipuladores de Interatividade (Filtros e Busca)
// ==========================================================================
window.updateSearch = function (e) {
  state.searchQuery = e.target.value;
  renderCatalog();
}
window.updateFilters = function () {
  state.filterLevel = document.getElementById('select-level').value;
  renderCatalog();
}
window.clearFilters = function () {
  state.filterLevel = 'Todos';
  state.searchQuery = '';
  renderCatalog();
}

// NOVO: Manipulador do filtro da Linha do Tempo
window.updateTimelineFilter = function () {
  state.timelineFilter = document.getElementById('timeline-filter').value;
  renderTimeline();
}

// ==========================================================================
// Sistema de Animação de Scroll (Intersection Observer)
// ==========================================================================
function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const revealElements = document.querySelectorAll('.reveal');
  revealElements.forEach(el => observer.observe(el));
}

// Inicialização da Aplicação
render();