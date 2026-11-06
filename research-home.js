/* The accepted Blog shell now opens a working spread of the x.0 research.
   Explanations, source quotations and prototype status stay distinct. */
(() => {
  'use strict';
  const data = window.HC_RESEARCH;
  if (!data || !document.querySelector('[data-hc-workspace]')) return;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const nav = [
    {num:'01', label:'ГЛАВНАЯ', route:'overview'},
    {num:'02', label:'СХЕМЫ', route:'schemes'},
    {num:'03', label:'ИГРА', route:'game'},
    {num:'04', label:'ПРИМЕРЫ', route:'examples'}
  ];
  const tabShape = 'M 46.79072656342929 0.5 H 66.666667 A 11.5 11.5 0 0 1 78.166667 12 V 66.666667 A 11.5 11.5 0 0 1 66.666667 78.166667 H 12 A 11.5 11.5 0 0 1 0.5 66.666667 V 46.79072656342929 A 11.5 11.5 0 0 1 12.767732953990608 35.316381871406264 A 21.181818156064274 21.181818156064274 0 0 0 35.316381871406264 12.767732953990608 A 11.5 11.5 0 0 1 46.79072656342929 0.5 Z';
  $('#hc-matrix-nav').innerHTML = nav.map(item => `<button class="section-tab${item.route === 'overview' ? ' is-active' : ''}" type="button" data-route="${item.route}" aria-label="${item.label}"><svg class="tab-outline" viewBox="0 0 78.666667 78.666667" aria-hidden="true"><path d="${tabShape}"/></svg><span class="tab-number">${item.num}</span><span class="tab-name">${item.label}</span></button>`).join('');

  let activeTopic = 'morphology';
  let visualMode = 'diagram';
  let selectedPart = 'I';
  let returnRoute = 'overview';
  let searchMatches = [];
  const selectedNodes = new Map();
  const currentTopic = () => data.topics.find(item => item.id === activeTopic) || data.topics[1];
  const currentRoute = () => $('.page-view.active')?.dataset.view || 'overview';
  const navigate = detail => document.dispatchEvent(new CustomEvent('hc:navigate', {detail}));
  const context = (id,label) => document.dispatchEvent(new CustomEvent('hc:context', {detail:{id,label}}));

  function nodeButton(topic,node,index,extra='') {
    const active = (selectedNodes.get(topic.id) || topic.nodes[0].id) === node.id;
    let inside = escape(node.label);
    if (topic.id === 'configurations') {
      const shortNames = ['Кооперативно-\nмиметическое','Мифо-ритуально-\nсимволическое','Архивно-\nцивилизационное','Логоцентрическое','Личностно-\nгерменевтическое','Научно-\nоперациональное'];
      inside = `<span class="hc-form-index">${escape(node.id)}</span><span>${escape(shortNames[index]).replace(/\n/g,'<br>')}</span>`;
    }
    return `<button class="hc-diagram-node ${extra}" type="button" data-hc-node="${escape(node.id)}" aria-label="${escape(node.label)}" aria-pressed="${active}">${inside}</button>`;
  }

  function diagram(topic,instance) {
    const buttons = topic.nodes.map((node,i) => nodeButton(topic,node,i)).join('');
    if (topic.id === 'morphology') {
      return `<div class="hc-diagram hc-morphology" aria-label="Четыре взаимосвязанные координаты формы"><svg viewBox="0 0 400 246" preserveAspectRatio="none" aria-hidden="true"><path class="hc-relation" d="M84 40 L316 206 M316 40 L84 206"/><path class="hc-relation-muted" d="M84 40 H316 V206 H84 Z"/></svg><span class="hc-diagram-center">ФОРМА<br>МЫШЛЕНИЯ</span>${buttons}</div>`;
    }
    if (topic.id === 'spiral') {
      return `<div class="hc-diagram hc-spiral" aria-label="Три взаимонаправленных движения, не последовательные шаги"><svg viewBox="0 0 400 246" preserveAspectRatio="none" aria-hidden="true"><path class="hc-relation" d="M157 58 Q100 83 85 160 M243 58 Q300 83 315 160 M122 194 Q200 235 278 194"/></svg><span class="hc-diagram-center">ВЗАИМНОЕ<br>ИЗМЕНЕНИЕ</span>${buttons}</div>`;
    }
    if (topic.id === 'genesis') return `<div class="hc-diagram hc-genesis" aria-label="Две генетические линии">${buttons}</div>`;
    return `<div class="hc-diagram hc-${topic.id}" aria-label="${topic.id === 'configurations' ? 'Шесть сосуществующих форм, не шкала оценки человека' : 'Различение трудности, аномалии и предела'}">${buttons}</div>`;
  }

  function renderWorkspace(mount) {
    const instance = mount.dataset.hcWorkspace;
    const topic = currentTopic();
    const node = topic.nodes.find(item => item.id === selectedNodes.get(topic.id)) || topic.nodes[0];
    mount.innerHTML = `
      <div class="hc-topic-nav" role="tablist" aria-label="Направления исследования">
        ${data.topics.map(item => `<button type="button" class="hc-topic-tab" role="tab" id="hc-tab-${instance}-${item.id}" data-hc-topic="${item.id}" aria-selected="${topic.id===item.id}" tabindex="${topic.id===item.id ? '0' : '-1'}" aria-controls="hc-panel-${instance}"><span>${item.index}</span><span>${escape(item.label)}</span></button>`).join('')}
      </div>
      <div class="hc-spread" role="tabpanel" id="hc-panel-${instance}" aria-labelledby="hc-tab-${instance}-${topic.id}">
        <div class="hc-topic-copy">
          <span class="hc-micro">${escape(topic.shortLabel.toLocaleUpperCase('ru'))} / ${escape(window.HC_TEXT_DISPLAY.arabic(topic.sourceRef))}</span>
          <h3>${escape(topic.question)}</h3>
          <p class="hc-topic-summary">${escape(topic.summary)}</p>
          <p class="hc-topic-caution">${escape(topic.caution)}</p>
          <details class="hc-inline-source"><summary><span>ОСНОВАНИЕ В ТРАКТАТЕ · ${escape(window.HC_TEXT_DISPLAY.arabic(topic.sourceRef))}</span></summary><blockquote>${escape(topic.quote)}</blockquote><button class="hc-text-action" type="button" data-hc-source="${topic.sourcePart}">ЧИТАТЬ РАЗДЕЛ</button></details>
        </div>
        <div class="hc-topic-visual">
          <div class="hc-visual-toolbar"><span class="hc-micro">${visualMode === 'diagram' ? 'СХЕМА-ПОЯСНЕНИЕ' : 'ИЗ ПЕРВИЧНОГО ТЕКСТА'}</span><div class="hc-view-switch" role="group" aria-label="Способ рассмотрения"><button type="button" data-hc-view="diagram" aria-pressed="${visualMode==='diagram'}">СХЕМА</button><button type="button" data-hc-view="text" aria-pressed="${visualMode==='text'}">ТЕКСТ</button></div></div>
          ${visualMode === 'diagram' ? `${diagram(topic,instance)}<div class="hc-node-detail" aria-live="polite"><strong>${escape(node.label)}</strong><p>${escape(node.description)}</p></div>` : `<div class="hc-quote-view"><blockquote>${escape(topic.quote)}</blockquote><p class="hc-micro">ДЕНИС ГАРДАРИ · ТРАКТАТ v5.2 · ${escape(window.HC_TEXT_DISPLAY.arabic(topic.sourceRef))}</p><button type="button" class="hc-text-action" data-hc-source="${topic.sourcePart}">ОТКРЫТЬ ЧТЕНИЕ</button></div>`}
        </div>
      </div>
      <div class="hc-workspace-foot"><span>ПОЯСНЕНИЯ ПО РАБОЧЕЙ РЕДАКЦИИ ТЕОРИИ. НЕ ОКОНЧАТЕЛЬНАЯ АВТОРСКАЯ МЕТА-СХЕМА.</span><button type="button" class="hc-text-action" data-open-panel="comments">ОБСУДИТЬ</button></div>`;
  }

  function renderWorkspaces() {
    $$('[data-hc-workspace]').forEach(renderWorkspace);
    if (['overview','map'].includes(currentRoute())) context(`topic:${activeTopic}`,currentTopic().label);
  }

  function selectTopic(id,focusInstance) {
    if (!data.topics.some(item => item.id === id)) return;
    activeTopic = id;
    renderWorkspaces();
    if (focusInstance) $(`[data-hc-workspace="${focusInstance}"] [data-hc-topic="${id}"]`)?.focus({preventScroll:true});
  }

  function renderSource(partId = selectedPart) {
    const part = data.parts.find(item => item.id === partId) || data.parts[0];
    selectedPart = part.id;
    document.dispatchEvent(new CustomEvent('hc:reader-request',{detail:{route:'treatise',groupId:`t-${part.id}`}}));
  }

  function syncRoute(route) {
    $$('#hc-matrix-nav .section-tab').forEach(button => {
      const active = button.dataset.route === route || (button.dataset.route==='treatise' && route==='master');
      button.classList.toggle('is-active',active);
      if (active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
    });
    if (route==='overview' || route==='map') context(`topic:${activeTopic}`,currentTopic().label);
    else if (route==='treatise') context(`treatise:${selectedPart}`,'Трактат · полный текст');
    else if (route==='lab') context('lab:appropriation','Опыт · Пользование и присвоение');
    else context(`route:${route}`,({schemes:'Схемы х.0',game:'Игра х.0',examples:'Примеры х.0',book:'Книга HOMO COGITANS',master:'Мастер-текст',journal:'Дневник исследования'})[route] || 'Исследование');
  }

  document.addEventListener('click', event => {
    const target = event.target;
    const mount = target.closest('[data-hc-workspace]');
    const topicButton = target.closest('[data-hc-topic]');
    if (topicButton) selectTopic(topicButton.dataset.hcTopic,mount?.dataset.hcWorkspace);
    const nodeButton = target.closest('[data-hc-node]');
    if (nodeButton) {
      const id = nodeButton.dataset.hcNode;
      selectedNodes.set(activeTopic,id);
      renderWorkspaces();
      $(`[data-hc-workspace="${mount.dataset.hcWorkspace}"] [data-hc-node="${id}"]`)?.focus({preventScroll:true});
    }
    const viewButton = target.closest('[data-hc-view]');
    if (viewButton) {
      visualMode=viewButton.dataset.hcView;
      renderWorkspaces();
      $(`[data-hc-workspace="${mount.dataset.hcWorkspace}"] [data-hc-view="${visualMode}"]`)?.focus({preventScroll:true});
    }
    const sourceButton=target.closest('[data-hc-source]');
    if (sourceButton) {
      returnRoute=['map','overview'].includes(currentRoute())?currentRoute():'overview';
      selectedPart=sourceButton.dataset.hcSource;
      navigate({route:'treatise',source:selectedPart});
    }
    const partButton=target.closest('[data-hc-part]');
    if (partButton) {
      const partId=partButton.dataset.hcPart;
      renderSource(partId);
      $(`[data-hc-part="${partId}"]`)?.focus({preventScroll:true});
    }
    if (target.closest('[data-hc-return]')) navigate({route:returnRoute});
    const chapter=target.closest('[data-hc-chapter]');
    if (chapter) navigate({route:'book',chapter:Number(chapter.dataset.hcChapter)});
    if (target.closest('[data-hc-open-experiment]')) navigate({route:'lab'});
    if (target.closest('#hc-replay-intro')) $('#replay-intro').click();
  });

  document.addEventListener('keydown',event => {
    const tab=event.target.closest('[data-hc-topic]');
    if (!tab || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const index=data.topics.findIndex(item=>item.id===activeTopic);
    const next=event.key==='Home'?0:event.key==='End'?data.topics.length-1:(index+(event.key==='ArrowRight'?1:-1)+data.topics.length)%data.topics.length;
    selectTopic(data.topics[next].id,tab.closest('[data-hc-workspace]').dataset.hcWorkspace);
  });
  document.addEventListener('hc:route-changed',event=>syncRoute(event.detail.route));
  document.addEventListener('hc:source',event=>renderSource(event.detail.part));
  document.addEventListener('hc:chapter',event=>context(`book:${event.detail.number}`,`Книга · ${event.detail.title}`));

  const search=$('#hc-material-search');
  const results=$('#hc-search-results');
  const baseSearch=[
    {title:'Схемы х.0',hint:'Визуальный аппарат теории · в развитии',route:'schemes',keywords:'схемы диаграммы рисунки'},
    {title:'Игра х.0',hint:'Игровая идея · в разработке',route:'game',keywords:'игра игровые механики'},
    {title:'Примеры х.0',hint:'Истории и жизненные ситуации',route:'examples',keywords:'примеры истории ситуации'},
    {title:'HOMO COGITANS',hint:'Книга · структура глав',route:'book'},
    {title:'Мета-карта х.0',hint:'Пять направлений исследования',route:'map'},
    {title:'Мастер-текст',hint:'Три беседы и заключение · полный основной текст',route:'master'},
    {title:'Трактат',hint:'Полная сводная рабочая редакция 5.2',route:'treatise'},
    {title:'Лаборатория',hint:'Пользование и присвоение · опыт',route:'lab'},
    ...data.topics.map(topic=>({title:topic.label,hint:topic.question,route:'map',topic:topic.id,keywords:topic.summary})),
    ...data.topics.flatMap(topic=>topic.nodes.map(node=>({title:node.label,hint:topic.label,route:'map',topic:topic.id,node:node.id,keywords:`${node.short} ${node.description}`}))),
    ...data.parts.map(part=>({title:`${window.HC_TEXT_DISPLAY.arabic(part.id)}. ${part.title}`,hint:'Трактат',route:'treatise',source:part.id,keywords:part.excerpt}))
  ];
  const normalize=text=>text.toLocaleLowerCase('ru').replaceAll('ё','е').replaceAll('x.0','х.0');
  function closeSearch() { results.hidden=true; search.setAttribute('aria-expanded','false'); }
  function searchResearch() {
    const words=normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    if (!words.length) { closeSearch(); return; }
    searchMatches=baseSearch.filter(item=>words.every(word=>normalize(`${item.title} ${item.hint} ${item.keywords||''}`).includes(word))).slice(0,9);
    results.replaceChildren();
    const label=document.createElement('div'); label.className='search-results-label';
    label.textContent=searchMatches.length?'РАЗДЕЛЫ, ПОНЯТИЯ И ФРАГМЕНТЫ':'НИЧЕГО НЕ НАЙДЕНО. ПОПРОБУЙТЕ «ФОРМА» ИЛИ «ПРИСВОЕНИЕ».';
    results.append(label);
    searchMatches.forEach((item,index)=>{
      const button=document.createElement('button'); button.type='button'; button.className='search-result'; button.dataset.hcResult=String(index);
      const title=document.createElement('strong'); title.textContent=item.title;
      const hint=document.createElement('small'); hint.textContent=item.hint;
      button.append(title,hint); results.append(button);
    });
    results.hidden=false; search.setAttribute('aria-expanded','true');
  }
  search.addEventListener('input',searchResearch);
  $('#hc-search-form').addEventListener('submit',event=>{event.preventDefault();searchResearch();results.querySelector('button')?.focus();});
  results.addEventListener('click',event=>{
    const button=event.target.closest('[data-hc-result]');
    if (!button) return;
    const match=searchMatches[Number(button.dataset.hcResult)];
    if (!match) return;
    if (match.topic) { if(match.node) selectedNodes.set(match.topic,match.node); selectTopic(match.topic); }
    search.value=''; closeSearch(); navigate({route:match.route,source:match.source});
  });
  document.addEventListener('click',event=>{if(!event.target.closest('#hc-search-form'))closeSearch();});
  search.addEventListener('keydown',event=>{if(event.key==='Escape')closeSearch();if(event.key==='ArrowDown'&&!results.hidden){event.preventDefault();results.querySelector('button')?.focus();}});

  const experimentReplies={
    result:'Мы видим доступ к внешнему результату. Это пользование. Из одного полученного ответа ещё нельзя заключить, что собственный способ понимания и действия изменился.',
    ability:'Стоит проверить, может ли человек различить основания, обнаружить ошибку и действовать в новой ситуации. Такие изменения будут свидетельствовать о преобразовании способности. При этом присвоение не равно полному отказу от инструмента.',
    uncertain:'Да, одного результата недостаточно. Чтобы различить пользование и присвоение, нужно наблюдать, как человек понимает основания и действует, в том числе при изменении задачи.'
  };
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-hc-experiment]');
    if(!button)return;
    $$('[data-hc-experiment]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    const answer=$('#hc-lab-answer');
    if(answer)answer.textContent=experimentReplies[button.dataset.hcExperiment];
  });
  renderWorkspaces();
})();
