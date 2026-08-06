const navToggle = document.getElementById('nav-toggle')
const navClose = document.getElementById('nav-close')
const navOverlay = document.getElementById('nav-overlay')
const navSidebar = document.getElementById('nav-sidebar')

// Keep this in sync with --nav-breakpoint in shared/header.css
const navDesktopQuery = window.matchMedia('(min-width: 769px)')

function openNav() {
  document.body.classList.add('nav-open')
  navToggle.setAttribute('aria-expanded', 'true')
  navSidebar.setAttribute('aria-hidden', 'false')
  navClose.focus()
}

function closeNav({ restoreFocus = false } = {}) {
  if (!document.body.classList.contains('nav-open')) return
  document.body.classList.remove('nav-open')
  navToggle.setAttribute('aria-expanded', 'false')
  navSidebar.setAttribute('aria-hidden', 'true')
  if (restoreFocus) navToggle.focus()
}

navToggle.addEventListener('click', openNav)
navClose.addEventListener('click', () => closeNav({ restoreFocus: true }))

// A click anywhere outside the sidebar closes it; the overlay covers the whole
// screen while the sidebar is open, so clicks never reach the page behind it.
navOverlay.addEventListener('click', () => closeNav())

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeNav({ restoreFocus: true })
})

// Resizing past the breakpoint brings the normal links back — drop the sidebar state.
navDesktopQuery.addEventListener('change', event => {
  if (event.matches) closeNav()
})
