import { useEffect, useRef, useId, type ReactNode } from 'react';

export default function Dialog({
  title,
  eyebrow,
  close,
  children,
  className = '',
}: {
  title: string;
  eyebrow: string;
  close: () => void;
  children: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const onClose = useRef(close);
  onClose.current = close;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current!;
    const first = root.querySelector<HTMLElement>('button');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose.current();
      }
      if (e.key === 'Tab') {
        const focusable = Array.from(
          root.querySelectorAll<HTMLElement>('button,[tabindex="0"],input,select,a[href],summary'),
        ).filter((el) => !el.hasAttribute('disabled'));
        const first = focusable[0],
          last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    root.addEventListener('keydown', onKey);
    return () => {
      root.removeEventListener('keydown', onKey);
      if (previous?.isConnected) previous.focus();
      else
        document
          .querySelector<HTMLElement>('.brand-button:not(:disabled),.help-button:not(:disabled)')
          ?.focus();
    };
  }, []);
  return (
    <div
      className='modal-backdrop'
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        ref={ref}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        className={`dialog ${className}`}
      >
        <div className='dialog-heading'>
          <div>
            <span className='eyebrow'>{eyebrow}</span>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button className='close' aria-label='Fermer' onClick={close}>
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
