/* Homepage interactions follow the Gallery/Blog Gardari structure. */
(() => {
  'use strict';
  const home = document.getElementById('blog-home');
  if (!home) return;

  const tabShape = 'M 46.79072656342929 0.5 H 66.666667 A 11.5 11.5 0 0 1 78.166667 12 V 66.666667 A 11.5 11.5 0 0 1 66.666667 78.166667 H 12 A 11.5 11.5 0 0 1 0.5 66.666667 V 46.79072656342929 A 11.5 11.5 0 0 1 12.767732953990608 35.316381871406264 A 21.181818156064274 21.181818156064274 0 0 0 35.316381871406264 12.767732953990608 A 11.5 11.5 0 0 1 46.79072656342929 0.5 Z';
  const nav = [
    { num:'01', label:'ГЛАВНАЯ', route:'overview' },
    { num:'02', label:'СХЕМЫ', route:'schemes' },
    { num:'03', label:'ИГРА', route:'game' },
    { num:'04', label:'ПРИМЕРЫ', route:'examples' }
  ];
  const newSectionSearch = [
    { name:'СХЕМЫ х.0', eyebrow:'ДИАГРАММЫ / В РАЗВИТИИ', deck:'Визуальный аппарат теории', route:'schemes', keywords:'схемы диаграммы рисунки визуальный логика' },
    { name:'ИГРА х.0', eyebrow:'ИГРОВАЯ ИДЕЯ / В РАЗВИТИИ', deck:'Будущая игра по теории', route:'game', keywords:'игра х.0 геймплей игровые ситуации' },
    { name:'ПРИМЕРЫ х.0', eyebrow:'ИСТОРИИ / СИТУАЦИИ', deck:'Жизненные ситуации в оптике теории', route:'examples', keywords:'примеры кейсы истории ситуации жизнь анализ' }
  ];
  const images = [
    'https://static.tildacdn.com/tild6564-3166-4162-a365-623231386134/021.jpeg',
    'https://static.tildacdn.com/tild6637-3230-4332-a362-353137646137/DSC_3752.jpeg',
    'https://static.tildacdn.com/tild6534-6665-4939-b961-343762383766/026.jpeg',
    'https://static.tildacdn.com/tild3936-3931-4633-a235-393866656638/021.jpeg',
    'https://static.tildacdn.com/tild6131-6439-4565-b432-303764626331/021.jpeg',
    'https://static.tildacdn.com/tild3562-3430-4337-b531-363331643262/Snapseed_3.jpg',
    'https://static.tildacdn.com/tild3666-6265-4566-a565-653831356639/022.jpeg'
  ];
  const sections = [
    { name:'HOMO COGITANS', eyebrow:'КНИГА / ЧАСТЬ I', deck:'Читать по главам', route:'book', keywords:'книга главы читать homo cogitans' },
    { name:'МЕТА-КАРТА х.0', eyebrow:'ИНТЕРАКТИВНАЯ КАРТА', deck:'Шесть режимов мышления', route:'map', keywords:'мета карта режимы схема x.0' },
    { name:'МАСТЕР-ТЕКСТ', eyebrow:'НОВАЯ ТЕОРИЯ МЫШЛЕНИЯ', deck:'Основания и понятия', route:'master', keywords:'теория понятия мастер текст' },
    { name:'ТРАКТАТ', eyebrow:'ТЕОРЕТИЧЕСКИЙ КОРПУС', deck:'Развёрнутое исследование', route:'treatise', keywords:'трактат основание теория' },
    { name:'ЛАБОРАТОРИЯ', eyebrow:'ОПЫТЫ / В РАЗРАБОТКЕ', deck:'Проверять способы понимания', route:'lab', keywords:'лаборатория опыт игра эксперимент' },
    { name:'ДНЕВНИК РАБОТЫ', eyebrow:'ИССЛЕДОВАНИЕ В ПРОЦЕССЕ', deck:'Следить за развитием', route:'journal', keywords:'дневник новости работа' },
    { name:'ПОДПИСКА', eyebrow:'ДОСТУП / ПРОТОТИП', deck:'Участие в исследовании', subscribe:true, keywords:'подписка доступ участие' }
  ];

  function makeTab({num,label,route},footer=false) {
    const className = `section-tab${footer ? ' footer-resource-tab' : ''}${route === 'overview' ? ' is-active' : ''}`;
    return `<button class="${className}" type="button" data-route="${route}" aria-label="${label}">
      <svg class="tab-outline" viewBox="0 0 78.666667 78.666667" aria-hidden="true"><path d="${tabShape}"/></svg>
      <span class="tab-number">${num}</span><span class="tab-name">${label}</span>
    </button>`;
  }
  document.getElementById('hc-matrix-nav').innerHTML = nav.map(item => makeTab(item)).join('');
  document.getElementById('hc-footer-nav').innerHTML = nav.map(item => makeTab(item,true)).join('');

  const track = document.getElementById('hc-accordion-track');
  track.innerHTML = sections.map((item,index) => `<div class="accordion-panel${index===0?' is-open':''}" data-index="${index}">
    <button class="panel-activate" type="button" ${item.subscribe?'data-subscribe':`data-route="${item.route}"`} aria-label="${item.name} — ${item.deck}">
      <img src="${images[index]}" alt="" loading="${index<2?'eager':'lazy'}" draggable="false">
      <span class="panel-overlay" aria-hidden="true"></span>
      <span class="panel-title-vertical" aria-hidden="true">${item.name}</span>
      <span class="panel-caption"><small>${item.eyebrow}</small><strong>${item.name}</strong><span>${item.deck}</span></span>
    </button>
  </div>`).join('');

  const panels = [...track.querySelectorAll('.accordion-panel')];
  let activePanel = 0;
  function expand(index) {
    if (index < 0 || index >= panels.length || activePanel === index) return;
    activePanel = index;
    panels.forEach((panel,i) => panel.classList.toggle('is-open',i===index));
  }
  panels.forEach((panel,index) => {
    panel.addEventListener('pointerenter',event => {
      if (event.pointerType !== 'touch') expand(index);
    });
    const button = panel.querySelector('.panel-activate');
    button.addEventListener('focus',() => expand(index));
    button.addEventListener('keydown',event => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + panels.length) % panels.length;
      panels[next].querySelector('.panel-activate').focus();
    });
    panel.querySelector('img').addEventListener('error', () => panel.classList.add('image-missing'));
  });

  // The lower navigation follows the Blog's single-expanded-row accordion.
  const folds = [...home.querySelectorAll('.footer-fold:not(.is-always-open)')];
  folds.forEach(fold => {
    fold.querySelector('.footer-fold-trigger').addEventListener('click', () => {
      const isOpening = !fold.classList.contains('is-open');
      folds.forEach(other => {
        const isOpen = isOpening && other === fold;
        other.classList.toggle('is-open',isOpen);
        other.querySelector('.footer-fold-trigger').setAttribute('aria-expanded',String(isOpen));
        const panel = other.querySelector('.footer-fold-panel');
        panel.setAttribute('aria-hidden', String(!isOpen));
        panel.inert = !isOpen;
        other.querySelector('.footer-fold-mark').textContent = isOpen ? '−' : '+';
      });
    });
  });

  const search = document.getElementById('hc-material-search');
  const searchResults = document.getElementById('hc-search-results');
  function searchSections() {
    const query = search.value.toLocaleLowerCase('ru').trim();
    if (!query) { searchResults.hidden = true; search.setAttribute('aria-expanded','false'); return; }
    const words = query.split(/\s+/).filter(Boolean);
    const matches = [...newSectionSearch, ...sections].filter(item => words.every(word => `${item.name} ${item.eyebrow} ${item.deck} ${item.keywords}`.toLocaleLowerCase('ru').includes(word)));
    searchResults.replaceChildren();
    const title = document.createElement('div'); title.className='search-results-label';
    title.textContent = `${matches.length ? `НАЙДЕНО РАЗДЕЛОВ: ${matches.length}` : 'ПОКА НИЧЕГО НЕ НАЙДЕНО'}`;
    searchResults.append(title);
    matches.forEach(item => {
      const result = document.createElement('button');
      result.type='button'; result.className='search-result';
      result.dataset.searchRoute = item.route || 'subscribe';
      const heading=document.createElement('strong'); heading.textContent=item.name;
      const hint=document.createElement('small'); hint.textContent=item.eyebrow;
      result.append(heading,hint); searchResults.append(result);
    });
    searchResults.hidden = false;
    search.setAttribute('aria-expanded','true');
  }
  search.addEventListener('input',searchSections);
  document.getElementById('hc-search-form').addEventListener('submit',event => {
    event.preventDefault();
    searchSections();
    const first=searchResults.querySelector('.search-result');
    if(first) first.focus();
  });
  searchResults.addEventListener('click',event => {
    const result=event.target.closest('[data-search-route]');
    if(!result)return;
    const route=result.dataset.searchRoute;
    if(route==='subscribe') home.querySelector('[data-subscribe]').click();
    else document.querySelector(`#hc-matrix-nav [data-route="${route}"], .sidebar-nav [data-route="${route}"]`)?.click();
    search.value=''; searchSections();
  });
  search.addEventListener('keydown',event => {
    if(event.key==='Escape') { search.value=''; searchSections(); search.blur(); }
  });
  document.addEventListener('click',event => {
    if(!event.target.closest('#hc-search-form')) { searchResults.hidden=true;search.setAttribute('aria-expanded','false'); }
  });

  home.addEventListener('click',event => {
    const opener=event.target.closest('[data-subscribe]');
    if(opener) {
      event.preventDefault();
      document.getElementById('subscribe-side').click();
    }
  });

  const share=document.getElementById('hc-share');
  const feedback=document.getElementById('hc-share-feedback');
  share.addEventListener('click',async () => {
    const url=window.location.origin+window.location.pathname;
    try {
      if(navigator.share) await navigator.share({title:'HOMO COGITANS x.0',url});
      else if(navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        feedback.textContent='ССЫЛКА СКОПИРОВАНА';
      } else throw new Error('Clipboard unavailable');
    } catch(error) {
      if(error.name==='AbortError')return;
      feedback.replaceChildren();
      const field=document.createElement('input');
      field.className='share-link-field'; field.value=url; field.readOnly=true;
      field.setAttribute('aria-label','Ссылка на исследование');
      feedback.textContent='СКОПИРУЙТЕ ССЫЛКУ:';feedback.append(field);field.select();
    }
  });

  // Both actual navigation bars live outside #blog-home, so keep them in sync.
  function syncActiveNavigation() {
    const active=document.querySelector('.page-view.active')?.dataset.view || 'overview';
    document.querySelectorAll('#hc-matrix-nav .section-tab, #hc-footer-nav .section-tab').forEach(tab => {
      const chosen=tab.dataset.route===active;
      tab.classList.toggle('is-active',chosen);
      if(chosen)tab.setAttribute('aria-current','page');
      else tab.removeAttribute('aria-current');
    });
  }
  const observer=new MutationObserver(syncActiveNavigation);
  observer.observe(document.getElementById('main-content'),{subtree:true,attributes:true,attributeFilter:['class']});
  syncActiveNavigation();
})();
