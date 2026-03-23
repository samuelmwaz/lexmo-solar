// ── Injects sidebar + hamburger into any app page ──────
function renderShell(activePage) {
  var session = getSession();
  var isAdmin = session && session.role === 'SuperAdmin';

  var pages = [
    { id:'dashboard',      icon:'⊞',  label:'Dashboard',       section:'Overview'   },
    { id:'inventory',      icon:'📦', label:'Inventory',       section:'Operations' },
    { id:'crm',            icon:'👥', label:'CRM / Leads',     section:'Operations' },
    { id:'quotes',         icon:'📄', label:'Quote Builder',   section:'Operations' },
    { id:'accounting',     icon:'💰', label:'Accounting',      section:'Finance'    },
    { id:'performance',    icon:'🚀', label:'Performance',     section:'System'     },
  ];

  if (isAdmin) {
    pages.push({ id:'admin_control', icon:'🛡', label:'Admin Control', section:'Admin' });
  }

  // Group by section
  var sections = {};
  pages.forEach(function(p) {
    if (!sections[p.section]) sections[p.section] = [];
    sections[p.section].push(p);
  });

  // Build sidebar HTML — include user badge at top for mobile
  var userLine = '';
  if (session) {
    userLine = '<div style="padding:0 16px 16px;border-bottom:1px solid var(--border);margin-bottom:12px">' +
      '<div style="font-size:12px;color:var(--text);font-weight:600">' + session.first + ' ' + session.last + '</div>' +
      '<div style="font-size:10px;color:var(--accent);font-family:var(--mono)">' + session.role + '</div>' +
    '</div>';
  }

  var html = userLine;
  Object.keys(sections).forEach(function(sec) {
    html += '<div class="sidebar-section"><div class="sidebar-label">' + sec + '</div>';
    sections[sec].forEach(function(p) {
      var active = (p.id === activePage) ? ' active' : '';
      html += '<a href="' + p.id + '.html" class="nav-item' + active + '" data-page="' + p.id + '" onclick="closeSidebar()">' +
              '<span class="nav-icon">' + p.icon + '</span>' + p.label + '</a>';
    });
    html += '</div>';
  });

  var sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.innerHTML = html;

  // ── Inject hamburger into navbar ──────────────────────
  var navbar = document.querySelector('.navbar');
  if (navbar && !document.getElementById('hamburger-btn')) {
    var ham = document.createElement('button');
    ham.id = 'hamburger-btn';
    ham.className = 'hamburger';
    ham.innerHTML = '☰';
    ham.setAttribute('onclick', 'toggleSidebar()');
    ham.setAttribute('aria-label', 'Open menu');
    navbar.insertBefore(ham, navbar.firstChild);
  }

  // ── Inject overlay ────────────────────────────────────
  if (!document.getElementById('sidebar-overlay')) {
    var overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.className = 'sidebar-overlay';
    overlay.setAttribute('onclick', 'closeSidebar()');
    document.body.appendChild(overlay);
  }
}

function toggleSidebar() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  if (!sidebar) return;
  var isOpen = sidebar.classList.contains('open');
  if (isOpen) { closeSidebar(); } else { openSidebar(); }
}

function openSidebar() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.add('open');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}
