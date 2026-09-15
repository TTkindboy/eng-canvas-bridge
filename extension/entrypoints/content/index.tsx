import './style.css';
import { useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import calendarAddIcon from '@instructure/ui-icons/svg/Line/calendar-add.svg?raw';
import { addParsedScheduleToCanvas, handleAddToCalendar } from './addToCalendar';

function AddToCalendarButton() {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'submitting' | 'submitted'>('idle');

  async function handleClick() {
    setError(null);
    setStatus('parsing');

    let submitting = false;
    try {
      const schedule = await handleAddToCalendar();
      submitting = true;
      setStatus('submitting');
      await addParsedScheduleToCanvas(schedule);
      setStatus('submitted');
    } catch {
      setStatus('idle');
      setError(submitting
        ? 'Failed to add schedule days to Canvas.'
        : 'Failed to parse this Canvas schedule file.');
    }
  }

  const busy = status === 'parsing' || status === 'submitting';
  const label = status === 'parsing' ? 'Parsing...'
    : status === 'submitting' ? 'Adding...'
    : status === 'submitted' ? 'Added to Canvas'
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
