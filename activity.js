// Adds a "Last posted" line to each channel card on the page.
// Cards are matched by data-channel="<key>" against the keys in activity.json.
// activity.json is refreshed by a scheduled job; channels without an entry show nothing.
(function () {
  var QUIET_DAYS = 7;
  var STALE_DAYS = 30;

  function daysAgo(iso) {
    var then = new Date(iso);
    var now = new Date();
    var a = Date.UTC(then.getFullYear(), then.getMonth(), then.getDate());
    var b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((b - a) / 86400000);
  }

  function label(days) {
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    return days + ' days ago';
  }

  function render(key, info) {
    var cards = document.querySelectorAll('[data-channel="' + key + '"]');
    if (!cards.length || !info || !info.last_posted) return;
    var days = daysAgo(info.last_posted);
    var state = days >= STALE_DAYS ? 'stale' : days >= QUIET_DAYS ? 'quiet' : 'fresh';
    var date = new Date(info.last_posted).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    cards.forEach(function (card) {
      var old = card.querySelector('.last-posted');
      if (old) old.remove();
      var el = document.createElement('p');
      el.className = 'last-posted last-posted--' + state;
      el.title = (info.last_post_title || '') + ' (' + date + ')';
      el.textContent = 'Last posted ' + label(days);
      if (state !== 'fresh') {
        var badge = document.createElement('span');
        badge.className = 'last-posted__badge';
        badge.textContent = state;
        el.appendChild(badge);
      }
      card.appendChild(el);
    });
  }

  var css = document.createElement('style');
  css.textContent =
    '.last-posted{margin:10px 0 0;font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft,#6b6b6b)}' +
    '.last-posted--fresh::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;background:var(--forest,#00583a)}' +
    '.last-posted__badge{margin-left:8px;padding:1px 6px;border-radius:3px;font-weight:600}' +
    '.last-posted--quiet .last-posted__badge{background:var(--copper-soft,#f1d7b3);color:#7a4a14}' +
    '.last-posted--stale .last-posted__badge{background:#f4d0cc;color:#8a1f12}';
  document.head.appendChild(css);

  fetch('activity.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !data.channels) return;
      Object.keys(data.channels).forEach(function (k) { render(k, data.channels[k]); });
    })
    .catch(function () {});
})();
