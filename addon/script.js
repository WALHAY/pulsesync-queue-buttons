(() => {
  'use strict';

  const INSTANCE = '__pulseSyncPlayNextInline';
  window[INSTANCE]?.dispose();

  const ROW = '[class*="CommonTrack_root__"], [data-test-id="SEARCH_TRACK_CARD"]';
  const LIKE = 'button[data-test-id="LIKE_BUTTON"]';
  const BUTTON = 'ps-play-next-button';
  const sourceScript = document.currentScript;
  const abort = new AbortController();
  const timers = new Set();
  const scopes = new Set();
  const buttons = new WeakMap();
  let frame = 0;
  let disposed = false;
  let status;
  let statusTimer;

  const messages = () => document.documentElement.lang.toLowerCase().startsWith('ru') ? {
    next: 'Играть следующим',
    added: 'Следующим в очереди',
    failed: 'Не удалось добавить трек. Попробуйте «Играть следующим» в меню трека.',
  } : {
    next: 'Play next',
    added: 'Next in queue',
    failed: 'Could not add this track. Try “Play next” in the track menu.',
  };

  function later(callback, delay) {
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
    while (pending.length && seen.size < 150) {
      const value = pending.shift();
      if (!value || typeof value !== 'object' || seen.has(value)) continue;
      seen.add(value);
      if (value.track?.entityId || value.track?.id) return value.track;
      if (Array.isArray(value)) pending.push(...value);
      else pending.push(value.props, value.children);
    }
    return null;
  }

  function getTrack(row, like) {
    // Start with the row's current props, before looking at nested controls.
    const nodes = [row];
    for (let node = like; node && node !== row; node = node.parentElement) nodes.push(node);
    for (const node of nodes) {
      const key = Object.keys(node).find(key => key.startsWith('__reactProps$'));
      const track = key && trackFromProps(node[key]);
      if (track) {
        const entityId = track.entityId || (track.albumId ? `${track.id}:${track.albumId}` : track.id);
        return { entityId: String(entityId), title: track.title || '', available: track.isAvailable !== false };
      }
    }

    // A track link is sufficient when React's private DOM props are unavailable.
    // Never use an album link or a track from elsewhere on the page.
    for (const link of row.querySelectorAll('a[href*="/track/"]')) {
      let path;
      try { path = new URL(link.getAttribute('href'), document.baseURI).pathname; }
      catch { continue; }
      const match = path.match(/^(?:\/album\/(\d+))?\/track\/(\d+)\/?$/);
      if (match) return {
        entityId: match[1] ? `${match[2]}:${match[1]}` : match[2],
        title: link.textContent.trim(),
        available: true,
      };
    }
    return null;
  }

  function unavailable(row, like, track) {
    return like.disabled || like.getAttribute('aria-disabled') === 'true' ||
      row.getAttribute('aria-disabled') === 'true' ||
      row.className.includes('CommonTrack_root_disabled__') || track?.available === false;
  }

  function announce(text) {
    if (!status) {
      status = document.createElement('div');
      status.className = 'ps-play-next-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.setAttribute('aria-atomic', 'true');
      document.body.append(status);
    }
    clearTimeout(statusTimer);
    timers.delete(statusTimer);
    status.textContent = text;
    statusTimer = later(() => { status.textContent = ''; }, 3000);
  }

  async function playNext(button, like) {
    if (button.getAttribute('aria-busy') === 'true') return;
    const row = like.closest(ROW);
    if (!row || !like.isConnected) return;
    try {
      const track = getTrack(row, like);
      if (unavailable(row, like, track)) return;
      const player = window.pulsesyncApi?.playerInstance;
      if (!track || typeof player?.injectNext !== 'function') throw new Error('Track or native queue unavailable');
      button.setAttribute('aria-busy', 'true');
      // Same operation and entity format as Yandex Music's track context menu.
      // Do not start playback or replace the current playback context.
      await player.injectNext({ entitiesData: [{ type: 'unloaded', meta: { id: track.entityId } }] });
      if (!disposed) announce(`${messages().added}${track.title ? `: ${track.title}` : ''}`);
    } catch (error) {
      if (!disposed) {
        console.warn('[PlayNextInline] Could not queue track:', error);
        announce(messages().failed);
      }
    } finally {
      // Absorb the second click of a double-click, retaining keyboard focus.
      if (!disposed) later(() => button.removeAttribute('aria-busy'), 400);
    }
  }

  function addButton(row) {
    const like = row.querySelector(LIKE);
    if (!like || like.closest(ROW) !== row) {
      row.querySelectorAll(`.${BUTTON}`).forEach(button => button.remove());
      return;
    }
    let button = buttons.get(like);
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = BUTTON;
      button.dataset.testId = 'PULSESYNC_PLAY_NEXT_BUTTON';
      // Use the same built-in symbol as the native track menu. The artwork
      // stays in the client and follows its icon updates.
      button.innerHTML = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">' +
        '<use href="/icons/sprite.svg#playNext_xxs"></use></svg>';
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        void playNext(button, like);
      }, { signal: abort.signal });
      // Stop the row's playback/navigation handlers while retaining native
      // button focus and Enter/Space activation.
      for (const type of ['dblclick', 'pointerdown', 'pointerup', 'mousedown', 'mouseup']) {
        button.addEventListener(type, event => event.stopPropagation(), { signal: abort.signal });
      }
      for (const type of ['keydown', 'keyup']) {
        button.addEventListener(type, event => {
          if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
        }, { signal: abort.signal });
      }
      buttons.set(like, button);
    }
    // React may replace the Like button without replacing the row.
    for (const stale of row.querySelectorAll(`.${BUTTON}`)) {
      if (stale !== button) stale.remove();
    }
    if (like.previousElementSibling !== button) like.before(button);
    const label = messages().next;
    if (button.title !== label) {
      button.title = label;
      button.setAttribute('aria-label', label);
    }
    const disabled = unavailable(row, like, getTrack(row, like));
    if (button.disabled !== disabled) button.disabled = disabled;
  }

  function scan(scope) {
    if (scope !== document && !scope.isConnected) return;
    if (scope.matches?.(ROW)) addButton(scope);
    scope.querySelectorAll?.(ROW).forEach(addButton);
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

  const observer = new MutationObserver(records => {
    if (sourceScript && !sourceScript.isConnected) return dispose();
    for (const record of records) {
      const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      if (target?.closest(`.${BUTTON}, .ps-play-next-status`)) continue;
      const row = target?.closest(ROW);
      if (row) schedule(row);
      for (const node of record.addedNodes) {
        if (node.nodeType === 1 && !node.matches(`.${BUTTON}, .ps-play-next-status`)) schedule(node);
      }
    }
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
    document.querySelectorAll(`.${BUTTON}`).forEach(button => button.remove());
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
