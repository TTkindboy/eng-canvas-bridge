import './style.css';
import calendarAddIcon from '@instructure/ui-icons/svg/Line/calendar-add.svg?raw';
import { handleAddToCalendar } from './addToCalendar';

export default defineContentScript({
  matches: ['*://friendsseminary.instructure.com/courses/*/files/*'],

  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      anchor: 'h2',
      append: 'last',
      onMount(container) {
        container.style.display = 'inline';
        const btn = document.createElement('button');
        btn.className = 'cb-btn';
        btn.style.marginLeft = '12px';
        const text = 'Add to Calendar';
        btn.innerHTML = `<span class="cb-btn__content">${calendarAddIcon} ${text}</span>`;
        btn.addEventListener('click', handleAddToCalendar);
        container.append(btn);
      },
    });
    ui.autoMount();
  },
});
