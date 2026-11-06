/* Three original text corpora. Client-side rendering never edits source data. */
(() => {
  'use strict';
  const index = window.HC_TEXT_INDEX;
  if (!index) return;
  const cache = new Map();
  const selected = {treatise:'t-I',master:'m-1',book:'b-1'};
  let revision = 0;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const displayInline = (source, route) => window.HC_TEXT_DISPLAY.inline(source, {numerals:route === 'treatise'});

  async function getLines(route) {
    if (!cache.has(route)) {
      const address = index[route].file;
      cache.set(route, fetch(address, {cache:'force-cache'}).then(response => {
        if (!response.ok) throw new Error(`Источник ${address}: ${response.status}`);
        return response.text();
      }).then(source => source.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').split('\n')));
    }
    return cache.get(route);
  }

  function renderLines(route,lines,group,next) {
    const from = group.line-1;
    const to = next ? next.line-1 : lines.length;
    const children = new Map(group.children.map(item => [item.line,item]));
    const parts = [];
    let list = false;
    const closeList=()=>{if(list){parts.push('</ul>');list=false;}};
    const heading=(level,text,n)=>{
      closeList();
      const tag=`h${Math.min(level,4)}`;
      const shown=route==='treatise'?window.HC_TEXT_DISPLAY.arabic(text):text;
      // Every authored structural heading of the unnumbered conversations needs
      // the same guide. In the treatise, title-page labels and formula callouts
      // remain unguided; numbered parts and Cyrillic appendices are guided.
      const guided=route==='master'||/^\s*(?:\d+(?:\.\d+)*\.|[А-Г](?:\.\d+)+\.|приложение\s+[А-Г]\.|(?:глава|часть|раздел)\s+\d+\b|беседа\s+(?:первая|вторая|третья)\b|часть\s+[IVX]+\.)/iu.test(shown);
      const dots=guided?'<span class="hc-heading-dotline" aria-hidden="true"></span>':'';
      parts.push(`<${tag} id="hc-${route}-line-${n}" class="hc-text-heading${guided?' hc-text-guided':''}" data-hc-line="${n}">${dots}${displayInline(text,route)}</${tag}>`);
    };
    for (let i=from;i<to;i++) {
      const line=lines[i]||'';
      const clean=line.trim();
      if(!clean){closeList();continue;}
      if(/^_{8,}$/.test(clean)){closeList();continue;}
      if(route==='treatise' && clean==='**Версия 5.2. Сводная рабочая редакция.**')continue;
      const md=/^(#{1,5})\s+(.+)$/.exec(line);
      if(md&&index[route].format==='markdown'){
        const depth=md[1].length;
        heading(depth,md[2],i+1);
        continue;
      }
      if((i===from||children.has(i+1))&&index[route].format==='plaintext'){
        heading(i===from?1:children.get(i+1).level,clean,i+1);
        continue;
      }
      const bullet=/^\s*\*\s+(.+)$/.exec(line);
      if(bullet){if(!list){parts.push('<ul class="hc-text-list">');list=true;}parts.push(`<li>${displayInline(bullet[1],route)}</li>`);continue;}
      closeList();
      parts.push(`<p${line.startsWith('\t')?' class="hc-text-indented"':''}>${displayInline(line,route)}</p>`);
    }
    closeList();
    return parts.join('');
  }

  function selectionFromHash(route) {
    const [hashRoute,encodedGroup,lineString] = location.hash.slice(1).split('/');
    if (hashRoute!==route) return {};
    let groupId=encodedGroup;
    try { groupId=decodeURIComponent(encodedGroup||''); } catch { groupId=undefined; }
    const line=Number(lineString);
    return {groupId, line:Number.isInteger(line)&&line>0?line:undefined};
  }

  async function show(route,request={}) {
    if(!index[route])return;
    const target=$(`#hc-text-content-${route}`);
    if(!target)return;
    const work=++revision;
    const book=index[route];
    const candidates=book.groups;
    const group=candidates.find(item=>item.id===request.groupId)||candidates.find(item=>item.id===selected[route])||candidates[0];
    selected[route]=group.id;
    const child=group.children.find(item=>item.line===Number(request.line));
    const next=candidates[candidates.indexOf(group)+1];
    target.classList.add('is-loading');
    target.innerHTML='<p class="hc-text-loading" role="status">ЗАГРУЗКА ТЕКСТА…</p>';
    try {
      const lines=await getLines(route);
      if(work!==revision)return;
      target.classList.remove('is-loading');
      const before=candidates[candidates.indexOf(group)-1];
      const nextChapter=route==='book'&&next?.kind==='sources'?null:next;
      target.innerHTML=`
        <div class="hc-text-body" data-group="${escape(group.id)}">${renderLines(route,lines,group,next)}</div>
        <nav class="hc-text-paper-actions" aria-label="Переходы между разделами">
          ${before?`<button class="hc-outline-button hc-reader-prev" type="button" data-hc-reader-group="${escape(before.id)}" data-hc-reader-route="${route}">ПРЕДЫДУЩИЙ РАЗДЕЛ</button>`:''}
          <button class="hc-outline-button hc-reader-contents" type="button" data-open-panel="contents">ОГЛАВЛЕНИЕ</button>
          ${nextChapter?`<button class="hc-outline-button hc-reader-next" type="button" data-hc-reader-group="${escape(nextChapter.id)}" data-hc-reader-route="${route}">СЛЕДУЮЩИЙ РАЗДЕЛ</button>`:''}
        </nav>`;
      const activeLine=child?.line;
      history.replaceState(null,'',`#${route}/${encodeURIComponent(group.id)}${activeLine?`/${activeLine}`:''}`);
      const contextLabel=child?.label||group.label;
      document.dispatchEvent(new CustomEvent('hc:context',{detail:{id:`${route}:${group.id}${activeLine?`:${activeLine}`:''}`,label:`${book.title} · ${contextLabel}`}}));
      document.dispatchEvent(new CustomEvent('hc:reader-active',{detail:{route,groupId:group.id,line:activeLine}}));
      requestAnimationFrame(()=>{
        if(work!==revision)return;
        if(activeLine){
          const heading=target.querySelector(`[data-hc-line="${activeLine}"]`);
          if(heading){const offset=($('.hc-site-header')?.getBoundingClientRect().height||85)+24;window.scrollTo({top:window.scrollY+heading.getBoundingClientRect().top-offset,behavior:'instant'});heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
        } else {
          window.scrollTo({top:0,behavior:'instant'});
          const title=target.querySelector('h1');
          if(title){title.setAttribute('tabindex','-1');title.focus({preventScroll:true});}
        }
      });
    } catch(error) {
      if(work!==revision)return;
      target.classList.remove('is-loading');
      target.innerHTML=`<p class="hc-text-error" role="alert">Не удалось открыть текст. Попробуйте ещё раз.</p><button class="hc-outline-button" type="button" data-hc-reader-retry="${route}">ПОВТОРИТЬ</button>`;
      cache.delete(route);
    }
  }

  document.addEventListener('hc:route-changed',event=>{
    const route=event.detail.route;
    if(index[route])show(route,selectionFromHash(route));
    else revision++;
  });
  document.addEventListener('hc:reader-request',event=>{
    const data=event.detail||{};
    if(index[data.route])show(data.route,data);
  });
  document.addEventListener('hc:chapter',event=>{
    const number=Number(event.detail.number);
    if(number>=1&&number<=3)show('book',{groupId:`b-${number}`});
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-hc-reader-group]');
    if(button){document.dispatchEvent(new CustomEvent('hc:navigate',{detail:{route:button.dataset.hcReaderRoute,groupId:button.dataset.hcReaderGroup}}));return;}
    const retry=event.target.closest('[data-hc-reader-retry]');
    if(retry)show(retry.dataset.hcReaderRetry);
  });
  window.HC_TEXT_READER={show};
})();
