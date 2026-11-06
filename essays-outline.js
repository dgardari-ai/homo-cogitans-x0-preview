/* Reader-facing essay outline. Source IDs and authorial texts remain unchanged. */
(() => {
  'use strict';
  const source = window.HC_ESSAYS_INDEX;
  if (!source) return;

  // One thematic route for every reader, without internal Book I / Book II labels.
  const topics = [
    ['es-2-5', 'Истоки и ранние формы мышления'],
    ['es-1-1', 'Совместность и подражание'],
    ['es-1-2', 'Миф, ритуал и символ'],
    ['es-1-3', 'Письмо, архив и цивилизация'],
    ['es-1-4', 'Логос, спор и доказательство'],
    ['es-1-5', 'Личность и истолкование'],
    ['es-1-6', 'Научное мышление и его пределы'],
    ['es-2-1', 'Западные мыслители и исследователи'],
    ['es-2-4', 'Русские мыслители'],
    ['es-2-2', 'Исследовательские направления'],
    ['es-2-3', 'Теоретические вопросы и развилки']
  ];
  const byId = new Map(source.groups.map(group => [group.id, group]));
  let ordinal = 0;
  const groups = topics.map(([id, label], index) => {
    const group = byId.get(id);
    if (!group) throw new Error('Не найдена тема корпуса эссе: ' + id);
    return {
      ...group,
      index: String(index + 1).padStart(2, '0'),
      label,
      children: group.children.map(essay => ({
        ...essay,
        displayNumber: String(++ordinal).padStart(2, '0'),
        label: essay.label.replace(/^Э\d{1,3}\.\s*/u, '')
      }))
    };
  });
  if (groups.length !== source.groups.length || ordinal !== 83) {
    throw new Error('Читательское оглавление эссе неполное.');
  }
  window.HC_ESSAY_OUTLINE = Object.freeze({ groups, count: ordinal });
})();
