(function () {
  'use strict';

  var KEY = 'budget-app-v1';
  var NET_RATIO = 0.78; // estimation net = 78 % du brut

  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var INITIALES = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  var COULEURS = ['#1f7a6d', '#3d5a9e', '#c98a2b', '#8a5fa8', '#2e9bb5', '#b5566b', '#6f8f3a', '#7a6a5a'];

  var fmt0 = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  var fmt2 = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  var app = document.getElementById('app');
  var dlg = document.getElementById('expense-dialog');
  var expForm = document.getElementById('expense-form');
  var expError = document.getElementById('expense-error');

  /* ---------- Données ---------- */

  function defaults() {
    return {
      salary: { amount: 30000, type: 'net' },
      categories: [
        { id: 'logement', name: 'Logement', pct: 35, color: COULEURS[0] },
        { id: 'courses', name: 'Courses', pct: 15, color: COULEURS[1] },
        { id: 'transport', name: 'Transport', pct: 10, color: COULEURS[2] },
        { id: 'loisirs', name: 'Loisirs', pct: 10, color: COULEURS[3] },
        { id: 'epargne', name: 'Épargne', pct: 20, color: COULEURS[4] },
        { id: 'autres', name: 'Autres', pct: 10, color: COULEURS[5] }
      ],
      expenses: []
    };
  }

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && d.salary && Array.isArray(d.categories) && Array.isArray(d.expenses)) return d;
      }
    } catch (e) { /* stockage indisponible : on repart des valeurs par défaut */ }
    return defaults();
  }

  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignoré */ }
  }

  var state = load();
  var view = 'month';
  var now = new Date();
  var cursor = { y: now.getFullYear(), m: now.getMonth() };

  /* ---------- Utilitaires ---------- */

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function ym(y, m) { return y + '-' + pad(m + 1); }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function eur(n) { return fmt0.format(n); }
  function eur2(n) { return fmt2.format(n); }
  function toNumber(v) { var n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : NaN; }

  function total(list) {
    return list.reduce(function (s, e) { return s + e.amount; }, 0);
  }

  function annualNet() {
    var s = state.salary;
    return s.type === 'brut' ? s.amount * NET_RATIO : s.amount;
  }
  function monthlyIncome() { return annualNet() / 12; }

  function expensesOfMonth(y, m) {
    var key = ym(y, m);
    return state.expenses.filter(function (e) { return e.date.slice(0, 7) === key; });
  }

  function catById(id) {
    for (var i = 0; i < state.categories.length; i++) {
      if (state.categories[i].id === id) return state.categories[i];
    }
    return null;
  }

  /* ---------- Éléments d'interface ---------- */

  function periodHeader(label, prev, next) {
    return '<header class="period">' +
      '<button type="button" class="icon-btn" data-action="' + prev + '" aria-label="Période précédente">‹</button>' +
      '<h1>' + esc(label) + '</h1>' +
      '<button type="button" class="icon-btn" data-action="' + next + '" aria-label="Période suivante">›</button>' +
      '</header>';
  }

  function catRow(name, color, spent, budget) {
    var over = spent > budget + 0.005;
    var ratio = budget > 0 ? spent / budget : (spent > 0 ? 1 : 0);
    var width = Math.min(100, ratio * 100);
    return '<li class="cat">' +
      '<div class="cat-top">' +
      '<span class="dot" style="background:' + color + '"></span>' +
      '<span class="cat-name">' + esc(name) + '</span>' +
      '<span class="cat-amt' + (over ? ' over' : '') + '">' + eur(spent) + ' <small>/ ' + eur(budget) + '</small></span>' +
      '</div>' +
      '<div class="bar"><span' + (over ? ' class="over"' : '') + ' style="width:' + width + '%;background:' + color + '"></span></div>' +
      '</li>';
  }

  /* ---------- Camembert (anneau) des dépenses ---------- */

  function donutCard(list, income, spent) {
    var parts = [];
    state.categories.forEach(function (c) {
      var s = total(list.filter(function (e) { return e.catId === c.id; }));
      if (s > 0) parts.push({ name: c.name, color: c.color, value: s });
    });
    var orphans = total(list.filter(function (e) { return !catById(e.catId); }));
    if (orphans > 0) parts.push({ name: 'Sans catégorie', color: '#8793a3', value: orphans });

    var left = income - spent;
    var denom = Math.max(income, spent, 1);
    var R = 52, C = 2 * Math.PI * R;
    var segs = parts.slice();
    if (left > 0) segs.push({ name: 'Reste', color: '#e1e8e6', value: left, rest: true });

    var svg = '<svg class="donut" viewBox="0 0 140 140" role="img" aria-label="Répartition des dépenses du mois par catégorie">' +
      '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="#e1e8e6" stroke-width="22"></circle>';
    var acc = 0;
    segs.forEach(function (p) {
      var len = p.value / denom * C;
      svg += '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="' + p.color + '" stroke-width="22"' +
        ' stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '"' +
        ' stroke-dashoffset="' + (-acc).toFixed(2) + '" transform="rotate(-90 70 70)"></circle>';
      acc += len;
    });
    svg += '<text x="70" y="68" text-anchor="middle" class="donut-val">' + eur(spent) + '</text>' +
      '<text x="70" y="84" text-anchor="middle" class="donut-lbl">Dépensé</text></svg>';

    var share = income > 0 ? Math.round(spent / income * 100) : 0;
    var h = '<section class="card"><div class="card-head"><h2>Répartition des dépenses</h2>' +
      '<span class="share' + (share > 100 ? ' over' : '') + '">' + share + ' %</span></div>';
    if (!parts.length) {
      h += '<div class="donut-wrap">' + svg + '<p class="empty">Aucune dépense ce mois-ci.</p></div>';
    } else {
      h += '<div class="donut-wrap">' + svg + '<ul class="legend-list">';
      segs.forEach(function (p) {
        var pct = income > 0 ? Math.round(p.value / income * 100) : 0;
        h += '<li><span class="dot" style="background:' + p.color + '"></span>' +
          '<span class="lg-name">' + esc(p.name) + '</span><span class="lg-pct">' + pct + ' %</span></li>';
      });
      h += '</ul></div>';
    }
    return h + '</section>';
  }

  /* ---------- Vue Mois ---------- */

  function renderMonth() {
    var list = expensesOfMonth(cursor.y, cursor.m).sort(function (a, b) {
      return b.date.localeCompare(a.date);
    });
    var income = monthlyIncome();
    var spent = total(list);
    var left = income - spent;
    var pctSpent = income > 0 ? Math.min(100, spent / income * 100) : 0;
    var h = '';

    h += periodHeader(MOIS[cursor.m] + ' ' + cursor.y, 'prevm', 'nextm');

    h += '<section class="hero' + (left < 0 ? ' over' : '') + '">' +
      '<p class="hero-label">' + (left < 0 ? 'Dépassement du mois' : 'Reste à dépenser') + '</p>' +
      '<p class="hero-value">' + eur(Math.abs(left)) + '</p>' +
      '<div class="meter"><span style="width:' + pctSpent + '%"></span></div>' +
      '<dl class="hero-meta">' +
      '<div><dt>Revenu du mois</dt><dd>' + eur(income) + '</dd></div>' +
      '<div><dt>Dépensé</dt><dd>' + eur(spent) + '</dd></div>' +
      '</dl></section>';

    h += donutCard(list, income, spent);

    h += '<section class="card"><h2>Budgets du mois</h2><ul class="cats">';
    state.categories.forEach(function (c) {
      var s = total(list.filter(function (e) { return e.catId === c.id; }));
      h += catRow(c.name, c.color, s, income * c.pct / 100);
    });
    var orphans = list.filter(function (e) { return !catById(e.catId); });
    if (orphans.length) h += catRow('Sans catégorie', '#8793a3', total(orphans), 0);
    h += '</ul>';
    if (!state.categories.length) {
      h += '<p class="empty">Aucune catégorie. Créez-en dans l’onglet Année.</p>';
    }
    h += '</section>';

    h += '<section class="card"><div class="card-head"><h2>Dépenses</h2>' +
      '<button type="button" class="btn" data-action="add">Ajouter une dépense</button></div>';
    if (list.length) {
      h += '<ul class="exp">';
      list.forEach(function (e) {
        var c = catById(e.catId);
        h += '<li>' +
          '<span class="exp-date">' + esc(e.date.slice(8, 10) + '/' + e.date.slice(5, 7)) + '</span>' +
          '<span class="exp-label">' + esc(e.label) + '<span class="exp-cat">' + esc(c ? c.name : 'Sans catégorie') + '</span></span>' +
          '<span class="exp-amt">' + eur2(e.amount) + '</span>' +
          '<button type="button" class="icon-btn" data-action="delexp" data-id="' + esc(e.id) + '" aria-label="Supprimer la dépense ' + esc(e.label) + '">×</button>' +
          '</li>';
      });
      h += '</ul>';
    } else {
      h += '<p class="empty">Aucune dépense ce mois-ci. Ajoutez la première pour suivre vos budgets.</p>';
    }
    h += '</section>';

    return h;
  }

  /* ---------- Vue Année ---------- */

  function chartSvg(byMonth, income) {
    var W = 320, H = 150, left = 8, right = 8, top = 12, bottom = 22;
    var max = Math.max(income, Math.max.apply(null, byMonth), 1) * 1.1;
    var plotH = H - top - bottom;
    var step = (W - left - right) / 12;
    var bw = step * 0.62;
    var yOf = function (v) { return top + plotH - (v / max) * plotH; };
    var s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Dépenses mensuelles comparées au revenu mensuel">';
    byMonth.forEach(function (v, i) {
      var x = left + i * step + (step - bw) / 2;
      var y = yOf(v);
      var over = v > income + 0.005;
      s += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(0, top + plotH - y).toFixed(1) +
        '" rx="3" fill="' + (over ? '#c23b4e' : '#1f7a6d') + '"></rect>';
      s += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + INITIALES[i] + '</text>';
    });
    var ly = yOf(income).toFixed(1);
    s += '<line x1="' + left + '" x2="' + (W - right) + '" y1="' + ly + '" y2="' + ly + '" stroke="#17233b" stroke-width="1.5" stroke-dasharray="4 3"></line>';
    s += '</svg>';
    return s;
  }

  function renderYear() {
    var y = cursor.y;
    var income = monthlyIncome();
    var byMonth = [];
    var yearList = [];
    for (var i = 0; i < 12; i++) {
      var l = expensesOfMonth(y, i);
      byMonth.push(total(l));
      yearList = yearList.concat(l);
    }
    var pctTotal = state.categories.reduce(function (s, c) { return s + c.pct; }, 0);
    var h = '';

    h += periodHeader(String(y), 'prevy', 'nexty');

    // Salaire
    h += '<section class="card"><h2>Salaire annuel</h2>' +
      '<div class="salary-row">' +
      '<label class="field"><span>Type</span><select data-change="salary-type">' +
      '<option value="net"' + (state.salary.type === 'net' ? ' selected' : '') + '>Net</option>' +
      '<option value="brut"' + (state.salary.type === 'brut' ? ' selected' : '') + '>Brut</option>' +
      '</select></label>' +
      '<label class="field"><span>Montant par an (€)</span>' +
      '<input type="number" inputmode="decimal" min="0" step="100" value="' + state.salary.amount + '" data-change="salary-amount"></label>' +
      '</div>' +
      '<dl class="stats">' +
      '<div><dt>Net par an</dt><dd>' + eur(annualNet()) + '</dd></div>' +
      '<div><dt>Net par mois</dt><dd>' + eur(income) + '</dd></div>' +
      '</dl>' +
      (state.salary.type === 'brut' ? '<p class="hint">Le net est estimé à 78 % du brut. Saisissez votre salaire net pour plus de précision.</p>' : '') +
      '</section>';

    // Graphique
    h += '<section class="card"><h2>Dépenses de ' + y + '</h2>' + chartSvg(byMonth, income) +
      '<div class="legend"><span>Dépensé par mois</span><span class="line">Revenu mensuel</span></div></section>';

    // Répartition
    h += '<section class="card"><h2>Répartition du salaire</h2><ul class="alloc">';
    state.categories.forEach(function (c) {
      h += '<li>' +
        '<span class="dot" style="background:' + c.color + '"></span>' +
        '<span class="alloc-name">' + esc(c.name) + '<span class="alloc-eur">' + eur(income * c.pct / 100) + ' par mois</span></span>' +
        '<label class="pct"><input type="number" inputmode="numeric" min="0" max="100" step="1" value="' + c.pct + '" data-change="pct" data-id="' + esc(c.id) + '" aria-label="Part de ' + esc(c.name) + ' en pourcentage"><span>%</span></label>' +
        '<button type="button" class="icon-btn" data-action="delcat" data-id="' + esc(c.id) + '" aria-label="Supprimer la catégorie ' + esc(c.name) + '">×</button>' +
        '</li>';
    });
    h += '</ul>';
    var diff = Math.round((100 - pctTotal) * 100) / 100;
    if (diff === 0) {
      h += '<p class="total">Total : 100 %. Tout votre salaire est réparti.</p>';
    } else if (diff > 0) {
      h += '<p class="total warn">Total : ' + pctTotal + ' %. Il reste ' + diff + ' % à répartir.</p>';
    } else {
      h += '<p class="total warn">Total : ' + pctTotal + ' %. Vous dépassez de ' + Math.abs(diff) + ' %.</p>';
    }
    h += '<form class="inline-form" data-form="addcat">' +
      '<input type="text" name="name" maxlength="30" placeholder="Nouvelle catégorie" aria-label="Nom de la nouvelle catégorie" required>' +
      '<button type="submit" class="btn">Ajouter</button></form>';
    h += '</section>';

    // Bilan annuel par catégorie
    h += '<section class="card"><h2>Bilan ' + y + ' par catégorie</h2><ul class="year-table">' +
      '<li class="col-head"><span>Catégorie</span><span class="num">Budget</span><span class="num">Dépensé</span></li>';
    state.categories.forEach(function (c) {
      var s = total(yearList.filter(function (e) { return e.catId === c.id; }));
      var b = income * 12 * c.pct / 100;
      h += '<li><span>' + esc(c.name) + '</span><span class="num">' + eur(b) + '</span>' +
        '<span class="num' + (s > b + 0.005 ? ' over' : '') + '">' + eur(s) + '</span></li>';
    });
    var orphans = yearList.filter(function (e) { return !catById(e.catId); });
    if (orphans.length) {
      h += '<li><span>Sans catégorie</span><span class="num">' + eur(0) + '</span><span class="num over">' + eur(total(orphans)) + '</span></li>';
    }
    h += '<li><strong>Total</strong><span class="num"><strong>' + eur(income * 12) + '</strong></span><span class="num"><strong>' + eur(total(yearList)) + '</strong></span></li>';
    h += '</ul></section>';

    return h;
  }

  /* ---------- Affichage ---------- */

  function render() {
    app.innerHTML = view === 'month' ? renderMonth() : renderYear();
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('data-view') === view) tabs[i].setAttribute('aria-current', 'page');
      else tabs[i].removeAttribute('aria-current');
    }
  }

  /* ---------- Fenêtre d'ajout ---------- */

  function openDialog() {
    var f = expForm.elements;
    var sel = f.cat;
    sel.innerHTML = '';
    if (!state.categories.length) {
      sel.innerHTML = '<option value="">Sans catégorie</option>';
    } else {
      state.categories.forEach(function (c) {
        var o = document.createElement('option');
        o.value = c.id;
        o.textContent = c.name;
        sel.appendChild(o);
      });
    }
    f.amount.value = '';
    f.label.value = '';
    var t = new Date();
    f.date.value = (cursor.y === t.getFullYear() && cursor.m === t.getMonth())
      ? todayStr()
      : ym(cursor.y, cursor.m) + '-01';
    expError.hidden = true;
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
    f.amount.focus();
  }

  function closeDialog() {
    if (typeof dlg.close === 'function') dlg.close();
    else dlg.removeAttribute('open');
  }

  /* ---------- Événements ---------- */

  document.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-action]') : null;
    if (!t) return;
    var a = t.getAttribute('data-action');
    var id = t.getAttribute('data-id');

    if (a === 'tab') {
      view = t.getAttribute('data-view');
      render();
      window.scrollTo(0, 0);
    } else if (a === 'prevm') {
      cursor.m--; if (cursor.m < 0) { cursor.m = 11; cursor.y--; }
      render();
    } else if (a === 'nextm') {
      cursor.m++; if (cursor.m > 11) { cursor.m = 0; cursor.y++; }
      render();
    } else if (a === 'prevy') {
      cursor.y--; render();
    } else if (a === 'nexty') {
      cursor.y++; render();
    } else if (a === 'add') {
      openDialog();
    } else if (a === 'cancel') {
      closeDialog();
    } else if (a === 'delexp') {
      state.expenses = state.expenses.filter(function (e) { return e.id !== id; });
      save(); render();
    } else if (a === 'delcat') {
      var c = catById(id);
      if (c && window.confirm('Supprimer la catégorie « ' + c.name + ' » ? Ses dépenses passeront en « Sans catégorie ».')) {
        state.categories = state.categories.filter(function (x) { return x.id !== id; });
        save(); render();
      }
    }
  });

  document.addEventListener('change', function (ev) {
    var t = ev.target;
    var k = t.getAttribute ? t.getAttribute('data-change') : null;
    if (!k) return;

    if (k === 'salary-type') {
      state.salary.type = t.value === 'brut' ? 'brut' : 'net';
    } else if (k === 'salary-amount') {
      var v = toNumber(t.value);
      state.salary.amount = isNaN(v) || v < 0 ? 0 : v;
    } else if (k === 'pct') {
      var c = catById(t.getAttribute('data-id'));
      var p = toNumber(t.value);
      if (c) c.pct = isNaN(p) ? 0 : Math.max(0, Math.min(100, p));
    }
    save(); render();
  });

  document.addEventListener('submit', function (ev) {
    var form = ev.target;
    if (form.getAttribute && form.getAttribute('data-form') === 'addcat') {
      ev.preventDefault();
      var name = form.elements.name.value.trim();
      if (!name) return;
      state.categories.push({
        id: uid(),
        name: name,
        pct: 0,
        color: COULEURS[state.categories.length % COULEURS.length]
      });
      save(); render();
    }
  });

  expForm.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var f = expForm.elements;
    var amount = toNumber(f.amount.value);
    if (isNaN(amount) || amount <= 0) {
      expError.textContent = 'Saisissez un montant supérieur à 0.';
      expError.hidden = false;
      f.amount.focus();
      return;
    }
    var date = f.date.value || todayStr();
    state.expenses.push({
      id: uid(),
      date: date,
      catId: f.cat.value,
      label: f.label.value.trim() || 'Dépense',
      amount: Math.round(amount * 100) / 100
    });
    save();
    cursor.y = parseInt(date.slice(0, 4), 10);
    cursor.m = parseInt(date.slice(5, 7), 10) - 1;
    view = 'month';
    closeDialog();
    render();
  });

  dlg.addEventListener('click', function (ev) {
    if (ev.target === dlg) closeDialog(); // clic sur le fond
  });

  /* ---------- Démarrage ---------- */

  try {
    render();
  } catch (err) {
    app.innerHTML = '<p class="loading">Une erreur est survenue : ' + esc(err && err.message ? err.message : err) + '</p>';
  }
})();
