import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();

const pages = [
  { html: 'index.html', json: 'content/ru.json' },
  { html: 'en/index.html', json: 'content/en.json' },
  { html: 'lv/index.html', json: 'content/lv.json' },
];

pages.forEach((page) => {
  const htmlPath = path.join(__dirname, page.html);
  const jsonPath = path.join(__dirname, page.json);

  if (!fs.existsSync(htmlPath) || !fs.existsSync(jsonPath)) return;

  let html = fs.readFileSync(htmlPath, 'utf8');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // 1. Цены
  Object.keys(data.prices).forEach((key) => {
    html = html.replace(new RegExp(`{{prices.${key}}}`, 'g'), data.prices[key]);
  });

  // 2. FAQ
  const faqHtml = data.faq
    .map(
      (item) => `
    <details class="acc-faq acc-trigger">
      <summary class="acc-faq__summary">
        ${item.question}
        <span class="acc-faq__icon" aria-hidden="true">+</span>
      </summary>
      <div class="acc-faq__panel">
        <div class="acc-faq__content"><p>${item.answer}</p></div>
      </div>
    </details>
  `,
    )
    .join('\n');
  html = html.replace('{{faq_items}}', faqHtml);

  // 3. Отзывы (Markdown ** -> <strong>)
  const reviewsHtml = data.reviews
    .map((rev) => {
      const formattedText = rev.text.replace(
        /\*\*(.*?)\*\*/g,
        '<strong>$1</strong>',
      );
      return `
      <article class="review-card">
        <p class="review-card__text">${formattedText}</p>
        <button class="review-card__btn" type="button" data-open-proof data-proof-src="${rev.image}" data-proof-alt="${rev.image_alt}">
          ${page.json.includes('ru') ? 'Показать оригинал' : page.json.includes('lv') ? 'Rādīt oriģinālu' : 'Show original'}
        </button>
      </article>`;
    })
    .join('\n');
  html = html.replace('{{reviews_items}}', reviewsHtml);

  // Сохраняем результат
  fs.writeFileSync(htmlPath, html);
});

console.log('🚀 Контент успешно внедрен в HTML!');
