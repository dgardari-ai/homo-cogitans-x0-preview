/* Adapted from the actual Blog Gardari slider, commit
   87681fc8585c9d55f9c41412fc16ad9e06b54a97 (app.js:137–172).
   Six forms and their short glosses follow Treatise 5.2, III.3–III.8.
   Images are the author's square covers supplied for this six-form sequence. */
(() => {
  'use strict';
  const track = document.getElementById('hc-forms-track');
  if (!track) return;

  const forms = [
    {
      number:'1.0', title:'КООПЕРАТИВНО-МИМЕТИЧЕСКОЕ МЫШЛЕНИЕ',
      detail:'Жест, ритм, подражание и передача навыка создают общий мир совместного действия.',
      image:'assets/x0_1_0_square_v01.webp'
    },
    {
      number:'2.0', title:'МИФО-РИТУАЛЬНО-СИМВОЛИЧЕСКОЕ МЫШЛЕНИЕ',
      detail:'Миф, образ и ритуал делают отсутствующее действующим участником общего мира.',
      image:'assets/x0_2_0_square_v01.webp'
    },
    {
      number:'3.0', title:'АРХИВНО-ЦИВИЛИЗАЦИОННОЕ МЫШЛЕНИЕ',
      detail:'Письмо, счёт и норма превращают память в устойчивую внешнюю организацию жизни.',
      image:'assets/x0_3_0_square_v01.webp'
    },
    {
      number:'4.0', title:'ЛОГОЦЕНТРИЧЕСКОЕ МЫШЛЕНИЕ',
      detail:'Понятие, диалог и аргумент позволяют спрашивать об основаниях и проверять мысль мыслью.',
      image:'assets/x0_4_0_square_v01.webp'
    },
    {
      number:'5.0', title:'ЛИЧНОСТНО-ГЕРМЕНЕВТИЧЕСКОЕ МЫШЛЕНИЕ',
      detail:'Понимание предельного основания требует незаменимого личного ответа и преобразования жизни.',
      image:'assets/x0_5_0_square_v01.webp'
    },
    {
      number:'6.0', title:'НАУЧНО-ОПЕРАЦИОНАЛЬНОЕ МЫШЛЕНИЕ',
      detail:'Метод, измерение и модель делают результат предметом независимой проверки и управляемого изменения.',
      image:'assets/x0_6_0_square_v01.webp'
    }
  ];
  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  forms.forEach((item,index) => {
    const panel = document.createElement('article');
    panel.className = 'accordion-panel' + (index === 0 ? ' is-open' : '');
    panel.innerHTML = [
      '<button class="panel-activate" type="button" aria-pressed="',index === 0,'" aria-label="',escapeHtml(item.number),' — ',escapeHtml(item.title),'">',
      '<img src="',item.image,'" alt="" loading="',index < 2 ? 'eager' : 'lazy','" draggable="false">',
      '<span class="panel-overlay" aria-hidden="true"></span>',
      '<span class="panel-title-vertical" aria-hidden="true">',escapeHtml(item.title.replace(/ МЫШЛЕНИЕ$/, '')),' · ',escapeHtml(item.number),'</span>',
      '<span class="panel-caption"><b class="panel-stage-number" aria-hidden="true">',escapeHtml(item.number),'</b>',
      '<small>ФОРМА МЫШЛЕНИЯ</small>',
      '<strong>',escapeHtml(item.title),'</strong><span>',escapeHtml(item.detail),'</span></span>',
      '</button>'
    ].join('');
    panel.querySelector('img').addEventListener('error', () => panel.classList.add('image-missing'));
    track.append(panel);
  });

  const panels = [...track.querySelectorAll('.accordion-panel')];
  const activate = index => {
    panels.forEach((panel,i) => {
      const isOpen = i === index;
      panel.classList.toggle('is-open',isOpen);
      panel.querySelector('.panel-activate').setAttribute('aria-pressed',String(isOpen));
    });
  };
  panels.forEach((panel,index) => {
    panel.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') activate(index); });
    const button = panel.querySelector('.panel-activate');
    button.addEventListener('focus', () => activate(index));
    button.addEventListener('click', () => activate(index));
  });
  track.addEventListener('keydown',event => {
    if (!['ArrowRight','ArrowLeft'].includes(event.key)) return;
    const current = panels.findIndex(p => p.classList.contains('is-open'));
    const next = (current + (event.key === 'ArrowRight' ? 1 : -1) + panels.length) % panels.length;
    activate(next);
    panels[next].querySelector('.panel-activate').focus();
    event.preventDefault();
  });
})();
