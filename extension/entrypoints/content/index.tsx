import './style.css';
import { createRoot, type Root } from 'react-dom/client';
import calendarAddIcon from '@instructure/ui-icons/svg/Line/calendar-add.svg?raw';
import { handleAddToCalendar } from './addToCalendar';

function AddToCalendarButton() {
  return (
    <button className="cb-btn" style={{ marginLeft: 12 }} type="button" onClick={handleAddToCalendar}>
      <span className="cb-btn__content">
        <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: calendarAddIcon }} />
        Add to Calendar
      </span>
    </button>
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
