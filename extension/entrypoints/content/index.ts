import './style.css';
import calendarAddIcon from '@instructure/ui-icons/svg/Line/calendar-add.svg?raw';

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
        btn.innerHTML = `<span class="cb-btn__content">${calendarAddIcon} Save</span>`;
        container.append(btn);
      },
    });
    ui.autoMount();
  },
});
