/**
 * Abdelmaboud Mohamed - Modern Portfolio & CV Engine
 * High-performance, accessible, responsive client script
 */

'use strict';

// ---------------------------------------------------------------------------
// 1. GENERAL UTILITY FUNCTIONS
// ---------------------------------------------------------------------------
const elementToggleFunc = function (elem) {
  if (elem) elem.classList.toggle("active");
};

// ---------------------------------------------------------------------------
// 3. COPY TO CLIPBOARD WITH TOAST NOTIFICATION
// ---------------------------------------------------------------------------
// Contact clipboard handling is implemented in contact.js.

// ---------------------------------------------------------------------------
// 4. TESTIMONIALS MODAL
// ---------------------------------------------------------------------------
const testimonialsItems = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

const toggleTestimonialsModal = function () {
  if (modalContainer && overlay) {
    modalContainer.classList.toggle("active");
    overlay.classList.toggle("active");
    if (modalContainer.classList.contains("active")) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }
};

testimonialsItems.forEach(item => {
  item.addEventListener("click", function () {
    const avatar = this.querySelector("[data-testimonials-avatar]");
    const title = this.querySelector("[data-testimonials-title]");
    const text = this.querySelector("[data-testimonials-text]");

    if (modalImg && avatar) {
      modalImg.src = avatar.src;
      modalImg.alt = avatar.alt || "Client Avatar";
    }
    if (modalTitle && title) {
      modalTitle.innerHTML = title.innerHTML;
    }
    if (modalText && text) {
      modalText.innerHTML = text.innerHTML;
    }

    toggleTestimonialsModal();
  });
});

if (modalCloseBtn) modalCloseBtn.addEventListener("click", toggleTestimonialsModal);
if (overlay) overlay.addEventListener("click", toggleTestimonialsModal);

// ---------------------------------------------------------------------------
// 5. PORTFOLIO FILTERING & LIVE SEARCH
// ---------------------------------------------------------------------------
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-select-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");
const filterItems = document.querySelectorAll("[data-filter-item]");
const projectSearchInput = document.getElementById("projectSearch");
const searchClearBtn = document.getElementById("searchClearBtn");
const noProjectsFound = document.getElementById("noProjectsFound");
const resetFilterBtn = document.getElementById("resetFilterBtn");

let currentCategory = "all";
let currentSearchQuery = "";

const applyFilters = function () {
  let visibleCount = 0;
  const q = currentSearchQuery.toLowerCase().trim();

  filterItems.forEach(item => {
    const itemCat = (item.dataset.category || "").toLowerCase().trim();
    const itemTitle = (item.dataset.projectTitle || item.querySelector(".project-title")?.innerText || "").toLowerCase();
    const itemTech = (item.dataset.projectTech || item.querySelector(".project-tech")?.innerText || "").toLowerCase();

    const matchesCategory = (currentCategory === "all" || currentCategory === itemCat);
    const matchesSearch = !q || itemTitle.includes(q) || itemTech.includes(q) || itemCat.includes(q);

    if (matchesCategory && matchesSearch) {
      item.classList.add("active");
      visibleCount++;
    } else {
      item.classList.remove("active");
    }
  });

  const resultCount = document.getElementById('projectResultCount');
  if (resultCount) resultCount.textContent = visibleCount + ' of ' + filterItems.length + ' projects';
  filterBtn.forEach(button => {
    const active = button.dataset.categoryTarget === currentCategory;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  if (noProjectsFound) {
    noProjectsFound.style.display = visibleCount === 0 ? "block" : "none";
  }
};

// Category filter buttons (Desktop)
let lastClickedBtn = filterBtn[0];
filterBtn.forEach(btn => {
  btn.addEventListener("click", function () {
    currentCategory = (this.getAttribute("data-category-target") || this.innerText).toLowerCase().trim();
    if (selectValue) selectValue.innerText = this.innerText;

    if (lastClickedBtn) lastClickedBtn.classList.remove("active");
    this.classList.add("active");
    lastClickedBtn = this;

    applyFilters();
  });
});

// Category select dropdown (Mobile)
if (select) {
  select.addEventListener("click", function () { elementToggleFunc(this); });
}

selectItems.forEach(item => {
  item.addEventListener("click", function () {
    currentCategory = (this.getAttribute("data-category-target") || this.innerText).toLowerCase().trim();
    if (selectValue) selectValue.innerText = this.innerText;
    if (select) elementToggleFunc(select);
    applyFilters();
  });
});

// Search Input Listener
if (projectSearchInput) {
  projectSearchInput.addEventListener("input", function () {
    currentSearchQuery = this.value;
    if (searchClearBtn) {
      searchClearBtn.style.display = this.value.length > 0 ? "block" : "none";
    }
    applyFilters();
  });
}

if (searchClearBtn) {
  searchClearBtn.addEventListener("click", function () {
    if (projectSearchInput) {
      projectSearchInput.value = "";
      currentSearchQuery = "";
      this.style.display = "none";
      applyFilters();
    }
  });
}

if (resetFilterBtn) {
  resetFilterBtn.addEventListener("click", function () {
    currentCategory = "all";
    currentSearchQuery = "";
    if (projectSearchInput) projectSearchInput.value = "";
    if (searchClearBtn) searchClearBtn.style.display = "none";
    if (selectValue) selectValue.innerText = "All";

    filterBtn.forEach(btn => {
      const cat = (btn.getAttribute("data-category-target") || btn.innerText).toLowerCase().trim();
      btn.classList.toggle("active", cat === "all");
      if (cat === "all") lastClickedBtn = btn;
    });

    applyFilters();
  });
}

// ---------------------------------------------------------------------------
// 6. PROJECT DETAILS MODAL & LIGHTBOX VIEWER
// ---------------------------------------------------------------------------
const projectModalContainer = document.getElementById("projectModalContainer");
const projectModalOverlay = document.getElementById("projectModalOverlay");
const projectModalCloseBtn = document.getElementById("projectModalCloseBtn");

const pModalImg = document.getElementById("pModalImg");
const pModalZoomBtn = document.getElementById("pModalZoomBtn");
const pModalCategory = document.getElementById("pModalCategory");
const pModalRole = document.getElementById("pModalRole");
const pModalTitle = document.getElementById("pModalTitle");
const pModalDesc = document.getElementById("pModalDesc");
const pModalTechList = document.getElementById("pModalTechList");
const pModalAction = document.getElementById("pModalAction");

const closeProjectModal = function () {
  if (projectModalContainer) {
    projectModalContainer.classList.remove("active");
    document.body.style.overflow = "";
  }
};

const openProjectModal = function (item) {
  if (!projectModalContainer) return;

  const title = item.getAttribute("data-project-title") || item.querySelector(".project-title")?.innerText || "";
  const category = item.getAttribute("data-project-category") || item.querySelector(".project-category")?.innerText || "";
  const img = item.getAttribute("data-project-img") || item.querySelector("img")?.src || "";
  const role = item.getAttribute("data-project-role") || "Senior Full-Stack .NET Developer";
  const desc = item.getAttribute("data-project-desc") || "Enterprise digital solution engineered with high security, optimized performance, and modern scalable architecture.";
  const tech = item.getAttribute("data-project-tech") || "";
  const url = item.getAttribute("data-project-url") || "";
  const isInternal = item.getAttribute("data-project-type") === "internal" || url.includes("javascript") || url === "#portfolio" || !url;

  if (pModalImg) {
    pModalImg.src = img;
    pModalImg.alt = title;
    pModalImg.style.cursor = "default";
  }
  if (pModalZoomBtn) {
    pModalZoomBtn.href = img;
  }
  if (pModalTitle) pModalTitle.textContent = title;
  if (pModalCategory) pModalCategory.textContent = category;
  if (pModalRole) pModalRole.textContent = role;
  if (pModalDesc) pModalDesc.innerHTML = desc;

  if (pModalTechList) {
    pModalTechList.innerHTML = "";
    const techItems = tech.split(",").map(t => t.trim()).filter(Boolean);
    techItems.forEach(t => {
      const span = document.createElement("span");
      span.className = "project-modal-tech-item";
      span.textContent = t;
      pModalTechList.appendChild(span);
    });
  }

  if (pModalAction) {
    if (isInternal) {
      pModalAction.innerHTML = `
        <span class="project-modal-btn-disabled">
          <ion-icon name="lock-closed-outline"></ion-icon>
          <span>Internal Enterprise Platform</span>
        </span>
      `;
    } else {
      pModalAction.innerHTML = `
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="project-modal-btn-primary">
          <ion-icon name="globe-outline"></ion-icon>
          <span>Visit Live Application</span>
        </a>
      `;
    }
  }

  const story = document.getElementById('projectStory');
  if (story) {
    story.replaceChildren();
    [['My role', role], ['Built with', tech], ['Access', isInternal ? 'Internal platform — explore the screenshots and project details.' : /\/(?:Admin|Account|login)(?:\/|$)/i.test(url) ? 'This application requires an account. Screenshots provide a preview.' : 'Public project link — availability is managed by the project owner.']].forEach(([label, value]) => {
      const cell = document.createElement('div');
      const heading = document.createElement('h4'); heading.textContent = label;
      const text = document.createElement('p'); text.textContent = value;
      cell.append(heading, text); story.append(cell);
    });
  }
  const liveLabel = pModalAction?.querySelector('a span');
  if (liveLabel && /\/(?:Admin|Account|login)(?:\/|$)/i.test(url)) liveLabel.textContent = 'Open application · sign-in required';
  projectModalContainer.classList.add("active");
  document.body.style.overflow = "hidden";
};

// Attach click listener to each project card
filterItems.forEach(item => {
  item.addEventListener("click", function (e) {
    e.preventDefault();
    openProjectModal(item);
  });
});

if (projectModalCloseBtn) projectModalCloseBtn.addEventListener("click", closeProjectModal);
if (projectModalOverlay) projectModalOverlay.addEventListener("click", closeProjectModal);

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if (projectModalContainer && projectModalContainer.classList.contains("active")) {
      closeProjectModal();
    }
    if (modalContainer && modalContainer.classList.contains("active")) {
      toggleTestimonialsModal();
    }
  }
});

// ---------------------------------------------------------------------------
// 7. PRINT ATS RESUME
// ---------------------------------------------------------------------------
const printCvBtn = document.getElementById("printCvBtn");
if (printCvBtn) {
  printCvBtn.addEventListener("click", function () {
    // Switch to resume tab before printing
    activateTab(1, "resume");
    setTimeout(() => {
      window.print();
    }, 250);
  });
}

// ---------------------------------------------------------------------------
// 8. FLOATING ACTION BUTTONS (Back to Top)
// ---------------------------------------------------------------------------
const backToTopBtn = document.getElementById("backToTopBtn");

window.addEventListener("scroll", function () {
  if (backToTopBtn) {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }
  }
});

if (backToTopBtn) {
  backToTopBtn.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

// ---------------------------------------------------------------------------
// 9. 3D CARD TILT MICRO-INTERACTION
// ---------------------------------------------------------------------------
// Motion preferences and lightweight interactions live in experience.js.

// ---------------------------------------------------------------------------
// 10. CONTACT FORM
// ---------------------------------------------------------------------------
// Contact draft handling lives in contact.js.

// ---------------------------------------------------------------------------
// 11. ROBUST PAGE NAVIGATION (Target & Index Fallback)
// ---------------------------------------------------------------------------
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

const activateTab = function (targetIdx, targetName) {
  for (let j = 0; j < pages.length; j++) {
    const pageKey = (pages[j].dataset.page || "").toLowerCase().trim();
    const isTarget = targetName ? (pageKey === targetName) : (targetIdx === j);

    if (isTarget) {
      pages[j].classList.add("active");
      if (navigationLinks[j]) navigationLinks[j].classList.add("active");
    } else {
      pages[j].classList.remove("active");
      if (navigationLinks[j]) navigationLinks[j].classList.remove("active");
    }
  }
  const activePage = document.querySelector('[data-page].active');
  document.title = activePage.dataset.page.charAt(0).toUpperCase() + activePage.dataset.page.slice(1) + ' | Abdelmaboud Mohamed';
  window.dispatchEvent(new Event('portfolio:pagechange'));
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
};

navigationLinks.forEach((navBtn, idx) => {
  navBtn.addEventListener("click", function (e) {
    e.preventDefault();
    const target = (this.getAttribute("data-nav-link-target") || this.innerText || this.textContent || "").toLowerCase().trim();
    if (window.location.hash !== '#' + target) window.location.hash = target;
    activateTab(idx, target);
  });
});

// Check URL Hash on page load (e.g. #portfolio, #resume)
window.addEventListener("DOMContentLoaded", function () {
  const hash = window.location.hash.replace("#", "").toLowerCase().trim();
  if (hash) {
    const matchedIdx = Array.from(pages).findIndex(p => (p.dataset.page || "").toLowerCase().trim() === hash);
    if (matchedIdx !== -1) {
      activateTab(matchedIdx, hash);
    }
  }
});

// Hero shortcuts reuse the same navigation controls as the main menu.
document.querySelectorAll('[data-page-action]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelector(`[data-nav-link-target="${button.dataset.pageAction}"]`)?.click();
    document.getElementById('main-content')?.focus({ preventScroll: true });
  });
});
const syncNavigationState = () => {
  navigationLinks.forEach(link => {
    if (link.classList.contains('active')) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
};
navigationLinks.forEach(link => link.addEventListener('click', syncNavigationState));
window.addEventListener('DOMContentLoaded', syncNavigationState);
syncNavigationState();

window.addEventListener('hashchange', () => {
  const target = window.location.hash.slice(1).toLowerCase();
  const index = Array.from(pages).findIndex(page => page.dataset.page === target);
  if (index !== -1 || !target) activateTab(index === -1 ? 0 : index, target || 'about');
  syncNavigationState();
});
window.addEventListener('portfolio:pagechange', syncNavigationState);
applyFilters();
