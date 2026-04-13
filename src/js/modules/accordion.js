import { throttle } from '../utils/throttle.js';

/**
 * アコーディオン
 * 使用例: <button class="js-accordion-btn">タイトル</button>
 *         <div class="js-accordion-content">コンテンツ</div>
 *
 *         または
 *
 *         <div>
 *           <button class="js-accordion-btn">タイトル</button>
 *           <div class="js-accordion-content">コンテンツ</div>
 *         </div>
 */
export class Accordion {
  static selector = '.js-accordion-btn';

  /** 排他制御用：グループIDごとのインスタンス一覧 */
  static instancesByGroup = new Map();

  static init() {
    const buttons = document.querySelectorAll('.js-accordion-btn');
    if (buttons.length === 0) return;

    buttons.forEach((button) => {
      if (button.dataset.accordionInitialized === 'true') {
        return;
      }
      new Accordion(button);
    });
  }

  constructor(button) {
    this.button = button;
    this.content = this.findContent(button);

    if (!this.content) {
      console.warn('アコーディオンのコンテンツ要素が見つかりません', button);
      return;
    }

    this.button.dataset.accordionInitialized = 'true';
    this.isOpen = this.button.classList.contains('is-open');

    const groupEl = this.button.closest('[data-accordion-exclusive]');
    if (groupEl) {
      const groupId = groupEl.getAttribute('data-accordion-exclusive') || 'default';
      if (!Accordion.instancesByGroup.has(groupId)) {
        Accordion.instancesByGroup.set(groupId, new Set());
      }
      Accordion.instancesByGroup.get(groupId).add(this);
    }

    this.init();
  }

  findContent(button) {
    let nextSibling = button.nextElementSibling;
    if (nextSibling && nextSibling.classList.contains('js-accordion-content')) {
      return nextSibling;
    }

    const parent = button.parentElement;
    if (parent) {
      const content = parent.querySelector('.js-accordion-content');
      if (content && parent.contains(content)) {
        return content;
      }
    }

    return null;
  }

  init() {
    window.addEventListener(
      'resize',
      throttle(() => {
        this.handleResize();
      }, 200),
      { passive: true },
    );

    this.isOpen = false;
    this.button.classList.remove('is-open');
    this.updateAria();
    this.content.style.height = '0';
    this.content.style.overflow = 'hidden';

    this.button.addEventListener('click', (e) => {
      if (this.button.tagName === 'A') {
        e.preventDefault();
      }
      this.toggle();
    });
  }

  handleResize() {
    if (this.isOpen) {
      this.updateContentHeight();
    }
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    const groupEl = this.button.closest('[data-accordion-exclusive]');
    if (groupEl) {
      const groupId = groupEl.getAttribute('data-accordion-exclusive') || 'default';
      const groupInstances = Accordion.instancesByGroup.get(groupId);
      if (groupInstances) {
        groupInstances.forEach((instance) => {
          if (instance !== this && instance.isOpen) {
            instance.close();
          }
        });
      }
    }

    this.isOpen = true;
    this.button.classList.add('is-open');
    this.updateAria();

    const currentHeight = this.content.style.height || '0';

    this.content.style.height = 'auto';
    const targetHeight = this.content.scrollHeight;

    this.content.style.height = currentHeight;

    requestAnimationFrame(() => {
      this.content.style.height = `${targetHeight}px`;
    });

    this.content.addEventListener(
      'transitionend',
      () => {
        if (this.isOpen) {
          this.content.style.overflow = 'visible';
        }
      },
      { once: true },
    );
  }

  close() {
    this.isOpen = false;
    this.button.classList.remove('is-open');
    this.updateAria();

    this.content.style.overflow = 'hidden';
    this.content.style.height = '0';
  }

  updateAria() {
    this.button.setAttribute('aria-expanded', this.isOpen);
    this.content.setAttribute('aria-hidden', !this.isOpen);
  }

  updateContentHeight() {
    if (this.isOpen) {
      this.content.style.height = 'auto';
      const height = this.content.scrollHeight;
      this.content.style.height = `${height}px`;
    }
  }
}
