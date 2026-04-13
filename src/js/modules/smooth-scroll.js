/**
 * スムーススクロール
 * 使用例: a[href*="#"] を自動検出します
 * requestAnimationFrameでアニメーション（iOS Safari等で確実に動作）
 */
export class SmoothScroll {
  static selector = 'a[href*="#"]';

  static init() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a[href*="#"]');
      if (!target) return;

      const hash = target.hash;
      if (!hash || hash === '#') return;

      const isSamePage = target.pathname === location.pathname && target.hostname === location.hostname;
      const isHashOnly = target.getAttribute('href')?.startsWith('#');
      if (!isSamePage && !isHashOnly) return;

      const targetElement = document.querySelector(hash);
      if (!targetElement) return;

      e.preventDefault();

      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight : 0;
      const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        window.scrollTo(0, targetPosition);
        targetElement.setAttribute('tabindex', '-1');
        targetElement.focus();
      } else {
        SmoothScroll._animateScroll(targetPosition, targetElement);
      }
    });
  }

  /**
   * requestAnimationFrameでスムーススクロール（モバイル対応）
   */
  static _animateScroll(targetY, targetElement) {
    const startY = window.scrollY;
    const distance = targetY - startY;
    const duration = 400;
    const startTime = performance.now();

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);
      window.scrollTo(0, startY + distance * eased);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else if (targetElement) {
        targetElement.setAttribute('tabindex', '-1');
        targetElement.focus({ preventScroll: true });
      }
    }

    requestAnimationFrame(step);
  }
}
