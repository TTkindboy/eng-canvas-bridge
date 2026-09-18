import './style.css';
import { useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import calendarAddIcon from '@instructure/ui-icons/svg/Line/calendar-add.svg?raw';
import { getFileImportStatus } from './canvasSession';
import type { DualSchedule } from '@/lib/client/types.gen';
import { addParsedScheduleToCanvas, handleAddToCalendar } from './addToCalendar';

function AddToCalendarButton() {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'checking' | 'idle' | 'parsing' | 'submitting' | 'submitted'>('checking');
  const working = useRef(false);
  const submission = useRef({
    filePath: '',
    schedule: null as DualSchedule | null,
    completedNotes: new Set<number>(),
  });

  useEffect(() => {
    let active = true;
    getFileImportStatus().then(saved => {
      if (active) setStatus(saved);
    }).catch(cause => {
      if (active) {
        setStatus('idle');
        setError(cause instanceof Error ? cause.message : 'Could not check this file’s import.');
      }
    });
    return () => { active = false; };
  }, []);

  async function handleClick() {
    if (working.current || status === 'submitted') return;
    working.current = true;
    setError(null);
    if (submission.current.filePath !== window.location.pathname) {
      submission.current = {
        filePath: window.location.pathname,
        schedule: null,
        completedNotes: new Set<number>(),
      };
    }
    const current = submission.current;
    setStatus(current.schedule ? 'submitting' : 'parsing');

    let submitting = false;
    try {
      current.schedule ??= await handleAddToCalendar();
      if (current.filePath !== window.location.pathname) {
        setStatus('idle');
        return;
      }
      submitting = true;
      setStatus('submitting');
      await addParsedScheduleToCanvas(current.schedule, current.completedNotes);
      setStatus('submitted');
    } catch (cause) {
      setStatus('idle');
      const total = current.schedule ? current.schedule.odd.length + current.schedule.even.length : 0;
      const message = cause instanceof Error ? cause.message : 'Failed to add schedule days to Canvas.';
      setError(submitting
        ? `${message} Added ${current.completedNotes.size} of ${total} notes. Retry to add the remaining notes.`
        : cause instanceof Error ? cause.message : 'Failed to parse this Canvas schedule file.');
    } finally {
      working.current = false;
    }
  }

  const busy = status === 'checking' || status === 'parsing' || status === 'submitting';
  const label = status === 'checking' ? 'Checking...'
    : status === 'parsing' ? 'Parsing...'
    : status === 'submitting' ? 'Adding...'
    : status === 'submitted' ? 'Added to Canvas'
    : error && submission.current.schedule ? 'Retry remaining notes'
    : 'Add to Calendar';

  return (
    <span className="cb-root">
      <button className={`cb-btn${status === 'submitted' ? ' cb-btn--submitted' : ''}`} type="button" disabled={busy || status === 'submitted'} onClick={handleClick}
        aria-pressed={status === 'submitted'}>
        <span className="cb-btn__content">
          <span className="cb-btn__icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: calendarAddIcon }} />
          {label}
        </span>
      </button>
      {error ? <span className="cb-inline-error" role="alert">{error}</span> : null}
    </span>
  );
}

export default defineContentScript({
  matches: ['*://friendsseminary.instructure.com/courses/*/files/*'],

  main(ctx) {
    const ui = createIntegratedUi<Root>(ctx, {
      position: 'inline',
      anchor: 'h2',
      append: 'last',
      onMount(container) {
        container.style.display = 'inline';
        const root = createRoot(container);
        root.render(<AddToCalendarButton />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });
    ui.autoMount();
    ctx.addEventListener(window, 'wxt:locationchange', () => {
      ui.remove();
      ui.autoMount();
    });
  },
});
