import './style.css';
import { useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import calendarAddIcon from '@instructure/ui-icons/svg/Line/calendar-add.svg?raw';
import type { DualSchedule } from '@/lib/client/types.gen';
import { addParsedScheduleToCanvas, handleAddToCalendar } from './addToCalendar';

function AddToCalendarButton() {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'submitting' | 'submitted'>('idle');
  const submission = useRef({
    filePath: '',
    schedule: null as DualSchedule | null,
    completedNotes: new Set<number>(),
  });

  async function handleClick() {
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
    }
  }

  const busy = status === 'parsing' || status === 'submitting';
  const label = status === 'parsing' ? 'Parsing...'
    : status === 'submitting' ? 'Adding...'
    : status === 'submitted' ? 'Added to Canvas'
    : error && submission.current.schedule ? 'Retry remaining notes'
    : 'Add to Calendar';

  return (
    <span className="cb-root">
      <button className="cb-btn" type="button" disabled={busy || status === 'submitted'} onClick={handleClick}>
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
  },
});
