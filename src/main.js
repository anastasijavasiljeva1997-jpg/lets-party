import './scss/main.scss';
import Swiper from 'swiper';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const SELECTORS = {
  header: '.header',
  burger: '.burger',
  menu: '.menu',
  detailsTrigger: '.acc-trigger',
  accLink: 'a[data-acc]',
  proofDialog: '#proof',
  proofImg: '.proof__img',
  proofClose: '[data-proof-close]',
  proofOpen: '[data-open-proof]',
  announcements: '[data-announcements]',
  announcementsSlider: '.announcements__slider',
  announcementsWrapper: '.announcements__wrapper',
  announcementImage: '.announcement-card__img',
  gallerySlider: '.gallery__slider',
  galleryWrapper: '#gallery-wrapper',
  galleryImage: '.gallery__slide-img',
  year: '#year',
};

const CLASSES = {
  bodyLocked: 'body--locked',
  headerScrolled: 'header--scrolled',
  burgerOpen: 'burger--open',
  menuOpen: 'menu--open',
  portraitContain: 'is-contain',
};

const ATTRS = {
  ariaExpanded: 'aria-expanded',
  ariaHidden: 'aria-hidden',
};

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function setBodyLocked(locked) {
  document.body.classList.toggle(CLASSES.bodyLocked, locked);
}

function initHeaderScrollState() {
  const headerEl = qs(SELECTORS.header);
  if (!headerEl) return;

  const updateHeaderState = () => {
    headerEl.classList.toggle(CLASSES.headerScrolled, window.scrollY > 30);
  };

  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });
}

function initMobileMenu() {
  const burger = qs(SELECTORS.burger);
  const menu = qs(SELECTORS.menu);

  if (!burger || !menu) return;

  const setMenuOpen = (open) => {
    burger.classList.toggle(CLASSES.burgerOpen, open);
    menu.classList.toggle(CLASSES.menuOpen, open);

    burger.setAttribute(ATTRS.ariaExpanded, open ? 'true' : 'false');
    menu.setAttribute(ATTRS.ariaHidden, open ? 'false' : 'true');

    setBodyLocked(open);
  };

  burger.addEventListener('click', () => {
    setMenuOpen(!menu.classList.contains(CLASSES.menuOpen));
  });

  menu.addEventListener('click', (event) => {
    if (event.target.closest('[data-menu-close]')) {
      setMenuOpen(false);
      return;
    }

    if (event.target.closest('a[href^="#"]')) {
      setMenuOpen(false);
    }
  });
}

function initAccordions() {
  const detailsList = qsa(SELECTORS.detailsTrigger);
  if (!detailsList.length) return;

  detailsList.forEach((detail) => {
    detail.addEventListener('click', () => {
      detailsList.forEach((otherDetail) => {
        if (otherDetail !== detail) {
          otherDetail.removeAttribute('open');
        }
      });
    });
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest(SELECTORS.accLink);
    if (!link) return;

    const id = link.dataset.acc;
    if (!id) return;

    const target = document.getElementById(id);
    if (!target || target.tagName !== 'DETAILS') return;

    detailsList.forEach((detail) => detail.removeAttribute('open'));
    target.setAttribute('open', '');
  });
}

function initProofDialog() {
  const proofDialog = qs(SELECTORS.proofDialog);
  if (!proofDialog) return;

  const proofImg = qs(SELECTORS.proofImg, proofDialog);
  const proofClose = qs(SELECTORS.proofClose, proofDialog);

  const canUseDialog =
    typeof HTMLDialogElement !== 'undefined' &&
    typeof proofDialog.showModal === 'function';

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest(SELECTORS.proofOpen);
    if (!trigger) return;

    const src = trigger.dataset.proofSrc;
    const alt = trigger.dataset.proofAlt || 'Оригинал отзыва';
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

  proofClose?.addEventListener('click', () => proofDialog.close());

  proofDialog.addEventListener('close', () => {
    if (!proofImg) return;
    proofImg.src = '';
    proofImg.alt = '';
  });
}

function initCurrentYear() {
  const yearEl = qs(SELECTORS.year);
  if (!yearEl) return;

  yearEl.textContent = String(new Date().getFullYear());
}

function markPortraitImages(root, selector = SELECTORS.galleryImage) {
  const images = qsa(selector, root);

  images.forEach((image) => {
    const applyOrientationClass = () => {
      const isPortrait = image.naturalHeight > image.naturalWidth;
      image.classList.toggle(CLASSES.portraitContain, isPortrait);
    };

    if (image.complete) {
      applyOrientationClass();
      return;
    }

    image.addEventListener('load', applyOrientationClass, { once: true });
  });
}

function getLocalizedDate(dateValue, locale = 'ru-RU') {
  if (!dateValue) return '';

  const dateParts = dateValue.split('-').map(Number);
  const date =
    dateParts.length === 3
      ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
      : new Date(dateValue);

  if (Number.isNaN(date.getTime())) return dateValue;

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function createAnnouncementSlide(item, options = {}) {
  const slide = document.createElement('div');
  slide.className = 'swiper-slide';

  const article = document.createElement('article');
  article.className = 'announcement-card';

  const media = document.createElement('div');
  media.className = 'announcement-card__media';

  const backgroundImage = document.createElement('img');
  backgroundImage.className = 'announcement-card__bg';
  backgroundImage.src = item.image;
  backgroundImage.alt = '';
  backgroundImage.setAttribute('aria-hidden', 'true');
  backgroundImage.loading = 'lazy';
  backgroundImage.decoding = 'async';

  const image = document.createElement('img');
  image.className = 'announcement-card__img';
  image.src = item.image;
  image.alt = options.imageAlt || 'Let’s Party event announcement';
  image.loading = 'lazy';
  image.decoding = 'async';
  media.append(backgroundImage, image);

  const body = document.createElement('div');
  body.className = 'announcement-card__body';

  const date = document.createElement('time');
  date.className = 'announcement-card__date';
  date.dateTime = item.date || '';
  date.textContent = getLocalizedDate(item.date, options.locale);

  const title = document.createElement('h3');
  title.className = 'announcement-card__title';
  title.textContent = item.title;

  const description = document.createElement('p');
  description.className = 'announcement-card__text';
  description.textContent = item.description;

  body.append(date, title, description);

  if (item.cta_text) {
    const cta = document.createElement('a');
    cta.className = 'announcement-card__cta';
    cta.href = '#booking';
    cta.textContent = item.cta_text;
    body.append(cta);
  }

  article.append(media, body);
  slide.append(article);

  return slide;
}

async function initAnnouncements() {
  const section = qs(SELECTORS.announcements);
  if (!section) return;

  const sliderEl = qs(SELECTORS.announcementsSlider, section);
  const wrapper = qs(SELECTORS.announcementsWrapper, section);
  const contentPath = section.dataset.announcementsSrc;
  const locale = section.dataset.locale || document.documentElement.lang;
  const imageAlt = section.dataset.imageAlt;

  if (!sliderEl || !wrapper || !contentPath) return;

  try {
    const response = await fetch(contentPath);
    if (!response.ok) {
      throw new Error(`Failed to load ${contentPath}`);
    }

    const data = await response.json();
    const announcements = Array.isArray(data.announcements)
      ? data.announcements.filter(
          (item) => item.date && item.image && item.title && item.description,
        )
      : [];

    if (!announcements.length) return;

    wrapper.replaceChildren(
      ...announcements.map((item) =>
        createAnnouncementSlide(item, { locale, imageAlt }),
      ),
    );
    markPortraitImages(wrapper, SELECTORS.announcementImage);
    section.hidden = false;

    new Swiper(sliderEl, {
      modules: [Navigation, Pagination, A11y],
      loop: announcements.length > 1,
      speed: 650,
      slidesPerView: 1,
      spaceBetween: 20,
      navigation: {
        nextEl: qs('.announcements__nav--next', section),
        prevEl: qs('.announcements__nav--prev', section),
      },
      pagination: {
        el: qs('.announcements__pagination', section),
        clickable: true,
      },
      a11y: true,
      grabCursor: announcements.length > 1,
    });
  } catch (error) {
    console.error('Ошибка загрузки анонсов:', error);
  }
}

function createGallerySlides(gallery) {
  return gallery
    .map(
      (item) => `
      <div class="swiper-slide">
        <figure class="gallery__frame">
          <img class="gallery__slide-img" src="${item.image}" alt="${item.caption}" loading="lazy" decoding="async" />
          <figcaption class="gallery__cap">${item.caption}</figcaption>
        </figure>
      </div>
    `,
    )
    .join('');
}

async function initDynamicGallery() {
  const sliderEl = qs(SELECTORS.gallerySlider);
  const wrapper = qs(SELECTORS.galleryWrapper);

  if (!sliderEl || !wrapper) return;

  const contentPath = '/content/gallery.json';

  try {
    const response = await fetch(contentPath);
    if (!response.ok) {
      throw new Error(`Failed to load ${contentPath}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.gallery) || data.gallery.length === 0) return;

    wrapper.innerHTML = createGallerySlides(data.gallery);
    markPortraitImages(wrapper);

    new Swiper(sliderEl, {
      modules: [Navigation, Pagination, A11y],
      loop: true,
      speed: 800,
      slidesPerView: 1,
      spaceBetween: 20,
      navigation: {
        nextEl: '.gallery__nav--next',
        prevEl: '.gallery__nav--prev',
      },
      pagination: {
        el: '.gallery__pagination',
        clickable: true,
      },
      a11y: true,
      grabCursor: true,
    });
  } catch (error) {
    console.error('Ошибка загрузки галереи:', error);
  }
}

function initApp() {
  initHeaderScrollState();
  initMobileMenu();
  initAccordions();
  initProofDialog();
  initCurrentYear();
  initAnnouncements();
  initDynamicGallery();
}

initApp();
