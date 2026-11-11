'use strict';

function buildContactDraft(values) {
  const name = values.fullname.trim();
  const email = values.email.trim();
  const subject = values.interest;
  const message = `Hi Abdelmaboud,\n\nI'm ${name}.\nI'd like to discuss: ${subject}.\n\n${values.message.trim()}${email ? `\n\nMy email: ${email}` : ''}`;
  return {
    message,
    whatsapp: `https://wa.me/201013470551?text=${encodeURIComponent(message)}`,
    email: `mailto:abdomohamed2751@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
  };
}

const contactForm = document.querySelector('[data-form]');
const contactSubmit = contactForm.querySelector('[data-form-btn]');
const contactFeedback = contactForm.querySelector('.form-feedback');
const draftValues = () => Object.fromEntries(new FormData(contactForm));
const setContactFeedback = message => {
  contactFeedback.classList.add('success');
  contactFeedback.textContent = message;
};
contactForm.addEventListener('change', () => {
  contactSubmit.textContent = contactForm.elements.channel.value === 'email' ? 'Continue to email ↗' : 'Continue to WhatsApp ↗';
});
contactForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const values = draftValues();
  if (!values.fullname.trim() || !values.message.trim()) {
    setContactFeedback('Please add your name and a short message.');
    return;
  }
  const draft = buildContactDraft(values);
  // Keep every field intact: opening an app does not confirm delivery.
  if (values.channel === 'email') window.location.href = draft.email;
  else window.open(draft.whatsapp, '_blank', 'noopener,noreferrer');
  setContactFeedback('Your draft is ready. Complete sending in the app that opens. If it doesn’t open, copy the message below or use a direct contact link above.');
});
async function copyTextSafely(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return; } catch { /* Try the local-file fallback. */ }
  }
  const previous = document.activeElement;
  const field = document.createElement('textarea');
  field.value = text;
  field.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(field);
  field.select();
  let copied = false;
  try { copied = document.execCommand('copy'); }
  finally { field.remove(); previous?.focus({ preventScroll: true }); }
  if (!copied) throw new Error('Clipboard unavailable');
}
document.getElementById('copyDraft').addEventListener('click', async () => {
  if (!contactForm.reportValidity()) return;
  const values = draftValues();
  if (!values.fullname.trim() || !values.message.trim()) {
    setContactFeedback('Please add your name and a short message.'); return;
  }
  try {
    await copyTextSafely(buildContactDraft(values).message);
    setContactFeedback('Message copied. Paste it into WhatsApp or email when you’re ready.');
  } catch {
    setContactFeedback('Clipboard unavailable. Select and copy your message manually; your text is still here.');
  }
});
let copyNoticeTimer;
document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    const notice = document.getElementById('toastNotification');
    try {
      await copyTextSafely(button.dataset.copy);
      notice.querySelector('.toast-text').textContent = 'Copied to clipboard!';
    } catch {
      notice.querySelector('.toast-text').textContent = 'Could not copy. Please select the contact details manually.';
    }
    notice.classList.add('active');
    clearTimeout(copyNoticeTimer);
    copyNoticeTimer = setTimeout(() => notice.classList.remove('active'), 3500);
  });
});

// Reuse existing project content; keep the homepage and portfolio in sync.
const featuredHost = document.getElementById('featuredProjects');
document.querySelectorAll('[data-highlight]').forEach(item => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'featured-card';
  button.dataset.highlightCard = item.dataset.highlight;
  const img = document.createElement('img');
  img.src = item.dataset.projectImg;
  img.alt = item.dataset.projectTitle;
  img.loading = 'lazy';
  img.width = 480;
  img.height = 300;
  const role = document.createElement('span');
  role.className = 'featured-role';
  role.textContent = item.dataset.projectRole;
  const title = document.createElement('h4');
  title.textContent = item.dataset.projectTitle;
  const description = document.createElement('p');
  description.textContent = item.dataset.projectDesc;
  const action = document.createElement('span');
  action.className = 'featured-action';
  action.textContent = 'Explore project ↗';
  button.append(img, role, title, description, action);
  button.addEventListener('click', () => openProjectModal(item));
  featuredHost.appendChild(button);
});

const workPicker = document.querySelector('.work-picker');
function showSelectedWork() {
  const selected = workPicker.querySelector(':checked').value;
  for (const card of featuredHost.children) {
    card.hidden = selected !== 'all' && card.dataset.highlightCard !== selected;
  }
  featuredHost.classList.toggle('single-highlight', selected !== 'all');
}
workPicker.addEventListener('change', showSelectedWork);
window.addEventListener('pageshow', showSelectedWork);
showSelectedWork();

const projectConversation = document.createElement('button');
projectConversation.type = 'button';
projectConversation.className = 'secondary-action project-conversation';
projectConversation.textContent = 'Have a similar project? Let’s talk ↗';
projectConversation.addEventListener('click', () => {
  const project = pModalTitle.textContent;
  closeProjectModal();
  document.querySelector('[data-nav-link-target="contact"]').click();
  const message = contactForm.elements.message;
  // Preserve any message the visitor already wrote.
  if (!message.value.trim()) message.value = `I saw your ${project} project and would like to discuss something similar.\n\nMy idea: `;
  message.focus({ preventScroll: true });
});
pModalAction.after(projectConversation);

// Keep keyboard focus inside an open project dialog and return to its opener.
let modalOpener = null;
const projectDialogObserver = new MutationObserver(() => {
  if (projectModalContainer.classList.contains('active')) {
    modalOpener = document.activeElement;
    projectModalCloseBtn.focus();
  } else {
    // Only restore when focus was left inside the now-hidden dialog.
    if (projectModalContainer.contains(document.activeElement)) modalOpener?.focus({ preventScroll: true });
  }
});
projectDialogObserver.observe(projectModalContainer, { attributes: true, attributeFilter: ['class'] });
projectModalContainer.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const focusable = [...projectModalContainer.querySelectorAll('a[href],button:not([disabled])')].filter(node => node.getClientRects().length);
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
function syncConversationBanner() {
  document.querySelector('.conversation-banner').hidden = document.querySelector('[data-page="contact"]').classList.contains('active');
}
navigationLinks.forEach(link => link.addEventListener('click', syncConversationBanner));
window.addEventListener('DOMContentLoaded', syncConversationBanner);
syncConversationBanner();

window.addEventListener('portfolio:pagechange', syncConversationBanner);

const introProject = document.getElementById('introProject');
introProject.addEventListener('click', () => {
  openProjectModal(document.querySelector('[data-highlight="content"]'));
});
