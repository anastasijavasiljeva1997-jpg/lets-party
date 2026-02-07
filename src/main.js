import './scss/main.scss';
import Swiper from 'swiper';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const headerEl = document.querySelector('.header');

// helpers
const lockBody = (lock) => {
  document.body.classList.toggle('body--locked', lock);
};

// Header background
window.addEventListener('scroll', () => {
  if (!headerEl) return;
  headerEl.classList.toggle('header--scrolled', window.scrollY > 30);
});

// Burger menu
const burger = document.querySelector('.burger');
const menu = document.querySelector('.menu');

if (burger && menu) {
  const OPEN_BURGER = 'burger--open';
  const OPEN_MENU = 'menu--open';

  const setMenuOpen = (open) => {
    burger.classList.toggle(OPEN_BURGER, open);
    menu.classList.toggle(OPEN_MENU, open);

    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');

    lockBody(open);
  };

  burger.addEventListener('click', () => {
    setMenuOpen(!menu.classList.contains(OPEN_MENU));
  });

  menu.addEventListener('click', (e) => {
    if (e.target.closest('[data-menu-close]')) {
      setMenuOpen(false);
      return;
    }

    const link = e.target.closest('a[href^="#"]');
    if (link) setMenuOpen(false);
  });
}

const detailsList = Array.from(document.querySelectorAll('.acc-trigger'));

detailsList.forEach((detail) => {
  detail.addEventListener('click', () => {
    detailsList.forEach((d) => {
      if (d !== detail) {
        d.removeAttribute('open');
      }
    });
  });
});

// Клик по "Подробнее"
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-acc]');
  if (!link) return;

  const id = link.dataset.acc;
  if (!id) return;

  const target = document.getElementById(id);
  if (!target || target.tagName !== 'DETAILS') return;

  detailsList.forEach((d) => {
    d.removeAttribute('open');
  });

  target.setAttribute('open', true);
});

const proofDialog = document.querySelector('#proof');
const proofImg = proofDialog?.querySelector('.proof__img');
const proofClose = proofDialog?.querySelector('[data-proof-close]');

const canUseDialog =
  typeof HTMLDialogElement !== 'undefined' &&
  typeof proofDialog?.showModal === 'function';

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-open-proof]');
  if (!btn) return;

  const src = btn.dataset.proofSrc;
  const alt = btn.dataset.proofAlt || 'Оригинал отзыва';
  if (!src) return;

  if (!canUseDialog) {
    window.open(src, '_blank', 'noopener,noreferrer');
    return;
  }

  if (proofImg) {
    proofImg.src = src;
    proofImg.alt = alt;
  }

  proofDialog.showModal();
});

proofClose?.addEventListener('click', () => {
  proofDialog?.close();
});

proofDialog?.addEventListener('close', () => {
  if (!proofImg) return;
  proofImg.src = '';
  proofImg.alt = '';
});

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// swiper

async function initDynamicGallery() {
  const wrapper = document.getElementById('gallery-wrapper');
  if (!wrapper) return;

  const lang = document.documentElement.lang || 'ru';
  const contentPath =
    lang === 'ru' ? '/content/ru.json' : `/content/${lang}.json`;

  try {
    const response = await fetch(contentPath);
    const data = await response.json();

    wrapper.innerHTML = data.gallery
      .map(
        (item) => `
      <div class="swiper-slide">
        <figure class="about__frame">
          <img class="about__slide-img" src="${item.image}" alt="${item.caption}" loading="lazy" decoding="async" />
          <figcaption class="about__cap">${item.caption}</figcaption>
        </figure>
      </div>
    `,
      )
      .join('');

    markPortraitImages(wrapper);

    // 4. Инициализируем Swiper
    new Swiper('.about__slider', {
      modules: [Navigation, Pagination, A11y],
      loop: true,
      speed: 650,
      slidesPerView: 1,
      spaceBetween: 16,
      navigation: {
        nextEl: '.about__nav--next',
        prevEl: '.about__nav--prev',
      },
    });
  } catch (err) {
    console.error('Ошибка загрузки галереи:', err);
  }
}

function markPortraitImages(root) {
  const imgs = root.querySelectorAll('.about__slide-img');
  imgs.forEach((img) => {
    const apply = () => {
      const isPortrait = img.naturalHeight > img.naturalWidth;
      img.classList.toggle('is-contain', isPortrait);
    };
    if (img.complete) apply();
    else img.addEventListener('load', apply, { once: true });
  });
}

// Запуск
initDynamicGallery();
