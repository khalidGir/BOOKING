import type { Request, Response } from 'express';

export function serveEmbedPage(req: Request, res: Response): void {
  const slug = String(req.params.slug);
  const theme = String(req.query.theme ?? 'light');

  const isDark = theme === 'dark';

  const bg = isDark ? '#1a1a2e' : '#ffffff';
  const fg = isDark ? '#e0e0e0' : '#1a1a2e';
  const card = isDark ? '#16213e' : '#f8f9fa';
  const accent = '#6c3aed';
  const border = isDark ? '#2a2a4a' : '#e2e8f0';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Book an Appointment</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: ${bg}; color: ${fg};
    padding: 16px; line-height: 1.5;
  }
  .step { display: none; }
  .step.active { display: block; }
  h2 { font-size: 1.125rem; margin-bottom: 12px; }
  .card {
    background: ${card}; border: 1px solid ${border};
    border-radius: 8px; padding: 12px; margin-bottom: 8px;
    cursor: pointer; transition: all 0.15s;
  }
  .card:hover { border-color: ${accent}; }
  .card.selected { border-color: ${accent}; box-shadow: 0 0 0 2px ${accent}40; }
  .card h3 { font-size: 0.9375rem; }
  .card p { font-size: 0.8125rem; opacity: 0.75; margin-top: 2px; }
  .slot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 6px; }
  .slot { text-align: center; padding: 8px 4px; font-size: 0.8125rem; border-radius: 6px;
    cursor: pointer; border: 1px solid ${border}; transition: all 0.15s; }
  .slot:hover { border-color: ${accent}; }
  .slot.selected { border-color: ${accent}; background: ${accent}; color: #fff; }
  .slot.unavailable { opacity: 0.35; cursor: not-allowed; }
  input, textarea {
    width: 100%; padding: 10px 12px; border: 1px solid ${border};
    border-radius: 6px; font-size: 0.875rem; background: ${bg}; color: ${fg};
    margin-bottom: 10px; font-family: inherit;
  }
  input:focus, textarea:focus { outline: none; border-color: ${accent}; }
  label { font-size: 0.8125rem; font-weight: 500; display: block; margin-bottom: 4px; }
  .btn {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 10px 20px; border-radius: 6px; font-size: 0.875rem; font-weight: 600;
    border: none; cursor: pointer; transition: all 0.15s; width: 100%;
    background: ${accent}; color: #fff;
  }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn:hover:not(:disabled) { opacity: 0.9; }
  .btn-secondary { background: transparent; color: ${fg}; border: 1px solid ${border}; }
  .btn-group { display: flex; gap: 8px; margin-top: 16px; }
  .error { color: #ef4444; font-size: 0.8125rem; margin-bottom: 8px; }
  .success { text-align: center; padding: 24px; }
  .success h2 { color: #22c55e; }
  .success .ref { font-size: 1.25rem; font-weight: 700; margin: 8px 0; }
  .loader { text-align: center; padding: 24px; opacity: 0.5; }
  .days { display: flex; gap: 4px; margin-bottom: 12px; overflow-x: auto; }
  .day-btn {
    flex-shrink: 0; padding: 8px 12px; border: 1px solid ${border}; border-radius: 6px;
    cursor: pointer; font-size: 0.75rem; text-align: center; background: transparent; color: ${fg}; transition: all 0.15s;
  }
  .day-btn:hover { border-color: ${accent}; }
  .day-btn.selected { background: ${accent}; color: #fff; border-color: ${accent}; }
  .day-btn .dow { display: block; font-weight: 600; }
  .day-btn .dom { display: block; font-size: 0.6875rem; opacity: 0.7; }
  .spinner { width: 24px; height: 24px; border: 3px solid ${border}; border-top-color: ${accent}; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
<div id="app">
  <div class="loader" id="initialLoader"><div class="spinner"></div><p style="margin-top:8px">Loading...</p></div>
</div>

<script>
(function() {
  var SLUG = ${JSON.stringify(slug)};
  var BASE = window.location.origin;
  var API = BASE + '/api/v1/public/businesses/' + encodeURIComponent(SLUG);

  var state = { services: [], selectedService: null, selectedStaff: null, date: null, time: null };

  function $(id) { return document.getElementById(id); }

  function fetchJSON(url) {
    return fetch(url).then(function(r) { if (!r.ok) throw new Error(r.statusText); return r.json(); });
  }

  function postJSON(url, body) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function(r) { return r.json(); });
  }

  function sendHeight() {
    var h = document.documentElement.scrollHeight;
    window.parent.postMessage({ type: '_bw_resize', height: h }, '*');
  }

  var ro = new ResizeObserver(sendHeight);
  ro.observe(document.documentElement);

  var app = document.getElementById('app');

  function render(html) {
    app.innerHTML = html;
    sendHeight();
  }

  function renderError(msg) {
    render('<div class="error" style="padding:24px;text-align:center">' + escapeHtml(msg) + '</div>');
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function loadServices() {
    render('<div class="loader"><div class="spinner"></div><p style="margin-top:8px">Loading services...</p></div>');

    fetchJSON(API + '/services').then(function(resp) {
      var data = resp.data;
      state.services = data.services || [];

      if (state.services.length === 0) {
        render('<div class="loader"><p>No services available at this time.</p></div>');
        return;
      }

      if (state.services.length === 1) {
        state.selectedService = state.services[0];
        loadSlots();
        return;
      }

      renderServiceList();
    }).catch(function(err) {
      renderError('Failed to load services: ' + err.message);
    });
  }

  function renderServiceList() {
    var cats = {};
    state.services.forEach(function(s) {
      var cid = s.category ? s.category.id : '__uncat';
      if (!cats[cid]) cats[cid] = { name: s.category ? s.category.name : 'Other', services: [] };
      cats[cid].services.push(s);
    });

    var html = '<h2>Select a Service</h2>';
    Object.keys(cats).forEach(function(cid) {
      html += '<p style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:12px 0 6px;opacity:0.6">' + escapeHtml(cats[cid].name) + '</p>';
      cats[cid].services.forEach(function(s) {
        var price = s.price ? parseFloat(s.price).toFixed(2) : '0.00';
        html += '<div class="card" data-id="' + s.id + '" onclick="selectService(\'' + s.id + '\')">' +
          '<h3>' + escapeHtml(s.name) + '</h3>' +
          '<p>' + s.duration + ' min &middot; $' + price + '</p>' +
          (s.description ? '<p>' + escapeHtml(s.description) + '</p>' : '') +
        '</div>';
      });
    });

    render(html);
  }

  window.selectService = function(serviceId) {
    state.selectedService = state.services.filter(function(s) { return s.id === serviceId; })[0];
    state.selectedStaff = null;
    state.date = null;
    state.time = null;
    loadSlots();
  };

  function formatDate(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function getDays(count) {
    var days = [];
    for (var i = 0; i < count; i++) {
      var d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }

  function loadSlots() {
    if (!state.date) {
      var today = formatDate(new Date());
      state.date = today;
    }

    render('<div class="loader"><div class="spinner"></div><p style="margin-top:8px">Loading available times...</p></div>');

    var q = '?serviceId=' + encodeURIComponent(state.selectedService.id) + '&date=' + encodeURIComponent(state.date);
    if (state.selectedStaff) q += '&staffId=' + encodeURIComponent(state.selectedStaff);

    fetchJSON(API + '/slots' + q).then(function(resp) {
      var slots = resp.data || [];

      var days = getDays(14);
      var html = '<h2>' + escapeHtml(state.selectedService.name) + ' &ndash; Pick a Time</h2>';

      html += '<div class="days">';
      days.forEach(function(d) {
        var ds = formatDate(d);
        var selected = ds === state.date ? ' selected' : '';
        var dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
        html += '<div class="day-btn' + selected + '" onclick="window.selectDate(\'' + ds + '\')"><span class="dow">' + dow + '</span><span class="dom">' + d.getDate() + '/' + (d.getMonth()+1) + '</span></div>';
      });
      html += '</div>';

      if (slots.length === 0) {
        html += '<p style="opacity:0.6;text-align:center;padding:16px">No available times for this date.</p>';
      } else {
        html += '<div class="slot-grid">';
        slots.forEach(function(s) {
          var t = new Date(s.startTime);
          var h = t.getHours();
          var m = String(t.getMinutes()).padStart(2, '0');
          var ampm = h >= 12 ? 'PM' : 'AM';
          var h12 = h % 12 || 12;
          var label = h12 + ':' + m + ' ' + ampm;
          var sel = state.time === s.startTime ? ' selected' : '';
          html += '<div class="slot' + sel + '" onclick="window.selectTime(\'' + s.startTime + '\')">' + label + '</div>';
        });
        html += '</div>';
      }

      html += '<div class="btn-group"><button class="btn btn-secondary" onclick="loadServices()">Back</button></div>';

      render(html);
    }).catch(function(err) {
      renderError('Failed to load slots: ' + err.message);
    });
  }

  window.selectDate = function(dateStr) {
    state.date = dateStr;
    state.time = null;
    loadSlots();
  };

  window.selectTime = function(timeStr) {
    state.time = timeStr;
    renderForm();
  };

  function renderForm() {
    var t = new Date(state.time);
    var h = t.getHours();
    var m = String(t.getMinutes()).padStart(2, '0');
    var ampm = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 || 12;

    var customFieldsHtml = '';
    var fields = state.selectedService.customFields || [];
    fields.forEach(function(f) {
      var required = f.isRequired ? 'required' : '';
      customFieldsHtml += '<label>' + escapeHtml(f.label) + (f.isRequired ? ' <span style="color:#ef4444">*</span>' : '') + '</label>';

      if (f.fieldType === 'TEXTAREA') {
        customFieldsHtml += '<textarea name="cf_' + f.id + '" ' + required + '></textarea>';
      } else if (f.fieldType === 'SELECT') {
        var opts = f.options || [];
        customFieldsHtml += '<select name="cf_' + f.id + '" ' + required + '>';
        customFieldsHtml += '<option value="">Select...</option>';
        opts.forEach(function(o) { customFieldsHtml += '<option value="' + escapeHtml(o) + '">' + escapeHtml(o) + '</option>'; });
        customFieldsHtml += '</select>';
      } else {
        customFieldsHtml += '<input type="text" name="cf_' + f.id + '" ' + required + '>';
      }
    });

    var html = '<h2>Your Details</h2>' +
      '<p style="font-size:0.8125rem;margin-bottom:12px;opacity:0.7">' + escapeHtml(state.selectedService.name) + ' &middot; ' + h12 + ':' + m + ' ' + ampm + '</p>' +
      '<div id="formError" class="error" style="display:none"></div>' +
      '<label>Name <span style="color:#ef4444">*</span></label><input type="text" id="fName" required>' +
      '<label>Email <span style="color:#ef4444">*</span></label><input type="email" id="fEmail" required>' +
      '<label>Phone <span style="color:#ef4444">*</span></label><input type="tel" id="fPhone" required>' +
      '<label>Notes</label><textarea id="fNotes" rows="2"></textarea>' +
      customFieldsHtml +
      '<div class="btn-group">' +
      '<button class="btn btn-secondary" onclick="loadSlots()">Back</button>' +
      '<button class="btn" onclick="submitBooking()">Confirm Booking</button></div>';

    render(html);
  }

  window.submitBooking = function() {
    var name = document.getElementById('fName').value.trim();
    var email = document.getElementById('fEmail').value.trim();
    var phone = document.getElementById('fPhone').value.trim();
    var notes = document.getElementById('fNotes') ? document.getElementById('fNotes').value.trim() : '';
    var errEl = document.getElementById('formError');

    if (!name || !email || !phone) {
      errEl.textContent = 'Please fill in all required fields.';
      errEl.style.display = 'block';
      return;
    }

    errEl.style.display = 'none';

    var cf = {};
    var fields = state.selectedService.customFields || [];
    fields.forEach(function(f) {
      var el = document.querySelector('[name="cf_' + f.id + '"]');
      if (el) cf[f.id] = el.value;
    });

    var body = {
      serviceId: state.selectedService.id,
      staffId: state.selectedStaff,
      startTime: state.time,
      duration: state.selectedService.duration,
      price: parseFloat(state.selectedService.price || 0),
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      notes: notes,
      customFieldAnswers: Object.keys(cf).length > 0 ? cf : undefined,
    };

    render('<div class="loader"><div class="spinner"></div><p style="margin-top:8px">Booking your appointment...</p></div>');

    postJSON(API + '/book', body).then(function(resp) {
      if (resp.error) {
        renderError(resp.error);
        return;
      }
      var b = resp.data;
      render(
        '<div class="success">' +
          '<h2>&#10003; Booking Confirmed!</h2>' +
          '<p class="ref">' + escapeHtml(b.bookingRef) + '</p>' +
          '<p style="margin-bottom:16px">A confirmation has been sent to your email.</p>' +
          '<p style="font-size:0.8125rem;opacity:0.7">Manage your booking: <a href="' + BASE + '/api/v1/public/bookings/manage/' + encodeURIComponent(b.manageToken) + '" target="_blank">Manage</a></p>' +
        '</div>'
      );
    }).catch(function(err) {
      renderError('Booking failed: ' + err.message);
    });
  };

  loadServices();
})();
</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}
