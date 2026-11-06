/* Presentation only: authorial source files and their stable anchors stay intact. */
(() => {
  'use strict';
  const roman = Object.freeze({I:1, II:2, III:3, IV:4, V:5, VI:6, VII:7, VIII:8, XX:20});
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function arabic(value) {
    return String(value ?? '').replace(/(?<![\p{L}\p{N}_])(?:VIII|VII|III|VI|IV|II|XX|V|I)(?![\p{L}\p{N}_])/gu, (token, offset, text) => {
      // The English pronoun in Hofstadter's book title is not a Roman numeral.
      if (token === 'I' && /^\s+Am\s+a\s+Strange\s+Loop\b/.test(text.slice(offset + 1))) return token;
      return String(roman[token]);
    });
  }

  function emphasis(text) {
    const out = [], stack = [];
    const toggle = (tag, marker) => {
      if (stack.at(-1)?.tag === tag) {
        stack.pop();
        out.push(`</${tag}>`);
      } else if (stack.some(item => item.tag === tag)) out.push(marker);
      else {
        stack.push({tag, marker, index:out.length});
        out.push(`<${tag}>`);
      }
    };
    const pieces = text.split(/(\*{1,3})/g);
    for (const piece of pieces) {
      if (piece === '***') {
        if (stack.at(-1)?.tag === 'strong' && stack.at(-2)?.tag === 'em') {
          toggle('strong','**'); toggle('em','*');
        } else {
          toggle('em','*'); toggle('strong','**');
        }
      } else if (piece === '**') toggle('strong','**');
      else if (piece === '*') toggle('em','*');
      else out.push(piece);
    }
    for (const item of stack) out[item.index] = item.marker;
    return out.join('');
  }

  function inline(source, {numerals = false} = {}) {
    const fragments = [];
    const text = String(source ?? '').replace(/&nbsp;/g,'\u00a0');
    const content = text.replace(/\[([^\]\n]+)\]\((https?:\/\/(?:[^\s()]|\([^\s()]*\))+)\)|`([^`\n]+)`/g, (match, label, href, code) => {
      const fragment = code !== undefined
        ? `<code>${escape(code)}</code>`
        : `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${emphasis(escape(numerals ? arabic(label) : label))}</a>`;
      const token = `\uE000${fragments.length}\uE001`;
      fragments.push(fragment);
      return token;
    });
    return emphasis(escape(numerals ? arabic(content) : content))
      .replace(/\uE000(\d+)\uE001/g, (_, n) => fragments[Number(n)]);
  }

  globalThis.HC_TEXT_DISPLAY = Object.freeze({arabic, inline, escape});
})();
