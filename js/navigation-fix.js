// navigation-fix.js
// Ensure .card-button elements navigate even if something blocks default link behavior

document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.card-button');
    if (!buttons || buttons.length === 0) return;

    buttons.forEach(btn => {
        // skip language flag buttons if any accidentally have the .card-button class
        if (btn.classList && btn.classList.contains && btn.classList.contains('lang-flag')) return;
        const hrefAttr = btn.getAttribute && btn.getAttribute('href');
        const dataHref = btn.dataset && btn.dataset.href;
        // only attach handler if there is an href or data-href
        const href = hrefAttr || dataHref;
        if (!href) return;

        btn.addEventListener('click', (e) => {
            try {
                if (href) {
                    // If it's an anchor, let normal behavior proceed for modifiers (ctrl/cmd) by detecting mouse button and modifier keys
                    const isAnchor = btn.tagName.toLowerCase() === 'a';
                    const modified = e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0;
                    if (isAnchor && !modified) {
                        // prevent double navigation in case other handlers interfere
                        e.preventDefault();
                        console.log('nav-fix: navigating to', href);
                        window.location.href = href;
                    } else if (!isAnchor) {
                        // For buttons, navigate programmatically
                        e.preventDefault();
                        console.log('nav-fix: navigating (button) to', href);
                        window.location.href = href;
                    }
                }
            } catch (err) {
                console.warn('nav-fix: error handling navigation', err);
            }
        });
    });
});
