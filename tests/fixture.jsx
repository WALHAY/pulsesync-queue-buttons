import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';

const root = createRoot(document.getElementById('root'));
let tracks = [];
window.rowEvents = [];
window.queueCalls = [];
window.appendCalls = [];
window.queue = ['currently-playing', 'previously-next'];
window.playCalls = 0;
window.pulsesyncApi = {
  playerInstance: {
    injectNext(payload) {
      window.queueCalls.push(payload);
      window.queue.splice(1, 0, ...payload.entitiesData.map(entity => entity.meta.id));
    },
    injectLast(payload) {
      window.appendCalls.push(payload);
      window.queue.push(...payload.entitiesData.map(entity => entity.meta.id));
    },
    playContext() { window.playCalls++; },
  },
};

function Controls({ track, generation = 0, noLike = false }) {
  return <div className="CommonControlsBar_root__native CommonControlsBar_controls__native">
    {!noLike && <button key={generation} type="button" data-test-id="LIKE_BUTTON"
      aria-label="Like" aria-pressed={track.liked || false} disabled={track.signedOut || false}
      onClick={() => { window.rowEvents.push('like'); }}>♡</button>}
    <button type="button" data-test-id="TRACK_CONTEXT_MENU_BUTTON" aria-label="More">⋯</button>
  </div>;
}

function TrackRow({ track, index }) {
  return <div data-slot={index}
    className={`HorizontalCardContainer_root__native CommonTrack_root__native ${track.isAvailable === false ? 'CommonTrack_root_disabled__native' : ''}`}
    data-test-id={track.surface === 'search' ? 'SEARCH_TRACK_CARD' : undefined}
    onClick={() => window.rowEvents.push('row-click')}
    onDoubleClick={() => window.rowEvents.push('row-double-click')}
    onKeyDown={() => window.rowEvents.push('row-key')}>
    <span className="cover">♪</span>
    <a data-test-id="TRACK_TITLE" href={`/album/${track.albumId}/track/${track.id}`}>{track.title}</a>
    <Controls track={track} generation={track.generation} noLike={track.noLike} />
  </div>;
}

function render(next = tracks) {
  tracks = next;
  flushSync(() => root.render(<>
    <button data-test-id="LIKE_BUTTON" aria-label="Player Like">Player Like</button>
    <section>{tracks.map((track, index) => <TrackRow key={index} track={track} index={index} />)}</section>
    <div data-test-id="ALBUM_CARD"><button data-test-id="LIKE_BUTTON">Album Like</button></div>
  </>));
}

window.fixture = { render };
render([
  { id: '11', albumId: '101', entityId: '11:101', title: 'Search track', surface: 'search' },
  { id: '22', albumId: '202', entityId: '22:202', title: 'Album track', surface: 'album' },
  { id: '33', albumId: '303', entityId: '33:303', title: 'Liked track', liked: true },
]);
