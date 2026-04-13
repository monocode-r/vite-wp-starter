// ========================================
// 画像拡大モーダル制御
// ========================================
export class Modal {
  static selector = '.js-modal';

  static init() {
    const modal = document.querySelector('.js-modal');
    if (!modal) return;

    const modalImg = modal.querySelector('.js-modal-img');
    const openTargets = document.querySelectorAll('.js-modal-open');
    const closeButtons = document.querySelectorAll('.js-modal-close');

    openTargets.forEach((target) => {
      if (target.dataset.magnifyInitialized) return;
      target.dataset.magnifyInitialized = 'true';

      target.addEventListener('click', (e) => {
        e.preventDefault();

        if (window.matchMedia('(min-width: 768px)').matches) return;

        const container = target.closest('.js-modal-container');
        const img = container ? container.querySelector('.js-modal-target-img') : null;

        if (img) {
          modalImg.src = img.src;
          modalImg.alt = img.alt;

          modal.classList.add('is-active');
          modal.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    closeButtons.forEach((btn) => {
      if (btn.dataset.magnifyInitialized) return;
      btn.dataset.magnifyInitialized = 'true';

      btn.addEventListener('click', () => {
        modal.classList.remove('is-active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';

        setTimeout(() => {
          if (!modal.classList.contains('is-active')) {
            modalImg.src = '';
          }
        }, 400);
      });
    });
  }
}
