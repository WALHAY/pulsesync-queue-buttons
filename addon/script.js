(() => {
  // biome-ignore lint/suspicious/noRedundantUseStrict: PulseSync injects this file as a classic script, not an ES module.
  'use strict';

  const INSTANCE = '__pulseSyncQueueButtons';
  window.__pulseSyncPlayNextInline?.dispose();
  window[INSTANCE]?.dispose();

  const ROW = '[class*="CommonTrack_root__"], [data-test-id="SEARCH_TRACK_CARD"]';
  const LIKE = 'button[data-test-id="LIKE_BUTTON"]';
  const BUTTON = 'ps-queue-button';
  const OWN_ELEMENTS = `.${BUTTON}, .ps-queue-status`;
  const POINTER_EVENTS = ['dblclick', 'pointerdown', 'pointerup', 'mousedown', 'mouseup'];
  // Keep Play next closest to Like, with Add to end just before it.
  const ACTIONS = [
    {
      key: 'last',
      method: 'injectLast',
      icon: 'playLast_xxs',
      testId: 'PULSESYNC_ADD_TO_QUEUE_BUTTON',
    },
    {
      key: 'next',
      method: 'injectNext',
      icon: 'playNext_xxs',
      testId: 'PULSESYNC_PLAY_NEXT_BUTTON',
    },
  ];
  const sourceScript = document.currentScript;
  const abort = new AbortController();
  const timers = new Set();
  const scopes = new Set();
  const controlsByLike = new WeakMap();
  let frame = 0;
  let disposed = false;
  let status;
  let statusTimer;

  const MESSAGES = {
    ru: {
      next: { label: 'Играть следующим', added: 'Следующим в очереди' },
      last: { label: 'Добавить в конец очереди', added: 'Добавлено в конец очереди' },
      failed: 'Не удалось добавить трек. Попробуйте добавить его через меню трека.',
    },
    en: {
      next: { label: 'Play next', added: 'Next in queue' },
      last: { label: 'Add to end of queue', added: 'Added to end of queue' },
      failed: 'Could not add this track. Try adding it through the track menu.',
    },
  };

  function messages() {
    return MESSAGES[document.documentElement.lang.toLowerCase().startsWith('ru') ? 'ru' : 'en'];
  }

  function later(callback, delay) {
    if (disposed) return;
    const id = setTimeout(() => {
      timers.delete(id);
      if (!disposed) callback();
    }, delay);
    timers.add(id);
    return id;
  }

  // React updates __reactProps on the DOM node on every commit. Reading these
  // afresh avoids retaining an old track when a virtualized row is recycled.
  function trackFromProps(props) {
    const pending = [props];
    const seen = new Set();
    for (let index = 0; index < pending.length && seen.size < 150; index++) {
      const value = pending[index];
      if (!value || typeof value !== 'object' || seen.has(value)) continue;
      seen.add(value);
      if (value.track?.entityId || value.track?.id) return value.track;
      if (Array.isArray(value)) pending.push(...value);
      else pending.push(value.props, value.children);
    }
    return null;
  }

  function trackFromReact(row, like) {
    // Start with the row's current props, before looking at nested controls.
    const nodes = [row];
    for (let node = like; node && node !== row; node = node.parentElement) nodes.push(node);
    for (const node of nodes) {
      const key = Object.keys(node).find(key => key.startsWith('__reactProps$'));
      const track = key && trackFromProps(node[key]);
      if (track) {
        const entityId =
          track.entityId || (track.albumId ? `${track.id}:${track.albumId}` : track.id);
        return {
          entityId: String(entityId),
          title: track.title || '',
          available: track.isAvailable !== false,
        };
      }
    }

    return null;
  }

  function trackFromLink(row) {
    // Only accept a track link from this row when React's props aren't available.
    for (const link of row.querySelectorAll('a[href*="/track/"]')) {
      let path;
      try {
        path = new URL(link.getAttribute('href'), document.baseURI).pathname;
      } catch {
        continue;
      }
      const match = path.match(/^(?:\/album\/(\d+))?\/track\/(\d+)\/?$/);
      if (match)
        return {
          entityId: match[1] ? `${match[2]}:${match[1]}` : match[2],
          title: link.textContent.trim(),
          available: true,
        };
    }
    return null;
  }

  function getTrack(row, like) {
    return trackFromReact(row, like) ?? trackFromLink(row);
  }

  function unavailable(row, like, track) {
    return (
      like.disabled ||
      like.getAttribute('aria-disabled') === 'true' ||
      row.getAttribute('aria-disabled') === 'true' ||
      row.className.includes('CommonTrack_root_disabled__') ||
      track?.available === false
    );
  }

  function announce(text) {
    if (disposed) return;
    if (!status) {
      status = document.createElement('div');
      status.className = 'ps-queue-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.setAttribute('aria-atomic', 'true');
      document.body.append(status);
    }
    clearTimeout(statusTimer);
    timers.delete(statusTimer);
    status.textContent = text;
    statusTimer = later(() => {
      status.textContent = '';
    }, 3000);
  }

  function getQueueRequest(row, like, method) {
    const track = getTrack(row, like);
    if (unavailable(row, like, track)) return null;
    const player = window.pulsesyncApi?.playerInstance;
    if (!track || typeof player?.[method] !== 'function') {
      throw new Error('Track or native queue unavailable');
    }
    return { track, player };
  }

  async function queueTrack(button, like, action) {
    if (button.getAttribute('aria-busy') === 'true' || !like.isConnected) return;
    const row = like.closest(ROW);
    if (!row) return;
    try {
      const request = getQueueRequest(row, like, action.method);
      if (!request) return;
      const { track, player } = request;
      button.setAttribute('aria-busy', 'true');
      // Same operation and entity format as Yandex Music's track context menu.
      // Do not start playback or replace the current playback context.
      await player[action.method]({
        entitiesData: [{ type: 'unloaded', meta: { id: track.entityId } }],
      });
      announce(`${messages()[action.key].added}${track.title ? `: ${track.title}` : ''}`);
    } catch (error) {
      if (!disposed) {
        console.warn('[QueueButtons] Could not queue track:', error);
        announce(messages().failed);
      }
    } finally {
      // Absorb the second click of a double-click, retaining keyboard focus.
      later(() => button.removeAttribute('aria-busy'), 400);
    }
  }

  function createIcon(symbol) {
    const namespace = 'http://www.w3.org/2000/svg';
    const icon = document.createElementNS(namespace, 'svg');
    icon.setAttribute('viewBox', '0 0 20 20');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    const use = document.createElementNS(namespace, 'use');
    use.setAttribute('href', `/icons/sprite.svg#${symbol}`);
    icon.append(use);
    return icon;
  }

  function stopPropagation(event) {
    event.stopPropagation();
  }

  function stopActivationKey(event) {
    if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
  }

  function createButton(like, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = BUTTON;
    button.dataset.testId = action.testId;
    // Reference the client's icons instead of shipping copies of its artwork.
    button.append(createIcon(action.icon));
    button.addEventListener(
      'click',
      event => {
        event.preventDefault();
        event.stopPropagation();
        void queueTrack(button, like, action);
      },
      { signal: abort.signal },
    );
    // Stop row playback/navigation while keeping native keyboard activation.
    for (const type of POINTER_EVENTS) {
      button.addEventListener(type, stopPropagation, { signal: abort.signal });
    }
    for (const type of ['keydown', 'keyup']) {
      button.addEventListener(type, stopActivationKey, { signal: abort.signal });
    }
    return button;
  }

  function getControls(like) {
    let controls = controlsByLike.get(like);
    if (!controls) {
      controls = ACTIONS.map(action => ({ action, button: createButton(like, action) }));
      controlsByLike.set(like, controls);
    }
    return controls;
  }

  function removeStaleButtons(row, controls = []) {
    for (const button of row.querySelectorAll(`.${BUTTON}`)) {
      if (!controls.some(control => control.button === button)) button.remove();
    }
  }

  function placeControls(controls, like) {
    let anchor = like;
    for (let i = controls.length - 1; i >= 0; i--) {
      const { button } = controls[i];
      if (anchor.previousElementSibling !== button) anchor.before(button);
      anchor = button;
    }
  }

  function addButtons(row) {
    const like = row.querySelector(LIKE);
    if (!like || like.closest(ROW) !== row) {
      removeStaleButtons(row);
      return;
    }

    const controls = getControls(like);
    // React may replace the Like button without replacing the row.
    removeStaleButtons(row, controls);
    placeControls(controls, like);
    const disabled = unavailable(row, like, getTrack(row, like));
    const labels = messages();
    for (const { button, action } of controls) {
      const label = labels[action.key].label;
      if (button.title !== label) {
        button.title = label;
        button.setAttribute('aria-label', label);
      }
      if (button.disabled !== disabled) button.disabled = disabled;
    }
  }

  function scan(scope) {
    if (scope !== document && !scope.isConnected) return;
    if (scope.matches?.(ROW)) addButtons(scope);
    scope.querySelectorAll?.(ROW).forEach(addButtons);
  }

  function schedule(scope) {
    scopes.add(scope);
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      for (const scope of scopes) scan(scope);
      scopes.clear();
    });
  }

  function scheduleMutation(record) {
    const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
    if (target?.closest(OWN_ELEMENTS)) return;
    const row = target?.closest(ROW);
    if (row) schedule(row);
    for (const node of record.addedNodes) {
      if (node.nodeType === 1 && !node.matches(OWN_ELEMENTS)) schedule(node);
    }
  }

  const observer = new MutationObserver(records => {
    if (sourceScript && !sourceScript.isConnected) return dispose();
    for (const record of records) scheduleMutation(record);
  });

  function dispose() {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    abort.abort();
    cancelAnimationFrame(frame);
    timers.forEach(clearTimeout);
    timers.clear();
    scopes.clear();
    removeStaleButtons(document);
    status?.remove();
    if (window[INSTANCE]?.dispose === dispose) delete window[INSTANCE];
  }

  window[INSTANCE] = { dispose };
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'disabled', 'aria-disabled', 'href', 'data-test-id'],
  });
  window.addEventListener('pagehide', dispose, { once: true, signal: abort.signal });
  scan(document);
})();
