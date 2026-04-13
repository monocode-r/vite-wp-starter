import { throttle } from '../utils/throttle.js';

/**
 * ページトップボタン
 * 使用例: <button class="js-page-top" aria-label="ページトップへ戻る">↑</button>
 *
 * - スクロール後に表示（MVセクションの80%を超えたら表示）
 * - フッター(.footer)の手前で止まる
 */
export class PageTop {
  static selector = '.js-page-top';

  static init() {
    const pageTopButtons = document.querySelectorAll('.js-page-top');
    if (pageTopButtons.length === 0) return;

    pageTopButtons.forEach((button) => {
      new PageTop(button);
    });
  }

  constructor(button) {
    this.button = button;
    this.wrapper = button.closest('.page-top');
    this.mvSection = document.querySelector('.js-mv-slider') || document.querySelector('.mv');
    this.footer = document.querySelector('.footer');
    this.bottomOffset = 20;
    this.isStoppedAtFooter = false;

    if (!this.button || !this.wrapper) {
      console.warn('ページトップボタンの要素が見つかりません');
      return;
    }

    this.init();
  }

  init() {
    this.updateVisibility();
    this.updatePosition();

    let ticking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            this.updateVisibility();
            this.updatePosition();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true },
    );

    window.addEventListener(
      'resize',
      throttle(() => {
        this.updateVisibility();
        this.updatePosition();
      }, 100),
      { passive: true },
    );

    this.button.addEventListener('click', (e) => {
      e.preventDefault();
      this.scrollToTop();
    });
  }

  updateVisibility() {
    let threshold = 200;

    if (this.mvSection) {
      threshold = this.mvSection.offsetHeight * 0.8;
    }

    const scrollY = window.scrollY || window.pageYOffset;
    if (scrollY > threshold) {
      this.wrapper.classList.add('is-visible');
      this.button.setAttribute('aria-hidden', 'false');
    } else {
      this.wrapper.classList.remove('is-visible');
      this.button.setAttribute('aria-hidden', 'true');
    }
  }

  updatePosition() {
    if (!this.footer) return;

    const footerRect = this.footer.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    const buttonBottomFromViewport = windowHeight - this.bottomOffset;

    if (footerRect.top < buttonBottomFromViewport) {
      const newBottom = windowHeight - footerRect.top + this.bottomOffset;
      this.wrapper.style.bottom = `${newBottom}px`;
      this.isStoppedAtFooter = true;
    } else if (this.isStoppedAtFooter) {
      this.wrapper.style.bottom = '';
      this.isStoppedAtFooter = false;
    }
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}
