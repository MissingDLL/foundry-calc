function toggleSection(header) {
  header.classList.toggle('collapsed');
  const body = header.nextElementSibling;
  body.classList.toggle('collapsed');
}

function toggleRecipeRow(id) {
  const row = document.getElementById(id);
  const arrow = document.getElementById('arr_' + id);
  if (!row) return;
  row.classList.toggle('collapsed');
  if (arrow) arrow.classList.toggle('open');
}

// ============================================================
// TABS
// ============================================================
function toggleSidebar() {
  const container = document.querySelector('.container');
  const isCollapsed = container.classList.toggle('sidebar-collapsed');
  localStorage.setItem('sidebarCollapsed', isCollapsed ? '1' : '0');
}

// Restore sidebar state on load
(function() {
  if (localStorage.getItem('sidebarCollapsed') === '1') {
    document.querySelector('.container').classList.add('sidebar-collapsed');
  }
})();

function switchSidebarView(mode) {
  const isBots = mode === 'bots';
  const isRecipes = mode === 'recipes';

  document.getElementById('sidebar-bots').style.display = isBots ? 'flex' : 'none';
  document.getElementById('sidebar-recipes').style.display = isRecipes ? 'flex' : 'none';

  const activeStyle = { bg: 'rgba(10,132,255,0.18)', color: '#0a84ff' };
  const inactiveStyle = { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.40)' };

  [
    { id: 'toggleBotBtn', active: isBots },
    { id: 'toggleRecipeBtn', active: isRecipes },
  ].forEach(function (item) {
    const el = document.getElementById(item.id);
    el.style.background = item.active ? activeStyle.bg : inactiveStyle.bg;
    el.style.color = item.active ? activeStyle.color : inactiveStyle.color;
  });

  const tabName = isBots ? 'overview' : 'recipes';
  const tabEl = document.querySelector('.tab[onclick*="\'' + tabName + '\'"]');
  if (tabEl) showTab(tabName, tabEl);
}
function fmt(n) {
  if (n === 0) return "-";
  if (Number.isInteger(n)) return n.toLocaleString("de");
  return n.toLocaleString("de", { maximumFractionDigits: 2 });
}


// ============================================================
// MAIN TAB SWITCHING
// ============================================================
// Current viz mode (sankey | boxes)
let _currentVizMode = 'sankey';

function switchVizMode(mode) {
  _currentVizMode = mode;
  const isSankey = mode === 'sankey';

  document.getElementById('tab-sankey').style.display = isSankey ? 'flex' : 'none';
  document.getElementById('tab-boxes').style.display  = isSankey ? 'none'  : 'flex';

  const activeStyle   = { background: 'rgba(255,255,255,0.18)', boxShadow: '0 2px 8px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.92)' };
  const inactiveStyle = { background: 'transparent', boxShadow: 'none', color: 'rgba(255,255,255,0.40)' };
  Object.assign(document.getElementById('vizBtnSankey').style, isSankey  ? activeStyle : inactiveStyle);
  Object.assign(document.getElementById('vizBtnBoxes').style,  !isSankey ? activeStyle : inactiveStyle);

  if (isSankey) {
    requestAnimationFrame(() => requestAnimationFrame(renderSankey));
  } else {
    requestAnimationFrame(() => requestAnimationFrame(renderBoxes));
  }
}

function switchMainTab(tab) {
  const isRecipes   = tab === 'recipes';
  const isVisualize = tab === 'visualize';

  const recipesEl   = document.getElementById('tab-recipes');
  const vizEl       = document.getElementById('tab-visualize');

  recipesEl.style.display = isRecipes   ? 'block' : 'none';
  vizEl.style.display     = isVisualize ? 'flex'  : 'none';

  const incoming = isRecipes ? recipesEl : vizEl;
  incoming.style.animation = 'none';
  incoming.offsetHeight;
  incoming.style.animation = 'tabContentIn 0.32s cubic-bezier(0.22,1,0.36,1) both';

  const isLight = document.documentElement.style.getPropertyValue('--text').trim() === '#1d1d1f';
  const inactiveColor = isLight ? '#6e6e73' : 'rgba(255,255,255,0.40)';
  const ab = { borderBottomColor: 'var(--accent)', color: 'var(--accent)'  };
  const ib = { borderBottomColor: 'transparent',   color: inactiveColor    };
  Object.assign(document.getElementById('mainTabBtnRecipes').style,   isRecipes   ? ab : ib);
  Object.assign(document.getElementById('mainTabBtnVisualize').style, isVisualize ? ab : ib);

  if (isVisualize) {
    // Render whichever sub-view is active
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (_currentVizMode === 'sankey') renderSankey();
      else renderBoxes();
    }));
  }
}

// ============================================================
// SANKEY — Datenaufbau
// ============================================================
