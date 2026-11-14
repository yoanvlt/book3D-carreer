import { goHome, showPanel, useGame } from '../state';

function Brand() {
  return (
    <span className='brand'>
      <svg viewBox='0 0 34 34' aria-hidden='true'>
        <path
          d='M24 7a13 13 0 1 0 0 20M12 13v8m7-8v8'
          fill='none'
          stroke='currentColor'
          strokeWidth='3.4'
          strokeLinecap='round'
        />
      </svg>
      <span>
        careerverse<span className='brand-dot'>.</span>
      </span>
    </span>
  );
}

export default function Header() {
  const state = useGame();
  const busy = state.phase !== 'home' && state.phase !== 'explore';
  return (
    <header className='topbar'>
      <button
        className='brand-button'
        disabled={busy || !!state.interior}
        aria-label='Revenir à la vue aérienne'
        onClick={goHome}
      >
        <Brand />
      </button>
      <span className='header-caption'>LE PORTFOLIO À EXPLORER</span>
      <div className='header-actions'>
        <button
          className='text-button'
          disabled={busy}
          aria-label='Ouvrir le plan'
          onClick={() => showPanel('map')}
        >
          <svg viewBox='0 0 24 24' aria-hidden='true'>
            <path d='m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16' />
          </svg>
          <span>Le plan</span>
          <kbd>M</kbd>
        </button>
        <button
          className='help-button'
          disabled={busy}
          aria-label='Commandes et réglages'
          onClick={() => showPanel('help')}
        >
          ?
        </button>
      </div>
    </header>
  );
}
