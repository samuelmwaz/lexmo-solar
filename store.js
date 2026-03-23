// ═══════════════════════════════════════════════════════
//  LEXMO SOLAR — SHARED STORE  v3
// ═══════════════════════════════════════════════════════

const KEYS = {
  users:        'lx_users',
  employees:    'lx_employees',
  session:      'lx_session',
  inventory:    'lx_inventory',
  leads:        'lx_leads',
  transactions: 'lx_transactions',
  eventLog:     'lx_eventLog',
  nextId:       'lx_nextId',
};

const DEFAULTS = {
  users: [
    // Super Admin — login: admin1234 / admin1234
    { id:1, first:'Admin', last:'Lexmo', email:'admin1234',
      phone:'+260 977 000 000', role:'SuperAdmin', password:'admin1234',
      isAdmin:true, created:'2025-01-01T00:00:00.000Z' },
    // Default staff account
    { id:2, first:'Samuel', last:'Mwale', email:'admin@lexmosolar.co.zm',
      phone:'+260 977 000 001', role:'Admin', password:'Solar2024!',
      isAdmin:false, created:'2025-01-01T00:00:00.000Z' }
  ],
  employees: [],
  inventory: [
    { id:1, name:'Hybrid Pump',       category:'Water Systems', specs:'1.5kW Solar/DC', price:4500, qty:12, min:4 },
    { id:2, name:'Lithium Battery',   category:'Storage',       specs:'5kWh',            price:8000, qty:3,  min:5 },
    { id:3, name:'Solar Panel 300W',  category:'Generation',    specs:'300W, 12V Mono',  price:1200, qty:8,  min:5 },
    { id:4, name:'Charge Controller', category:'Control',       specs:'40A MPPT',        price:750,  qty:5,  min:3 },
  ],
  leads: [
    { id:1, name:'Mwamba Farms',      phone:'+260 977 001 234', location:'Lusaka', stage:'Quoted',      product:'Hybrid Pump x3', value:13500 },
    { id:2, name:'Chanda Mulenga',    phone:'+260 966 444 123', location:'Kitwe',  stage:'Prospect',    product:'Battery System',  value:8000  },
    { id:3, name:'Ngosa Enterprises', phone:'+260 955 876 543', location:'Ndola',  stage:'Negotiating', product:'Full Solar Kit',   value:35000 },
  ],
  transactions: [
    { id:1, desc:'Payment – Mwamba Farms', type:'Income',  amount:13500, date:'2025-05-10', status:'Paid'    },
    { id:2, desc:'Panel Stock Purchase',   type:'Expense', amount:9600,  date:'2025-05-08', status:'Paid'    },
    { id:3, desc:'Invoice #023 – Chanda',  type:'Income',  amount:8000,  date:'2025-05-15', status:'Pending' },
    { id:4, desc:'Freight – Batteries',    type:'Expense', amount:1200,  date:'2025-05-12', status:'Paid'    },
  ],
  eventLog: [
    '[2025-06-01 08:12] System boot — all modules initialised',
    '[2025-06-01 08:13] Background sync enabled — Lusaka network detected',
    '[2025-06-01 09:05] Inventory: Lithium Battery qty → 3 (LOW STOCK)',
    '[2025-06-01 10:22] Duplicate check passed — 0 found',
  ],
  nextId: 200,
};

// ── Seed defaults on first run ────────────────────────
(function seed() {
  Object.keys(DEFAULTS).forEach(function(key) {
    if (localStorage.getItem(KEYS[key]) === null) {
      localStorage.setItem(KEYS[key], JSON.stringify(DEFAULTS[key]));
    }
  });
})();

// ── Read ──────────────────────────────────────────────
function storeGet(key) {
  try {
    var raw = localStorage.getItem(KEYS[key]);
    if (raw !== null) return JSON.parse(raw);
    var def = DEFAULTS[key];
    return def !== undefined ? JSON.parse(JSON.stringify(def)) : null;
  } catch(e) {
    var def2 = DEFAULTS[key];
    return def2 !== undefined ? JSON.parse(JSON.stringify(def2)) : null;
  }
}

// ── Write + broadcast ─────────────────────────────────
function storeSet(key, value) {
  try {
    localStorage.setItem(KEYS[key], JSON.stringify(value));
    try {
      var bc = new BroadcastChannel('lx_sync');
      bc.postMessage({ key: key, ts: Date.now() });
      bc.close();
    } catch(e) {}
  } catch(e) {}
}

// ── Session ───────────────────────────────────────────
function getSession() {
  try { return JSON.parse(localStorage.getItem(KEYS.session)); } catch(e) { return null; }
}
function saveSession(user) {
  localStorage.setItem(KEYS.session, JSON.stringify(user));
}
function clearSessionData() {
  localStorage.removeItem(KEYS.session);
}

// ── Users ─────────────────────────────────────────────
function getUsers() {
  return storeGet('users') || [];
}
function saveUsers(users) {
  storeSet('users', users);
}

// ── Auth guard ────────────────────────────────────────
function requireAuth() {
  var s = getSession();
  if (!s) { window.location.href = 'auth.html'; return null; }
  return s;
}

// Redirect non-admins away from admin page
function requireAdmin() {
  var s = requireAuth();
  if (!s) return null;
  if (s.role !== 'SuperAdmin') {
    window.location.href = 'dashboard.html';
    return null;
  }
  return s;
}

// ── ID generator ──────────────────────────────────────
function getNextId() {
  var id = storeGet('nextId') || 200;
  storeSet('nextId', id + 1);
  return id;
}

// ── Event log ─────────────────────────────────────────
function logEvent(msg) {
  var now = new Date();
  var ts = '[' + now.toISOString().slice(0,10) + ' ' + now.toTimeString().slice(0,5) + ']';
  var log = storeGet('eventLog') || [];
  log.unshift(ts + ' ' + msg);
  if (log.length > 60) log.pop();
  storeSet('eventLog', log);
}

// ── Navbar init ───────────────────────────────────────
function initNavbar() {
  var session = requireAuth();
  if (!session) return;

  var nameEl = document.getElementById('nav-username');
  var roleEl = document.getElementById('nav-role');
  if (nameEl) nameEl.textContent = session.first + ' ' + session.last;
  if (roleEl) roleEl.textContent = session.role;

  function tick() {
    var cl = document.getElementById('clock');
    if (cl) cl.textContent = new Date().toLocaleTimeString('en-ZM', {hour:'2-digit', minute:'2-digit'});
  }
  setInterval(tick, 1000); tick();

  window.addEventListener('offline', function() {
    var b = document.getElementById('offline-banner');
    if (b) b.style.display = 'block';
    var dot = document.querySelector('.online-dot');
    if (dot) dot.style.background = 'var(--danger)';
    var cs = document.getElementById('conn-status');
    if (cs) cs.textContent = 'Offline';
    toast('⚠ Connection lost — offline mode active');
  });
  window.addEventListener('online', function() {
    var b = document.getElementById('offline-banner');
    if (b) b.style.display = 'none';
    var dot = document.querySelector('.online-dot');
    if (dot) dot.style.background = 'var(--accent)';
    var cs = document.getElementById('conn-status');
    if (cs) cs.textContent = 'Online';
    toast('✓ Reconnected');
  });

  try {
    var bc = new BroadcastChannel('lx_sync');
    bc.onmessage = function(e) {
      if (typeof onStoreUpdate === 'function') onStoreUpdate(e.data.key);
    };
  } catch(e) {}
}

// ── Logout ────────────────────────────────────────────
function doLogout() {
  clearSessionData();
  window.location.href = 'auth.html';
}

// ── Toast ─────────────────────────────────────────────
function toast(msg, type) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.borderColor = (type === 'err') ? 'var(--danger)' : 'var(--accent)';
  t.style.color       = (type === 'err') ? 'var(--danger)' : 'var(--accent)';
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(function() { t.classList.remove('show'); }, 2800);
}

// ── Modal helpers ─────────────────────────────────────
function openModal(id) { var el = document.getElementById(id); if (el) el.classList.add('open'); }
function closeModal(id) { var el = document.getElementById(id); if (el) el.classList.remove('open'); }
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.modal-overlay').forEach(function(m) {
    m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('open'); });
  });
});
