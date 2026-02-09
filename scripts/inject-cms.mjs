import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();

const pages = [
  {
    template: 'templates/index.ru.html',
    output: 'index.html',
    json: 'public/content/ru.json',
  },
  {
    template: 'templates/index.en.html',
    output: 'en/index.html',
    json: 'public/content/en.json',
  },
  {
    template: 'templates/index.lv.html',
    output: 'lv/index.html',
    json: 'public/content/lv.json',
  },
];

pages.forEach((page) => {
  const templatePath = path.join(__dirname, page.template);
  const outputPath = path.join(__dirname, page.output);
  const jsonPath = path.join(__dirname, page.json);

  if (!fs.existsSync(templatePath)) {
    console.warn(`⚠️ Пропуск: Шаблон не найден по пути ${templatePath}`);
    return;
  }
  if (!fs.existsSync(jsonPath)) {
    console.warn(`⚠️ Пропуск: JSON с данными не найден по пути ${jsonPath}`);
    return;
  }

  try {
    let html = fs.readFileSync(templatePath, 'utf8');
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // 1. Внедрение цен
    if (data.prices) {
      Object.keys(data.prices).forEach((key) => {
        const placeholder = `{{prices.${key}}}`;
        html = html.split(placeholder).join(data.prices[key]);
      });
    }

    // 2. Внедрение ФОРМАТОВ (Party Mafia, Bunker и т.д.)
    // Проходим по ключам объекта formats и заменяем title и description
    if (data.formats) {
      Object.keys(data.formats).forEach((key) => {
        const titlePlaceholder = `{{formats.${key}.title}}`;
        const descPlaceholder = `{{formats.${key}.description}}`;

        if (html.includes(titlePlaceholder)) {
          html = html.split(titlePlaceholder).join(data.formats[key].title);
        }
        if (html.includes(descPlaceholder)) {
          html = html
            .split(descPlaceholder)
            .join(data.formats[key].description);
        }
      });
    }

    // 3. Внедрение FAQ
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

    // 4. Внедрение отзывов
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

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, html);
    console.log(`✅ Сгенерирован файл: ${page.output}`);
  } catch (err) {
    console.error(`❌ Ошибка при обработке ${page.template}:`, err);
  }
});

console.log('🚀 Все страницы успешно обновлены из шаблонов!');
