// ========================================
// Shared Utilities & Constants
// ========================================

const HANDLED_INTERNALLY = Symbol('handled');

const THEMES = [
    'light', 'dark', 'black', 'nord', 'newspaper', 'coffee', 'root', 'neon'
];

/**
 * Remove bookmark matching styles from elements
 */
function resetStyles(elements) {
    elements.forEach(el => {
        el.classList.remove("bookmark-match", "bookmark-nomatch", "primary-match");
        el.style.mixBlendMode = "";
    });
}

/**
 * Debounce a function call
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
