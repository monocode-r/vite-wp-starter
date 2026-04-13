import { throttle } from '../utils/throttle.js';

// ========================================
// スクロール量に応じてis-activeを切り替えるページ（初期状態ではis-activeを付与しない）
// 下層ページで同様の挙動にしたい場合はパスを配列に追加
// ========================================
const SCROLL_BASED_HEADER_PATHS = ['/', '/index.html', '/recruit/'];

function shouldUseScrollBasedHeader(pathname) {
  return SCROLL_BASED_HEADER_PATHS.some((pattern) => {
    if (pathname === pattern) return true;
    if (pattern.endsWith('/')) {
      const base = pattern.slice(0, -1);
      return pathname === base || pathname === pattern + 'index.html';
    }
    return false;
  });
}

// ========================================
// ヘッダーロゴのタグ切り替え（トップページ: h1 / 下層ページ: div）
// ========================================
function initHeaderLogo() {
  const logoElement = document.querySelector('.js-header-logo');
  if (!logoElement) return;

  const pathname = window.location.pathname;
  const isTopPage = pathname === '/' || pathname === '/index.html';

  if (!isTopPage) {
    const div = document.createElement('div');
    div.className = logoElement.className;
    div.innerHTML = logoElement.innerHTML;
    logoElement.parentNode.replaceChild(div, logoElement);
    document.body.classList.add('is-sub-page');
  }
}

// ========================================
// SP用サブメニューアコーディオン
// ========================================
function initSubMenuAccordion() {
  const toggleButtons = document.querySelectorAll('.js-sub-menu-toggle');

  toggleButtons.forEach((button) => {
    if (button.dataset.initialized) return;
    button.dataset.initialized = 'true';

    button.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (window.matchMedia('(min-width: 768px)').matches) return;

      const subMenu = this.closest('.sub-menu');
      const subMenuWrap = subMenu.querySelector('.sub-menu__wrap');

      const isOpen = this.classList.contains('is-active');

      if (isOpen) {
        this.classList.remove('is-active');
        this.setAttribute('aria-expanded', 'false');
        subMenuWrap.classList.remove('is-open');
      } else {
        this.classList.add('is-active');
        this.setAttribute('aria-expanded', 'true');
        subMenuWrap.classList.add('is-open');
      }
    });
  });
}

// ========================================
// ヘッダー制御
// ========================================
export class Header {
  static selector = '.js-header';

  static init() {
    const header = document.querySelector('.js-header');
    if (!header) return;
    if (header.dataset.headerInitialized === 'true') return;
    header.dataset.headerInitialized = 'true';

    initHeaderLogo();

    const pathname = window.location.pathname;

    if (!shouldUseScrollBasedHeader(pathname)) {
      header.classList.add('is-active');
      initSubMenuAccordion();
      return;
    }

    let ticking = false;

    const handleScroll = () => {
      const mvSection = document.querySelector('.js-mv-slider');
      let threshold = 100;

      if (mvSection) {
        threshold = mvSection.offsetHeight * 0.8;
      }

      if (window.scrollY > threshold) {
        header.classList.add('is-active');
      } else {
        header.classList.remove('is-active');
      }
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(handleScroll);
        ticking = true;
      }
    });
    handleScroll();

    initSubMenuAccordion();
  }
}

window.addEventListener(
  'resize',
  throttle(function () {
    if (window.matchMedia('(min-width: 768px)').matches) {
      const toggleButtons = document.querySelectorAll('.js-sub-menu-toggle');
      const subMenuWraps = document.querySelectorAll('.sub-menu__wrap');

      toggleButtons.forEach((btn) => {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-expanded', 'false');
      });

      subMenuWraps.forEach((wrap) => {
        wrap.classList.remove('is-open');
      });
    }
  }, 200),
);
