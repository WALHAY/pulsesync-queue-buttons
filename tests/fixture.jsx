import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'));
let tracks = [];
window.rowEvents = [];
window.queueCalls = [];
window.appendCalls = [];
window.queue = ['currently-playing', 'previously-next'];
window.playCalls = 0;
let queueSources = [null, null];
let isVibeQueue = false;

function inject(payload, position) {
  // My Vibe distinguishes manual additions by sourceContextData. Its native
  // beforeInject hook places them before recommendations (Yandex Music 5.124.1).
  if (isVibeQueue && payload.sourceContextData) {
    const manualCount = queueSources.slice(1).filter(Boolean).length;
    position = Math.min(position, 1 + manualCount);
  }
  const ids = payload.entitiesData.map(entity => entity.meta.id);
  window.queue.splice(position, 0, ...ids);
  queueSources.splice(position, 0, ...ids.map(() => payload.sourceContextData));
}

function startVibe() {
  isVibeQueue = true;
  window.queue = ['currently-playing', 'recommendation-1', 'recommendation-2'];
  queueSources = [null, null, null];
}

window.pulsesyncApi = {
  playerInstance: {
    injectNext(payload) {
      window.queueCalls.push(payload);
      inject(payload, 1);
    },
    injectLast(payload) {
      window.appendCalls.push(payload);
      inject(payload, window.queue.length);
    },
    playContext() {
      window.playCalls++;
    },
  },
};

function Controls({ track, generation = 0, noLike = false }) {
  return (
    <div className="CommonControlsBar_root__native CommonControlsBar_controls__native">
      {!noLike && (
        <button
          key={generation}
          type="button"
          data-test-id="LIKE_BUTTON"
          aria-label="Like"
          aria-pressed={track.liked || false}
          disabled={track.signedOut || false}
          onClick={() => {
            window.rowEvents.push('like');
          }}
        >
          ♡
        </button>
      )}
      <button type="button" data-test-id="TRACK_CONTEXT_MENU_BUTTON" aria-label="More">
        ⋯
      </button>
    </div>
  );
}

function TrackRow({ track, index }) {
  return (
    <fieldset
      data-slot={index}
      aria-label={track.title}
      className={`HorizontalCardContainer_root__native CommonTrack_root__native ${track.isAvailable === false ? 'CommonTrack_root_disabled__native' : ''}`}
      data-test-id={track.surface === 'search' ? 'SEARCH_TRACK_CARD' : undefined}
      onClick={() => window.rowEvents.push('row-click')}
      onDoubleClick={() => window.rowEvents.push('row-double-click')}
      onKeyDown={() => window.rowEvents.push('row-key')}
    >
      <span className="cover">♪</span>
      <a data-test-id="TRACK_TITLE" href={`/album/${track.albumId}/track/${track.id}`}>
        {track.title}
      </a>
      <Controls track={track} generation={track.generation} noLike={track.noLike} />
    </fieldset>
  );
}

function render(next = tracks) {
  tracks = next;
  flushSync(() =>
    root.render(
      <>
        <button type="button" data-test-id="LIKE_BUTTON" aria-label="Player Like">
          Player Like
        </button>
        <section>
          {tracks.map((track, index) => {
            // biome-ignore lint/suspicious/noArrayIndexKey: Reusing a viewport slot for another track is what this fixture tests.
            return <TrackRow key={index} track={track} index={index} />;
          })}
        </section>
        <div data-test-id="ALBUM_CARD">
          <button type="button" data-test-id="LIKE_BUTTON">
            Album Like
          </button>
        </div>
      </>,
    ),
  );
}

window.fixture = { render, startVibe };
render([
  { id: '11', albumId: '101', entityId: '11:101', title: 'Search track', surface: 'search' },
  { id: '22', albumId: '202', entityId: '22:202', title: 'Album track', surface: 'album' },
  { id: '33', albumId: '303', entityId: '33:303', title: 'Liked track', liked: true },
]);
