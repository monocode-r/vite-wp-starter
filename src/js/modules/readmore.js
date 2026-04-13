import { throttle } from '../utils/throttle.js';

/**
 * 折りたたみリスト + Read More
 *
 * 使用例:
 * <div class="js-readmore" data-readmore-count="3"
 *      data-readmore-label-open="Read More" data-readmore-label-close="Close">
 *   <ul class="js-readmore-list">
 *     <li>...</li>
 *   </ul>
 *   <div class="js-readmore-btn-area">
 *     <button type="button" class="js-readmore-btn">Read More</button>
 *   </div>
 * </div>
 */
function initReadMoreSection(section) {
  if (section.dataset.readmoreInitialized === 'true') return;

  const btn = section.querySelector('.js-readmore-btn');
  const list = section.querySelector('.js-readmore-list');
  if (!btn || !list) return;

  section.dataset.readmoreInitialized = 'true';

  const visibleCount = Math.max(1, parseInt(section.getAttribute('data-readmore-count') || '3', 10));
  const labelOpen = section.getAttribute('data-readmore-label-open') || 'Read More';
  const labelClose = section.getAttribute('data-readmore-label-close') || 'Close';

  const items = [...list.children].filter((el) => el.nodeType === Node.ELEMENT_NODE);
  const btnArea = btn.closest('.js-readmore-btn-area');

  if (items.length <= visibleCount) {
    if (btnArea) btnArea.style.display = 'none';
    return;
  }

  let isOpen = false;

  function getCollapsedHeight() {
    let height = 0;
    const listStyle = window.getComputedStyle(list);
    const gap = parseFloat(listStyle.rowGap) || parseFloat(listStyle.gap) || 0;
    for (let i = 0; i < visibleCount && i < items.length; i++) {
      height += items[i].offsetHeight;
      if (i < visibleCount - 1) {
        height += gap;
      }
    }
    return height;
  }

  const collapsedHeight = getCollapsedHeight();
  list.style.height = `${collapsedHeight}px`;
  list.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    list.style.transition = 'height 0.4s ease';
  });

  btn.setAttribute('aria-expanded', 'false');

  btn.addEventListener('click', function (e) {
    e.preventDefault();

    if (!isOpen) {
      isOpen = true;
      const fullHeight = list.scrollHeight;
      list.style.height = `${fullHeight}px`;

      btn.textContent = labelClose;
      btn.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');

      const onEnd = () => {
        list.removeEventListener('transitionend', onEnd);
        if (isOpen) {
          list.style.height = 'auto';
          list.style.overflow = 'visible';
        }
      };
      list.addEventListener('transitionend', onEnd);
    } else {
      isOpen = false;
      list.style.overflow = 'hidden';
      list.style.height = `${list.scrollHeight}px`;

      list.offsetHeight;
      const newCollapsed = getCollapsedHeight();
      list.style.height = `${newCollapsed}px`;

      btn.textContent = labelOpen;
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  window.addEventListener(
    'resize',
    throttle(function () {
      if (!isOpen) {
        list.style.transition = 'none';
        list.style.height = `${getCollapsedHeight()}px`;
        requestAnimationFrame(() => {
          list.style.transition = 'height 0.4s ease';
        });
      }
    }, 200),
  );
}

export class ReadMore {
  static selector = '.js-readmore';

  static init() {
    document.querySelectorAll('.js-readmore').forEach((section) => {
      initReadMoreSection(section);
    });
  }
}
