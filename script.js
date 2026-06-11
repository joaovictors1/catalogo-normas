// ==========================================================================
// Gerenciamento de Estado da Aplicação (SPA)
// ==========================================================================
let state = {
  view: 'home',
  backgroundView: 'home',
  currentNorm: null,
  searchQuery: '',
  filterLevel: 'Todos',
  filterAxis: 'Todos',
  filterNature: 'Todos',
  filterBinding: 'Todos',
  filterYearMin: 1868,
  filterYearMax: 2025,
  filterStatus: 'Todos',
  timelineFilter: 'Todos',
  timelineInstance: null,
  _searchTimeout: null,
  selectedNorms: []
};

const appContainer = document.getElementById('app-content');

// ==========================================================================
// Sistema de Navegação Principal
// ==========================================================================
function render() {
  const drawer = document.getElementById('detail-drawer');
  const wasDetailOpen = drawer && !drawer.classList.contains('drawer-hidden');

  if (state.view !== 'detail') {
    closeDrawer();
  }

  document.querySelectorAll('.btn-nav').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`nav-${state.view === 'detail' ? 'catalog' : state.view}`);
  if (activeBtn) activeBtn.classList.add('active');

  if (state.view === 'detail') {
    renderDetail();
  } else {
    // Evita re-renderizar o fundo se o painel de detalhes estava aberto e estamos voltando à mesma visualização
    const isExitingDetailToBackground = wasDetailOpen && (state.view === state.backgroundView);
    if (!isExitingDetailToBackground) {
      if (state.view === 'home') renderHome();
      else if (state.view === 'catalog') renderCatalog();
      else if (state.view === 'timeline') renderTimeline();
      else if (state.view === 'dashboard') renderDashboard();
      else if (state.view === 'compare') renderCompare();
      else if (state.view === 'graph') renderGraph();
    }
  }

  updateCompareBar();
  initScrollAnimations();
}

function closeDrawer() {
  const drawer = document.getElementById('detail-drawer');
  if (drawer) drawer.classList.add('drawer-hidden');
}

function openDrawer() {
  const drawer = document.getElementById('detail-drawer');
  if (drawer) drawer.classList.remove('drawer-hidden');
}

function navigateTo(view, normId = null, pushHistory = true) {
  // Close mobile drawer if open
  const drawer = document.getElementById('nav-drawer');
  const mBtn = document.getElementById('mobile-menu-btn');
  if (drawer && drawer.classList.contains('open')) {
    drawer.classList.remove('open');
    if (mBtn) mBtn.setAttribute('aria-expanded', 'false');
  }

  const prevView = state.view;
  state.view = view;
  
  if (normId) {
    state.currentNorm = catalogData.find(n => n.id === normId);
  } else if (view !== 'detail') {
    state.currentNorm = null;
  }
  
  if (view !== 'detail') {
    state.backgroundView = view;
  }

  // Evita rolar para o topo se estiver apenas fechando o painel de detalhes para voltar à mesma visualização de fundo
  if (view !== 'detail') {
    if (prevView === 'detail' && view === state.backgroundView) {
      // Mantém a posição de rolagem original do fundo
    } else if (view !== prevView) {
      window.scrollTo(0, 0);
    }
  }
  
  if (pushHistory) {
    const url = new URL(window.location);
    url.searchParams.set('view', view);
    if (normId) url.searchParams.set('id', normId);
    else url.searchParams.delete('id');
    window.history.pushState({ view, normId }, '', url);
  }
  
  render();
}

// Manipulador de histórico (botões Voltar/Avançar do navegador)
window.addEventListener('popstate', (e) => {
  if (e.state && e.state.view) {
    navigateTo(e.state.view, e.state.normId, false);
  } else {
    // Fallback if no state
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view') || 'home';
    const id = urlParams.get('id');
    navigateTo(view, id, false);
  }
});

// Mobile menu toggle
const mobileBtn = document.getElementById('mobile-menu-btn');
const navDrawer = document.getElementById('nav-drawer');
if (mobileBtn && navDrawer) {
  mobileBtn.addEventListener('click', () => {
    const isOpen = navDrawer.classList.toggle('open');
    mobileBtn.setAttribute('aria-expanded', isOpen);
  });
}

// Ouvintes de evento do Menu
document.getElementById('nav-home').addEventListener('click', (e) => { e.preventDefault(); navigateTo('home'); });
document.getElementById('nav-catalog').addEventListener('click', () => navigateTo('catalog'));
document.getElementById('nav-graph').addEventListener('click', () => navigateTo('graph'));
document.getElementById('nav-timeline').addEventListener('click', () => navigateTo('timeline'));
document.getElementById('nav-dashboard').addEventListener('click', () => navigateTo('dashboard'));
document.getElementById('nav-about').addEventListener('click', () => showAboutDrawer());

// ==========================================================================
// Views (Renderização de Conteúdo)
// ==========================================================================

function renderHome() {
  appContainer.innerHTML = `
    <div class="hero-docly fade-in">
      
      <h2 class="hero-title" style="color: var(--primary-color);">Repertório de Normas sobre o Uso da Força</h2>
      <p class="hero-subtitle">
        Documentação estruturada das normas estaduais (Sergipe), federais e internacionais sobre o controle do uso da força e militarização.
      </p>
      
      <div class="hero-search-wrapper">
        <div class="hero-search-container" onclick="document.getElementById('home-search-input').focus()">
          <i class="ph ph-magnifying-glass search-icon"></i>
          <input type="text" id="home-search-input" placeholder="Buscar normas (ex: lei ordinária, direitos humanos, armas)..." autocomplete="off" onfocus="showSearchDropdown()" onblur="hideSearchDropdownDelayed(event)" onkeydown="handleHomeSearchKey(event)">
          <div class="search-shortcut-keys">
            <kbd>⌘</kbd> <kbd>K</kbd>
          </div>
        </div>
        
        <!-- Extensão Inferior (Dropdown de Busca) -->
        <div id="home-search-dropdown" class="search-dropdown-hidden">
          <div class="dropdown-section">
            <span class="dropdown-section-title"><i class="ph ph-sparkle"></i> Sugestões Rápidas</span>
            <div class="dropdown-suggestions">
              <button class="dropdown-tag" onmousedown="submitHomeSearch('Direitos Humanos')">Direitos Humanos</button>
              <button class="dropdown-tag" onmousedown="submitHomeSearch('Uso da Força')">Uso da Força</button>
              <button class="dropdown-tag" onmousedown="submitHomeSearch('Decreto Sergipe')">Decreto Sergipe</button>
              <button class="dropdown-tag" onmousedown="submitHomeSearch('Militarização')">Militarização</button>
            </div>
          </div>
          
          <div class="dropdown-section" style="margin-top: 1rem;">
            <span class="dropdown-section-title"><i class="ph ph-funnel"></i> Explorar por Eixo</span>
            <div class="dropdown-axes-list">
              <div class="dropdown-axis-item" onmousedown="submitHomeSearchAxis('4')">
                <span class="axis-num">Eixo 4</span>
                <span class="axis-name">Direitos Humanos</span>
              </div>
              <div class="dropdown-axis-item" onmousedown="submitHomeSearchAxis('A')">
                <span class="axis-num">Eixo A</span>
                <span class="axis-name">Normas Locais (Sergipe)</span>
              </div>
              <div class="dropdown-axis-item" onmousedown="submitHomeSearchAxis('3')">
                <span class="axis-num">Eixo 3</span>
                <span class="axis-name">Dir. Internacional Humanitário</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="hero-shortcuts">
        <span class="shortcuts-label">Atalhos:</span>
        <button class="shortcut-tag" onclick="state.filterAxis='4'; navigateTo('catalog');">Direitos Humanos</button>
        <button class="shortcut-tag" onclick="state.filterLevel='Internacional'; navigateTo('catalog');">Internacional</button>
        <button class="shortcut-tag" onclick="state.filterLevel='Estadual'; navigateTo('catalog');">Sergipe</button>
      </div>

      <div class="section-title">
        <h3>Explorar por categoria</h3>
      </div>
      
      <div class="docly-grid-auto">
        <div class="docly-card" onclick="navigateTo('catalog')">
          <div class="docly-icon-wrapper"><i class="ph ph-books"></i></div>
          <h4>Catálogo de Normas</h4>
          <p>Explore o acervo completo e estruturado de normas.</p>
          <span class="docly-link">Acessar Repertório <i class="ph ph-arrow-up-right"></i></span>
        </div>
        
        <div class="docly-card" onclick="navigateTo('graph')">
          <div class="docly-icon-wrapper"><i class="ph ph-graph"></i></div>
          <h4>Grafo de Relações</h4>
          <p>Visualização interativa das conexões entre as normas.</p>
          <span class="docly-link">Ver Grafo <i class="ph ph-arrow-up-right"></i></span>
        </div>
        
        <div class="docly-card" onclick="navigateTo('timeline')">
          <div class="docly-icon-wrapper"><i class="ph ph-clock-counter-clockwise"></i></div>
          <h4>Evolução Histórica</h4>
          <p>Acompanhe a linha do tempo diacrônica das normas.</p>
          <span class="docly-link">Ver Evolução <i class="ph ph-arrow-up-right"></i></span>
        </div>

        <div class="docly-card" onclick="navigateTo('dashboard')">
          <div class="docly-icon-wrapper"><i class="ph ph-chart-bar"></i></div>
          <h4>Panorama Analítico</h4>
          <p>Métricas, estatísticas e gráficos sobre o uso da força.</p>
          <span class="docly-link">Ver Dashboard <i class="ph ph-arrow-up-right"></i></span>
        </div>
      </div>

      <div class="section-title mt-4">
        <h3>Sobre o Projeto</h3>
      </div>
      
      <div class="docly-grid-2">
        <div class="docly-card-horizontal" onclick="showAboutDrawer()">
          <div class="docly-icon-wrapper secondary"><i class="ph ph-info"></i></div>
          <div class="docly-card-content">
            <h4>Sobre a Pesquisa</h4>
            <p>Metodologia e informações do projeto PIBIC UFS.</p>
          </div>
          <span class="docly-link">Saber mais <i class="ph ph-arrow-up-right"></i></span>
        </div>

        <div class="docly-card-horizontal" onclick="showContactDrawer()">
          <div class="docly-icon-wrapper secondary"><i class="ph ph-envelope-simple"></i></div>
          <div class="docly-card-content">
            <h4>Entrar em Contato</h4>
            <p>Fale com o grupo proprietário da pesquisa.</p>
          </div>
          <span class="docly-link">Contato <i class="ph ph-arrow-up-right"></i></span>
        </div>
      </div>
      
      <!-- Stats Summary at bottom -->
      <div class="docly-stats">
        <div class="docly-stat-item">
          <h3 id="count-total">0</h3>
          <span>Normas</span>
        </div>
        <div class="docly-stat-item">
          <h3 id="count-levels">0</h3>
          <span>Níveis</span>
        </div>
        <div class="docly-stat-item">
          <h3>1868-2025</h3>
          <span>Período</span>
        </div>
      </div>
    </div>
  `;

  // Animate counters after loader is gone to prevent CPU lag from blocking frames
  const triggerHomeCounters = () => {
    const countTotal = document.getElementById('count-total');
    if (countTotal) animateValue(countTotal, 0, catalogData.length, 1200);
    
    const countLevels = document.getElementById('count-levels');
    if (countLevels) animateValue(countLevels, 0, 3, 1200);
  };

  const loader = document.getElementById('loader');
  if (loader && !loader.classList.contains('hidden-loader')) {
    const checkLoader = setInterval(() => {
      const loaderCheck = document.getElementById('loader');
      if (!loaderCheck || loaderCheck.classList.contains('hidden-loader')) {
        clearInterval(checkLoader);
        setTimeout(triggerHomeCounters, 300);
      }
    }, 100);
  } else {
    setTimeout(triggerHomeCounters, 100);
  }
}

function renderCatalog() {
  let filtered = catalogData;
  
  // Text search with keyword support
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.desc.toLowerCase().includes(q) ||
      n.theme.toLowerCase().includes(q) ||
      (n.keywords && n.keywords.some(k => k.toLowerCase().includes(q)))
    );
  }
  
  // Level filter
  if (state.filterLevel !== 'Todos') {
    filtered = filtered.filter(n => n.level.includes(state.filterLevel));
  }
  
  // Axis filter
  if (state.filterAxis !== 'Todos') {
    filtered = filtered.filter(n => n.axis === state.filterAxis);
  }
  
  // Nature filter
  if (state.filterNature !== 'Todos') {
    filtered = filtered.filter(n => n.nature.toLowerCase().includes(state.filterNature.toLowerCase()));
  }
  
  // Binding type filter
  if (state.filterBinding !== 'Todos') {
    filtered = filtered.filter(n => {
      const isIntOrReg = n.level.toLowerCase().includes('internacional') || n.level.toLowerCase().includes('regional');
      if (!isIntOrReg) return false;
      return (n.bindingType || 'Hard Law') === state.filterBinding;
    });
  }
  
  // Year range filter
  filtered = filtered.filter(n => {
    const yearMatch = n.year.match(/\d{4}/);
    if (!yearMatch) return true;
    const y = parseInt(yearMatch[0]);
    return y >= state.filterYearMin && y <= state.filterYearMax;
  });
  
  // Status filter
  if (state.filterStatus !== 'Todos') {
    filtered = filtered.filter(n => n.status.toLowerCase().includes(state.filterStatus.toLowerCase()));
  }

  // Build active filters chips
  const activeFilters = [];
  if (state.filterLevel !== 'Todos') activeFilters.push({label: `Nível: ${state.filterLevel}`, key: 'filterLevel'});
  if (state.filterAxis !== 'Todos') activeFilters.push({label: `Eixo: ${state.filterAxis}`, key: 'filterAxis'});
  if (state.filterNature !== 'Todos') activeFilters.push({label: `Natureza: ${state.filterNature}`, key: 'filterNature'});
  if (state.filterBinding !== 'Todos') activeFilters.push({label: state.filterBinding, key: 'filterBinding'});
  if (state.filterYearMin > 1868 || state.filterYearMax < 2025) activeFilters.push({label: `${state.filterYearMin}–${state.filterYearMax}`, key: 'filterYear'});
  if (state.filterStatus !== 'Todos') activeFilters.push({label: `Status: ${state.filterStatus}`, key: 'filterStatus'});
  if (state.searchQuery) activeFilters.push({label: `"${state.searchQuery}"`, key: 'searchQuery'});

  const chipsHtml = activeFilters.length > 0 ? `
    <div class="filter-chips">
      ${activeFilters.map(f => `<span class="filter-chip" onclick="removeFilter('${f.key}')">${f.label} <i class="ph ph-x"></i></span>`).join('')}
      <button class="filter-chip-clear" onclick="clearFilters()"><i class="ph ph-trash"></i> Limpar tudo</button>
    </div>
  ` : '';

  // Highlight function
  const highlightText = (text, maxLen) => {
    let t = maxLen ? text.substring(0, maxLen) + (text.length > maxLen ? '...' : '') : text;
    if (state.searchQuery) {
      const q = state.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      t = t.replace(new RegExp(`(${q})`, 'gi'), '<mark class="search-highlight">$1</mark>');
    }
    return t;
  };

  const emptyStateHtml = `
    <div class="empty-state reveal">
      <div class="empty-state-icon">
        <i class="ph ph-magnifying-glass-slash"></i>
      </div>
      <h4>Nenhuma norma encontrada</h4>
      <p>Não encontramos nenhum documento que corresponda aos critérios ou palavra-chave selecionados.</p>
      <button class="btn-clear-filters-empty" onclick="clearFilters()">
        <i class="ph ph-trash"></i> Limpar Filtros
      </button>
    </div>
  `;

  const cardsHtml = filtered.length > 0 ? filtered.map(n => {
    const bindingClass = (n.bindingType || 'Hard Law').toLowerCase().includes('soft') ? 'soft' : 'hard';
    const isSelected = state.selectedNorms.includes(n.id);
    const levelClass = `level-${n.level.toLowerCase()}`;
    const isIntOrReg = n.level.toLowerCase().includes('internacional') || n.level.toLowerCase().includes('regional');
    const bindingBadgeHtml = isIntOrReg ? `<span class="badge-binding-small ${bindingClass}">${(n.bindingType || 'Hard Law').toUpperCase()}</span>` : '';
    
    return `
    <div class="norm-card reveal ${levelClass} ${isSelected ? 'card-selected' : ''}">
      <label class="compare-check" onclick="event.stopPropagation()">
        <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleCompare('${n.id}')">
        <span class="checkmark"><i class="ph ph-check"></i></span>
      </label>
      <div class="badges">
        <span class="badge level ${levelClass}">${n.level}</span>
        ${bindingBadgeHtml}
        <span class="badge">${n.nature}</span>
      </div>
      <h3>${highlightText(n.title)}</h3>
      <p style="font-size: 0.9rem; margin-bottom: 1rem; color: var(--text-muted);"><i class="ph ph-tag"></i> ${n.theme} | Ano: ${n.year}</p>
      <p>${highlightText(n.desc, 150)}</p>
      <button class="btn-text" style="margin-left: 0; margin-top: 1rem; color: var(--secondary-color); font-weight: bold; padding:0;" onclick="navigateTo('detail', '${n.id}')">Ler Documento Completo <i class="ph ph-arrow-right"></i></button>
    </div>
  `;
  }).join('') : emptyStateHtml;

  const countHtml = `<strong>${filtered.length}</strong> de ${catalogData.length} normas encontradas.`;

  // If already in catalog, just update results with a smooth fade-in morph transition
  const existingGrid = document.querySelector('.grid-cards');
  if (existingGrid && state.view === 'catalog') {
    existingGrid.style.opacity = '0.3';
    existingGrid.style.transform = 'translateY(10px)';
    existingGrid.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
    
    setTimeout(() => {
      existingGrid.innerHTML = cardsHtml;
      existingGrid.style.opacity = '1';
      existingGrid.style.transform = 'translateY(0)';
      
      document.getElementById('catalog-count').innerHTML = countHtml;
      const chipsContainer = document.querySelector('.filter-chips-container');
      if (chipsContainer) chipsContainer.innerHTML = chipsHtml;
      // Update filter controls to match state
      syncFilterControls();
      // Re-observe
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { entry.target.classList.add('active'); obs.unobserve(entry.target); }
        });
      }, { root: null, rootMargin: '0px', threshold: 0.1 });
      document.querySelectorAll('.grid-cards .reveal').forEach(el => observer.observe(el));
    }, 120);
    return;
  }

  // Extract unique values for nature and status selects
  const natures = [...new Set(catalogData.map(n => {
    if (n.nature.includes('Tratado')) return 'Tratado';
    if (n.nature.includes('Lei Complementar')) return 'Lei Complementar';
    if (n.nature.includes('Lei Ordinária')) return 'Lei Ordinária';
    if (n.nature.includes('Decreto')) return 'Decreto';
    if (n.nature.includes('Portaria')) return 'Portaria';
    if (n.nature.includes('Resolução')) return 'Resolução';
    if (n.nature.includes('Emenda Constitucional')) return 'Emenda Constitucional';
    if (n.nature.includes('Norma Constitucional')) return 'Norma Constitucional';
    if (n.nature.includes('Protocolo')) return 'Protocolo';
    if (n.nature.includes('Princípios')) return 'Princípios';
    if (n.nature.includes('Declaração')) return 'Declaração';
    if (n.nature.includes('Diretriz')) return 'Diretriz';
    if (n.nature.includes('Manual')) return 'Manual';
    if (n.nature.includes('Código')) return 'Código';
    if (n.nature.includes('Convenção')) return 'Convenção';
    return 'Outro';
  }))].sort();

  const statuses = [...new Set(catalogData.map(n => {
    if (n.status.includes('Vigente')) return 'Vigente';
    if (n.status.includes('Ratificou')) return 'Ratificou';
    if (n.status.includes('Não é parte')) return 'Não é parte';
    if (n.status.includes('Assinou')) return 'Assinou';
    if (n.status.includes('Apoiou')) return 'Apoiou';
    if (n.status.includes('Aplica')) return 'Aplica';
    if (n.status.includes('Endossou')) return 'Endossou';
    if (n.status.includes('Pendente')) return 'Pendente';
    if (n.status.includes('Referencia')) return 'Referencia';
    return 'Outro';
  }))].sort();

  // Full page render
  appContainer.innerHTML = `
    <div class="catalog-layout fade-in">
      <aside class="filters">
        <h4><i class="ph ph-funnel"></i> Filtros</h4>
        
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

        <div class="filter-group">
          <label>Eixo Temático</label>
          <select id="select-axis" onchange="updateFilters()">
            <option value="Todos" ${state.filterAxis === 'Todos' ? 'selected' : ''}>Todos os Eixos</option>
            <option value="A" ${state.filterAxis === 'A' ? 'selected' : ''}>A — Normas Locais (Sergipe)</option>
            <option value="B" ${state.filterAxis === 'B' ? 'selected' : ''}>B — Constitucionais Federais</option>
            <option value="C" ${state.filterAxis === 'C' ? 'selected' : ''}>C — Federais</option>
            <option value="1" ${state.filterAxis === '1' ? 'selected' : ''}>1 — Uso da Força Internacional</option>
            <option value="2" ${state.filterAxis === '2' ? 'selected' : ''}>2 — Desarmamento e Controle</option>
            <option value="3" ${state.filterAxis === '3' ? 'selected' : ''}>3 — Dir. Internacional Humanitário</option>
            <option value="4" ${state.filterAxis === '4' ? 'selected' : ''}>4 — Direitos Humanos</option>
            <option value="5" ${state.filterAxis === '5' ? 'selected' : ''}>5 — Militarização Seg. Pública</option>
            <option value="6" ${state.filterAxis === '6' ? 'selected' : ''}>6 — Crianças e Conflitos</option>
            <option value="7" ${state.filterAxis === '7' ? 'selected' : ''}>7 — Mercenários e EMSP</option>
            <option value="8" ${state.filterAxis === '8' ? 'selected' : ''}>8 — Espaços Regulados</option>
            <option value="9" ${state.filterAxis === '9' ? 'selected' : ''}>9 — Bens Civis</option>
            <option value="10" ${state.filterAxis === '10' ? 'selected' : ''}>10 — Regionais Interamericanas</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Natureza Jurídica</label>
          <select id="select-nature" onchange="updateFilters()">
            <option value="Todos" ${state.filterNature === 'Todos' ? 'selected' : ''}>Todas</option>
            ${natures.map(n => `<option value="${n}" ${state.filterNature === n ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </div>

        <div class="filter-group">
          <label>Força Vinculante</label>
          <div class="binding-toggle">
            <button class="toggle-btn ${state.filterBinding === 'Todos' ? 'active' : ''}" onclick="setBinding('Todos')">Todos</button>
            <button class="toggle-btn hard ${state.filterBinding === 'Hard Law' ? 'active' : ''}" onclick="setBinding('Hard Law')">Hard Law</button>
            <button class="toggle-btn soft ${state.filterBinding === 'Soft Law' ? 'active' : ''}" onclick="setBinding('Soft Law')">Soft Law</button>
          </div>
        </div>

        <div class="filter-group">
          <label>Período: <span id="year-range-label">${state.filterYearMin} — ${state.filterYearMax}</span></label>
          <div class="range-slider-container">
            <input type="range" id="year-min" class="range-input" min="1868" max="2025" value="${state.filterYearMin}" oninput="updateYearRange()">
            <input type="range" id="year-max" class="range-input" min="1868" max="2025" value="${state.filterYearMax}" oninput="updateYearRange()">
          </div>
        </div>

        <div class="filter-group">
          <label>Status no Brasil</label>
          <select id="select-status" onchange="updateFilters()">
            <option value="Todos" ${state.filterStatus === 'Todos' ? 'selected' : ''}>Todos</option>
            ${statuses.map(s => `<option value="${s}" ${state.filterStatus === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>

        <button class="btn-clear-filters" onclick="clearFilters()"><i class="ph ph-x"></i> Limpar Todos os Filtros</button>
      </aside>
      
      <div class="results-area">
        <div class="search-wrapper">
          <i class="ph ph-magnifying-glass search-icon-catalog"></i>
          <input type="text" id="search-input" placeholder="Buscar por palavra-chave, título, tema ou descrição..." value="${state.searchQuery}" oninput="debouncedSearch(event)">
          <div class="search-shortcut-hint">
            <kbd>⌘</kbd> <kbd>K</kbd>
          </div>
        </div>
        <div class="filter-chips-container">${chipsHtml}</div>
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

  const drawer = document.getElementById('detail-drawer');
  if (drawer) {
    if (state.backgroundView === 'timeline' || state.backgroundView === 'graph') {
      drawer.classList.add('is-modal');
    } else {
      drawer.classList.remove('is-modal');
    }
  }

  // Determine binding type if applicable
  const isIntOrReg = n.level.toLowerCase().includes('internacional') || n.level.toLowerCase().includes('regional');
  let bindingBadgeHtml = '';
  if (isIntOrReg) {
    const bindingType = n.bindingType || 'Hard Law';
    const bindingClass = bindingType.toLowerCase().includes('soft') ? 'soft' : 'hard';
    const bindingLabel = bindingType.toUpperCase();
    bindingBadgeHtml = `<span class="badge-binding ${bindingClass}" style="margin-bottom: 2rem;">${bindingLabel}</span>`;
  }

  // Axis info for breadcrumb
  const axisLabel = n.axis ? `Eixo ${n.axis}` : '';
  const axisName = n.axisName || n.level || '';
  const breadcrumbAxisText = axisLabel && axisName ? `${axisLabel} — ${axisName}` : axisName || n.level;

  // Related norms
  const relatedIds = n.relatedIds || [];
  const relatedNorms = relatedIds
    .map(id => catalogData.find(norm => norm.id === id))
    .filter(Boolean);

  let relatedHtml = '';
  if (relatedNorms.length > 0) {
    const relatedCardsHtml = relatedNorms.map(rn => {
      const rnIsIntOrReg = rn.level.toLowerCase().includes('internacional') || rn.level.toLowerCase().includes('regional');
      let rnBindingBadgeHtml = '';
      if (rnIsIntOrReg) {
        const rnBindingType = rn.bindingType || 'Hard Law';
        const rnBindingClass = rnBindingType.toLowerCase().includes('soft') ? 'soft' : 'hard';
        rnBindingBadgeHtml = `<span class="badge-binding-small ${rnBindingClass}">${rnBindingType.toUpperCase()}</span>`;
      }
      return `
        <div class="related-card" onclick="navigateTo('detail', '${rn.id}')">
          <span class="badge level">${rn.level}</span>
          ${rnBindingBadgeHtml}
          <h5>${rn.title}</h5>
          <p class="related-desc">${rn.desc.substring(0, 120)}...</p>
          <span class="related-link"><i class="ph ph-arrow-right"></i> Ver ficha completa</span>
        </div>
      `;
    }).join('');

    relatedHtml = `
      <section class="related-norms">
        <h4><i class="ph ph-link"></i> Normas Correlatas</h4>
        <p class="related-subtitle">Instrumentos normativos diretamente relacionados a este documento</p>
        <div class="related-grid">
          ${relatedCardsHtml}
        </div>
      </section>
    `;
  }

  // Citation and full text buttons
  let actionsHtml = '';
  const hasCitation = n.citationABNT && n.citationABNT.trim() !== '';
  const hasFullLink = n.fullLink && n.fullLink.trim() !== '';
  if (hasCitation || hasFullLink) {
    actionsHtml = '<div class="detail-actions">';
    if (hasCitation) {
      actionsHtml += `
        <button class="btn-citation" onclick="copyCitation()">
          <i class="ph ph-copy"></i> Copiar Citação ABNT
        </button>
      `;
    }
    if (hasFullLink) {
      actionsHtml += `
        <a href="${n.fullLink}" target="_blank" rel="noopener" class="btn-fulltext">
          <i class="ph ph-arrow-square-out"></i> Acessar Texto Integral
        </a>
      `;
    }
    actionsHtml += '</div>';
  }

  // Previous/Next navigation within the same axis
  let navHtml = '';
  const axisKey = n.axis || null;
  if (axisKey) {
    const sameAxis = catalogData.filter(item => item.axis === axisKey);
    const currentIndex = sameAxis.findIndex(item => item.id === n.id);
    const prev = currentIndex > 0 ? sameAxis[currentIndex - 1] : null;
    const next = currentIndex < sameAxis.length - 1 ? sameAxis[currentIndex + 1] : null;

    if (prev || next) {
      navHtml = '<nav class="detail-nav">';
      if (prev) {
        navHtml += `
          <button class="detail-nav-btn prev" onclick="navigateTo('detail', '${prev.id}')">
            <span class="nav-label"><i class="ph ph-caret-left"></i> Anterior</span>
            <span class="nav-title">${prev.title.substring(0, 60)}${prev.title.length > 60 ? '...' : ''}</span>
          </button>
        `;
      }
      if (next) {
        navHtml += `
          <button class="detail-nav-btn next" onclick="navigateTo('detail', '${next.id}')">
            <span class="nav-label">Próximo <i class="ph ph-caret-right"></i></span>
            <span class="nav-title">${next.title.substring(0, 60)}${next.title.length > 60 ? '...' : ''}</span>
          </button>
        `;
      }
      navHtml += '</nav>';
    }
  }

  if (!appContainer.innerHTML.trim()) {
    state.backgroundView = 'catalog';
    renderCatalog();
  }

  const drawerContent = document.getElementById('drawer-content-area');
  drawerContent.innerHTML = `
    <button class="btn-close-drawer" aria-label="Fechar painel" onclick="navigateTo(state.backgroundView || 'catalog')"><i class="ph ph-x"></i></button>
    
    <div class="breadcrumb" style="margin-bottom: 2rem;">
      <span style="color: var(--primary-color); font-weight: 600;">Repertório</span>
      <i class="ph ph-caret-right"></i>
      <span>${breadcrumbAxisText}</span>
    </div>
 
    <h2 style="font-family: var(--font-serif); font-size: 2.2rem; color: #fff; margin-bottom: 1rem; line-height: 1.2;">${n.title}</h2>
    ${bindingBadgeHtml}
    
    <div class="meta-grid" style="grid-template-columns: 1fr; background: var(--glass-bg); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); border: 1px solid var(--glass-border); border-radius: 8px; padding: 1.5rem; gap: 1rem; margin-bottom: 2rem;">
      <div class="meta-item"><strong>Ano:</strong> ${n.year}</div>
      <div class="meta-item"><strong>Nível:</strong> ${n.level}</div>
      <div class="meta-item"><strong>Natureza:</strong> ${n.nature}</div>
      <div class="meta-item"><strong>Tema:</strong> ${n.theme}</div>
      <div class="meta-item"><strong>Status:</strong> ${n.status}</div>
      <div class="meta-item" style="word-break: break-all;"><strong>Link Oficial:</strong> <a href="${n.link}" target="_blank" style="color: var(--primary-color);">${n.link}</a></div>
    </div>
    
    <h4 style="margin-top: 1rem; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; color:var(--primary-color);">Disposições</h4>
    <p style="font-size: 1.05rem; line-height: 1.8; color:var(--text-main); white-space: pre-line;">${n.desc}</p>
    
    ${actionsHtml}
    ${relatedHtml}

    <div style="margin-top: 3rem; padding: 1.5rem; background: rgba(37, 99, 235, 0.1); border-left: 4px solid var(--primary-color); font-size: 0.9rem; border-radius:4px; color: #cbd5e1;">
      <strong>Nota Metodológica:</strong> Dados extraídos do levantamento de Maio/2026.
    </div>

    ${navHtml}
  `;
  drawerContent.scrollTop = 0;
  openDrawer();
}

// ==========================================================================
// Função de Copiar Citação ABNT
// ==========================================================================
window.copyCitation = function() {
  const text = state.currentNorm?.citationABNT || '';
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.btn-citation');
    if (!btn) return;
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-check"></i> Copiado!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = original;
      btn.classList.remove('copied');
    }, 2000);
  });
}

// ==========================================================================
// SEÇÃO ATUALIZADA: Linha do Tempo Vertical Custom
// ==========================================================================
function renderTimeline() {
  // Filter data
  let dadosFiltrados = catalogData;
  if (state.timelineFilter !== 'Todos') {
    dadosFiltrados = dadosFiltrados.filter(n => n.level.includes(state.timelineFilter));
  }

  // Parse years and sort chronologically
  const withYear = dadosFiltrados.map(n => {
    const m = n.year.match(/\d{4}/);
    return m ? { ...n, _year: parseInt(m[0]) } : null;
  }).filter(Boolean).sort((a, b) => a._year - b._year);

  // Group by decade
  const decades = {};
  withYear.forEach(n => {
    const dec = Math.floor(n._year / 10) * 10;
    if (!decades[dec]) decades[dec] = [];
    decades[dec].push(n);
  });

  const levelColor = (level) => {
    if (level.includes('Estadual')) return '#2dd4bf';
    if (level.includes('Federal')) return '#818cf8';
    if (level.includes('Internacional')) return '#38bdf8';
    if (level.includes('Regional')) return '#f59e0b';
    return '#94a3b8';
  };

  const bindingBadge = (n) => {
    const isIntOrReg = n.level.toLowerCase().includes('internacional') || n.level.toLowerCase().includes('regional');
    if (!isIntOrReg) return '';
    const bt = (n.bindingType || 'Hard Law');
    const cls = bt.toLowerCase().includes('soft') ? 'soft' : 'hard';
    return `<span class="tl-binding ${cls}">${bt.toUpperCase()}</span>`;
  };

  const decadeKeys = Object.keys(decades).map(Number).sort((a, b) => a - b);

  const decadesHtml = decadeKeys.map((dec, decIndex) => {
    const items = decades[dec];
    
    let prevDecadeColor = 'transparent';
    if (decIndex > 0) {
      const prevItems = decades[decadeKeys[decIndex - 1]];
      if (prevItems && prevItems.length > 0) {
        prevDecadeColor = levelColor(prevItems[prevItems.length - 1].level);
      }
    }
    const firstItemColor = items.length > 0 ? levelColor(items[0].level) : 'transparent';

    const itemsHtml = items.map((n, i) => {
      let nextColor = null;
      if (i < items.length - 1) {
        nextColor = levelColor(items[i + 1].level);
      } else {
        const nextDecade = decadeKeys[decIndex + 1];
        if (nextDecade && decades[nextDecade].length > 0) {
          nextColor = levelColor(decades[nextDecade][0].level);
        } else {
          nextColor = 'transparent';
        }
      }
      const currentColor = levelColor(n.level);

      return `
      <div class="tl-item" onclick="navigateTo('detail', '${n.id}')">
        <div class="tl-segment" style="background: linear-gradient(to bottom, ${currentColor}, ${nextColor});"></div>
        <div class="tl-dot" style="background: ${currentColor}"></div>
        <div class="tl-card" style="--level-color: ${currentColor}">
          <div class="tl-card-header">
            <span class="tl-year">${n._year}</span>
            ${bindingBadge(n)}
            <span class="tl-level-tag" style="color: ${currentColor}">${n.level}</span>
          </div>
          <h5 class="tl-title">${n.title}</h5>
          <p class="tl-desc">${n.desc.substring(0, 120)}...</p>
          <span class="tl-action"><i class="ph ph-arrow-right"></i> Ver ficha completa</span>
        </div>
      </div>
    `}).join('');

    return `
      <div class="tl-decade">
        <div class="tl-decade-marker" onclick="this.parentElement.classList.toggle('collapsed')">
          <div class="tl-segment tl-segment-marker" style="background: linear-gradient(to bottom, ${prevDecadeColor}, ${firstItemColor});"></div>
          <span class="tl-decade-label">${dec}s</span>
          <span class="tl-decade-count">${items.length} norma${items.length > 1 ? 's' : ''}</span>
          <i class="ph ph-caret-down tl-decade-chevron"></i>
        </div>

        <div class="tl-decade-items">
          ${itemsHtml}
        </div>
      </div>
    `;
  }).join('');

  // Legend
  const legendHtml = [
    { label: 'Estadual', color: '#2dd4bf' },
    { label: 'Federal', color: '#818cf8' },
    { label: 'Internacional', color: '#38bdf8' },
    { label: 'Regional', color: '#f59e0b' }
  ].map(l =>
    `<span class="tl-legend-item"><span class="tl-legend-dot" style="background:${l.color}"></span>${l.label}</span>`
  ).join('');

  appContainer.innerHTML = `
    <div class="timeline-section reveal active">
      <h2>Evolução Diacrônica da Tendência Normativa</h2>
      <p style="text-align:center; color:var(--text-muted); max-width:600px; margin: 0 auto 1.5rem;">
        Navegue pela cronologia dos ${withYear.length} instrumentos jurídicos, organizados por década. Clique em qualquer norma para ver sua ficha completa.
      </p>

      <div class="tl-controls">
        <select id="timeline-filter" onchange="updateTimelineFilter()">
          <option value="Todos" ${state.timelineFilter === 'Todos' ? 'selected' : ''}>Todos os Níveis</option>
          <option value="Estadual" ${state.timelineFilter === 'Estadual' ? 'selected' : ''}>Estadual (Sergipe)</option>
          <option value="Federal" ${state.timelineFilter === 'Federal' ? 'selected' : ''}>Federal (Brasil)</option>
          <option value="Internacional" ${state.timelineFilter === 'Internacional' ? 'selected' : ''}>Internacional</option>
          <option value="Regional" ${state.timelineFilter === 'Regional' ? 'selected' : ''}>Regional (Interamericano)</option>
        </select>
        <div class="tl-legend">${legendHtml}</div>
      </div>

      <div class="tl-container">
        <div class="tl-line"></div>
        ${decadesHtml}
      </div>
    </div>
  `;
}

// ==========================================================================
// Dashboard Analítico (Fase 4)
// ==========================================================================
function renderDashboard() {
  // Pre-calculate stats
  const totalNorms = catalogData.length;
  const intAndRegNorms = catalogData.filter(n => n.level.toLowerCase().includes('internacional') || n.level.toLowerCase().includes('regional'));
  const hardLaw = intAndRegNorms.filter(n => (n.bindingType || 'Hard Law') === 'Hard Law').length;
  const softLaw = intAndRegNorms.filter(n => (n.bindingType || 'Hard Law') === 'Soft Law').length;
  const vigentes = catalogData.filter(n => n.status.includes('Vigente')).length;
  const ratificados = catalogData.filter(n => n.status.includes('Ratificou')).length;

  appContainer.innerHTML = `
    <div class="dashboard-view fade-in">
      <h2><i class="ph ph-chart-bar"></i> Panorama Analítico do Acervo</h2>
      <p class="dash-subtitle">Visualização estatística da composição e distribuição das ${totalNorms} normas catalogadas.</p>

      <div class="counter-grid">
        <div class="counter-card reveal">
          <i class="ph ph-books"></i>
          <span class="counter-value" data-target="${totalNorms}">0</span>
          <span class="counter-label">Normas Catalogadas</span>
        </div>
        <div class="counter-card reveal">
          <i class="ph ph-scales"></i>
          <span class="counter-value" data-target="${hardLaw}">0</span>
          <span class="counter-label">Hard Law</span>
        </div>
        <div class="counter-card reveal">
          <i class="ph ph-scroll"></i>
          <span class="counter-value" data-target="${softLaw}">0</span>
          <span class="counter-label">Soft Law</span>
        </div>
        <div class="counter-card reveal">
          <i class="ph ph-check-circle"></i>
          <span class="counter-value" data-target="${vigentes}">0</span>
          <span class="counter-label">Vigentes</span>
        </div>
        <div class="counter-card reveal">
          <i class="ph ph-handshake"></i>
          <span class="counter-value" data-target="${ratificados}">0</span>
          <span class="counter-label">Ratificados pelo Brasil</span>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card reveal">
          <h4><i class="ph ph-list-bullets"></i> Distribuição por Eixo Temático</h4>
          <canvas id="chart-axis"></canvas>
        </div>
        <div class="chart-card reveal">
          <h4><i class="ph ph-circle-half"></i> Hard Law vs Soft Law</h4>
          <canvas id="chart-binding"></canvas>
        </div>
        <div class="chart-card reveal">
          <h4><i class="ph ph-trend-up"></i> Evolução por Década</h4>
          <canvas id="chart-decade"></canvas>
        </div>
        <div class="chart-card reveal">
          <h4><i class="ph ph-globe-hemisphere-west"></i> Distribuição por Nível Jurisdicional</h4>
          <canvas id="chart-level"></canvas>
        </div>
      </div>
    </div>
  `;

  // Animate counters
  animateCounters();

  // Chart.js global defaults for dark theme
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.07)';
  Chart.defaults.font.family = 'Inter, sans-serif';

  // ---- 1. Bar chart: by axis ----
  const axisMap = {};
  const axisLabelsMap = {
    'A': 'A — Sergipe', 'B': 'B — Constitucionais', 'C': 'C — Federais',
    '1': '1 — Uso da Força', '2': '2 — Desarmamento', '3': '3 — DIH',
    '4': '4 — Dir. Humanos', '5': '5 — Militarização', '6': '6 — Crianças',
    '7': '7 — Mercenários', '8': '8 — Espaços Reg.', '9': '9 — Bens Civis',
    '10': '10 — Regionais'
  };
  catalogData.forEach(n => {
    const a = n.axis || '?';
    axisMap[a] = (axisMap[a] || 0) + 1;
  });
  const axisKeys = Object.keys(axisLabelsMap).filter(k => axisMap[k]);
  new Chart(document.getElementById('chart-axis'), {
    type: 'bar',
    data: {
      labels: axisKeys.map(k => axisLabelsMap[k] || k),
      datasets: [{
        label: 'Normas',
        data: axisKeys.map(k => axisMap[k] || 0),
        backgroundColor: axisKeys.map((_, i) => `hsla(${200 + i * 25}, 70%, 55%, 0.75)`),
        borderColor: axisKeys.map((_, i) => `hsla(${200 + i * 25}, 70%, 65%, 1)`),
        borderWidth: 1, borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { stepSize: 2 } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });

  // ---- 2. Donut: Hard vs Soft ----
  new Chart(document.getElementById('chart-binding'), {
    type: 'doughnut',
    data: {
      labels: ['Hard Law', 'Soft Law'],
      datasets: [{
        data: [hardLaw, softLaw],
        backgroundColor: ['rgba(56, 189, 248, 0.8)', 'rgba(245, 158, 11, 0.8)'],
        borderColor: ['#38bdf8', '#f59e0b'], borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true, font: { size: 13 } } }
      }
    }
  });

  // ---- 3. Line: by decade ----
  const decadeMap = {};
  catalogData.forEach(n => {
    const ym = n.year.match(/\d{4}/);
    if (!ym) return;
    const decade = Math.floor(parseInt(ym[0]) / 10) * 10;
    decadeMap[decade] = (decadeMap[decade] || 0) + 1;
  });
  const decades = Object.keys(decadeMap).map(Number).sort((a, b) => a - b);
  new Chart(document.getElementById('chart-decade'), {
    type: 'line',
    data: {
      labels: decades.map(d => `${d}s`),
      datasets: [{
        label: 'Normas publicadas',
        data: decades.map(d => decadeMap[d]),
        fill: true,
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        borderColor: '#38bdf8', borderWidth: 2,
        pointBackgroundColor: '#38bdf8', pointRadius: 4, pointHoverRadius: 7,
        tension: 0.35
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { stepSize: 5 } }
      }
    }
  });

  // ---- 4. Bar: by level ----
  const levelMap = {};
  const levelOrder = ['Estadual', 'Federal', 'Internacional', 'Regional'];
  const levelColors = ['#2dd4bf', '#818cf8', '#38bdf8', '#f59e0b'];
  catalogData.forEach(n => {
    let lv = 'Outro';
    for (const l of levelOrder) { if (n.level.includes(l)) { lv = l; break; } }
    levelMap[lv] = (levelMap[lv] || 0) + 1;
  });
  new Chart(document.getElementById('chart-level'), {
    type: 'bar',
    data: {
      labels: levelOrder.filter(l => levelMap[l]),
      datasets: [{
        label: 'Normas',
        data: levelOrder.filter(l => levelMap[l]).map(l => levelMap[l]),
        backgroundColor: levelOrder.filter(l => levelMap[l]).map((_, i) => levelColors[i] + 'cc'),
        borderColor: levelOrder.filter(l => levelMap[l]).map((_, i) => levelColors[i]),
        borderWidth: 1, borderRadius: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { stepSize: 5 } }
      }
    }
  });
}

function animateCounters() {
  const counters = document.querySelectorAll('.counter-value');
  counters.forEach(el => {
    const target = parseInt(el.dataset.target);
    const duration = 1500;
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * ease);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

// ==========================================================================
// Manipuladores de Interatividade (Filtros e Busca)
// ==========================================================================
// Debounced search
window.debouncedSearch = function(e) {
  state.searchQuery = e.target.value;
  clearTimeout(state._searchTimeout);
  state._searchTimeout = setTimeout(() => renderCatalog(), 300);
}
window.updateSearch = function(e) {
  state.searchQuery = e.target.value;
  renderCatalog();
}
window.updateFilters = function() {
  const level = document.getElementById('select-level');
  const axis = document.getElementById('select-axis');
  const nature = document.getElementById('select-nature');
  const status = document.getElementById('select-status');
  if (level) state.filterLevel = level.value;
  if (axis) state.filterAxis = axis.value;
  if (nature) state.filterNature = nature.value;
  if (status) state.filterStatus = status.value;
  renderCatalog();
}
window.setBinding = function(value) {
  state.filterBinding = value;
  renderCatalog();
}
window.updateYearRange = function() {
  const minEl = document.getElementById('year-min');
  const maxEl = document.getElementById('year-max');
  let min = parseInt(minEl.value);
  let max = parseInt(maxEl.value);
  if (min > max) { const t = min; min = max; max = t; minEl.value = min; maxEl.value = max; }
  state.filterYearMin = min;
  state.filterYearMax = max;
  const label = document.getElementById('year-range-label');
  if (label) label.textContent = `${min} — ${max}`;
  clearTimeout(state._searchTimeout);
  state._searchTimeout = setTimeout(() => renderCatalog(), 200);
}
window.removeFilter = function(key) {
  if (key === 'filterYear') { state.filterYearMin = 1868; state.filterYearMax = 2025; }
  else if (key === 'searchQuery') { state.searchQuery = ''; }
  else { state[key] = 'Todos'; }
  renderCatalog();
}
window.syncFilterControls = function() {
  const ids = {level:'select-level', axis:'select-axis', nature:'select-nature', status:'select-status'};
  const vals = {level: state.filterLevel, axis: state.filterAxis, nature: state.filterNature, status: state.filterStatus};
  for (const [k, id] of Object.entries(ids)) {
    const el = document.getElementById(id);
    if (el) el.value = vals[k];
  }
  const minEl = document.getElementById('year-min');
  const maxEl = document.getElementById('year-max');
  if (minEl) minEl.value = state.filterYearMin;
  if (maxEl) maxEl.value = state.filterYearMax;
  const label = document.getElementById('year-range-label');
  if (label) label.textContent = `${state.filterYearMin} — ${state.filterYearMax}`;
  document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
  const activeToggle = document.querySelector(`.toggle-btn${state.filterBinding === 'Todos' ? ':first-child' : state.filterBinding === 'Hard Law' ? '.hard' : '.soft'}`);
  if (activeToggle) activeToggle.classList.add('active');
}
window.clearFilters = function() {
  state.filterLevel = 'Todos';
  state.filterAxis = 'Todos';
  state.filterNature = 'Todos';
  state.filterBinding = 'Todos';
  state.filterYearMin = 1868;
  state.filterYearMax = 2025;
  state.filterStatus = 'Todos';
  state.searchQuery = '';
  renderCatalog();
}

// NOVO: Manipulador do filtro da Linha do Tempo
window.updateTimelineFilter = function () {
  state.timelineFilter = document.getElementById('timeline-filter').value;
  renderTimeline();
}

// ==========================================================================
// Fase 8 — Knowledge Graph (Rede de Conexões)
// ==========================================================================
function renderGraph() {
  appContainer.innerHTML = `
    <div class="graph-view fade-in">
      <h2><i class="ph ph-graph"></i> Rede de Conexões Normativas</h2>
      <p class="dash-subtitle">Explore visualmente as referências cruzadas entre as normas. Arraste para mover, use o scroll para aplicar zoom e clique em um nó para ver os detalhes.</p>
      
      <div class="tl-legend" style="justify-content:center; margin-bottom:1.5rem;">
        <span class="tl-legend-item"><span class="tl-legend-dot" style="background:#2dd4bf"></span>Estadual</span>
        <span class="tl-legend-item"><span class="tl-legend-dot" style="background:#818cf8"></span>Federal</span>
        <span class="tl-legend-item"><span class="tl-legend-dot" style="background:#38bdf8"></span>Internacional</span>
        <span class="tl-legend-item"><span class="tl-legend-dot" style="background:#f59e0b"></span>Regional</span>
      </div>

      <div id="network-container"></div>
    </div>
  `;

  const nodes = [];
  const edges = [];

  const levelColor = (level) => {
    if (level.includes('Estadual')) return '#2dd4bf'; // Teal
    if (level.includes('Federal')) return '#818cf8'; // Indigo
    if (level.includes('Internacional')) return '#38bdf8'; // Sky Blue
    if (level.includes('Regional')) return '#f59e0b'; // Amber
    return '#94a3b8';
  };

  // Calcular o "peso" de cada norma para definir o tamanho da bolinha
  const nodeWeight = {};
  catalogData.forEach(n => {
    if (n.relatedIds) {
      n.relatedIds.forEach(targetId => {
        nodeWeight[targetId] = (nodeWeight[targetId] || 0) + 1; // Quantos apontam para ela
        nodeWeight[n.id] = (nodeWeight[n.id] || 0) + 0.5; // Bônus por ela apontar para outros
      });
    }
  });

  catalogData.forEach(n => {
    const tooltipEl = document.createElement('div');
    tooltipEl.innerHTML = `<div style="max-width:300px; white-space:pre-wrap; font-family:Inter,sans-serif;"><strong>${n.title}</strong><br><br>${n.theme} | Ano: ${n.year}<br><br><em style="color:#38bdf8; font-size:0.8rem;">Clique na bolinha para ler a ficha completa.</em></div>`;

    const weight = nodeWeight[n.id] || 0;
    const baseColor = levelColor(n.level);

    nodes.push({
      id: n.id,
      title: tooltipEl,
      value: weight, // vis.js usa 'value' para escalar dinamicamente o tamanho
      color: {
        background: baseColor,
        border: '#ffffff',
        highlight: { background: '#ffffff', border: baseColor }
      },
      originalColor: baseColor,
      shadow: {
        enabled: true,
        color: baseColor,
        size: 15,
        x: 0,
        y: 0
      }
    });

    if (n.relatedIds && n.relatedIds.length > 0) {
      n.relatedIds.forEach(targetId => {
        if (catalogData.some(x => x.id === targetId)) {
          edges.push({
            from: n.id,
            to: targetId,
            color: { color: 'rgba(255,255,255,0.15)', highlight: '#38bdf8' },
            arrows: { to: { enabled: true, scaleFactor: 0.5 } }
          });
        }
      });
    }
  });

  const container = document.getElementById('network-container');
  const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
  
  const options = {
    nodes: {
      shape: 'dot',
      scaling: {
        min: 10,
        max: 35,
        label: { enabled: false }
      },
      borderWidth: 2,
      borderWidthSelected: 4,
      shadow: {
        enabled: true,
        size: 15,
        x: 0,
        y: 0
      }
    },
    edges: {
      width: 1,
      color: { color: 'rgba(255,255,255,0.1)', highlight: 'rgba(255,255,255,0.6)', hover: 'rgba(255,255,255,0.3)' },
      smooth: { type: 'continuous' }
    },
    physics: {
      forceAtlas2Based: {
        gravitationalConstant: -50,
        centralGravity: 0.01,
        springLength: 100,
        springConstant: 0.08
      },
      maxVelocity: 50,
      solver: 'forceAtlas2Based',
      timestep: 0.35,
      stabilization: { iterations: 150 }
    },
    interaction: {
      hover: true,
      tooltipDelay: 200,
      zoomView: true
    }
  };

  const network = new vis.Network(container, data, options);

  // Desativa simulação física após estabilização para economizar CPU (Performance Phase 2)
  network.once("stabilizationIterationsDone", function () {
    network.setOptions({ physics: false });
  });

  // Efeitos de Hover para Focus
  network.on("hoverNode", function (params) {
    const hoveredNode = params.node;
    const connectedNodes = network.getConnectedNodes(hoveredNode);
    connectedNodes.push(hoveredNode);

    const updateArray = data.nodes.get().map(n => {
      if (!connectedNodes.includes(n.id)) {
        return { id: n.id, color: { background: 'rgba(255,255,255,0.05)', border: 'transparent' } };
      }
      return { id: n.id, shadow: { size: 30 } };
    });
    data.nodes.update(updateArray);
  });

  network.on("blurNode", function (params) {
    const updateArray = data.nodes.get().map(n => {
      return { id: n.id, color: { background: n.originalColor, border: '#ffffff' }, shadow: { size: 15 } };
    });
    data.nodes.update(updateArray);
  });

  network.on('click', function(params) {
    if (params.nodes.length > 0) {
      navigateTo('detail', params.nodes[0]);
    }
  });
}

// ==========================================================================
// Fase 6 — Comparador e Exportação
// ==========================================================================
window.toggleCompare = function(id) {
  const idx = state.selectedNorms.indexOf(id);
  if (idx > -1) {
    state.selectedNorms.splice(idx, 1);
  } else if (state.selectedNorms.length < 4) {
    state.selectedNorms.push(id);
  } else {
    return; // max 4
  }
  // Update card visual without full re-render
  const cards = document.querySelectorAll('.norm-card');
  cards.forEach(card => {
    const cb = card.querySelector('input[type=checkbox]');
    if (cb) {
      const checked = cb.checked;
      card.classList.toggle('card-selected', checked);
    }
  });
  updateCompareBar();
}

function updateCompareBar() {
  let bar = document.getElementById('compare-bar');
  const count = state.selectedNorms.length;
  if (count < 2) {
    if (bar) bar.classList.remove('visible');
    return;
  }
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'compare-bar';
    document.body.appendChild(bar);
  }
  bar.innerHTML = `
    <div class="compare-bar-inner">
      <span><i class="ph ph-scales"></i> <strong>${count}</strong> normas selecionadas</span>
      <div class="compare-bar-actions">
        <button onclick="navigateTo('compare')"><i class="ph ph-columns"></i> Comparar</button>
        <button onclick="exportSelectedABNT()"><i class="ph ph-quotes"></i> Citar ABNT</button>
        <button onclick="exportCSV()"><i class="ph ph-file-csv"></i> Exportar CSV</button>
        <button class="bar-clear" onclick="clearSelection()"><i class="ph ph-x"></i></button>
      </div>
    </div>
  `;
  bar.classList.add('visible');
}

window.clearSelection = function() {
  state.selectedNorms = [];
  document.querySelectorAll('.norm-card').forEach(c => {
    c.classList.remove('card-selected');
    const cb = c.querySelector('input[type=checkbox]');
    if (cb) cb.checked = false;
  });
  updateCompareBar();
}

function renderCompare() {
  const norms = state.selectedNorms.map(id => catalogData.find(n => n.id === id)).filter(Boolean);
  if (norms.length < 2) return navigateTo('catalog');

  const fields = [
    { key: 'year', label: 'Ano' },
    { key: 'level', label: 'Nível Jurisdicional' },
    { key: 'nature', label: 'Natureza Jurídica' },
    { key: 'bindingType', label: 'Força Vinculante', fn: n => {
      const isIntOrReg = n.level.toLowerCase().includes('internacional') || n.level.toLowerCase().includes('regional');
      return isIntOrReg ? (n.bindingType || 'Hard Law') : 'Não se aplica';
    } },
    { key: 'theme', label: 'Tema Principal' },
    { key: 'status', label: 'Status no Brasil' },
    { key: 'axis', label: 'Eixo Temático', fn: n => n.axis ? `${n.axis} — ${n.axisName || ''}` : '—' },
    { key: 'desc', label: 'Disposições Regulatórias' }
  ];

  const colW = Math.floor(100 / norms.length);

  const headerHtml = norms.map(n => `
    <th style="width:${colW}%">
      <span class="cmp-title">${n.title}</span>
      <button class="cmp-remove" onclick="removeFromCompare('${n.id}')" title="Remover"><i class="ph ph-x"></i></button>
    </th>
  `).join('');

  const rowsHtml = fields.map(f => {
    const vals = norms.map(n => f.fn ? f.fn(n) : (n[f.key] || '—'));
    const allSame = vals.every(v => v === vals[0]);
    return `
      <tr class="${allSame ? '' : 'cmp-diff'}">
        <td class="cmp-label">${f.label}</td>
        ${vals.map(v => `<td>${f.key === 'desc' ? `<div class="cmp-desc">${v}</div>` : v}</td>`).join('')}
      </tr>
    `;
  }).join('');

  appContainer.innerHTML = `
    <div class="compare-view fade-in">
      <button class="btn-back" onclick="navigateTo('catalog')"><i class="ph ph-arrow-left"></i> Voltar ao Repertório</button>
      <h2><i class="ph ph-columns"></i> Comparação de Normas</h2>
      <p class="cmp-subtitle">${norms.length} normas selecionadas para comparação. Campos com diferenças são destacados.</p>

      <div class="cmp-actions">
        <button onclick="exportSelectedABNT()"><i class="ph ph-quotes"></i> Copiar Citações ABNT</button>
        <button onclick="exportCSV()"><i class="ph ph-file-csv"></i> Exportar CSV</button>
        <button onclick="window.print()"><i class="ph ph-printer"></i> Imprimir</button>
      </div>

      <div class="cmp-table-wrap">
        <table class="cmp-table">
          <thead><tr><th class="cmp-label">Campo</th>${headerHtml}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </div>
  `;
}

window.removeFromCompare = function(id) {
  state.selectedNorms = state.selectedNorms.filter(x => x !== id);
  if (state.selectedNorms.length < 2) return navigateTo('catalog');
  renderCompare();
}

window.exportCSV = function() {
  const headers = ['ID','Título','Ano','Nível','Natureza','Força Vinculante','Tema','Status','Eixo','Descrição','Citação ABNT','Link'];
  const ids = state.selectedNorms.length > 0 ? state.selectedNorms : catalogData.map(n => n.id);
  const rows = ids.map(id => {
    const n = catalogData.find(x => x.id === id);
    if (!n) return null;
    const isIntOrReg = n.level.toLowerCase().includes('internacional') || n.level.toLowerCase().includes('regional');
    const bindingVal = isIntOrReg ? (n.bindingType || 'Hard Law') : 'Não se aplica';
    return [n.id, n.title, n.year, n.level, n.nature, bindingVal, n.theme, n.status, `${n.axis||''} - ${n.axisName||''}`, n.desc, n.citationABNT||'', n.fullLink||''];
  }).filter(Boolean);

  const escape = v => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(';'), ...rows.map(r => r.map(escape).join(';'))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'repertorio_normas.csv'; a.click();
  URL.revokeObjectURL(url);
}

window.exportSelectedABNT = function() {
  const ids = state.selectedNorms.length > 0 ? state.selectedNorms : [];
  if (ids.length === 0) return;
  const citations = ids.map(id => {
    const n = catalogData.find(x => x.id === id);
    return n?.citationABNT || '';
  }).filter(Boolean).join('\n\n');

  navigator.clipboard.writeText(citations).then(() => {
    // Feedback on the bar or the compare view
    const btn = document.querySelector('.compare-bar-actions button:nth-child(2)') || document.querySelector('.cmp-actions button:first-child');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="ph ph-check"></i> Copiado!';
      setTimeout(() => btn.innerHTML = orig, 2000);
    }
  });
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

// ==========================================================================
// Funções da Extensão Inferior (Dropdown de Busca na Home)
// ==========================================================================
window.showSearchDropdown = function() {
  const dropdown = document.getElementById('home-search-dropdown');
  const wrapper = document.querySelector('.hero-search-wrapper');
  if (dropdown) {
    dropdown.classList.remove('search-dropdown-hidden');
  }
  if (wrapper) {
    wrapper.classList.add('dropdown-active');
  }
}

window.hideSearchDropdownDelayed = function(e) {
  const dropdown = document.getElementById('home-search-dropdown');
  const wrapper = document.querySelector('.hero-search-wrapper');
  if (dropdown) {
    // Timeout para dar tempo de registrar o clique (onmousedown) nos itens do dropdown
    setTimeout(() => {
      // Evita fechar se o input ainda estiver em foco por algum motivo
      if (document.activeElement !== document.getElementById('home-search-input')) {
        dropdown.classList.add('search-dropdown-hidden');
        if (wrapper) {
          wrapper.classList.remove('dropdown-active');
        }
      }
    }, 200);
  }
}

window.submitHomeSearch = function(query) {
  state.searchQuery = query;
  navigateTo('catalog');
}

window.submitHomeSearchAxis = function(axis) {
  state.filterAxis = axis;
  navigateTo('catalog');
}

window.handleHomeSearchKey = function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const query = e.target.value.trim();
    state.searchQuery = query;
    navigateTo('catalog');
  }
}

// ==========================================================================
// Acessibilidade e Atalhos do Teclado
// ==========================================================================
document.addEventListener('keydown', (e) => {
  // Ctrl+K ou Cmd+K para focar o input de busca (Home ou Catálogo)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    const homeInput = document.getElementById('home-search-input');
    const catalogInput = document.getElementById('search-input');
    
    if (state.view === 'home' && homeInput) {
      homeInput.focus();
    } else if (state.view === 'catalog' && catalogInput) {
      catalogInput.focus();
    } else {
      navigateTo('catalog');
      setTimeout(() => {
        const catInput = document.getElementById('search-input');
        if (catInput) catInput.focus();
      }, 150);
    }
  }

  if (e.key === 'Escape') {
    // Fechar painel de detalhes
    if (state.view === 'detail') {
      navigateTo(state.backgroundView || 'catalog');
    }

    // Fechar dropdown de busca da Home se estiver focado
    const homeInput = document.getElementById('home-search-input');
    if (homeInput && document.activeElement === homeInput) {
      homeInput.blur();
      const dropdown = document.getElementById('home-search-dropdown');
      if (dropdown) dropdown.classList.add('search-dropdown-hidden');
    }

    const drawer = document.getElementById('nav-drawer');
    const btn = document.getElementById('mobile-menu-btn');
    if (drawer && drawer.classList.contains('open')) {
      drawer.classList.remove('open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      if (btn) btn.focus();
    }
    
    // Limpar busca se o acervo principal estiver focado
    const searchInput = document.getElementById('search-input');
    if (document.activeElement === searchInput) {
      searchInput.value = '';
      state.searchQuery = '';
      renderCatalog();
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('drawer-overlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      if (state.view === 'detail') {
        navigateTo(state.backgroundView || 'catalog');
      } else {
        closeDrawer();
      }
    });
  }
});

// Inicialização da Aplicação
// Lida com URL direta (ex: ?view=catalog)
const initialUrlParams = new URLSearchParams(window.location.search);
const initialView = initialUrlParams.get('view');
if (initialView) {
  const initialId = initialUrlParams.get('id');
  navigateTo(initialView, initialId, false);
} else {
  render();
  // Set initial state
  window.history.replaceState({ view: state.view, normId: null }, '', window.location.href);
}

// Global mouse tracking for Spotlight effect on cards
document.addEventListener('mousemove', e => {
  document.querySelectorAll('.norm-card, .stat-card').forEach(card => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });
});

// Counter Animation function
function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // Cubic-out easing for a smooth slowdown
    obj.innerHTML = Math.floor(ease * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      obj.innerHTML = end;
    }
  };
  window.requestAnimationFrame(step);
}

// ==========================================================================
// Gavetas Customizadas Premium (Substituição de alert() nativo)
// ==========================================================================
window.showAboutDrawer = function() {
  const drawerContent = document.getElementById('drawer-content-area');
  if (!drawerContent) return;
  
  state.backgroundView = state.view;
  
  drawerContent.innerHTML = `
    <button class="btn-close-drawer" aria-label="Fechar painel" onclick="closeDrawer()"><i class="ph ph-x"></i></button>
    
    <div class="breadcrumb" style="margin-bottom: 2rem;">
      <span style="color: var(--primary-color); font-weight: 600;">Institucional</span>
      <i class="ph ph-caret-right"></i>
      <span>Sobre o Projeto</span>
    </div>
    
    <h2 style="font-family: var(--font-serif); font-size: 2.2rem; color: #fff; margin-bottom: 1.5rem; line-height: 1.2;">Sobre o Projeto de Pesquisa</h2>
    
    <div class="meta-grid" style="grid-template-columns: 1fr; background: var(--glass-bg); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); border: 1px solid var(--glass-border); border-radius: 8px; padding: 1.5rem; gap: 1rem; margin-bottom: 2rem;">
      <div class="meta-item"><strong>Instituição:</strong> Universidade Federal de Sergipe (UFS)</div>
      <div class="meta-item"><strong>Programa:</strong> Programa Institucional de Bolsas de Iniciação Científica (PIBIC)</div>
      <div class="meta-item"><strong>Período de Levantamento:</strong> Acervo documental de normas atualizado até Maio de 2026.</div>
      <div class="meta-item"><strong>Escopo:</strong> 111 instrumentos jurídicos catalogados (Sergipe, Federal e Internacionais/Regionais) relativos ao uso da força e militarização da segurança pública.</div>
    </div>
    
    <h4 style="margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; color:var(--primary-color);">Objetivo e Metodologia</h4>
    <p style="font-size: 1.05rem; line-height: 1.8; color:var(--text-main); margin-bottom: 1.5rem;">
      O presente repositório acadêmico exaustivo tem como objetivo central catalogar, organizar e analisar sistematicamente a regulação jurídica e as tendências de militarização da segurança no Brasil e em Sergipe.
    </p>
    <p style="font-size: 1.05rem; line-height: 1.8; color:var(--text-main); margin-bottom: 1.5rem;">
      Toda a compilação documental obedece a um protocolo de rigor metodológico, registrando referências de legislação de "Hard Law" vinculantes e diretrizes de "Soft Law" que servem como parâmetros hermenêuticos para a atuação de forças de segurança e direitos humanos.
    </p>
    
    <div style="margin-top: 3rem; padding: 1.5rem; background: rgba(37, 99, 235, 0.1); border-left: 4px solid var(--primary-color); font-size: 0.9rem; border-radius:4px; color: #cbd5e1;">
      <strong>Nota Metodológica:</strong> Todas as informações fornecidas estão alinhadas com as pesquisas de graduação e pós-graduação vinculadas à Faculdade de Direito da UFS.
    </div>
  `;
  
  const drawer = document.getElementById('detail-drawer');
  if (drawer) {
    drawer.classList.remove('is-modal');
    openDrawer();
  }
}

window.showContactDrawer = function() {
  const drawerContent = document.getElementById('drawer-content-area');
  if (!drawerContent) return;
  
  state.backgroundView = state.view;
  
  drawerContent.innerHTML = `
    <button class="btn-close-drawer" aria-label="Fechar painel" onclick="closeDrawer()"><i class="ph ph-x"></i></button>
    
    <div class="breadcrumb" style="margin-bottom: 2rem;">
      <span style="color: var(--primary-color); font-weight: 600;">Institucional</span>
      <i class="ph ph-caret-right"></i>
      <span>Contato</span>
    </div>
    
    <h2 style="font-family: var(--font-serif); font-size: 2.2rem; color: #fff; margin-bottom: 1.5rem; line-height: 1.2;">Fale Conosco</h2>
    <p style="color: var(--text-muted); margin-bottom: 2rem; font-size: 0.95rem;">Entre em contato com o grupo de pesquisa do PIBIC na Universidade Federal de Sergipe.</p>
    
    <div style="background: var(--glass-bg); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); border: 1px solid var(--glass-border); border-radius: 12px; padding: 2rem; margin-bottom: 2rem;">
      <form id="drawer-contact-form" onsubmit="handleContactSubmit(event)" style="display: flex; flex-direction: column; gap: 1.2rem;">
        <div class="filter-group" style="margin-bottom: 0;">
          <label style="color:#fff; font-weight:500; font-size: 0.85rem; margin-bottom: 0.4rem;">Nome Completo</label>
          <input type="text" placeholder="Seu nome..." required style="width:100%; background: rgba(0,0,0,0.25); border: 1px solid var(--glass-border); border-radius: 8px; color: #fff; padding: 0.8rem 1rem; font-family:var(--font-sans); outline:none;">
        </div>
        
        <div class="filter-group" style="margin-bottom: 0;">
          <label style="color:#fff; font-weight:500; font-size: 0.85rem; margin-bottom: 0.4rem;">E-mail</label>
          <input type="email" placeholder="seuemail@exemplo.com" required style="width:100%; background: rgba(0,0,0,0.25); border: 1px solid var(--glass-border); border-radius: 8px; color: #fff; padding: 0.8rem 1rem; font-family:var(--font-sans); outline:none;">
        </div>
        
        <div class="filter-group" style="margin-bottom: 0;">
          <label style="color:#fff; font-weight:500; font-size: 0.85rem; margin-bottom: 0.4rem;">Mensagem</label>
          <textarea placeholder="Escreva sua mensagem aqui..." required rows="4" style="width: 100%; background: rgba(0,0,0,0.25); border: 1px solid var(--glass-border); border-radius: 8px; color: #fff; padding: 0.8rem 1rem; font-family: var(--font-sans); resize: none; outline:none;"></textarea>
        </div>
        
        <button class="btn-primary" type="submit" style="width: 100%; justify-content: center; margin-top: 0.5rem; padding: 0.8rem 1.5rem; border-radius: 8px; cursor:pointer;">
          <i class="ph ph-paper-plane-tilt"></i> Enviar Mensagem
        </button>
      </form>
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 0.75rem; color: var(--text-muted); font-size: 0.9rem;">
      <div style="display:flex; align-items:center; gap:0.5rem;"><i class="ph ph-envelope-simple" style="color: var(--primary-color); font-size:1.1rem;"></i> contato.pesquisa@ufs.br</div>
      <div style="display:flex; align-items:start; gap:0.5rem;"><i class="ph ph-map-pin" style="color: var(--primary-color); font-size:1.1rem; margin-top:0.1rem;"></i> Cidade Universitária Prof. José Aloísio de Campos, São Cristóvão - SE</div>
    </div>
  `;
  
  const drawer = document.getElementById('detail-drawer');
  if (drawer) {
    drawer.classList.remove('is-modal');
    openDrawer();
  }
}

window.handleContactSubmit = function(e) {
  e.preventDefault();
  const form = document.getElementById('drawer-contact-form');
  if (form) {
    form.innerHTML = `
      <div style="text-align: center; padding: 2rem 0; animation: fadeIn 0.4s ease;">
        <i class="ph ph-check-circle" style="font-size: 3.5rem; color: #22c55e; margin-bottom: 1rem; display: block;"></i>
        <h4 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.5rem; font-family:var(--font-serif);">Mensagem Enviada!</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.5;">Obrigado pelo contato. O grupo de pesquisa responderá a sua mensagem por e-mail em breve.</p>
      </div>
    `;
  }
}