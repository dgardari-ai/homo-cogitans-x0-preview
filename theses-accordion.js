/* Ключевые тезисы: самостоятельные вводные пояснения по монографии.
   Авторские тексты монографии и трактата не изменяются. */
(() => {
  'use strict';
  const list = document.getElementById('hc-theses-list');
  if (!list) return;

  const items = Array.from(list.querySelectorAll('.hc-thesis-item'));
  if (items.length !== 9) {
    console.error('Ожидались девять тезисов, обнаружено:', items.length);
    return;
  }

  const sources = [
    {groupId:'m-2',line:200,number:2},
    {groupId:'m-1',line:12,number:1},
    {groupId:'m-1',line:5,number:1},
    {groupId:'m-3',line:332,number:3},
    {groupId:'m-3',line:426,number:3},
    {groupId:'m-3',line:356,number:3},
    {groupId:'m-2',line:241,number:2},
    {groupId:'m-1',line:182,number:1},
    {groupId:'m-3',line:293,number:3}
  ];

  const addDeepLink = (target, source) => {
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'hc-outline-button hc-thesis-deep-link';
    link.textContent = `ЧИТАТЬ В МОНОГРАФИИ · БЕСЕДА ${source.number}`;
    link.setAttribute('aria-label', `Перейти к беседе ${source.number} монографии Мышление х.0`);
    link.setAttribute('data-vmg-edit-target', 'Кнопка перехода в монографию');
    link.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('hc:navigate', {
        detail: {route:'master', groupId:source.groupId, line:source.line}
      }));
    });
    target.appendChild(link);
  };

  const contentReady = fetch('content/thesis-explanations-v2.json')
    .then(response => {
      if (!response.ok) throw new Error(`Пояснения: HTTP ${response.status}`);
      return response.json();
    })
    .then(content => {
      if (!content || !Array.isArray(content.theses) || content.theses.length !== items.length) {
        throw new Error('Ожидаются девять пояснений');
      }
      content.theses.forEach((thesis, index) => {
        const source = sources[index];
        if (thesis.id !== index + 1 ||
            !thesis.source || thesis.source.groupId !== source.groupId ||
            thesis.source.line !== source.line ||
            !Array.isArray(thesis.paragraphs) || thesis.paragraphs.length === 0) {
          throw new Error(`Неверные данные пояснения ${index + 1}`);
        }
        const target = items[index].querySelector('.hc-thesis-panel-inner');
        thesis.paragraphs.forEach((text, paragraphIndex) => {
          if (typeof text !== 'string' || !text.trim()) {
            throw new Error(`Пустой абзац пояснения ${index + 1}`);
          }
          const paragraph = document.createElement('p');
          paragraph.textContent = text;
          paragraph.setAttribute('data-vmg-edit-target',
            `Пояснение · тезис ${String(index + 1).padStart(2,'0')} · абзац ${paragraphIndex + 1}`);
          target.appendChild(paragraph);
        });
        addDeepLink(target, source);
      });
    })
    .catch(error => {
      console.error('Не удалось загрузить пояснения по монографии', error);
      items.forEach((item, index) => {
        const target = item.querySelector('.hc-thesis-panel-inner');
        target.replaceChildren();
        const note = document.createElement('p');
        note.textContent = 'Пояснение временно недоступно. Можно открыть соответствующую беседу монографии.';
        target.appendChild(note);
        addDeepLink(target, sources[index]);
      });
    });

  const setOpen = (item, open) => {
    const trigger = item.querySelector('.hc-thesis-trigger');
    const panel = item.querySelector('.hc-thesis-panel');
    item.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    panel.inert = !open;
  };

  items.forEach(item => {
    item.querySelector('.hc-thesis-trigger').addEventListener('click', async () => {
      await contentReady;
      const shouldOpen = !item.classList.contains('is-open');
      items.forEach(other => setOpen(other, other === item && shouldOpen));
    });
  });
})();
