import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();

// Массив страниц с актуальными путями к JSON (теперь внутри public)
const pages = [
  { html: 'index.html', json: 'public/content/ru.json' },
  { html: 'en/index.html', json: 'public/content/en.json' },
  { html: 'lv/index.html', json: 'public/content/lv.json' },
];

pages.forEach((page) => {
  const htmlPath = path.join(__dirname, page.html);
  const jsonPath = path.join(__dirname, page.json);

  // Проверка существования файлов
  if (!fs.existsSync(htmlPath)) {
    console.warn(`⚠️ Пропуск: HTML файл не найден по пути ${htmlPath}`);
    return;
  }
  if (!fs.existsSync(jsonPath)) {
    console.warn(`⚠️ Пропуск: JSON файл не найден по пути ${jsonPath}`);
    return;
  }

  try {
    let html = fs.readFileSync(htmlPath, 'utf8');
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // 1. Внедрение цен
    if (data.prices) {
      Object.keys(data.prices).forEach((key) => {
        const placeholder = `{{prices.${key}}}`;
        html = html.split(placeholder).join(data.prices[key]);
      });
    }

    // 2. Внедрение FAQ
    if (data.faq && html.includes('{{faq_items}}')) {
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
    }

    // 3. Внедрение отзывов (Markdown ** -> <strong>)
    if (data.reviews && html.includes('{{reviews_items}}')) {
      const reviewsHtml = data.reviews
        .map((rev) => {
          const formattedText = rev.text.replace(
            /\*\*(.*?)\*\*/g,
            '<strong>$1</strong>',
          );

          let btnText = 'Show original';
          if (page.json.includes('ru.json')) btnText = 'Показать оригинал';
          if (page.json.includes('lv.json')) btnText = 'Rādīt oriģinālu';

          return `
          <article class="review-card">
            <p class="review-card__text">${formattedText}</p>
            <button class="review-card__btn" type="button" data-open-proof data-proof-src="${rev.image}" data-proof-alt="${rev.image_alt}">
              ${btnText}
            </button>
          </article>`;
        })
        .join('\n');
      html = html.replace('{{reviews_items}}', reviewsHtml);
    }

    fs.writeFileSync(htmlPath, html);
    console.log(`✅ Обработано: ${page.html}`);
  } catch (err) {
    console.error(`❌ Ошибка при обработке ${page.html}:`, err);
  }
});

console.log('🚀 Контент успешно внедрен в HTML!');
