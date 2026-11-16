'use strict';
// Language changes and generated project cards can reinsert arrow text.
// Replace only text nodes, preserving the controls and their event handlers.
(() => {
  const markup = '<i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>';
  function replaceArrows() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.nodeValue.includes('↗') && !node.parentElement.closest('script, style, textarea, input, code, pre')
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      node.nodeValue.split('↗').forEach((part, index) => {
        if (index) { const template = document.createElement('template'); template.innerHTML = markup; fragment.append(template.content.cloneNode(true)); }
        fragment.append(document.createTextNode(part));
      });
      node.replaceWith(fragment);
    }
    document.querySelectorAll('.fa-arrow-up-right-from-square').forEach(icon => {
      const wrapper = icon.parentElement;
      if (wrapper?.tagName === 'SPAN') wrapper.classList.add('fa-icon-wrap');
    });
  }
  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; replaceArrows(); });
  }).observe(document.body, {childList: true, subtree: true, characterData: true});
  replaceArrows();
})();
