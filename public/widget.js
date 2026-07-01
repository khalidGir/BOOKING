(function () {
  'use strict';

  var SCRIPT = document.currentScript || document.querySelector('script[data-business]');
  var BUSINESS_SLUG = SCRIPT ? SCRIPT.getAttribute('data-business') : null;
  var THEME = SCRIPT ? SCRIPT.getAttribute('data-theme') : 'light';
  var BASE = SCRIPT ? SCRIPT.getAttribute('data-base') : (window._bookingBase || 'https://book.example.com');
  var POSITION = SCRIPT ? SCRIPT.getAttribute('data-position') : 'right';

  if (!BUSINESS_SLUG) {
    console.warn('[Booking Widget] Missing data-business attribute. Usage: <script src="widget.js" data-business="your-slug"></script>');
    return;
  }

  var CONTAINER = document.getElementById('booking-widget');
  var isModal = !CONTAINER;
  var iframe = null;
  var modalOverlay = null;

  function createModalButton() {
    var btn = document.createElement('div');
    btn.id = '_bw_btn';
    btn.setAttribute('aria-label', 'Open booking');
    btn.setAttribute('role', 'button');
    btn.tabIndex = 0;

    var styles = {
      position: 'fixed',
      bottom: '24px',
      [POSITION]: '24px',
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: '#6c3aed',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: '0 4px 16px rgba(108,58,237,0.4)',
      zIndex: '2147483646',
      fontSize: '28px',
      fontFamily: 'sans-serif',
      transition: 'transform 0.2s',
      userSelect: 'none',
    };

    Object.keys(styles).forEach(function (k) { btn.style[k] = styles[k]; });

    btn.innerHTML = '<span style="transform:rotate(45deg)">+</span>';
    btn.onmouseenter = function () { btn.style.transform = 'scale(1.1)'; };
    btn.onmouseleave = function () { btn.style.transform = 'scale(1)'; };
    btn.onclick = openModal;
    btn.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') openModal(); };

    document.body.appendChild(btn);
    return btn;
  }

  function createModal() {
    var overlay = document.createElement('div');
    overlay.id = '_bw_overlay';

    var os = {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0,0,0,0.5)',
      zIndex: '2147483647',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: '0',
      transition: 'opacity 0.25s',
    };
    Object.keys(os).forEach(function (k) { overlay.style[k] = os[k]; });

    var wrapper = document.createElement('div');
    wrapper.id = '_bw_wrapper';

    var ws = {
      width: '95%',
      maxWidth: '480px',
      height: '85vh',
      maxHeight: '700px',
      background: '#fff',
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    };
    Object.keys(ws).forEach(function (k) { wrapper.style[k] = ws[k]; });

    var closeBtn = document.createElement('button');
    closeBtn.id = '_bw_close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close');
    var cbs = {
      position: 'absolute',
      top: '8px',
      right: '12px',
      background: 'none',
      border: 'none',
      fontSize: '28px',
      cursor: 'pointer',
      zIndex: '1',
      color: '#666',
      lineHeight: '1',
      padding: '4px',
    };
    Object.keys(cbs).forEach(function (k) { closeBtn.style[k] = cbs[k]; });
    closeBtn.onclick = closeModal;

    wrapper.appendChild(closeBtn);
    overlay.appendChild(wrapper);
    document.body.appendChild(overlay);

    overlay.onclick = function (e) { if (e.target === overlay) closeModal(); };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

    return { overlay: overlay, wrapper: wrapper };
  }

  function openModal() {
    if (!modalOverlay) {
      modalOverlay = createModal();
    }
    modalOverlay.overlay.style.display = 'flex';
    requestAnimationFrame(function () {
      modalOverlay.overlay.style.opacity = '1';
    });
    injectIframe(modalOverlay.wrapper);
  }

  function closeModal() {
    if (modalOverlay) {
      modalOverlay.overlay.style.opacity = '0';
      setTimeout(function () {
        modalOverlay.overlay.style.display = 'none';
      }, 250);
    }
  }

  function createContainerIframe() {
    CONTAINER.style.position = 'relative';
    CONTAINER.style.width = '100%';
    CONTAINER.style.minHeight = '600px';
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'width:100%;height:100%;min-height:600px;';
    CONTAINER.appendChild(wrapper);
    injectIframe(wrapper);
  }

  function injectIframe(parent) {
    if (iframe && iframe.parentNode) return;

    var src = BASE.replace(/\/+$/, '') + '/embed/' + encodeURIComponent(BUSINESS_SLUG) + '?theme=' + encodeURIComponent(THEME);

    iframe = document.createElement('iframe');
    iframe.setAttribute('src', src);
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('title', 'Booking Widget');

    iframe.style.cssText = 'width:100%;height:100%;border:none;overflow:hidden;';

    parent.appendChild(iframe);
  }

  function handleMessage(event) {
    if (event.data && event.data.type === '_bw_resize') {
      var h = parseInt(event.data.height, 10);
      if (h > 0 && iframe) {
        iframe.style.height = h + 'px';
        if (CONTAINER) {
          CONTAINER.style.minHeight = 'auto';
        }
      }
    }
    if (event.data && event.data.type === '_bw_navigate') {
      if (event.data.url) {
        window.open(event.data.url, event.data.target || '_self');
      }
    }
    if (event.data && event.data.type === '_bw_close') {
      closeModal();
    }
  }

  window.addEventListener('message', handleMessage);

  if (CONTAINER) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createContainerIframe);
    } else {
      createContainerIframe();
    }
  } else {
    createModalButton();
    if (SCRIPT && SCRIPT.hasAttribute('data-open')) {
      openModal();
    }
  }
})();
