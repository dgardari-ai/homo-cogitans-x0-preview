/* Contents and private browser-local notes. No server comments are implied. */
(() => {
  'use strict';
  const shell = document.getElementById('app-shell');
  if (!shell) return;
  const STORAGE_KEY = 'hc:local-comments:v1';
  const LIMIT = 3000;
  const types = { comment: 'Комментарий', question: 'Вопрос', objection: 'Возражение' };
  const routeLabels = {
    overview: 'Главная · HOMO COGITANS', schemes: 'Схемы х.0',
    game: 'Игра х.0', examples: 'Примеры х.0', book: 'Книга · HOMO COGITANS',
    map: 'Мета-карта мышления х.0', master: 'Мастер-текст',
    treatise: 'Концептуальный трактат', lab: 'Лаборатория', journal: 'Дневник исследования'
  };
  const originalIndex = window.HC_TEXT_INDEX;
  if (!originalIndex) return;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function makeDialog(kind, title, eyebrow) {
    const dialog = element('dialog', `hc-drawer hc-drawer--${kind}${kind === 'comments' ? ' hc-drawer--right' : ''}`);
    dialog.id = `hc-${kind}-dialog`;
    dialog.setAttribute('aria-labelledby', `hc-${kind}-title`);
    const frame = element('div', 'hc-drawer-shell');
    if (kind === 'contents') {
      // Keep an accessible dialog name, but no visible header or separator.
      const label = element('h2', 'hc-sr-only', title);
      label.id = `hc-${kind}-title`;
      frame.append(label);
    } else {
      const header = element('header', 'hc-drawer-header');
      const titles = element('div');
      titles.append(element('span', 'hc-drawer-eyebrow', eyebrow));
      const heading = element('h2', 'hc-drawer-title', title);
      heading.id = `hc-${kind}-title`;
      titles.append(heading);
      header.append(titles);
      frame.append(header);
    }
    const content = element('div', 'hc-drawer-scroll');
    if (kind === 'contents') {
      content.id = 'hc-contents-scroll';
      content.dataset.vmgEditTarget = 'Фон и содержимое левого меню';
    }
    frame.append(content);
    dialog.append(frame);
    shell.append(dialog);
    dialog.addEventListener('cancel', event => { event.preventDefault(); closePanel(); });
    dialog.addEventListener('close', () => {
      if (active?.dialog === dialog) active.finish();
    });
    return { dialog, content, kind };
  }

  let active = null;
  const panels = {
    contents: makeDialog('contents', 'Оглавление', 'КОНЦЕПЦИЯ х.0 / МЫШЛЕНИЕ х.0 / HOMO COGITANS'),
    comments: makeDialog('comments', 'Комментарии', 'HOMO COGITANS / НА ПОЛЯХ')
  };
  function syncTriggers(kind) {
    document.querySelectorAll('[data-open-panel]').forEach(button => {
      const key = button.dataset.openPanel;
      if (!panels[key]) return;
      button.setAttribute('aria-controls', panels[key].dialog.id);
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-expanded', String(key === kind));
      button.setAttribute('aria-label', `${key === kind ? 'Закрыть' : 'Открыть'} ${key === 'contents' ? 'оглавление' : 'комментарии'}`);
    });
  }
  function positionPanel(kind) {
    const dialog = panels[kind].dialog;
    const trigger = document.getElementById(kind === 'contents' ? 'hc-toc-toggle' : 'hc-comments-toggle');
    const viewport = document.documentElement.clientWidth;
    const fullWidth = Math.min(380, Math.max(0, viewport - 24));
    const triggerBox = trigger.getBoundingClientRect();
    const contentBox = document.getElementById('main-content').getBoundingClientRect();
    const headerBox = document.getElementById('hc-site-header').getBoundingClientRect();
    const headerFrame = document.querySelector('.hc-header-frame');
    const measuredGap = Number.parseFloat(window.getComputedStyle(headerFrame).columnGap);
    const margin = Number.isFinite(measuredGap) ? measuredGap : 14;
    const room = kind === 'contents' ? contentBox.left : viewport - contentBox.right;
    // Use the available side margin before allowing a panel over the reading area.
    // A narrower but legible panel is preferable to covering the text on a laptop.
    const sideWidth = Math.min(fullWidth, Math.max(0, room - margin - 12));
    // The inner edge is the physical edge of the header circle, not of its grid cell.
    // Bound the width before positioning: clamping left after positioning caused drift.
    const anchor = kind === 'contents' ? triggerBox.right : triggerBox.left;
    const anchoredCapacity = Math.max(0, kind === 'contents' ? anchor - 12 : viewport - anchor - 12);
    const anchoredWidth = Math.min(sideWidth, anchoredCapacity);
    const fitsBeside = anchoredWidth >= 240;
    const width = fitsBeside ? anchoredWidth : fullWidth;
    // On narrow screens a readable overlay takes precedence over an impossible
    // edge-to-edge alignment (the header circle is too close to the window edge).
    const overlayStart = kind === 'contents' ? triggerBox.left : triggerBox.right - fullWidth;
    const left = fitsBeside
      ? (kind === 'contents' ? anchor - width : anchor)
      : Math.max(12, Math.min(overlayStart, viewport - fullWidth - 12));
    dialog.style.width = `${width}px`;
    dialog.style.setProperty('--hc-panel-left', `${left}px`);
    dialog.style.setProperty('--hc-panel-top', `${Math.round(headerBox.bottom + 10)}px`);
    dialog.dataset.placement = fitsBeside ? 'aside' : 'overlay';
  }
  function closePanel({ immediate = false, restoreFocus = true } = {}) {
    if (!active) return Promise.resolve();
    const current = active;
    current.restoreFocus = restoreFocus;
    if (current.closing) {
      if (immediate) current.finish();
      return current.closed;
    }
    current.closing = true;
    current.dialog.classList.remove('is-visible');
    syncTriggers(null);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (immediate || reduced) current.finish();
    else current.timer = window.setTimeout(current.finish, 225);
    return current.closed;
  }
  function openPanel(kind, opener) {
    if (!panels[kind] || shell.getAttribute('aria-hidden') === 'true') return;
    if (active?.kind === kind && !active.closing) { closePanel(); return; }
    if (active) closePanel({ immediate: true, restoreFocus: false });
    syncRouteContext();
    if (kind === 'comments') refreshComments();
    const { dialog } = panels[kind];
    let resolveClosed;
    const current = {
      kind, dialog, opener: opener || document.activeElement,
      closing: false, restoreFocus: true, timer: null,
      closed: new Promise(resolve => { resolveClosed = resolve; })
    };
    current.finish = () => {
      window.clearTimeout(current.timer);
      if (active === current) {
        active = null;
        dialog.classList.remove('is-visible');
        if (dialog.open) dialog.close();
        syncTriggers(null);
        if (current.restoreFocus && current.opener?.isConnected) current.opener.focus({ preventScroll: true });
      }
      resolveClosed();
    };
    active = current;
    syncTriggers(kind);
    positionPanel(kind);
    dialog.show();
    if (kind === 'contents') syncContentsIndicator(true);
    dialog.getBoundingClientRect();
    window.requestAnimationFrame(() => {
      if (active === current && !current.closing) dialog.classList.add('is-visible');
    });
    (kind === 'contents' ? tabs.querySelector('[aria-selected="true"]') : textInput).focus({ preventScroll: true });
  }

  const contentsTop = element('div', 'hc-contents-top');
  contentsTop.dataset.vmgEditTarget = 'Шапка оглавления · служебное название и информация';
  const topCaption = element('span', 'hc-contents-overline', 'КОРПУС ТЕКСТОВ Х.0');
  topCaption.dataset.vmgEditTarget = 'Название корпуса текстов · шрифт и цвет';
  const infoTrigger = element('button', 'hc-contents-info-trigger', 'i');
  infoTrigger.type = 'button';
  infoTrigger.id = 'hc-contents-info-trigger';
  infoTrigger.setAttribute('aria-label', 'О четырёх корпусах текстов');
  infoTrigger.setAttribute('aria-controls', 'hc-contents-info');
  infoTrigger.setAttribute('aria-expanded', 'false');
  infoTrigger.dataset.vmgEditTarget = 'Информационный кружок · размер, фон, обводка';
  const infoPopup = element('dialog', 'hc-corpus-info-dialog');
  infoPopup.id = 'hc-contents-info';
  infoPopup.setAttribute('aria-modal', 'true');
  infoPopup.setAttribute('aria-labelledby', 'hc-corpus-info-title');
  infoPopup.dataset.vmgEditTarget = 'Центральная справка · четыре корпуса текстов';
  const infoPopupHead = element('header', 'hc-corpus-info-head');
  const infoTitles = element('div', 'hc-corpus-info-titles');
  infoTitles.append(element('span', 'hc-corpus-info-overline', 'HOMO COGITANS · КОРПУС ТЕКСТОВ'));
  const infoTitle = element('h2', 'hc-corpus-info-title', 'ЧЕТЫРЕ ФОРМЫ ТЕКСТА');
  infoTitle.id = 'hc-corpus-info-title';
  infoTitles.append(infoTitle);
  const infoClose = element('button', 'hc-corpus-info-close', '×');
  infoClose.type = 'button';
  infoClose.setAttribute('aria-label', 'Закрыть справку');
  infoPopupHead.append(infoTitles, infoClose);
  const infoIntro = element('p', 'hc-corpus-info-intro',
    'Здесь собраны основные авторские тексты о мышлении х.0. Они посвящены одной теории, но устроены по-разному — в зависимости от того, как вы хотите с ней познакомиться.');
  const infoGrid = element('div', 'hc-corpus-info-grid');
  [
    ['01', 'Монография', 'Последовательные беседы, в которых теория объясняется живым языком: от возникновения новых форм мышления до механизмов их развития и пределов.'],
    ['02', 'Концептуальный трактат', 'Систематическое изложение основных понятий, положений и внутренних связей теории. Здесь важны полнота устройства и точность различений.'],
    ['03', 'Рукопись книги', 'Главы HOMO COGITANS, где исследование разворачивается через исторические сцены, людей и опыт культуры. Рукопись пополняется по мере работы.'],
    ['04', 'Корпус эссе', 'Самостоятельные исследования о мыслителях, культурных формах и истории мышления. Они служат материалом для книг, но каждое эссе можно читать отдельно.']
  ].forEach(([number, title, description]) => {
    const item = element('section', 'hc-corpus-info-card');
    item.append(element('span', 'hc-corpus-info-number', number));
    item.append(element('h3', 'hc-corpus-info-card-title', title));
    item.append(element('p', 'hc-corpus-info-card-copy', description));
    infoGrid.append(item);
  });
  const infoNote = element('p', 'hc-corpus-info-note',
    'Выберите близкий вам способ чтения: от беседы и отдельного вопроса — к систематическому изложению и книге.');
  infoPopup.append(infoPopupHead, infoIntro, infoGrid, infoNote);
  contentsTop.append(topCaption, infoTrigger);
  panels.contents.content.append(contentsTop);
  document.body.append(infoPopup);
  const homeInfoTrigger = document.querySelector('[data-hc-corpus-info]');
  let infoReturnFocus = infoTrigger;
  function setContentsInfo(open, opener = infoTrigger) {
    if (open) infoReturnFocus = opener;
    if (open && !infoPopup.open) infoPopup.showModal();
    if (!open && infoPopup.open) infoPopup.close();
    for (const button of [infoTrigger, homeInfoTrigger]) {
      button?.setAttribute('aria-expanded', String(infoPopup.open));
    }
  }
  infoTrigger.addEventListener('click', () => setContentsInfo(!infoPopup.open, infoTrigger));
  homeInfoTrigger?.addEventListener('click', () => setContentsInfo(!infoPopup.open, homeInfoTrigger));
  infoClose.addEventListener('click', () => setContentsInfo(false));
  infoPopup.addEventListener('close', () => {
    for (const button of [infoTrigger, homeInfoTrigger]) {
      button?.setAttribute('aria-expanded', 'false');
    }
    if (infoReturnFocus?.isConnected) infoReturnFocus.focus({ preventScroll:true });
  });
  infoPopup.addEventListener('click', event => {
    if (event.target !== infoPopup) return;
    const bounds = infoPopup.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) setContentsInfo(false);
  });
  infoPopup.addEventListener('keydown', event => {
    if (event.key === 'Escape') event.stopPropagation();
  });

  const tabs = element('div', 'hc-contents-tabs');
  tabs.id = 'hc-contents-switcher';
  tabs.dataset.vmgEditTarget = 'Плашка переключателя · 4 позиции и подвижный жёлтый кружок';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Выбор корпуса текстов');
  const indicator = element('span', 'hc-contents-indicator');
  indicator.setAttribute('aria-hidden', 'true');
  indicator.dataset.vmgEditTarget = 'Подвижный жёлтый кружок · размер и цвет';
  tabs.append(indicator);
  const tabEntries = [
    { id:'monograph', name:'Монография', heading:'МОНОГРАФИЯ Х.0. ТЕКСТЫ БЕСЕД', route:'master', items:originalIndex.master.groups },
    { id:'concept', name:'Трактат', heading:'КОНЦЕПТУАЛЬНЫЙ ТРАКТАТ Х.0', route:'treatise', items:originalIndex.treatise.groups },
    { id:'manuscript', name:'Рукопись', heading:'HOMO COGITANS, РУКОПИСЬ КНИГИ', route:'book', items:originalIndex.book.groups },
    { id:'essays', name:'Эссе', heading:'КОРПУС ЭССЕ ПО РАЗНЫМ ТЕМАМ Х.0', route:'essays', items:window.HC_ESSAY_OUTLINE?.groups || [] }
  ];
  panels.contents.content.append(tabs);
  const homeTabs = document.getElementById('hc-home-corpus-tabs');
  const headerNav = document.getElementById('hc-matrix-nav');
  function syncHomeCorpusWidth() {
    // The four actual cards, not the stretching nav container on compact screens.
    const first = headerNav?.firstElementChild?.getBoundingClientRect();
    const last = headerNav?.lastElementChild?.getBoundingClientRect();
    const width = first && last ? last.right - first.left : 0;
    if (width > 0) {
      // One measured header width drives the homepage and centered left-menu rails.
      shell.style.setProperty('--hc-contents-rail-width', `${width}px`);
      if (homeTabs) homeTabs.closest('.hc-home-description')
        ?.style.setProperty('--hc-home-corpus-width', `${width}px`);
    }
  }
  function centerRailIndicator(rail, instant = false) {
    if (!rail?.getClientRects().length) return;
    const target = rail.querySelector('.hc-contents-tab[aria-selected="true"], .hc-contents-tab[aria-pressed="true"] .hc-contents-tab-label')?.closest('.hc-contents-tab');
    const mark = rail.querySelector('.hc-contents-indicator');
    if (!target || !mark) return;
    // Measure the painted circle, not rounded offsetLeft. This also survives editor zoom/transforms.
    const circle = target.querySelector('.hc-contents-tab-label')?.getBoundingClientRect();
    const frame = rail.getBoundingClientRect();
    const scale = frame.width / rail.offsetWidth;
    if (!circle || !scale) return;
    const left = `${(circle.left + circle.width / 2 - frame.left) / scale - rail.clientLeft}px`;
    if (instant) {
      // Resize must not animate the marker away from the already-moved buttons.
      mark.style.transition = 'none';
      mark.style.left = left;
      void mark.offsetWidth; // Commit its position before restoring click animation.
      mark.style.removeProperty('transition');
    } else mark.style.left = left;
  }
  function syncContentsIndicator(instant = false) {
    syncHomeCorpusWidth();
    centerRailIndicator(tabs, instant);
    centerRailIndicator(homeTabs, instant);
  }
  function selectContentsTab(id, focus = false) {
    const selectedIndex = Math.max(0, tabEntries.findIndex(entry => entry.id === id));
    const selectedId = tabEntries[selectedIndex].id;
    tabs.dataset.active = String(selectedIndex);
    tabEntries.forEach(entry => {
      const selected = entry.id === selectedId;
      entry.button.setAttribute('aria-selected', String(selected));
      entry.button.tabIndex = selected ? 0 : -1;
      entry.panel.hidden = !selected;
      if (selected && focus) entry.button.focus({ preventScroll:true });
    });
    homeTabs?.querySelectorAll('[data-hc-corpus-tab]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.hcCorpusTab === selectedId));
    });
    syncContentsIndicator();
  }
  function expandContentsGroup(sublist, expanded) {
    sublist.hidden = !expanded;
    const trigger = sublist.parentElement.firstElementChild;
    if (trigger?.hasAttribute('aria-expanded')) trigger.setAttribute('aria-expanded', String(expanded));
    const disclosure = sublist.parentElement.querySelector('.hc-contents-disclosure');
    if (disclosure) {
      disclosure.setAttribute('aria-expanded', String(expanded));
      disclosure.setAttribute('aria-label', (expanded ? 'Свернуть' : 'Развернуть') + ' главы: ' + disclosure.dataset.hcContentsTitle);
      disclosure.textContent = expanded ? '−' : '+';
    }
  }
  tabEntries.forEach((entry, index) => {
    const button = element('button', 'hc-contents-tab');
    button.type = 'button';
    button.id = 'hc-contents-tab-' + entry.id;
    const number = String(index + 1).padStart(2, '0');
    button.dataset.vmgEditTarget = 'Номер ' + number + ' · ' + entry.name + ' · цвет, размер, шрифт';
    button.setAttribute('aria-label', number + ' — ' + entry.name);
    const caption = element('span', 'hc-contents-tab-label', number);
    caption.id = 'hc-contents-tab-label-' + entry.id;
    caption.dataset.vmgEditTarget = 'Цифра ' + number + ' · цвет и шрифт';
    button.append(caption);
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', 'hc-contents-page-' + entry.id);
    button.addEventListener('click', () => selectContentsTab(entry.id));
    button.addEventListener('keydown', event => {
      const directions = {ArrowRight:1,ArrowLeft:-1};
      if (!(event.key in directions) && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabEntries.length - 1 : (index + directions[event.key] + tabEntries.length) % tabEntries.length;
      selectContentsTab(tabEntries[next].id, true);
    });
    entry.button = button;
    tabs.append(button);
    const panel = element('section', 'hc-contents-panel');
    panel.id = 'hc-contents-page-' + entry.id;
    panel.setAttribute('role','tabpanel');
    panel.setAttribute('aria-labelledby', button.id);
    panel.tabIndex = 0;
    const heading = element('h3', 'hc-contents-corpus-title', entry.heading);
    heading.dataset.vmgEditTarget = 'Заголовок корпуса · ' + entry.name;
    panel.append(heading);
    const list = element('ol', 'hc-contents-list');
    if (entry.id === 'essays') list.classList.add('hc-contents-list--essays');
    entry.items.forEach(item => {
      const li = element('li','hc-contents-group');
      const link = element('button','hc-contents-link');
      link.type = 'button';
      link.dataset.hcContentsGroup = item.id;
      link.dataset.hcContentsRoute = entry.route;
      link.append(element('span', 'hc-contents-index', item.index), element('span', 'hc-contents-label', item.label));
      li.append(link);
      const children = element('ol','hc-contents-sublist');
      children.hidden = entry.id !== 'monograph';
      if (item.children?.length) {
        children.id = 'hc-contents-children-' + entry.id + '-' + item.id;
        if (entry.id !== 'monograph') {
          link.setAttribute('aria-controls', children.id);
          link.setAttribute('aria-expanded','false');
        }
        item.children.forEach(child => {
          const childLi = element('li');
          const childLink = element('button','hc-contents-sub-link');
          childLink.type = 'button';
          if (entry.id === 'essays') {
            childLink.classList.add('hc-contents-sub-link--essay');
            childLink.append(
              element('span', 'hc-contents-essay-number', child.displayNumber),
              element('span', 'hc-contents-essay-title', child.label)
            );
            childLink.dataset.vmgEditTarget = 'Эссе ' + child.displayNumber + ' · ' + child.label;
          } else {
            childLink.textContent = child.label;
          }
          childLink.dataset.hcContentsRoute = entry.route;
          childLink.dataset.hcContentsGroup = item.id;
          childLink.dataset.hcContentsLine = String(child.line);
          childLink.dataset.level = String(child.level);
          childLink.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('hc:navigate',{detail:{route:entry.route,groupId:item.id,line:child.line}}));
          });
          childLi.append(childLink);
          children.append(childLi);
        });
        li.append(children);
        if (entry.id === 'monograph') {
          li.classList.add('hc-contents-group--with-disclosure');
          const disclosure = element('button', 'hc-contents-disclosure');
          disclosure.type = 'button';
          disclosure.dataset.hcContentsTitle = item.label;
          disclosure.setAttribute('aria-controls', children.id);
          disclosure.addEventListener('click', () => expandContentsGroup(children, children.hidden));
          li.append(disclosure);
          expandContentsGroup(children, true);
        }
      }
      link.addEventListener('click', () => {
        if (entry.id !== 'monograph' && item.children?.length && children.hidden) {
          entry.panel.querySelectorAll('.hc-contents-sublist').forEach(sub => expandContentsGroup(sub, sub === children));
          return;
        }
        document.dispatchEvent(new CustomEvent('hc:navigate',{detail:{route:entry.route,groupId:item.id}}));
      });
      list.append(li);
    });
    panel.append(list);
    entry.panel = panel;
    panels.contents.content.append(panel);
  });
  selectContentsTab('monograph');
  homeTabs?.addEventListener('click', event => {
    const button = event.target.closest?.('[data-hc-corpus-tab]');
    if (!button) return;
    selectContentsTab(button.dataset.hcCorpusTab);
    // A homepage choice opens the correct contents page; repeated choices do not close it.
    if (active?.kind !== 'contents' || active.closing) openPanel('contents', button);
    else tabs.querySelector('[aria-selected="true"]')?.focus({ preventScroll:true });
  });
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(() => syncContentsIndicator(true));
    observer.observe(tabs);
    if (homeTabs) observer.observe(homeTabs);
    if (headerNav) observer.observe(headerNav);
  }

  document.addEventListener('hc:reader-active',event => {
    const {route,groupId,line}=event.detail;
    const matchingTab=tabEntries.find(entry=>entry.route===route);
    if(matchingTab) selectContentsTab(matchingTab.id);
    panels.contents.content.querySelectorAll('.hc-contents-link').forEach(button => {
      const activeGroup=button.dataset.hcContentsRoute===route&&button.dataset.hcContentsGroup===groupId;
      // Only the chosen row stays bold: an active subsection supersedes its parent row.
      if(activeGroup&&line===undefined) button.setAttribute('aria-current','location');
      else button.removeAttribute('aria-current');
      const nested=button.parentElement.querySelector('.hc-contents-sublist');
      if(nested && button.dataset.hcContentsRoute !== 'master') expandContentsGroup(nested,activeGroup);
    });
    panels.contents.content.querySelectorAll('.hc-contents-sub-link').forEach(button => {
      const active=button.dataset.hcContentsRoute===route&&button.dataset.hcContentsGroup===groupId&&Number(button.dataset.hcContentsLine)===line;
      if(active) button.setAttribute('aria-current','location');
      else button.removeAttribute('aria-current');
    });
  });

  function getRoute() { return document.querySelector('.page-view.active')?.dataset.view || window.location.hash.slice(1) || 'overview'; }
  let lastRoute = getRoute();
  let context = { id: lastRoute, label: routeLabels[lastRoute] || routeLabels.overview };
  const drafts = new Map();
  const contextBox = element('div', 'hc-comment-context');
  contextBox.append(element('small', '', 'К ТЕКУЩЕМУ ФРАГМЕНТУ'));
  const contextLabel = element('strong', '', context.label);
  contextBox.append(contextLabel);
  const form = element('form', 'hc-comment-form');
  const fieldset = element('fieldset', 'hc-comment-types');
  fieldset.append(element('legend', 'hc-sr-only', 'Тип записи'));
  Object.entries(types).forEach(([value, label], index) => {
    const wrapper = element('label', 'hc-comment-type');
    const input = element('input');
    input.type = 'radio'; input.name = 'hc-comment-type'; input.value = value; input.checked = index === 0;
    wrapper.append(input, element('span', '', label)); fieldset.append(wrapper);
  });
  const textLabel = element('label', 'hc-comment-label', 'Ваш текст');
  textLabel.htmlFor = 'hc-comment-text';
  const textInput = element('textarea', 'hc-comment-input');
  textInput.id = 'hc-comment-text'; textInput.rows = 5; textInput.maxLength = LIMIT;
  textInput.placeholder = 'Что хочется спросить, уточнить или оспорить?';
  textInput.setAttribute('aria-describedby', 'hc-comment-counter hc-comment-disclaimer hc-comment-status');
  const counter = element('p', 'hc-comment-counter', `0 / ${LIMIT}`); counter.id = 'hc-comment-counter';
  const save = element('button', 'hc-comment-save', 'СОХРАНИТЬ ЛОКАЛЬНО'); save.type = 'submit';
  const disclaimer = element('p', 'hc-comment-disclaimer', 'Прототип: записи хранятся только в этом браузере, другим читателям не отправляются.');
  disclaimer.id = 'hc-comment-disclaimer';
  const status = element('p', 'hc-comment-status'); status.id = 'hc-comment-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  form.append(fieldset, textLabel, textInput, counter, save, disclaimer, status);
  const listHeader = element('div', 'hc-comments-head');
  const countLabel = element('span', 'hc-comments-count', '0');
  listHeader.append(element('span', '', 'ЛОКАЛЬНЫЕ ЗАПИСИ К ФРАГМЕНТУ'), countLabel);
  const recordsList = element('ol', 'hc-comments-list');
  const empty = element('p', 'hc-comments-empty', 'Здесь ещё нет записей. Можно оставить вопрос или собственное наблюдение.');
  panels.comments.content.append(contextBox, form, listHeader, recordsList, empty);

  function announce(message, error = false) { status.textContent = message; status.classList.toggle('is-error', error); }
  function readRecords() {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const data = JSON.parse(stored);
    if (data?.version !== 1 || !Array.isArray(data.records) || !data.records.every(record =>
      record && typeof record.id === 'string' && typeof record.contextId === 'string' &&
      typeof record.contextLabel === 'string' && typeof record.body === 'string' && record.body.length <= LIMIT &&
      Object.prototype.hasOwnProperty.call(types, record.type) && typeof record.createdAt === 'string' && Number.isFinite(Date.parse(record.createdAt)))) {
      throw new Error('Invalid local comment data');
    }
    return data.records;
  }
  function renderRecords(records) {
    recordsList.replaceChildren();
    const selected = records.filter(record => record.contextId === context.id).reverse();
    countLabel.textContent = String(selected.length);
    empty.hidden = selected.length > 0;
    selected.forEach(record => {
      const li = element('li', 'hc-comment-record');
      const head = element('div', 'hc-comment-record-header');
      const date = element('time', '', new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(record.createdAt)));
      date.dateTime = record.createdAt;
      head.append(element('span', '', types[record.type].toLocaleUpperCase('ru')), date);
      li.append(head, element('p', '', record.body));
      recordsList.append(li);
    });
  }
  function refreshComments() {
    contextLabel.textContent = context.label;
    try { renderRecords(readRecords()); }
    catch (_) {
      recordsList.replaceChildren(); countLabel.textContent = '—'; empty.hidden = true;
      announce('Не удалось прочитать записи в браузере. Ранее сохранённые данные не изменены; новый текст пока не сохранён.', true);
    }
  }
  function captureDraft() {
    drafts.set(context.id, { body: textInput.value, type: form.querySelector('input[name="hc-comment-type"]:checked')?.value || 'comment' });
  }
  function setContext(next) {
    if (!next?.id || !next?.label || typeof next.id !== 'string' || typeof next.label !== 'string') return;
    if (next.id === context.id) { context.label = next.label; contextLabel.textContent = next.label; return; }
    captureDraft();
    context = { id: next.id.slice(0,200), label: next.label.slice(0,300) };
    const draft = drafts.get(context.id) || { body: '', type: 'comment' };
    textInput.value = draft.body;
    form.querySelectorAll('input[name="hc-comment-type"]').forEach(input => { input.checked = input.value === draft.type; });
    textInput.removeAttribute('aria-invalid');
    counter.textContent = `${textInput.value.length} / ${LIMIT}`;
    announce('');
    refreshComments();
  }
  function syncRouteContext() {
    const route = getRoute();
    if (route === lastRoute) return;
    lastRoute = route;
    setContext({ id: route, label: routeLabels[route] || routeLabels.overview });
  }
  textInput.addEventListener('input', () => {
    counter.textContent = `${textInput.value.length} / ${LIMIT}`;
    textInput.removeAttribute('aria-invalid');
    if (status.classList.contains('is-error')) announce('');
    captureDraft();
  });
  fieldset.addEventListener('change', captureDraft);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const body = textInput.value.trim();
    if (!body || body.length > LIMIT) {
      textInput.setAttribute('aria-invalid', 'true');
      announce(!body ? 'Сначала напишите комментарий, вопрос или возражение.' : `Текст должен быть не длиннее ${LIMIT} знаков.`, true);
      textInput.focus();
      return;
    }
    const type = form.querySelector('input[name="hc-comment-type"]:checked')?.value || 'comment';
    try {
      const records = readRecords();
      const id = window.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      records.push({ id, contextId: context.id, contextLabel: context.label, type, body, createdAt: new Date().toISOString() });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, records }));
      const verified = readRecords();
      if (!verified.some(record => record.id === id && record.body === body)) throw new Error('Write not verified');
      textInput.value = ''; counter.textContent = `0 / ${LIMIT}`; textInput.removeAttribute('aria-invalid');
      drafts.delete(context.id);
      renderRecords(verified);
      announce('Сохранено в этом браузере. Запись не отправлена другим читателям.');
    } catch (_) {
      announce('Сохранить не удалось: хранилище браузера недоступно, переполнено или его данные не удалось прочитать. Текст остаётся в поле — можно скопировать его и попробовать ещё раз.', true);
    }
  });
  document.addEventListener('click', event => {
    const opener = event.target.closest?.('[data-open-panel]');
    if (!opener || !panels[opener.dataset.openPanel]) return;
    event.preventDefault();
    openPanel(opener.dataset.openPanel, opener);
  });
  document.addEventListener('pointerdown', event => {
    if (!active || active.closing || active.dialog.contains(event.target) || event.target.closest?.('[data-open-panel]')) return;
    // Overlay panels dismiss on the page; panels beside the reading area stay open.
    // positionPanel updates this placement when the viewport changes.
    if (active.dialog.dataset.placement !== 'overlay') return;
    closePanel({ restoreFocus: false });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !active) return;
    event.preventDefault();
    closePanel();
  });
  window.addEventListener('resize', () => {
    if (active && !active.closing) positionPanel(active.kind);
    syncContentsIndicator(true);
  });
  document.addEventListener('hc:context', event => {
    lastRoute = getRoute();
    setContext(event.detail);
  });
  window.addEventListener('hashchange', syncRouteContext);
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY && active?.kind === 'comments') refreshComments();
  });
  const main = document.getElementById('main-content');
  if (main) new MutationObserver(syncRouteContext).observe(main, { subtree: true, attributes: true, attributeFilter: ['class'] });
  syncTriggers(null);
})();
