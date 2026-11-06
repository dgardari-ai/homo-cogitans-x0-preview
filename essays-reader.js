/* Reader for the two distinct authorial essay corpora. Source text is never rewritten. */
(() => {
  'use strict';
  const paper = document.getElementById('hc-text-content-essays');
  const index = window.HC_ESSAY_OUTLINE;
  if (!paper || !index) return;

  const ordered = index.groups.flatMap(group =>
    group.children.map(entry => ({group, entry, book: group.source === 'КНИГА II' ? 2 : 1}))
  );
  const cached = new Map();
  const display = window.HC_TEXT_DISPLAY;
  let activeItem = null;
  let revision = 0;

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  async function getCorpus(book) {
    if (!cached.has(book)) {
      const promise = fetch('essay-book' + book + '.json')
        .then(response => {
          if (!response.ok) throw new Error('Не удалось открыть корпус эссе (' + response.status + ').');
          return response.json();
        })
        .catch(error => { cached.delete(book); throw error; });
      cached.set(book, promise);
    }
    return cached.get(book);
  }

  function appendProse(container, markdown) {
    const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
    let list = null;
    for (const original of lines) {
      const line = original.trim();
      if (!line) { list = null; continue; }
      const header = line.match(/^(#{2,4})\s+(.+)$/);
      if (header) {
        list = null;
        const heading = element('h' + Math.min(4, header[1].length + 1), 'hc-text-heading');
        heading.innerHTML = display.inline(header[2]);
        container.append(heading);
        continue;
      }
      const bullet = line.match(/^[-*]\s+(.+)$/);
      const numbered = line.match(/^\d+\.\s+(.+)$/);
      if (bullet || numbered) {
        const kind = numbered ? 'ol' : 'ul';
        if (!list || list.tagName.toLowerCase() !== kind) {
          list = element(kind, 'hc-text-list');
          container.append(list);
        }
        const li = element('li');
        li.innerHTML = display.inline((bullet || numbered)[1]);
        list.append(li);
        continue;
      }
      list = null;
      if (/^---+$/.test(line)) continue;
      const paragraph = element('p');
      paragraph.innerHTML = display.inline(line);
      container.append(paragraph);
    }
  }

  function dispatchActive(item) {
    document.dispatchEvent(new CustomEvent('hc:reader-active', {
      detail: {route:'essays', groupId:item.group.id, line:item.entry.line}
    }));
  }

  function navigationButton(label, target, className) {
    const button = element('button', 'hc-outline-button ' + className, label);
    button.type = 'button';
    if (!target) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    } else {
      button.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('hc:navigate', {
          detail: {route:'essays', groupId:target.group.id, line:target.entry.line}
        }));
      });
    }
    return button;
  }

  function render(item, essay, corpus) {
    const position = ordered.findIndex(next => next.entry.id === item.entry.id);
    const outer = element('div', 'hc-text-paper-inner');
    const eyebrow = element('p', 'hc-essay-eyebrow');
    eyebrow.textContent = 'ЭССЕ ' + item.entry.displayNumber + ' / ' + String(index.count).padStart(2, '0');
    const body = element('div', 'hc-text-body');
    body.dataset.group = item.group.id;
    const heading = element('h1', 'hc-text-heading hc-text-guided', essay.title.replace(/^Э\d{1,3}\.\s*/u, ''));
    const dots = element('span', 'hc-heading-dotline');
    dots.setAttribute('aria-hidden', 'true');
    heading.append(dots);
    body.append(heading);
    appendProse(body, essay.body);
    const origin = element('p', 'hc-essay-origin',
      'Авторский исследовательский текст из корпуса эссе. Материал для книг, а не глава готовой рукописи.');
    const actions = element('nav', 'hc-text-paper-actions');
    actions.setAttribute('aria-label', 'Навигация по эссе');
    actions.append(navigationButton('ПРЕДЫДУЩЕЕ', ordered[position - 1], 'hc-reader-prev'));
    const contents = element('button', 'hc-outline-button hc-reader-contents', 'ОГЛАВЛЕНИЕ');
    contents.type = 'button';
    contents.addEventListener('click', () => document.getElementById('hc-toc-toggle')?.click());
    actions.append(contents, navigationButton('СЛЕДУЮЩЕЕ', ordered[position + 1], 'hc-reader-next'));
    outer.append(eyebrow, body, origin, actions);
    paper.replaceChildren(outer);
    paper.classList.remove('is-loading');
    dispatchActive(item);
  }

  async function show(item) {
    if (!item) return;
    activeItem = item;
    const currentRevision = ++revision;
    paper.classList.add('is-loading');
    paper.replaceChildren(element('p', 'hc-text-loading', 'ОТКРЫВАЕМ ЭССЕ…'));
    try {
      const corpus = await getCorpus(item.book);
      if (currentRevision !== revision) return;
      const essay = corpus.essays.find(entry => entry.id === item.entry.id);
      if (!essay) throw new Error('Эссе не найдено в исходном корпусе.');
      render(item, essay, corpus);
    } catch (error) {
      if (currentRevision !== revision) return;
      paper.classList.remove('is-loading');
      paper.replaceChildren(element('p','hc-text-error','Не удалось открыть эссе. ' + error.message));
    }
  }

  function resolve(groupId, line) {
    const group = index.groups.find(entry => entry.id === groupId);
    if (!group) return activeItem || ordered[0];
    const entry = group.children.find(child => child.line === line) || group.children[0];
    return ordered.find(item => item.entry.id === entry?.id) || ordered[0];
  }

  document.addEventListener('hc:reader-request', event => {
    if (event.detail?.route !== 'essays') return;
    show(resolve(event.detail.groupId, event.detail.line));
  });
  document.addEventListener('hc:route-changed', event => {
    if (event.detail?.route !== 'essays') return;
    const observedRevision = revision;
    queueMicrotask(() => {
      if (observedRevision === revision) show(activeItem || ordered[0]);
    });
  });
})();
