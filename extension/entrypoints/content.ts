export default defineContentScript({
  matches: ['*://*.instructure.com/courses/*/files/*'],

  main(ctx) {
    createIntegratedUi(ctx, {
      position: 'inline',
      anchor: 'h2',
      onMount(container) {
        const btn = document.createElement('button')
        btn.textContent = 'Save'
        container.after(btn)
      },
    })
  },
})
