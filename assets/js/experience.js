'use strict';

// Progressive enhancement: all content remains visible if scripting is unavailable.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const readingProgress = document.getElementById('readingProgress');
let progressFrame = 0;
function updateReadingProgress() {
  progressFrame = 0;
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  readingProgress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0})`;
}
function scheduleProgress() {
  if (!progressFrame) progressFrame = requestAnimationFrame(updateReadingProgress);
}
window.addEventListener('scroll', scheduleProgress, { passive: true });
window.addEventListener('resize', scheduleProgress);
window.addEventListener('load', scheduleProgress);
window.addEventListener('portfolio:pagechange', scheduleProgress);
updateReadingProgress();

let revealObserver;
function setupReveals() {
  revealObserver?.disconnect();
  document.querySelectorAll('.reveal-pending').forEach(node => node.classList.remove('reveal-pending'));
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('reveal-pending');
      entry.target.classList.add('reveal-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  // Assign staggered cascade indices to child cards
  document.querySelectorAll('.service-list, .skills-container, .process-grid, .timeline-list').forEach(container => {
    Array.from(container.children).forEach((child, index) => {
      child.style.setProperty('--stagger-idx', Math.min(index, 6));
    });
  });

  document.querySelectorAll('.selected-work, .service, .testimonials, .working-together, .conversation-banner, .skills-category, .timeline').forEach(node => {
    // Hidden tabs are left intact and reconsidered when activated.
    if (!node.getClientRects().length || node.getBoundingClientRect().top < window.innerHeight) return;
    node.classList.add('reveal-pending');
    revealObserver.observe(node);
  });
}
motionPreference.addEventListener('change', setupReveals);
window.addEventListener('portfolio:pagechange', setupReveals);
setupReveals();

// Let visitors control continuous logo movement.
const clientTrack = document.querySelector('.clients-marquee-track');
if (clientTrack) {
  const pause = document.createElement('button');
  pause.type = 'button';
  pause.className = 'motion-toggle';
  let paused = true;
  function syncMotion() {
    const isAr = document.documentElement.getAttribute('dir') === 'rtl';
    clientTrack.style.animationPlayState = paused || motionPreference.matches ? 'paused' : 'running';
    pause.textContent = paused
      ? (isAr ? 'تشغيل عرض الشركاء ←' : 'Play client showcase →')
      : (isAr ? 'إيقاف عرض الشركاء Ⅱ' : 'Pause client showcase Ⅱ');
    pause.setAttribute('aria-pressed', String(!paused));
    pause.hidden = motionPreference.matches;
  }
  pause.addEventListener('click', () => { paused = !paused; syncMotion(); });
  clientTrack.parentElement.after(pause);
  motionPreference.addEventListener('change', syncMotion);
  window.addEventListener('portfolio:langchange', syncMotion);
  syncMotion();
}

// Escape closes the mobile category menu; clicks outside dismiss it as well.
if (select) {
  const syncSelect = () => select.setAttribute('aria-expanded', String(select.classList.contains('active')));
  select.addEventListener('click', syncSelect);
  document.addEventListener('click', event => {
    if (!event.target.closest('.filter-select-box')) select.classList.remove('active');
    syncSelect();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && select.classList.contains('active')) {
      select.classList.remove('active'); syncSelect(); select.focus();
    }
  });
  syncSelect();
}


// ---------------------------------------------------------------------------
// COMMAND PALETTE (Ctrl + K / Cmd + K) & QUICK ACTIONS
// ---------------------------------------------------------------------------
(function initCommandPalette() {
  const cmdBtn = document.getElementById("cmdPaletteBtn");
  const cmdContainer = document.getElementById("cmdPaletteContainer");
  const cmdOverlay = document.getElementById("cmdPaletteOverlay");
  const cmdInput = document.getElementById("cmdPaletteInput");
  const cmdResults = document.getElementById("cmdPaletteResults");

  if (!cmdContainer || !cmdInput || !cmdResults) return;

  let selectedIndex = 0;
  let currentItems = [];

  const defaultCommands = [
    // Navigation
    { group: "Navigation", groupAr: "التنقل", icon: "person-outline", title: "About Abdelmaboud", titleAr: "نبذة عن عبد المعبود", desc: "Background, stats, and overview", descAr: "الخلفية، الإحصائيات، ونظرة عامة", action: () => activateTab(0, "about") },
    { group: "Navigation", groupAr: "التنقل", icon: "document-text-outline", title: "View Résumé & Experience", titleAr: "عرض السيرة الذاتية والخبرات", desc: "Work history, education, and technical skills", descAr: "تاريخ العمل، التعليم، والمهارات التقنية", action: () => activateTab(1, "resume") },
    { group: "Navigation", groupAr: "التنقل", icon: "briefcase-outline", title: "Explore Portfolio Projects", titleAr: "تصفح مشاريع البورتفوليو", desc: "Browse 19+ enterprise web and mobile applications", descAr: "استكشف أكثر من 19 مشروعاً وتطبيقاً مؤسسياً", action: () => activateTab(2, "portfolio") },
    { group: "Navigation", groupAr: "التنقل", icon: "chatbubble-ellipses-outline", title: "Contact & Inquiries", titleAr: "التواصل والاستفسارات", desc: "Direct messaging, WhatsApp, and email draft", descAr: "مراسلة مباشرة، واتساب، ومسودة بريد", action: () => activateTab(3, "contact") },

    // Quick Actions
    { group: "Quick Actions", groupAr: "إجراءات سريعة", icon: "git-network-outline", title: "Clean Architecture Blueprint 📐", titleAr: "مخطط المعمارية النظيفة 📐", desc: "Interactive enterprise .NET & CQRS diagram", descAr: "رسم بياني تفاعلي لمعمارية .NET و CQRS", action: () => { const btn = document.getElementById("openBlueprintBtn"); if (btn) btn.click(); } },
    { group: "Quick Actions", groupAr: "إجراءات سريعة", icon: "person-add-outline", title: "Save Contact Card (.vcf)", titleAr: "حفظ بطاقة جهة الاتصال (.vcf)", desc: "Export phone, WhatsApp & email to contacts", descAr: "تصدير أرقام الهاتف والواتساب والبريد لجهات الاتصال", action: () => { const btn = document.getElementById("downloadVCardBtn"); if (btn) btn.click(); } },
    { group: "Quick Actions", groupAr: "إجراءات سريعة", icon: "print-outline", title: "Print ATS-Ready CV", titleAr: "طباعة سيرة ذاتية جاهزة لأنظمة ATS", desc: "Generate a clean, printable PDF resume", descAr: "توليد ملف PDF نظيف ومخصص للطباعة والتوظيف", action: () => { const btn = document.getElementById("printCvBtn"); if (btn) btn.click(); } },
    { group: "Quick Actions", groupAr: "إجراءات سريعة", icon: "cloud-download-outline", title: "View Résumé on Google Drive", titleAr: "عرض السيرة الذاتية على Google Drive", desc: "Open the verified PDF document", descAr: "فتح مستند PDF المعتمد والمدقق", action: () => window.open("https://drive.google.com/file/d/1QOYCwKpqWnF85dwzb5TD34j0w3a305QF/view?usp=drive_link", "_blank") },
    { group: "Quick Actions", groupAr: "إجراءات سريعة", icon: "logo-whatsapp", title: "Chat on WhatsApp", titleAr: "محادثة عبر واتساب", desc: "+20 1013470551 · Start a conversation", descAr: "+20 1013470551 · بدء محادثة مباشرة", action: () => window.open("https://wa.me/201013470551", "_blank") },
    { group: "Quick Actions", groupAr: "إجراءات سريعة", icon: "mail-outline", title: "Copy Email Address", titleAr: "نسخ البريد الإلكتروني", desc: "abdomohamed2751@gmail.com", descAr: "abdomohamed2751@gmail.com", action: () => copyFromPalette("abdomohamed2751@gmail.com", "Email copied to clipboard!") },
    { group: "Quick Actions", groupAr: "إجراءات سريعة", icon: "call-outline", title: "Copy Saudi Phone Number", titleAr: "نسخ رقم الجوال السعودي", desc: "+966 59 722 8231 (Riyadh, KSA)", descAr: "+966 59 722 8231 (الرياض، السعودية)", action: () => copyFromPalette("+966597228231", "Saudi phone number copied!") },
    { group: "Quick Actions", groupAr: "إجراءات سريعة", icon: "call-outline", title: "Copy WhatsApp Number", titleAr: "نسخ رقم الواتساب", desc: "+20 1013470551 (Mobile & WhatsApp)", descAr: "+20 1013470551 (موبايل وواتساب)", action: () => copyFromPalette("+201013470551", "Phone number copied to clipboard!") },
    { group: "Quick Actions", groupAr: "إجراءات سريعة", icon: "logo-github", title: "Visit GitHub Profile", titleAr: "زيارة الحساب على GitHub", desc: "github.com/AbdoMohaamed", descAr: "github.com/AbdoMohaamed", action: () => window.open("https://github.com/AbdoMohaamed", "_blank") },
    { group: "Quick Actions", groupAr: "إجراءات سريعة", icon: "logo-linkedin", title: "Visit LinkedIn Profile", titleAr: "زيارة الحساب على LinkedIn", desc: "linkedin.com/in/abdo-mohamed-2277b1191", descAr: "linkedin.com/in/abdo-mohamed-2277b1191", action: () => window.open("https://www.linkedin.com/in/abdo-mohamed-2277b1191/", "_blank") },

    // Key Featured Projects
    { group: "Featured Projects", groupAr: "مشاريع مميزة", icon: "phone-portrait-outline", title: "Zad Al-Muslim Mobile Platform (زاد المسلم)", titleAr: "منصة تطبيق زاد المسلم (زاد المسلم)", desc: "10M+ Users, High-Concurrency APIs, Redis, FCM", descAr: "أكثر من 10 ملايين مستخدم، APIs عالية التزامن، Redis، FCM", action: () => openProjectByHighlight("mobile") },
    { group: "Featured Projects", groupAr: "مشاريع مميزة", icon: "layers-outline", title: "Dar-Alifta Arabic Portal", titleAr: "بوابة دار الإفتاء المصرية", desc: "ASP.NET MVC, High Concurrency, Millions of Visitors", descAr: "ASP.NET MVC، ملايين الزوار شهرياً، أداء فائق", action: () => openProjectByHighlight("content") },
    { group: "Featured Projects", groupAr: "مشاريع مميزة", icon: "business-outline", title: "Restful ERP Solutions", titleAr: "حلول Restful ERP للمؤسسات", desc: "Clean Architecture, CQRS, Financial Accounting", descAr: "Clean Architecture، CQRS، المحاسبة والفاتورة الإلكترونية", action: () => openProjectByHighlight("business") }
  ];

  function copyFromPalette(text, message) {
    if (typeof copyTextSafely === 'function') {
      copyTextSafely(text);
    }
    const notice = document.getElementById("toastNotification");
    if (notice) {
      notice.querySelector(".toast-text").textContent = message;
      notice.classList.add("active");
      setTimeout(() => notice.classList.remove("active"), 3200);
    }
  }

  function openProjectByHighlight(highlightKey) {
    const item = document.querySelector(`[data-highlight="${highlightKey}"]`);
    if (item && typeof openProjectModal === 'function') {
      activateTab(2, "portfolio");
      openProjectModal(item);
    }
  }

  function openProjectByElement(item) {
    if (item && typeof openProjectModal === 'function') {
      activateTab(2, "portfolio");
      openProjectModal(item);
    }
  }

  function openPalette() {
    cmdContainer.classList.add("active");
    cmdInput.value = "";
    selectedIndex = 0;
    renderCommands("");
    setTimeout(() => cmdInput.focus(), 50);
    document.body.style.overflow = "hidden";
  }

  function closePalette() {
    cmdContainer.classList.remove("active");
    document.body.style.overflow = "";
  }

  function renderCommands(query) {
    cmdResults.replaceChildren();
    const q = query.toLowerCase().trim();
    const isAr = document.documentElement.getAttribute("dir") === "rtl";

    if (!q) {
      currentItems = [...defaultCommands];
      let currentGroup = "";
      currentItems.forEach((cmd, idx) => {
        const grp = isAr && cmd.groupAr ? cmd.groupAr : cmd.group;
        if (grp !== currentGroup) {
          currentGroup = grp;
          const grpHeading = document.createElement("div");
          grpHeading.className = "cmd-group-title";
          grpHeading.textContent = currentGroup;
          cmdResults.appendChild(grpHeading);
        }
        createCmdElement(cmd, idx);
      });
    } else {
      // Search default commands (supports both English and Arabic queries)
      const matchedCommands = defaultCommands.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q) ||
        (c.titleAr && c.titleAr.toLowerCase().includes(q)) ||
        (c.descAr && c.descAr.toLowerCase().includes(q))
      );

      // Search all projects dynamically
      const projectElements = document.querySelectorAll("[data-filter-item]");
      const matchedProjects = [];
      projectElements.forEach(item => {
        const title = item.dataset.projectTitle || item.querySelector(".project-title")?.innerText || "";
        const desc = item.dataset.projectDesc || "";
        const tech = item.dataset.projectTech || "";
        const cat = item.dataset.projectCategory || "";

        if (title.toLowerCase().includes(q) || tech.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || cat.toLowerCase().includes(q)) {
          matchedProjects.push({
            group: isAr ? "المشاريع" : "Projects",
            groupAr: "المشاريع",
            icon: "code-working-outline",
            title: title,
            desc: tech ? tech.split(",").slice(0, 3).join(", ") : cat,
            badge: isAr ? (cat.toLowerCase().includes("mobile") ? "تطبيقات الموبايل" : "تطبيقات الويب") : cat,
            action: () => openProjectByElement(item)
          });
        }
      });

      currentItems = [...matchedCommands, ...matchedProjects];

      if (currentItems.length === 0) {
        const emptyDiv = document.createElement("div");
        emptyDiv.style.cssText = "padding: 24px; text-align: center; color: #8c9e86; font-size: 13px;";
        emptyDiv.textContent = isAr ? `لا توجد أوامر أو مشاريع مطابقة لـ "${query}"` : `No commands or projects found matching "${query}"`;
        cmdResults.appendChild(emptyDiv);
        return;
      }

      let currentGroup = "";
      currentItems.forEach((cmd, idx) => {
        const grp = isAr && cmd.groupAr ? cmd.groupAr : cmd.group;
        if (grp !== currentGroup) {
          currentGroup = grp;
          const grpHeading = document.createElement("div");
          grpHeading.className = "cmd-group-title";
          grpHeading.textContent = currentGroup;
          cmdResults.appendChild(grpHeading);
        }
        createCmdElement(cmd, idx);
      });
    }

    updateSelection();
  }

  function createCmdElement(cmd, idx) {
    const isAr = document.documentElement.getAttribute("dir") === "rtl";
    const itemBtn = document.createElement("button");
    itemBtn.type = "button";
    itemBtn.className = "cmd-item";
    itemBtn.dataset.index = idx;

    const left = document.createElement("div");
    left.className = "cmd-item-left";

    const iconBox = document.createElement("div");
    iconBox.className = "cmd-item-icon";
    const ionIcon = document.createElement("ion-icon");
    ionIcon.name = cmd.icon || "arrow-forward-outline";
    iconBox.appendChild(ionIcon);

    const textBox = document.createElement("div");
    textBox.className = "cmd-item-text";
    const titleSpan = document.createElement("span");
    titleSpan.className = "cmd-item-title";
    titleSpan.textContent = isAr && cmd.titleAr ? cmd.titleAr : cmd.title;
    const descSpan = document.createElement("span");
    descSpan.className = "cmd-item-desc";
    descSpan.textContent = isAr && cmd.descAr ? cmd.descAr : cmd.desc;
    textBox.append(titleSpan, descSpan);

    left.append(iconBox, textBox);
    itemBtn.appendChild(left);

    if (cmd.badge) {
      const badgeSpan = document.createElement("span");
      badgeSpan.className = "cmd-item-badge";
      badgeSpan.textContent = cmd.badge;
      itemBtn.appendChild(badgeSpan);
    }

    itemBtn.addEventListener("mouseenter", () => {
      selectedIndex = idx;
      updateSelection();
    });

    itemBtn.addEventListener("click", () => {
      closePalette();
      cmd.action();
    });

    cmdResults.appendChild(itemBtn);
  }

  function updateSelection() {
    const domItems = cmdResults.querySelectorAll(".cmd-item");
    domItems.forEach((btn, idx) => {
      const isSel = idx === selectedIndex;
      btn.classList.toggle("selected", isSel);
      if (isSel) {
        btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
  }

  // Keyboard Navigation inside Command Palette
  cmdInput.addEventListener("input", function () {
    selectedIndex = 0;
    renderCommands(this.value);
  });

  cmdInput.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (currentItems.length > 0) {
        selectedIndex = (selectedIndex + 1) % currentItems.length;
        updateSelection();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (currentItems.length > 0) {
        selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
        updateSelection();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentItems[selectedIndex]) {
        closePalette();
        currentItems[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closePalette();
    }
  });

  // Global Shortcut: Ctrl + K or Cmd + K
  window.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (cmdContainer.classList.contains("active")) {
        closePalette();
      } else {
        openPalette();
      }
    } else if (e.key === "Escape" && cmdContainer.classList.contains("active")) {
      closePalette();
    }
  });

  if (cmdBtn) cmdBtn.addEventListener("click", openPalette);
  if (cmdOverlay) cmdOverlay.addEventListener("click", closePalette);
})();

// ---------------------------------------------------------------------------
// UNIVERSAL CLICK-TO-FILTER BY TECH TAGS
// ---------------------------------------------------------------------------
(function initTechTagFiltering() {
  document.addEventListener("click", function (e) {
    const target = e.target.closest(".project-tech span, .skill-tag, .project-modal-tech-item");
    if (!target) return;

    const techName = target.textContent.trim();
    if (!techName) return;

    // Close any open modals
    const pModal = document.getElementById("projectModalContainer");
    if (pModal && pModal.classList.contains("active")) {
      if (typeof closeProjectModal === "function") {
        closeProjectModal();
      } else {
        pModal.classList.remove("active");
        document.body.style.overflow = "";
      }
    }

    // Switch to Portfolio tab
    if (typeof activateTab === "function") {
      activateTab(2, "portfolio");
    }

    // Set search query and trigger filter
    const searchInput = document.getElementById("projectSearch");
    if (searchInput) {
      searchInput.value = techName;
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    // Smooth scroll down to the portfolio section
    const portfolioArticle = document.querySelector('[data-page="portfolio"]');
    if (portfolioArticle) {
      portfolioArticle.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
})();


// ---------------------------------------------------------------------------
// AMBIENT CURSOR SPOTLIGHT TRACKER
// ---------------------------------------------------------------------------
(function initCursorSpotlight() {
  const glow = document.getElementById("cursorGlow");
  if (!glow || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let curX = mouseX;
  let curY = mouseY;
  let isMoving = false;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!glow.classList.contains("active")) {
      glow.classList.add("active");
    }
    if (!isMoving) {
      isMoving = true;
      requestAnimationFrame(renderGlow);
    }
  }, { passive: true });

  window.addEventListener("mouseleave", () => {
    glow.classList.remove("active");
  });

  function renderGlow() {
    curX += (mouseX - curX) * 0.15;
    curY += (mouseY - curY) * 0.15;
    glow.style.transform = `translate3d(${curX}px, ${curY}px, 0) translate(-50%, -50%)`;

    if (Math.abs(mouseX - curX) > 0.5 || Math.abs(mouseY - curY) > 0.5) {
      requestAnimationFrame(renderGlow);
    } else {
      isMoving = false;
    }
  }
})();

// ---------------------------------------------------------------------------
// STATS COUNT-UP ANIMATION
// ---------------------------------------------------------------------------
(function initStatsCountUp() {
  const statsContainer = document.getElementById("statsGrid");
  if (!statsContainer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const statNumbers = statsContainer.querySelectorAll(".stat-number[data-count]");
  if (statNumbers.length === 0) return;

  let hasAnimated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        observer.unobserve(entry.target);
        runCountUp();
      }
    });
  }, { threshold: 0.3 });

  observer.observe(statsContainer);

  function runCountUp() {
    const duration = 1400; // ms
    const startTime = performance.now();

    function updateCounters(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      statNumbers.forEach(el => {
        const target = parseInt(el.dataset.count, 10) || 0;
        const suffix = el.dataset.suffix || "";
        const currentVal = Math.round(target * ease);
        el.textContent = `${currentVal}${suffix}`;
      });

      if (progress < 1) {
        requestAnimationFrame(updateCounters);
      }
    }

    requestAnimationFrame(updateCounters);
  }
})();

// ---------------------------------------------------------------------------
// MORPHING HERO HEADLINE TEXT
// ---------------------------------------------------------------------------
(function initMorphingHeadline() {
  const morphEl = document.getElementById("morphingText");
  if (!morphEl || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const englishWords = [
    ".NET developer.",
    "high-scale APIs.",
    "enterprise ERPs.",
    "cloud platforms."
  ];
  const arabicWords = [
    "تطبيقات .NET المتكاملة",
    "واجهات برمجية فائقة السرعة",
    "أنظمة ERP للمؤسسات",
    "معمارية سحابية نظيفة"
  ];

  let currentIndex = 0;

  setInterval(() => {
    const currentMorphEl = document.getElementById("morphingText");
    if (!currentMorphEl) return;
    currentMorphEl.classList.add("changing");

    setTimeout(() => {
      const targetEl = document.getElementById("morphingText");
      if (!targetEl) return;
      const isArabic = document.documentElement.getAttribute("dir") === "rtl";
      const currentList = isArabic ? arabicWords : englishWords;
      currentIndex = (currentIndex + 1) % currentList.length;
      targetEl.textContent = currentList[currentIndex];
      targetEl.classList.remove("changing");
      targetEl.classList.add("entering");

      setTimeout(() => {
        targetEl.classList.remove("entering");
      }, 50);
    }, 320);
  }, 3400);
})();

// ---------------------------------------------------------------------------
// ENTERPRISE CLEAN ARCHITECTURE BLUEPRINT MODAL
// ---------------------------------------------------------------------------
function openArchitectureModal() {
  const container = document.getElementById("architectureModalContainer");
  if (!container) return;
  container.classList.add("active");
  document.body.style.overflow = "hidden";
  const closeBtn = document.getElementById("archModalCloseBtn");
  if (closeBtn) closeBtn.focus();
}

function closeArchitectureModal() {
  const container = document.getElementById("architectureModalContainer");
  if (!container) return;
  container.classList.remove("active");
  document.body.style.overflow = "";
}

(function initArchitectureModal() {
  const openBtn = document.getElementById("openBlueprintBtn");
  const closeBtn = document.getElementById("archModalCloseBtn");
  const overlay = document.getElementById("archModalOverlay");

  if (openBtn) openBtn.addEventListener("click", openArchitectureModal);
  if (closeBtn) closeBtn.addEventListener("click", closeArchitectureModal);
  if (overlay) overlay.addEventListener("click", closeArchitectureModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const container = document.getElementById("architectureModalContainer");
      if (container && container.classList.contains("active")) {
        closeArchitectureModal();
      }
    }
  });
})();

// ---------------------------------------------------------------------------
// ONE-CLICK VCARD (.VCF) CONTACT EXPORTER
// ---------------------------------------------------------------------------
function downloadVCard() {
  const vcardData = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:Mohamed;Abdelmaboud;;;",
    "FN:Abdelmaboud Mohamed",
    "NICKNAME:Abdo Mohamed",
    "TITLE:Senior Full-Stack .NET Developer",
    "ORG:Perfect Presentation (2P)",
    "TEL;TYPE=CELL,VOICE,PREF:+966597228231",
    "TEL;TYPE=CELL,VOICE,SECOND:+201013470551",
    "EMAIL;TYPE=INTERNET,PREF:abdomohamed2751@gmail.com",
    "ADR;TYPE=WORK:;;Riyadh;Riyadh;;;Saudi Arabia",
    "URL;TYPE=WORK:https://abdomohaamed.github.io/portfolio-v2/",
    "URL;TYPE=LINKEDIN:https://www.linkedin.com/in/abdo-mohamed-2277b1191/",
    "URL;TYPE=GITHUB:https://github.com/AbdoMohaamed",
    "NOTE:Senior Full-Stack .NET Developer specializing in ASP.NET Core, Clean Architecture, CQRS, Angular, Microservices, and high-concurrency systems (Zad Al-Muslim 10M+ users, Dar-Alifta).",
    "REV:2026-11-11T12:00:00Z",
    "END:VCARD"
  ].join("\r\n");

  const blob = new Blob([vcardData], { type: "text/vcard;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const tempLink = document.createElement("a");
  tempLink.href = url;
  tempLink.setAttribute("download", "Abdelmaboud_Mohamed.vcf");
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
  URL.revokeObjectURL(url);

  const notice = document.getElementById("toastNotification");
  if (notice) {
    const isAr = document.documentElement.getAttribute("dir") === "rtl";
    const textEl = notice.querySelector(".toast-text");
    if (textEl) textEl.textContent = isAr ? "تم حفظ بطاقة جهة الاتصال (.vcf) بنجاح!" : "Contact card (vCard .vcf) saved!";
    notice.classList.add("active");
    setTimeout(() => notice.classList.remove("active"), 3200);
  }
}

(function initVCardDownload() {
  const btn = document.getElementById("downloadVCardBtn");
  if (btn) btn.addEventListener("click", downloadVCard);
})();

// ---------------------------------------------------------------------------
// BILINGUAL ARABIC / ENGLISH (RTL / LTR) FULL-SITE TRANSLATION ENGINE
// ---------------------------------------------------------------------------
(function initBilingualSwitcher() {
  const langBtn = document.getElementById("langToggleBtn");
  const langLabel = document.getElementById("langLabel");
  if (!langBtn) return;

  let currentLang = localStorage.getItem("portfolio_lang") || "en";

  const projectTranslationsAr = {
    "Zad Al-Muslim Mobile Platform (زاد المسلم)": {
      cardTitle: "منصة تطبيق زاد المسلم",
      title: "منصة تطبيق زاد المسلم",
      role: "مهندس معماري أول للباك إند والـ APIs",
      desc: "معمارية الباك إند عالية التزامن والواجهات البرمجية الموزعة لتطبيق زاد المسلم الشهير (أكثر من 10 ملايين مستخدم). تم هندسة RESTful APIs عالية التوافر، وخوارزميات دقيقة لمواقيت الصلاة، وبث صوتي للقرآن الكريم عبر CDN، وإرسال إشعارات لحظية لملايين المستخدمين حول العالم."
    },
    "Dar-Alifta Arabic Portal": {
      cardTitle: "بوابة دار الإفتاء المصرية",
      title: "بوابة دار الإفتاء المصرية (العربية)",
      role: "مهندس برمجيات أول Full-Stack .NET",
      desc: "بوابة إلكترونية رسمية عالية التوافر تخدم ملايين الزوار شهرياً في العالمين العربي والإسلامي. تم تطوير نظام إدارة محتوى ديناميكي، ومحرك بحث فتاوى يتحمل الضغط العالي، والأرشفة التلقائية مع فهرسة SQL Server بأعلى معايير الأمان واستقرار البيانات."
    },
    "Mefan Creative Agency": {
      cardTitle: "وكالة ميفان الإبداعية",
      title: "وكالة ميفان الإبداعية (Mefan)",
      role: "مطور برمجيات Full-Stack .NET",
      desc: "منصة متكاملة وبورتفوليو تفاعلي لوكالة إبداعية رائدة في المملكة العربية السعودية. شملت تنفيذ حركات تفاعلية مخصصة، ولوحة تحكم ديناميكية لإدارة المشاريع، ونماذج متجاوبة لاستقطاب العملاء."
    },
    "Restful ERP Solutions": {
      cardTitle: "حلول Restful ERP للمؤسسات",
      title: "حلول Restful ERP المؤسسية",
      role: "مهندس معماري أول لأنظمة ERP و .NET",
      desc: "نظام تخطيط موارد مؤسسات (ERP) شامل لإدارة المستودعات متعددة الفروع، والربط الكامل مع منظومة الفاتورة الإلكترونية المعتمدة من مصلحة الضرائب، ونقاط البيع (POS)، ووحدات التقارير المالية الآلية."
    },
    "VOIP Egypt Telecommunication": {
      cardTitle: "شركة VOIP Egypt للاتصالات",
      title: "بوابة VOIP Egypt للاتصالات",
      role: "مهندس باك إند وتكامل أنظمة",
      desc: "بوابة اتصالات مؤسسية تربط سجلات مكالمات الـ PBX، وحسابات أرصدة العملاء والفوترة، ولوحات تحكم متعددة المستويات، وإدارة اتصالات VoIP في الوقت الفعلي."
    },
    "Dar-Alifta English Portal": {
      cardTitle: "بوابة دار الإفتاء (الإنجليزية)",
      title: "بوابة دار الإفتاء المصرية (النسخة الإنجليزية)",
      role: "مطور برمجيات Full-Stack .NET",
      desc: "بوابة دولية للفتاوى والبحوث الإسلامية باللغة الإنجليزية مع تصنيفات مخصصة، وتوزيع عالمي للمحتوى، وتحسين متقدم لمحركات البحث (SEO)."
    },
    "Family Guidance Platform": {
      cardTitle: "منصة الإرشاد الأسري",
      title: "منصة الإرشاد والتنمية الأسرية",
      role: "مطور برمجيات Full-Stack .NET",
      desc: "بوابة مجتمعية متكاملة لتنظيم مواعيد الاستشارات الأسرية، والندوات التثقيفية، والمقالات المتخصصة، وإدارة جلسات الإرشاد التفاعلية."
    },
    "BUCCINO MARBLE Kuwait": {
      cardTitle: "شركة BUCCINO للرخام (الكويت)",
      title: "منصة BUCCINO MARBLE للرخام - الكويت",
      role: "مطور تجارة إلكترونية و .NET",
      desc: "منصة تجارة إلكترونية متكاملة للرخام والأحجار الطبيعية في الكويت، تشمل حاسبة تقدير الأسعار، وطلبات التسعير الفورية، والربط مع بوابات الدفع الإلكتروني."
    },
    "Ramadan Portal": {
      cardTitle: "بوابة رمضان التفاعلية",
      title: "بوابة شهر رمضان المبارك",
      role: "مطور برمجيات Full-Stack .NET",
      desc: "منصة موسمية عالية الكثافة تقدم إمساكية ومواقيت رمضان اليومية، والأدعية، والبث المباشر للفتاوى، والمحتوى الصوتي والمرئي المتكامل."
    },
    "Fatwa Conference Mobile Application": {
      cardTitle: "تطبيق مؤتمر الإفتاء العالمي",
      title: "تطبيق مؤتمر الأمانة العامة لدور الإفتاء",
      role: "مهندس معماري لواجهات الموبايل APIs",
      desc: "التطبيق الرسمي للمؤتمر الدولي لتنظيم الجداول الزمنية، والجلسات الحوارية المباشرة، وإرسال الإشعارات الفورية، وإدارة تسجيل المشاركين والوفود."
    },
    "مصر قرآن كريم Mobile Platform": {
      cardTitle: "تطبيق مصر قرآن كريم",
      title: "منصة وتطبيق مصر قرآن كريم",
      role: "مطور واجهات برمجية للموبايل APIs",
      desc: "تطبيق ديني واسع الانتشار يتيح البث الصوتي فائق الجودة لتلاوات القرآن الكريم، والتحميل للاستماع بدون إنترنت، وحفظ العلامات المرجعية ومزامنة الصوت."
    },
    "Conference Admin Portal": {
      cardTitle: "بوابة إدارة المؤتمرات",
      title: "لوحة تحكم وإدارة المؤتمر العالمي",
      role: "مهندس برمجيات باك إند أول",
      desc: "لوحة تحكم إدارية متقدمة لإدارة ضيوف المؤتمر والدعوات، وتقديم الأوراق البحثية، وتنظيم مقاعد كبار الشخصيات (VIP)، واستخراج تقارير التحليلات."
    },
    "Prof. Shawky Allam Portal": {
      cardTitle: "الموقع الرسمي لفضيلة أ.د. شوقي علام",
      title: "البوابة الرسمية لفضيلة أ.د. شوقي علام",
      role: "مطور برمجيات Full-Stack .NET",
      desc: "الأرشيف الرقمي والمركز الإعلامي الرسمي لعرض المؤلفات العلمية، والزيارات الدولية، والمحاضرات، والبيانات الصحفية."
    },
    "Impact Agency": {
      cardTitle: "وكالة إمباكت التسويقية",
      title: "منصة وكالة إمباكت (Impact Agency)",
      role: "مطور واجهات أمامية ومواقع ويب",
      desc: "موقع وكالة تسويق رقمي حديث يتميز بحركات تفاعلية انسيابية، واستعراض الخدمات، ونماذج تواصل ذكية لاستقطاب العملاء."
    },
    "Freelancer Hub": {
      cardTitle: "منصة Freelancer Hub للعمل الحر",
      title: "منصة العمل الحر السحابية (Freelancer Hub)",
      role: "مهندس سحابة و .NET",
      desc: "منصة متكاملة للعمل الحر منشورة على خدمات Microsoft Azure السحابية، تتضمن تقديم العروض، والمحادثة الفورية بين العملاء والمستقلين، وإدارة الدفع."
    },
    "Palestine Information Portal": {
      cardTitle: "بوابة فلسطين التوثيقية",
      title: "بوابة فلسطين للمعلومات والتوثيق",
      role: "مطور برمجيات Full-Stack .NET",
      desc: "بوابة معرفية وتوثيقية شاملة تعرض الخرائط التفاعلية، والخطوط الزمنية التاريخية، والمقالات والأبحاث العلمية الموثقة."
    },
    "VerifyFatwa Engine": {
      cardTitle: "محرك التحقق VerifyFatwa",
      title: "محرك التحقق والمصادقة (VerifyFatwa Engine)",
      role: "مهندس معماري للنظام",
      desc: "محرك تحقق داخلي متطور لفحص ومطابقة الفتاوى والشهادات الصادرة ومكافحة التزوير عبر خوارزميات البحث والتحقق الرقمي."
    },
    "Events Analytics Dashboard": {
      cardTitle: "لوحة تحليلات الفعاليات",
      title: "لوحة تحليلات ومؤشرات الفعاليات والمؤتمرات",
      role: "مطور لوحات تحكم .NET أول",
      desc: "لوحة تحكم تحليلية في الوقت الفعلي لتتبع تفاعل الحضور، ونسب الحضور بالجلسات، ونتائج الاستبيانات اللحظية والرسوم البيانية."
    },
    "Staff Enterprise HR Portal": {
      cardTitle: "بوابة الموارد البشرية للموظفين",
      title: "نظام إدارة الموارد البشرية المؤسسي (HR Portal)",
      role: "مطور برمجيات Full-Stack .NET",
      desc: "نظام مؤسسي داخلي لإدارة شؤون الموظفين، والحضور والانصراف، والإجازات، ومسير الرواتب، والصلاحيات متعددة المستويات (RBAC)."
    },
    "Prof. Nazir Ayyad Portal": {
      cardTitle: "البوابة الرسمية لفضيلة أ.د. نظير عياد",
      title: "البوابة العلمية لفضيلة أ.د. نظير عياد - مفتي الجمهورية",
      role: "مطور برمجيات Full-Stack .NET",
      desc: "البوابة العلمية الرسمية لفضيلة مفتي الديار المصرية، لعرض المقالات البحثية، والتحديثات الصحفية، والمكتبة المرئية والمقروءة."
    }
  };

  function cacheOriginalEnglish(el, key, value) {
    if (el && !el.hasAttribute(key)) {
      el.setAttribute(key, value);
    }
  }

  function applyText(selector, arText, isHtml = false) {
    const el = typeof selector === "string" ? document.querySelector(selector) : selector;
    if (!el) return;
    if (isHtml) {
      cacheOriginalEnglish(el, "data-en-html", el.innerHTML);
      el.innerHTML = arText;
    } else {
      cacheOriginalEnglish(el, "data-en-text", el.textContent);
      el.textContent = arText;
    }
  }

  function restoreOriginal(selector, isHtml = false) {
    const el = typeof selector === "string" ? document.querySelector(selector) : selector;
    if (!el) return;
    if (isHtml && el.hasAttribute("data-en-html")) {
      el.innerHTML = el.getAttribute("data-en-html");
    } else if (!isHtml && el.hasAttribute("data-en-text")) {
      el.textContent = el.getAttribute("data-en-text");
    }
  }

  function applyLanguage(lang) {
    const isAr = lang === "ar";
    document.documentElement.setAttribute("dir", isAr ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", isAr ? "ar" : "en");

    if (langLabel) langLabel.textContent = isAr ? "English" : "عربي";
    langBtn.setAttribute("title", isAr ? "Switch to English" : "التبديل إلى اللغة العربية");

    // 1. HEADER, SKIP LINK, FLOATING ACTIONS & FOOTER
    if (isAr) {
      applyText(".skip-link", "الانتقال إلى المحتوى");
      applyText(".wordmark .brand-label", "عبد المعبود<br><small>بورتفوليو مهندس البرمجيات</small>", true);
      applyText('[data-nav-link-target="about"]', "نبذة عني");
      applyText('[data-nav-link-target="resume"]', "السيرة الذاتية");
      applyText('[data-nav-link-target="portfolio"]', "المشاريع");
      applyText('[data-nav-link-target="contact"]', "تواصل معي");
      applyText(".cmd-palette-label", "إجراءات سريعة");
      applyText(".header-contact", 'تواصل معي <span aria-hidden="true">↗</span>', true);
      applyText(".whatsapp-tooltip", "محادثة عبر واتساب");
      document.getElementById("backToTopBtn")?.setAttribute("title", "العودة للأعلى");
      document.querySelector(".floating-whatsapp-btn")?.setAttribute("title", "محادثة عبر واتساب");
      applyText(".site-footer > span", "عبد المعبود محمد · الرياض، المملكة العربية السعودية");
    } else {
      restoreOriginal(".skip-link");
      restoreOriginal(".wordmark .brand-label", true);
      restoreOriginal('[data-nav-link-target="about"]');
      restoreOriginal('[data-nav-link-target="resume"]');
      restoreOriginal('[data-nav-link-target="portfolio"]');
      restoreOriginal('[data-nav-link-target="contact"]');
      restoreOriginal(".cmd-palette-label");
      restoreOriginal(".header-contact", true);
      restoreOriginal(".whatsapp-tooltip");
      document.getElementById("backToTopBtn")?.setAttribute("title", "Back to top");
      document.querySelector(".floating-whatsapp-btn")?.setAttribute("title", "Chat on WhatsApp");
      restoreOriginal(".site-footer > span");
    }

    // 2. HERO & STATS (ABOUT PAGE)
    document.title = isAr
      ? "عبد المعبود محمد | مهندس برمجيات أول .NET Full-Stack"
      : "Abdelmaboud Mohamed | Senior Full Stack .NET Developer";

    if (isAr) {
      applyText(".intro-name", "عبد المعبود محمد");
      applyText(".availability-badge span:last-child", "الرياض، المملكة العربية السعودية · إقامة قابلة للتحويل · متاح للفرص");
      applyText(".hero-heading", 'مهندس برمجيات أول<br><em id="morphingText" class="morphing-text">تطبيقات .NET المتكاملة</em>', true);
      applyText(".hero-description", 'من المنصات الرقمية المليونية مثل <strong>زاد المسلم</strong> و<strong>دار الإفتاء</strong>، إلى أنظمة تخطيط موارد المؤسسات (ERP)، أبني حلولاً برمجية مرنة ومصممة لتحمل أعتى أعباء العمل والطلب العالي.', true);
      applyText(".hero-actions .primary-action", 'استكشف أعمالي <span aria-hidden="true">↗</span>', true);
      applyText(".hero-actions .secondary-action", 'تواصل معي <span aria-hidden="true">←</span>', true);
      applyText(".intro-caption small", "مشروع مميز");
      applyText(".intro-caption strong", "بوابة دار الإفتاء المصرية");

      const statLabels = document.querySelectorAll(".stat-label");
      if (statLabels[0]) applyText(statLabels[0], "سنوات من الخبرة العملية");
      if (statLabels[1]) applyText(statLabels[1], "تطبيقات مؤسسية ومنصات مليونية");
      if (statLabels[2]) applyText(statLabels[2], "أسواق إقليمية · السعودية ومصر والكويت");
    } else {
      restoreOriginal(".intro-name");
      restoreOriginal(".availability-badge span:last-child");
      restoreOriginal(".hero-heading", true);
      restoreOriginal(".hero-description", true);
      restoreOriginal(".hero-actions .primary-action", true);
      restoreOriginal(".hero-actions .secondary-action", true);
      restoreOriginal(".intro-caption small");
      restoreOriginal(".intro-caption strong");
      document.querySelectorAll(".stat-label").forEach(el => restoreOriginal(el));
    }

    // 3. SELECTED WORK, BIO, SERVICES, TESTIMONIALS, CLIENTS & FAQ (ABOUT PAGE)
    if (isAr) {
      applyText("#selected-heading", "مشاريع مختارة");
      applyText(".work-picker legend", "ما الذي تسعى لبنائه؟");
      const pickerSpans = document.querySelectorAll(".work-picker label span");
      if (pickerSpans[0]) applyText(pickerSpans[0], "كل المشاريع المختارة");
      if (pickerSpans[1]) applyText(pickerSpans[1], "أنظمة الأعمال وERP");
      if (pickerSpans[2]) applyText(pickerSpans[2], "تطبيقات الموبايل");
      if (pickerSpans[3]) applyText(pickerSpans[3], "بوابات المحتوى");
      applyText(".selected-work .text-action", 'استكشف كافة المشاريع <span aria-hidden="true">↗</span>', true);

      // Bio
      applyText(".about-text .section-heading", "نبذة عني");
      const bioParas = document.querySelectorAll(".about-text > p");
      if (bioParas[0]) applyText(bioParas[0], 'مرحباً! أنا <strong>عبد المعبود محمد</strong>، مهندس برمجيات أول Full-Stack .NET بخبرة عملية تتجاوز <strong>5 سنوات</strong> في تصميم وهندسة وتطوير تطبيقات المؤسسات عالية الأمان وقابلية التوسع. أقيم حالياً في <strong>الرياض، المملكة العربية السعودية</strong>، وأعمل لدى <strong>شركة العرض المتقن (2P)</strong> على أنظمة التحول الرقمي الكبرى.', true);
      if (bioParas[1]) applyText(bioParas[1], 'أحمل درجة البكالوريوس في علوم الحاسب من أكاديمية مودرن، ولدي سجل حافل بالإنجازات في تسليم حلول برمجية كبرى لجهات مرموقة من بينها <strong>جامعة الملك سعود</strong>، <strong>دار الإفتاء المصرية</strong>، وكبرى شركات تخطيط موارد المؤسسات.', true);
      applyText(".expertise-details summary", "استكشف خلفيتي التقنية بالتفصيل");
      const bioBullets = document.querySelectorAll(".about-list li");
      const bioBulletsAr = [
        '<strong>تطوير .NET Core والأنظمة المؤسسية:</strong> خبرة عميقة في C# و ASP.NET Core و ASP.NET MVC و Entity Framework Core و LINQ.',
        '<strong>الأنماط المعمارية المتقدمة:</strong> تطبيق عملي راسخ لـ Clean Architecture و CQRS ونمط المستودع (Repository Pattern) وحقن التبعيات (DI).',
        '<strong>واجهات برمجية RESTful آمنة وعالية التدفق:</strong> بناء Web APIs عالية السرعة وربط بوابات الدفع الإلكتروني (Stripe, مدى) ومزودي الرسائل (Nexmo, Cequens, SMSMisr) والبريد الإلكتروني.',
        '<strong>هندسة قواعد البيانات:</strong> تصميم المخططات المعيارية، الإجراءات المخزنة (Stored Procedures)، الفهرسة المتقدمة، وضبط أداء الاستعلامات على SQL Server و MySQL.',
        '<strong>واجهات أمامية حديثة وتفاعلية:</strong> احترافية في JavaScript (ES6+) و TypeScript و Angular وتصميم واجهات متجاوبة باستخدام HTML5 و CSS3 و Bootstrap.',
        '<strong>السحابة والذكاء الاصطناعي:</strong> تدريب معتمد من مايكروسوفت على Azure ودمج خدمات Azure OpenAI لأتمتة سير العمل الذكي.',
        '<strong>منهجيات Agile وأدوات DevOps:</strong> إتقان Git (GitHub, GitLab)، خطوط الأتمتة CI/CD، واختبار الـ APIs عبر Postman، وإدارة المشاريع عبر JIRA.'
      ];
      bioBullets.forEach((li, i) => { if (bioBulletsAr[i]) applyText(li, bioBulletsAr[i], true); });

      // Services
      applyText(".service .article-title", "مجالات خبرتي وخدماتي");
      const servicesAr = [
        { title: "تطوير تطبيقات الويب المتكاملة (Full-Stack)", text: "بناء منصات وتطبيقات ويب مؤسسية متكاملة باستخدام .NET 8/9 و ASP.NET Core وأحدث تقنيات الويب، مع التركيز على قابلية التوسع والكود النظيف والموثوقية العالية." },
        { title: "تصميم وضبط أداء قواعد البيانات", text: "هندسة مخططات قواعد البيانات المعيارية وفائقة الأداء في SQL Server، مع تصميم استعلامات معقدة واستراتيجيات فهرسة متقدمة للبيانات الحيوية." },
        { title: "تصميم الواجهات البرمجية وتكامل الأنظمة", text: "صياغة RESTful APIs آمنة ومعمارية مايكروسيرفيسز، وربط بوابات الدفع والفوترة الإلكترونية والرسائل النصية وإشعارات السحابة مع توثيق متكامل." },
        { title: "خوادم تطبيقات الموبايل والخدمات السحابية", text: "تطوير البنى التحتية الخلفية فائقة السرعة والـ APIs اللحظية لتطبيقات iOS وأندرويد، مدعومة ببنية Azure السحابية والتخزين المؤقت الموزع." }
      ];
      document.querySelectorAll(".service-item").forEach((item, i) => {
        if (servicesAr[i]) {
          applyText(item.querySelector(".service-item-title"), servicesAr[i].title);
          applyText(item.querySelector(".service-item-text"), servicesAr[i].text);
        }
      });

      // Testimonials & Clients
      applyText(".testimonials .article-title", "آراء العملاء والشركاء");
      applyText("[data-testimonials-title]", "عميل من دولة الكويت");
      applyText("[data-modal-time]", "تقييم عميل موثق");
      applyText(".clients .article-title", "ثقة كبرى الكيانات والشركات");

      // Working Together & FAQ
      applyText("#working-heading", "ابدأ بمحادثة مباشرة");
      const stepsAr = [
        { title: "شاركني ما تحتاجه", desc: "فكرة منتج، تحدٍّ تقني، أو دور وظيفي في فريقك. نبذة قصيرة تكفي تماماً للبدء." },
        { title: "استكشاف مدى التوافق", desc: "نناقش معاً أهدافك، الأنظمة الحالية، والخبرة التقنية الدقيقة التي يتطلبها مشروعك." },
        { title: "تحديد الخطوة التالية", desc: "التوافق على نطاق العمل والأولويات والتطلعات قبل الانطلاق في التنفيذ." }
      ];
      document.querySelectorAll(".process-grid > div").forEach((step, i) => {
        if (stepsAr[i]) {
          applyText(step.querySelector("h4"), stepsAr[i].title);
          applyText(step.querySelector("p"), stepsAr[i].desc);
        }
      });
      const faqAr = [
        { q: "ماذا ينبغي أن أكتب في رسالتي الأولى؟", a: "هدفك، نوع المساعدة التي تحتاجها، وأي إطار زمني في بالك. لست بحاجة لكتابة مواصفات تفصيلية للبدء." },
        { q: "هل يمكنني التواصل بخصوص فرصة عمل بدوام كامل؟", a: "بكل سرور. اختر «فرصة وظيفية / انضمام لفريق» من نموذج التواصل وشاركني تفاصيل الدور والفريق وطبيعة العمل." },
        { q: "هل يمكننا مناقشة نظام أو تطبيق موجود بالفعل؟", a: "نعم بالتأكيد. شاركني تفاصيل بنيتكم التقنية الحالية والخصائص أو التحديات التي تودون تطويرها أو تسريع أدائها." }
      ];
      document.querySelectorAll(".quick-faq details").forEach((faq, i) => {
        if (faqAr[i]) {
          applyText(faq.querySelector("summary"), faqAr[i].q);
          applyText(faq.querySelector("p"), faqAr[i].a);
        }
      });
    } else {
      restoreOriginal("#selected-heading");
      restoreOriginal(".work-picker legend");
      document.querySelectorAll(".work-picker label span").forEach(el => restoreOriginal(el));
      restoreOriginal(".selected-work .text-action", true);
      restoreOriginal(".about-text .section-heading");
      document.querySelectorAll(".about-text > p").forEach(el => restoreOriginal(el, true));
      restoreOriginal(".expertise-details summary");
      document.querySelectorAll(".about-list li").forEach(el => restoreOriginal(el, true));
      restoreOriginal(".service .article-title");
      document.querySelectorAll(".service-item").forEach(item => {
        restoreOriginal(item.querySelector(".service-item-title"));
        restoreOriginal(item.querySelector(".service-item-text"));
      });
      restoreOriginal(".testimonials .article-title");
      restoreOriginal("[data-testimonials-title]");
      restoreOriginal("[data-modal-time]");
      restoreOriginal(".clients .article-title");
      restoreOriginal("#working-heading");
      document.querySelectorAll(".process-grid > div").forEach(step => {
        restoreOriginal(step.querySelector("h4"));
        restoreOriginal(step.querySelector("p"));
      });
      document.querySelectorAll(".quick-faq details").forEach(faq => {
        restoreOriginal(faq.querySelector("summary"));
        restoreOriginal(faq.querySelector("p"));
      });
    }

    // 4. RESUME PAGE (HEADER, WORK EXPERIENCE, EDUCATION, CERTIFICATIONS, SKILLS)
    if (isAr) {
      applyText(".resume-header .article-title", "السيرة الذاتية");
      applyText("#openBlueprintBtn span", "مخطط البنية البرمجية 📐");
      applyText(".resume-file", "عرض السيرة الذاتية ↗");
      applyText("#printCvBtn span", "طباعة سيرة ذاتية (ATS)");

      const resumeTimelines = document.querySelectorAll("article.resume .timeline");
      // Experience
      if (resumeTimelines[0]) {
        applyText(resumeTimelines[0].querySelector(".h3"), "الخبرات المهنية");
        const expItems = resumeTimelines[0].querySelectorAll(".timeline-item");
        const expAr = [
          {
            title: "شركة العرض المتقن (2P)",
            role: "مهندس برمجيات أول FULL-STACK .NET",
            date: "10/2025 — حتى الآن (دوام كامل حضوري · الرياض، المملكة العربية السعودية)",
            desc: 'المساهمة في بناء وتطوير منصات رقمية مؤسسية كبرى في شركة العرض المتقن (2P)، لتقديم أنظمة ويب آمنة وعالية التوسع باستخدام ASP.NET Core و .NET Framework و SQL Server و RESTful APIs.<br><span class="highlight">أبرز المساهمات:</span><br>• بناء وصيانة تطبيقات ويب حيوية تخدم آلاف المستخدمين في القطاعين المؤسسي والحكومي.<br>• ربط بوابات الدفع الإلكتروني، ومزودي الرسائل النصية، وخدمات البريد المؤتمتة.<br>• تطوير أنظمة المصادقة الآمنة وإدارة الجلسات والصلاحيات المعتمدة على الأدوار (RBAC).<br>• تصميم واستهلاك RESTful APIs عالية الأداء للتكامل السلس بين الويب وتطبيقات الهاتف.<br>• تحسين استعلامات SQL Server وفهارس قواعد البيانات مما رفع كفاءة واستجابة الأنظمة.<br>• التعاون الوثيق ضمن فرق Agile لتسليم حلول برمجية بمعايير جودة عالمية.'
          },
          {
            title: "شركة سمارت جيت / سيج للتقنية (Sig Smart Technology)",
            role: "مهندس برمجيات أول FULL-STACK .NET",
            date: "05/2022 — 10/2025 (دوام كامل)",
            desc: 'قيادة تصميم وتنفيذ تطبيقات الويب المتكاملة باستخدام ASP.NET MVC و Entity Framework و SQL Server.<br><span class="highlight">أبرز المساهمات:</span><br>• هندسة وتوسيع واجهات برمجية RESTful Web APIs عالية التزامن لمنظومة تطبيق <strong>زاد المسلم (Zad Al-Muslim)</strong> المليوني (أكثر من 10 ملايين مستخدم نشط)، مع دمج Redis للتخزين المؤقت وإرسال الإشعارات عبر FCM وخدمات مواقيت الصلاة.<br>• تطبيق معمارية Clean Architecture مع أنماط Repository و Dependency Injection لكود مرن وقابل للصيانة.<br>• هندسة مسارات مصادقة آمنة تشمل التحقق متعدد العوامل (MFA) ورموز OTP وإعادة تعيين كلمات المرور.<br>• ربط مزودي الرسائل النصية (Nexmo, Cequens, SMSMisr) ومرسلات البريد الآلية عبر OAuth و SMTP.<br>• تحسين قواعد البيانات العلائقية وخطط تنفيذ الاستعلامات في بيئات الضغط العالي.'
          },
          {
            title: "الشركة العربية (Arabian)",
            role: "مطور برمجيات FULL-STACK .NET",
            date: "12/2020 — 04/2022 (دوام كامل حضوري)",
            desc: 'المسؤولية عن تطوير وتحسين بوابات الويب وبناء واجهات RESTful APIs المستهلكة من قِبل تطبيقات الموبايل.<br><span class="highlight">أبرز المساهمات:</span><br>• تطوير وحدات متكاملة لأنظمة ERP وربط البرمجيات ببوابات الفاتورة والإيصال الإلكتروني الحكومية.<br>• تصميم واجهات ويب ديناميكية ومتجاوبة باستخدام ASP.NET و C# و JavaScript و jQuery و Bootstrap.'
          },
          {
            title: "البيت للتصميم (Albait Design)",
            role: "مطور برمجيات مبتدئ FULL-STACK .NET",
            date: "01/2020 — 11/2020 (دوام جزئي عن بُعد)",
            desc: 'تطوير جداول DataTables من جانب الخادم، وفلاتر البحث اللحظي، ووحدات التقارير الآلية مع التصدير والطباعة السريعة، وتنفيذ كافة عمليات CRUD والتواصل غير المتزامن عبر ASP.NET MVC و Ajax و jQuery.'
          }
        ];
        expItems.forEach((item, i) => {
          if (expAr[i]) {
            applyText(item.querySelector(".timeline-item-title"), expAr[i].title);
            const spans = item.querySelectorAll(":scope > span");
            if (spans[0]) applyText(spans[0], expAr[i].role);
            if (spans[1]) applyText(spans[1], expAr[i].date);
            applyText(item.querySelector(".timeline-text"), expAr[i].desc, true);
          }
        });
      }

      // Education
      if (resumeTimelines[1]) {
        applyText(resumeTimelines[1].querySelector(".h3"), "التعليم الأكاديمي");
        const eduItem = resumeTimelines[1].querySelector(".timeline-item");
        if (eduItem) {
          applyText(eduItem.querySelector(".timeline-item-title"), "أكاديمية مودرن (Modern Academy)");
          const spans = eduItem.querySelectorAll(":scope > span");
          if (spans[0]) applyText(spans[0], "بكالوريوس في علوم الحاسب (Computer Science)");
          applyText(eduItem.querySelector(".timeline-text"), 'دراسة شاملة في أساسيات علوم الحاسب، وهياكل البيانات، والخوارزميات، وهندسة البرمجيات.<br>• <strong>التقدير العام:</strong> جيد<br>• <strong>مشروع التخرج:</strong> امتياز (التقدير: A+)', true);
        }
      }

      // Certifications
      if (resumeTimelines[2]) {
        applyText(resumeTimelines[2].querySelector(".h3"), "الدورات والشهادات التخصصية");
        const certItems = resumeTimelines[2].querySelectorAll(".timeline-item");
        const certAr = [
          { title: "خدمات الذكاء الاصطناعي (Azure OpenAI Service)", span: "مايكروسوفت (Microsoft) · 2024", text: "تدريب عملي على نشر وإدارة نماذج الذكاء الاصطناعي عبر سحابة Microsoft Azure، ودمج نماذج OpenAI لمعالجة اللغات الطبيعية (NLP) والحلول التوليدية." },
          { title: "تصميم الويب وتطوير الواجهات الأمامية", span: "المعهد القومي للاتصالات (NTI) · 11/2020 — 01/2021", text: "تدريب تخصصي مكثف يركز على تصميم الويب الحديث، والتخطيطات المتجاوبة، و HTML5 و CSS3 و JavaScript و Bootstrap." },
          { title: "تدريب مطور Full Stack متكامل", span: "المركز الثقافي الروسي · 04/2020 — 10/2020", text: "تدريب متقدم يغطي لغة C# و .NET Framework والتحليل والتصميم كائني التوجه (OOAD) و SQL Server ومعمارية الويب." },
          { title: "تدريب مطور Full Stack متكامل", span: "مجموعة العربي (Elaraby Group) · 06/2019 — 01/2020", text: "تدريب عملي في تطوير تطبيقات الويب المؤسسية بتقنيات مايكروسوفت، ونمذجة قواعد البيانات، والعمل ضمن فرق التطوير." }
        ];
        certItems.forEach((item, i) => {
          if (certAr[i]) {
            applyText(item.querySelector(".timeline-item-title"), certAr[i].title);
            applyText(item.querySelector(":scope > span"), certAr[i].span);
            applyText(item.querySelector(".timeline-text"), certAr[i].text);
          }
        });
      }

      // Skills
      applyText(".skill .skills-title", "المهارات التقنية والخبرات");
      const skillCatsAr = [
        "معمارية الباك إند (.NET Core)",
        "قواعد البيانات والتخزين",
        "السحابة والذكاء الاصطناعي والتكاملات",
        "تطوير الواجهات وتجربة المستخدم"
      ];
      document.querySelectorAll(".skills-category-title").forEach((el, i) => {
        if (skillCatsAr[i]) applyText(el, skillCatsAr[i]);
      });
    } else {
      restoreOriginal(".resume-header .article-title");
      restoreOriginal("#openBlueprintBtn span");
      restoreOriginal(".resume-file");
      restoreOriginal("#printCvBtn span");
      document.querySelectorAll("article.resume .timeline").forEach(tl => {
        restoreOriginal(tl.querySelector(".h3"));
        tl.querySelectorAll(".timeline-item").forEach(item => {
          restoreOriginal(item.querySelector(".timeline-item-title"));
          item.querySelectorAll(":scope > span").forEach(s => restoreOriginal(s));
          restoreOriginal(item.querySelector(".timeline-text"), true);
        });
      });
      restoreOriginal(".skill .skills-title");
      document.querySelectorAll(".skills-category-title").forEach(el => restoreOriginal(el));
    }

    // 5. PORTFOLIO PAGE, PROJECTS CARDS & FEATURED CARDS
    const projectSearch = document.getElementById("projectSearch");
    if (isAr) {
      applyText(".portfolio .article-title", "معرض المشاريع");
      if (projectSearch) {
        cacheOriginalEnglish(projectSearch, "data-en-placeholder", projectSearch.placeholder);
        projectSearch.placeholder = "ابحث باسم المشروع أو التقنية (مثل: Stripe, ERP, Azure, SQL)...";
      }
      applyText('.filter-list [data-category-target="all"]', "الكل");
      applyText('.filter-list [data-category-target="web development"]', "تطبيقات الويب");
      applyText('.filter-list [data-category-target="mobile development"]', "تطبيقات الموبايل");
      applyText('[data-select-value]', "اختر التصنيف");
      applyText('.select-list [data-category-target="all"]', "الكل");
      applyText('.select-list [data-category-target="web development"]', "تطبيقات الويب");
      applyText('.select-list [data-category-target="mobile development"]', "تطبيقات الموبايل");
      applyText("#noProjectsFound p", "لا توجد مشاريع تطابق معايير البحث.");
      applyText("#resetFilterBtn", "إعادة ضبط الفلاتر");
    } else {
      restoreOriginal(".portfolio .article-title");
      if (projectSearch && projectSearch.hasAttribute("data-en-placeholder")) {
        projectSearch.placeholder = projectSearch.getAttribute("data-en-placeholder");
      }
      document.querySelectorAll("[data-category-target]").forEach(btn => restoreOriginal(btn));
      restoreOriginal('[data-select-value]');
      restoreOriginal("#noProjectsFound p");
      restoreOriginal("#resetFilterBtn");
    }

    // Translate all 20 project cards & their modal attributes
    document.querySelectorAll(".project-item").forEach(item => {
      const catEl = item.querySelector(".project-category");
      const titleEl = item.querySelector(".project-title");

      // Store original values on first run
      cacheOriginalEnglish(item, "data-en-title", item.getAttribute("data-project-title") || "");
      cacheOriginalEnglish(item, "data-en-role", item.getAttribute("data-project-role") || "");
      cacheOriginalEnglish(item, "data-en-desc", item.getAttribute("data-project-desc") || "");
      cacheOriginalEnglish(item, "data-en-cat", item.getAttribute("data-project-category") || "");

      const enTitleKey = item.getAttribute("data-en-title");
      const enCat = item.getAttribute("data-en-cat");

      if (isAr) {
        if (catEl) {
          cacheOriginalEnglish(catEl, "data-en-text", catEl.textContent);
          catEl.textContent = enCat.toLowerCase().includes("mobile") ? "تطبيقات الموبايل" : "تطبيقات الويب";
        }
        const tr = projectTranslationsAr[enTitleKey];
        if (tr) {
          if (titleEl) {
            cacheOriginalEnglish(titleEl, "data-en-text", titleEl.textContent);
            titleEl.textContent = tr.cardTitle;
          }
          item.setAttribute("data-project-title", tr.title);
          item.setAttribute("data-project-role", tr.role);
          item.setAttribute("data-project-desc", tr.desc);
          item.setAttribute("data-project-category", enCat.toLowerCase().includes("mobile") ? "تطبيقات الموبايل" : "تطبيقات الويب");
        }
      } else {
        if (catEl) restoreOriginal(catEl);
        if (titleEl) restoreOriginal(titleEl);
        if (item.hasAttribute("data-en-title")) item.setAttribute("data-project-title", item.getAttribute("data-en-title"));
        if (item.hasAttribute("data-en-role")) item.setAttribute("data-project-role", item.getAttribute("data-en-role"));
        if (item.hasAttribute("data-en-desc")) item.setAttribute("data-project-desc", item.getAttribute("data-en-desc"));
        if (item.hasAttribute("data-en-cat")) item.setAttribute("data-project-category", item.getAttribute("data-en-cat"));
      }
    });

    // Update Featured Cards in About page dynamically
    document.querySelectorAll("#featuredProjects .featured-card").forEach(card => {
      const highlightKey = card.dataset.highlightCard;
      const matchingSource = document.querySelector(`[data-highlight="${highlightKey}"]`);
      if (matchingSource) {
        const roleEl = card.querySelector(".featured-role");
        const titleEl = card.querySelector("h4");
        const descEl = card.querySelector("p");
        const actionEl = card.querySelector(".featured-action");

        if (roleEl) roleEl.textContent = matchingSource.getAttribute("data-project-role");
        if (titleEl) titleEl.textContent = matchingSource.getAttribute("data-project-title");
        if (descEl) descEl.textContent = matchingSource.getAttribute("data-project-desc");
        if (actionEl) actionEl.textContent = isAr ? "استكشف المشروع ↗" : "Explore project ↗";
      }
    });

    // Refresh project result count if filter function is available
    if (typeof applyFilters === "function") applyFilters();

    // 6. CONTACT PAGE & CONVERSATION BANNER
    if (isAr) {
      applyText(".contact .article-title", "تواصل معي");
      applyText(".contact-form .eyebrow", "لنصنع معاً شيئاً ذا قيمة");
      applyText(".contact-form .form-title", "ما الذي يدور في ذهنك؟");
      applyText(".contact-form .section-intro", "مشروع جديد، تحسين تطبيق قائم، أو فرصة قيادية في فريقك البرمجي. ابدأ بمشاركة التفاصيل وسننطلق من هناك.");
      applyText(".contact-options a:first-child strong", "محادثة عبر واتساب");
      applyText(".contact-options a:first-child small", "ابدأ محادثة مباشرة الآن");
      applyText(".contact-options a:last-child strong", "تفضل البريد الإلكتروني؟");
      applyText('.contact-direct button[data-copy*="gmail"]', "نسخ البريد");
      applyText('.contact-direct a[href="tel:+966597228231"]', "اتصل بالسعودية (+966 59 722 8231)");
      applyText('.contact-direct button[data-copy*="966597228231"]', "نسخ الرقم السعودي");
      applyText('.contact-direct a[href="tel:+201013470551"]', "اتصل بمصر (+20 1013470551)");
      applyText('.contact-direct button[data-copy*="1013470551"]', "نسخ رقم الواتساب");
      applyText("#downloadVCardBtn span", "حفظ جهة الاتصال (.vcf)");

      applyText('label[for="contact-interest"]', "أود التحدث بشأن");
      const interestOpts = document.querySelectorAll("#contact-interest option");
      const optsAr = ["مشروع جديد", "تحسين نظام أو تطبيق قائم", "فرصة وظيفية / انضمام لفريق", "موضوع آخر"];
      interestOpts.forEach((opt, i) => { if (optsAr[i]) applyText(opt, optsAr[i]); });

      applyText('label[for="contact-name"]', "الاسم الكريم");
      const nameInput = document.getElementById("contact-name");
      if (nameInput) { cacheOriginalEnglish(nameInput, "data-en-placeholder", nameInput.placeholder); nameInput.placeholder = "كيف تحب أن أناديك؟"; }

      applyText('label[for="contact-email"]', 'البريد الإلكتروني <span>(اختياري)</span>', true);
      applyText('label[for="contact-message"]', "نبذة عما تحتاجه أو تبحث عنه");
      const msgInput = document.getElementById("contact-message");
      if (msgInput) { cacheOriginalEnglish(msgInput, "data-en-placeholder", msgInput.placeholder); msgInput.placeholder = "ما الذي تسعى لبنائه أو تبحث عنه؟ شاركني أهدافك والإطار الزمني المتوقع."; }

      applyText(".delivery-options legend", "متابعة المحادثة عبر");
      const radioLabels = document.querySelectorAll(".delivery-options label");
      if (radioLabels[0]) {
        cacheOriginalEnglish(radioLabels[0], "data-en-html", radioLabels[0].innerHTML);
        const inp0 = radioLabels[0].querySelector("input");
        const checked0 = inp0?.checked;
        radioLabels[0].innerHTML = `<input type="radio" name="channel" value="whatsapp" ${checked0 ? "checked" : ""}> واتساب`;
      }
      if (radioLabels[1]) {
        cacheOriginalEnglish(radioLabels[1], "data-en-html", radioLabels[1].innerHTML);
        const inp1 = radioLabels[1].querySelector("input");
        const checked1 = inp1?.checked;
        radioLabels[1].innerHTML = `<input type="radio" name="channel" value="email" ${checked1 ? "checked" : ""}> البريد الإلكتروني`;
      }
      applyText("#delivery-note", "هذا يجهز مسودة للرسالة لمراجعتها وإرسالها بنفسك عبر واتساب أو تطبيق بريدك. لا يتم إرسال أي بيانات من هذه الصفحة.");

      const submitBtn = document.querySelector('[data-form-btn]');
      if (submitBtn) {
        cacheOriginalEnglish(submitBtn, "data-en-html", submitBtn.innerHTML);
        const isEmail = document.querySelector('input[name="channel"]:checked')?.value === "email";
        submitBtn.innerHTML = (isEmail ? "المتابعة عبر البريد الإلكتروني" : "المتابعة عبر واتساب") + ' <span aria-hidden="true">↗</span>';
      }
      applyText("#copyDraft", "نسخ نص الرسالة");

      applyText(".conversation-banner .eyebrow", "هل لديك فكرة أو فرصة جديدة؟");
      applyText(".conversation-banner h3", "لنحوّل فكرتك القادمة إلى واقع حي ومتقن.");
      applyText(".conversation-banner div > p:last-of-type", "أخبرني قليلاً عن مشروعك أو الفرصة المتاحة وسنتواصل فوراً.");
      applyText(".conversation-banner .primary-action", 'تواصل معي <span aria-hidden="true">↗</span>', true);
    } else {
      restoreOriginal(".contact .article-title");
      restoreOriginal(".contact-form .eyebrow");
      restoreOriginal(".contact-form .form-title");
      restoreOriginal(".contact-form .section-intro");
      restoreOriginal(".contact-options a:first-child strong");
      restoreOriginal(".contact-options a:first-child small");
      restoreOriginal(".contact-options a:last-child strong");
      restoreOriginal('.contact-direct button[data-copy*="gmail"]');
      restoreOriginal('.contact-direct a[href="tel:+966597228231"]');
      restoreOriginal('.contact-direct button[data-copy*="966597228231"]');
      restoreOriginal('.contact-direct a[href="tel:+201013470551"]');
      restoreOriginal('.contact-direct button[data-copy*="1013470551"]');
      restoreOriginal("#downloadVCardBtn span");
      restoreOriginal('label[for="contact-interest"]');
      document.querySelectorAll("#contact-interest option").forEach(opt => restoreOriginal(opt));
      restoreOriginal('label[for="contact-name"]');
      const nameInput = document.getElementById("contact-name");
      if (nameInput && nameInput.hasAttribute("data-en-placeholder")) nameInput.placeholder = nameInput.getAttribute("data-en-placeholder");
      restoreOriginal('label[for="contact-email"]', true);
      restoreOriginal('label[for="contact-message"]');
      const msgInput = document.getElementById("contact-message");
      if (msgInput && msgInput.hasAttribute("data-en-placeholder")) msgInput.placeholder = msgInput.getAttribute("data-en-placeholder");
      restoreOriginal(".delivery-options legend");
      document.querySelectorAll(".delivery-options label").forEach(lbl => restoreOriginal(lbl, true));
      restoreOriginal("#delivery-note");
      restoreOriginal('[data-form-btn]', true);
      restoreOriginal("#copyDraft");
      restoreOriginal(".conversation-banner .eyebrow");
      restoreOriginal(".conversation-banner h3");
      restoreOriginal(".conversation-banner div > p:last-of-type");
      restoreOriginal(".conversation-banner .primary-action", true);
    }

    // 7. CLEAN ARCHITECTURE BLUEPRINT MODAL
    if (isAr) {
      applyText(".arch-modal-title", "معمارية .NET Clean Architecture و CQRS المؤسسية");
      applyText(".arch-modal-subtitle", "معمارية برمجية معتمدة ومثبتة في بيئات الإنتاج، مصممة لتحمل الضغط العالي وقابلية الصيانة والتوسع.");
      applyText(".presentation-layer .arch-layer-badge", "1. طبقة العرض والواجهات البرمجية (Presentation & API)");
      applyText(".application-layer .arch-layer-badge", "2. طبقة التطبيق الأساسية (Application Core & CQRS)");
      applyText(".domain-layer .arch-layer-badge", "3. طبقة منطق الأعمال الأساسية (Domain Core)");
      applyText(".infrastructure-layer .arch-layer-badge", "4. طبقة البنية التحتية وقواعد البيانات (Infrastructure)");

      const archNodesAr = [
        // Layer 1
        ["واجهات ASP.NET Core Web APIs", "Minimal APIs ووحدات التحكم Controllers"],
        ["الأمان والمصادقة", "توكنز JWT وسياسات RBAC للأدوار"],
        ["تحديد المعدل والتخزين المؤقت", "IP Rate Limiting و OutputCache"],
        ["خط معالجة الطلبات (Middleware)", "معالجة الأخطاء الشاملة وسجلات التدقيق"],
        // Layer 2
        ["أوامر ومعالجات (Commands)", "عمليات الكتابة عبر MediatR"],
        ["استعلامات ومعالجات (Queries)", "عمليات القراءة المحسنة عبر Dapper"],
        ["التحقق (FluentValidation)", "خط التحقق الصارم من صحة الطلبات"],
        ["سلوكيات خط المعالجة (Behaviors)", "التسجيل، القياسات، و UnitOfWork"],
        // Layer 3
        ["الكيانات وجذور التجميع", "نماذج نطاق غنية وقواعد الأعمال النقية"],
        ["كائنات القيمة (Value Objects)", "كائنات غير قابلة للتغيير (Immutable)"],
        ["أحداث النطاق (Domain Events)", "أحداث داخلية غير متزامنة في الذاكرة"],
        ["المواصفات (Specifications)", "تغليف قواعد الاستعلامات المعقدة"],
        // Layer 4
        ["EF Core 8 / 9", "نموذج الكتابة وتتبع التغييرات"],
        ["Dapper Micro-ORM", "تنفيذ استعلامات فائقة السرعة"],
        ["SQL Server", "جداول مفهرسة ومقسمة لتحمل الأحمال"],
        ["Redis Cache", "التخزين المؤقت الموزع وإدارة الجلسات"]
      ];
      document.querySelectorAll(".arch-diagram .arch-node").forEach((node, i) => {
        if (archNodesAr[i]) {
          applyText(node.querySelector("strong"), archNodesAr[i][0]);
          applyText(node.querySelector("span"), archNodesAr[i][1]);
        }
      });
      const specs = document.querySelectorAll(".arch-specs span");
      if (specs[0]) applyText(specs[0], '⚡ <strong>الأداء الفائق:</strong> استجابات APIs في أقل من 50ms', true);
      if (specs[1]) applyText(specs[1], '🔒 <strong>الأمان العالي:</strong> متوافق مع معايير OWASP وتشفير شامل', true);
      if (specs[2]) applyText(specs[2], '📈 <strong>قابلية التوسع:</strong> بنية موزعة ومتعددة المستأجرين (Multi-Tenant)', true);
    } else {
      restoreOriginal(".arch-modal-title");
      restoreOriginal(".arch-modal-subtitle");
      document.querySelectorAll(".arch-layer-badge").forEach(b => restoreOriginal(b));
      document.querySelectorAll(".arch-diagram .arch-node").forEach(node => {
        restoreOriginal(node.querySelector("strong"));
        restoreOriginal(node.querySelector("span"));
      });
      document.querySelectorAll(".arch-specs span").forEach(s => restoreOriginal(s, true));
    }

    // 8. COMMAND PALETTE INPUT & FOOTER
    const cmdInput = document.getElementById("cmdPaletteInput");
    const cmdFooter = document.querySelector(".cmd-palette-footer");
    if (isAr) {
      if (cmdInput) {
        cacheOriginalEnglish(cmdInput, "data-en-placeholder", cmdInput.placeholder);
        cmdInput.placeholder = "اكتب أمراً، مشروعاً، أو تقنية... (مثل: زاد المسلم، سيرة ذاتية)";
      }
      if (cmdFooter) {
        cacheOriginalEnglish(cmdFooter, "data-en-html", cmdFooter.innerHTML);
        cmdFooter.innerHTML = '<span><kbd>↑</kbd> <kbd>↓</kbd> للتنقل</span><span><kbd>↵</kbd> للاختيار</span><span><kbd>ESC</kbd> للإغلاق</span>';
      }
    } else {
      if (cmdInput && cmdInput.hasAttribute("data-en-placeholder")) {
        cmdInput.placeholder = cmdInput.getAttribute("data-en-placeholder");
      }
      restoreOriginal(cmdFooter, true);
    }

    // Emit custom event so other components (like marquee button & sound tooltip) sync
    window.dispatchEvent(new CustomEvent("portfolio:langchange", { detail: { lang } }));
  }

  // Initialize
  if (currentLang === "ar") {
    applyLanguage("ar");
  }

  langBtn.addEventListener("click", () => {
    currentLang = currentLang === "en" ? "ar" : "en";
    localStorage.setItem("portfolio_lang", currentLang);
    applyLanguage(currentLang);
  });
})();

// ---------------------------------------------------------------------------
// LINEAR-STYLE CARD SPOTLIGHT TRACKER & MAGNETIC BUTTON PHYSICS
// ---------------------------------------------------------------------------
(function initSignatureMotion() {
  if (!window.matchMedia("(hover: hover)").matches) return;

  // 1. Card Spotlight Glow (delegated passive pointermove)
  const cardSelector = ".service-item, .featured-card, .project-item, .skills-category, .timeline-item, .arch-node, .content-card-clients";
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest(cardSelector);
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }, { passive: true });

  // 2. Magnetic Pull Physics on Primary CTAs
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const magneticSelector = ".primary-action, .header-contact, .blueprint-btn, .floating-whatsapp-btn";

  document.querySelectorAll(magneticSelector).forEach(btn => {
    btn.classList.add("magnetic-btn");

    btn.addEventListener("pointermove", (e) => {
      const rect = btn.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      const pullX = Math.max(-5, Math.min(5, relX * 0.18));
      const pullY = Math.max(-4, Math.min(4, relY * 0.18));
      btn.style.transform = `translate3d(${pullX}px, ${pullY}px, 0)`;
    }, { passive: true });

    btn.addEventListener("pointerleave", () => {
      btn.style.transform = "";
    });
  });
})();
