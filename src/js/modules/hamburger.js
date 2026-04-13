/**
 * ハンバーガーメニュー（ドロワー）
 * 使用例: <button class="c-hamburger-btn js-hamburger-btn" aria-label="メニューを開く">
 *           <span class="c-hamburger-btn__line"></span>
 *           <span class="c-hamburger-btn__line"></span>
 *           <span class="c-hamburger-btn__line"></span>
 *         </button>
 *         <nav class="js-hamburger-menu">...</nav>
 */
export class Hamburger {
  static selector = '.js-hamburger-btn';

  static init() {
    const buttons = document.querySelectorAll('.js-hamburger-btn');
    if (buttons.length === 0) return;

    buttons.forEach((button) => {
      new Hamburger(button);
    });
  }

  constructor(button) {
    this.button = button;
    this.menu = document.querySelector(this.button.getAttribute('data-target') || '.js-hamburger-menu');
    this.isOpen = false;

    if (!this.menu) {
      console.warn('ハンバーガーメニューの対象要素が見つかりません');
      return;
    }

    this.init();
  }

  init() {
    this.button.setAttribute('aria-expanded', 'false');
    if (!this.button.getAttribute('aria-label')) {
      this.button.setAttribute('aria-label', 'メニューを開く');
    }
    this.menu.setAttribute('aria-hidden', 'true');

    this.button.addEventListener('click', () => this.toggle());

    this.menu.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('.header__drawer-close');
      if (closeBtn) {
        this.close();
        return;
      }
      const link = e.target.closest('a[href]');
      if (link && !link.hasAttribute('target') && !link.getAttribute('href')?.startsWith('mailto:')) {
        this.close();
      }
    });

    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.button.contains(e.target) && !this.menu.contains(e.target)) {
        this.close();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    this.button.setAttribute('aria-expanded', 'true');
    this.button.setAttribute('aria-label', 'メニューを閉じる');
    this.button.classList.add('is-active');
    this.menu.classList.add('is-open');
    this.menu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-menu-open');
  }

  close() {
    this.isOpen = false;
    this.button.setAttribute('aria-expanded', 'false');
    this.button.setAttribute('aria-label', 'メニューを開く');
    this.button.classList.remove('is-active');
    this.menu.classList.remove('is-open');
    this.menu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-menu-open');

    this.resetAccordions();
  }

  resetAccordions() {
    const accordionButtons = this.menu.querySelectorAll('.js-accordion-btn');
    accordionButtons.forEach((btn) => {
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');

      const content = btn.nextElementSibling?.classList.contains('js-accordion-content') ? btn.nextElementSibling : btn.parentElement?.querySelector('.js-accordion-content');

      if (content) {
        content.style.height = '0';
        content.style.overflow = 'hidden';
        content.setAttribute('aria-hidden', 'true');
      }
    });
  }
}
