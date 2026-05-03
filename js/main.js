const typedRoleEl = document.getElementById("typed-role");
const projectsGrid = document.getElementById("projects-grid");
const orbitWrap = document.getElementById("orbit-wrap");
const orbitsEl = document.getElementById("orbits");
const orbitTooltip = document.getElementById("orbit-tooltip");
const orbitCarousel = document.getElementById("orbit-carousel");
const navWrap = document.querySelector(".glass-nav-wrap");
const navLinks = document.querySelectorAll(".nav-links a, .mobile-menu a");
const scrollTopBtn = document.getElementById("scroll-top");
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobile-menu");
const contactForm = document.getElementById("contact-form");
const formNotification = document.getElementById("form-notification");
const modal = document.getElementById("project-modal");
const modalClose = document.getElementById("modal-close");
const modalTitle = document.getElementById("modal-title");
const modalDescription = document.getElementById("modal-description");
const modalImage = document.getElementById("modal-image");
const modalTags = document.getElementById("modal-tags");
const modalGithub = document.getElementById("modal-github");
const modalLive = document.getElementById("modal-live");

const PROJECT_IMAGE_COUNT = 20;
let releaseProjectModalTrap = null;

function isMobilePerformanceMode() {
  return window.matchMedia("(max-width: 900px), (hover: none) and (pointer: coarse)").matches;
}

function normalizeProjectImages(projectList, startIndex = 0) {
  return projectList.map((project, index) => ({
    ...project,
    image: project.image || getProjectImage(startIndex + index)
  }));
}

let activeProjects = normalizeProjectImages(Array.isArray(projects) ? [...projects] : []);

function normalizeRepoName(name) {
  return name.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function getProjectImage(index) {
  const imageNumber = (Math.abs(Number(index)) % PROJECT_IMAGE_COUNT) + 1;
  return `assets/projects/project-${imageNumber}.svg`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeUrl(url, fallback = "#") {
  const trimmed = String(url || "").trim();

  if (!trimmed) {
    return fallback;
  }

  if (trimmed.startsWith("#")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed, window.location.href);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
  } catch {
    // Fall through to fallback.
  }

  return fallback;
}

function trapFocus(container) {
  if (!container) {
    return () => {};
  }

  const focusables = [...container.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.hasAttribute("aria-hidden"));

  if (!focusables.length) {
    return () => {};
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  function onKeyDown(event) {
    if (event.key !== "Tab") {
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  container.addEventListener("keydown", onKeyDown);
  first.focus();

  return () => {
    container.removeEventListener("keydown", onKeyDown);
  };
}





const PORTFOLIO_DEPLOYED_URL = "https://personal-portfolio-qea0.onrender.com/";

async function loadProjectsFromGithub() {
  if (!projectSyncConfig?.includeGithubRepos || !projectSyncConfig?.githubUsername) {
    return;
  }

  try {
    const perPage = projectSyncConfig.maxGithubRepos || 100;
    const response = await fetch(
      `https://api.github.com/users/${projectSyncConfig.githubUsername}/repos?sort=updated&per_page=${perPage}`
    );

    if (!response.ok) {
      return;
    }

    const repos = await response.json();
    if (!Array.isArray(repos)) {
      return;
    }

    const localByGithub = new Set(
      activeProjects
        .map((project) => (project.github || "").trim().toLowerCase())
        .filter(Boolean)
    );

    const excluded = new Set((projectSyncConfig.excludeRepos || []).map((name) => String(name).trim().toLowerCase()));

    const githubProjects = repos
      .filter((repo) => !repo.fork && !repo.archived)
      .filter((repo) => !excluded.has(String(repo.name || "").trim().toLowerCase()))
      .filter((repo) => !localByGithub.has(String(repo.html_url || "").trim().toLowerCase()))
      .map((repo) => {
        const repoName = String(repo.name || "").trim().toLowerCase();
        const tech = [];
        if (repo.language) {
          tech.push(repo.language);
        }

        const topics = Array.isArray(repo.topics) ? repo.topics.slice(0, 3).map((t) => normalizeRepoName(t)) : [];
        topics.forEach((topic) => {
          if (!tech.includes(topic)) {
            tech.push(topic);
          }
        });

        if (!tech.length) {
          tech.push("Repository");
        }

        const liveUrl = repoName === "personal_portfolio"
          ? PORTFOLIO_DEPLOYED_URL
          : (repo.homepage ? repo.homepage : repo.html_url);

        return {
          title: normalizeRepoName(repo.name || "Untitled Project"),
          description: repo.description || "GitHub project synced automatically from repository data.",
          tech,
          github: repo.html_url,
          live: liveUrl
        };
      });

    activeProjects = [
      ...activeProjects,
      ...normalizeProjectImages(githubProjects, activeProjects.length)
    ];
  } catch {
    // Keep local projects only when GitHub API is unavailable.
  }
}

function initTyping() {
  if (!typedRoleEl || !Array.isArray(roles) || roles.length === 0) {
    return;
  }

  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function tick() {
    const current = roles[roleIndex % roles.length];
    const roleLength = current.length;

    if (isDeleting) {
      charIndex = Math.max(0, charIndex - 1);
    } else {
      charIndex = Math.min(roleLength, charIndex + 1);
    }

    typedRoleEl.textContent = current.slice(0, charIndex);

    let nextDelay;
    if (!isDeleting && charIndex === roleLength) {
      isDeleting = true;
      nextDelay = 1200;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex += 1;
      nextDelay = 320;
    } else {
      const progress = roleLength ? charIndex / roleLength : 0;
      nextDelay = isDeleting
        ? 42 + Math.round((1 - progress) * 28)
        : 64 + Math.round(progress * 30);
    }

    setTimeout(tick, nextDelay);
  }

  tick();
}

function renderOrbitSystem() {
  if (!orbitsEl || !orbitCarousel || !orbitTooltip || !orbitWrap) {
    return;
  }

  const categories = {
    "Web Development": [],
    "Programming Languages": [],
    "AI / Machine Learning": [],
    "Tools & Technologies": []
  };

  // Get skills from skillManager instead of static array
  const currentSkills = skillManager ? skillManager.getSkills() : skills;

  currentSkills.forEach((skill) => {
    if (!categories[skill.category]) {
      categories[skill.category] = [];
    }
    categories[skill.category].push(skill);
  });

  orbitsEl.innerHTML = "";

  const scene = document.createElement("div");
  scene.className = "orbit-scene";

  const mainRing = document.createElement("div");
  mainRing.className = "orbit-ring-main";

  const rotator = document.createElement("div");
  rotator.className = "orbit-rotator";

  const isCompact = window.matchMedia("(max-width: 900px)").matches;
  const radius = isCompact ? 136 : 188;
  const ringSize = (radius * 2) + 28;
  mainRing.style.width = `${ringSize}px`;
  mainRing.style.height = `${ringSize}px`;
  const total = currentSkills.length;
  if (!total) {
    orbitCarousel.innerHTML = "";
    return;
  }

  currentSkills.forEach((skill, index) => {
    const angle = (Math.PI * 2 * index) / total;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const related = categories[skill.category]
      .map((item) => item.name)
      .filter((name) => name !== skill.name)
      .slice(0, 3)
      .join(", ");

    const node = document.createElement("button");
    node.className = "orbit-node";
    node.type = "button";
    node.style.left = `calc(50% + ${x}px)`;
    node.style.top = `calc(50% + ${y}px)`;
    node.setAttribute("aria-label", skill.name);

    const dot = document.createElement("span");
    dot.className = "orbit-node-dot";

    const label = document.createElement("span");
    label.className = "orbit-node-label";
    label.textContent = skill.name;
    // Keep skill names consistently above each orbit dot, even after add/delete re-renders.
    label.style.left = "50%";
    label.style.top = "0";

    node.appendChild(dot);
    node.appendChild(label);

    node.addEventListener("mouseenter", () => {
      orbitTooltip.innerHTML = "";

      const tooltipTitle = document.createElement("strong");
      tooltipTitle.textContent = `${skill.icon} ${skill.name}`;

      const tooltipCategory = document.createElement("span");
      tooltipCategory.textContent = skill.category;

      const tooltipRelated = document.createElement("small");
      tooltipRelated.textContent = `Related: ${related || "Core skill"}`;

      orbitTooltip.append(tooltipTitle, tooltipCategory, tooltipRelated);
      orbitTooltip.classList.add("show");

      const bounds = orbitWrap.getBoundingClientRect();
      const nodeBounds = node.getBoundingClientRect();
      orbitTooltip.style.left = `${nodeBounds.left - bounds.left + nodeBounds.width / 2}px`;
      orbitTooltip.style.top = `${nodeBounds.top - bounds.top}px`;
    });

    node.addEventListener("mouseleave", () => {
      orbitTooltip.classList.remove("show");
    });

    rotator.appendChild(node);
  });

  scene.appendChild(mainRing);
  scene.appendChild(rotator);
  orbitsEl.appendChild(scene);

  function updateOrbitPause(event) {
    const rect = scene.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const distance = Math.hypot(dx, dy);
    const orbitRadius = mainRing.clientWidth / 2;

    scene.classList.toggle("orbit-paused", distance <= orbitRadius);
  }

  scene.addEventListener("mousemove", updateOrbitPause);
  scene.addEventListener("mouseleave", () => {
    scene.classList.remove("orbit-paused");
  });

  orbitCarousel.innerHTML = Object.entries(categories)
    .filter(([_, skills]) => skills.length > 0)
    .map(([category, skillsByCategory]) => {
      const items = skillsByCategory
        .map((skill) => `<span>${escapeHtml(`${skill.icon} ${skill.name}`)}</span>`)
        .join("");
      return `
        <article class="orbit-chip">
          <h3>${escapeHtml(category)}</h3>
          <div class="project-tags">
            ${items}
          </div>
        </article>`;
    })
    .join("");
}

function renderProjects() {
  if (!projectsGrid) {
    return;
  }


  const maxProjects = 5;
  const projectCards = activeProjects.slice(0, maxProjects)
    .map((project, idx) => {
      const projectImage = project.image || getProjectImage(idx);
      const safeTitle = escapeHtml(project.title || "Untitled Project");
      const safeAlt = escapeHtml(`${project.title || "Project"} preview`);
      const safeTech = Array.isArray(project.tech)
        ? project.tech.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")
        : "";

      let thumbContent = "";
      if (projectImage.endsWith('.html')) {
        // Fetch and insert thumbnail HTML
        thumbContent = `<div class='project-thumb' data-thumb-html='${projectImage}'></div>`;
      } else {
        thumbContent = `<img src="${sanitizeUrl(projectImage, getProjectImage(idx))}" alt="${safeAlt}" />`;
      }

      return `
        <article class="project-card" data-index="${idx}">
          <div class="project-inner glass-card">
            <div class="project-face project-front">
              ${thumbContent}
              <h3>${safeTitle}</h3>
              <div class="project-tags">
                ${safeTech}
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  const viewMoreBtn = `<div class="view-more-wrap"><button class="view-more-btn" id="view-more-projects">View More</button></div>`;
  projectsGrid.innerHTML = projectCards + viewMoreBtn;

  // Load thumbnail HTML for project cards
  document.querySelectorAll('.project-thumb[data-thumb-html]').forEach(async (el) => {
    const htmlPath = el.getAttribute('data-thumb-html');
    try {
      const response = await fetch(htmlPath);
      if (response.ok) {
        const html = await response.text();
        el.innerHTML = html;
      }
    } catch {}
  });

  document.querySelectorAll(".project-card").forEach((card) => {
    const inner = card.querySelector(".project-inner");
    if (!inner) {
      return;
    }

    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 10;
      const rotateX = (0.5 - y / rect.height) * 10;

      if (!card.matches(":hover")) {
        return;
      }

      inner.style.transform = `translateY(-10px) scale(1.015) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      inner.style.transform = "translateY(0) scale(1) rotateY(0deg) rotateX(0deg)";
      setTimeout(() => {
        inner.style.transform = "";
      }, 30);
    });

    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        return;
      }

      const projectIndex = Number(card.dataset.index);
      const project = activeProjects[projectIndex];
      openModal(project, projectIndex);
    });
  });

  const viewMoreProjectsBtn = document.getElementById("view-more-projects");
  if (viewMoreProjectsBtn) {
    viewMoreProjectsBtn.addEventListener("click", () => {
      window.open("https://github.com/anuphiremani04?tab=repositories", "_blank");
    });
  }
}

function openModal(project, projectIndex = 0) {

  if (!modal || !modalTitle || !modalDescription || !modalImage || !modalTags || !modalGithub) {
    return;
  }

  if (!project || typeof project !== "object") {
    return;
  }

  modalTitle.textContent = project.title || "Untitled Project";
  modalDescription.textContent = project.description || "No description available.";
  modalImage.src = sanitizeUrl(project.image || getProjectImage(projectIndex), getProjectImage(projectIndex));

  const tags = Array.isArray(project.tech) ? project.tech : [];
  modalTags.innerHTML = tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  modalGithub.href = sanitizeUrl(project.github);
  // Hide the Live Demo button if it exists
  if (modalLive) {
    modalLive.style.display = "none";
  }

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  if (releaseProjectModalTrap) {
    releaseProjectModalTrap();
  }
  releaseProjectModalTrap = trapFocus(modal);
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (releaseProjectModalTrap) {
    releaseProjectModalTrap();
    releaseProjectModalTrap = null;
  }
}

function initRevealOnScroll() {
  const revealElements = [...document.querySelectorAll(".reveal")];
  const mobileLite = isMobilePerformanceMode();

  const sectionCounters = {
    about: 0,
    projects: 0,
    default: 0
  };

  revealElements.forEach((el) => {
    if (el.classList.contains("reveal-up") || el.classList.contains("reveal-left") || el.classList.contains("reveal-right")) {
      return;
    }

    if (mobileLite) {
      el.classList.add("reveal-up");
      return;
    }

    // Keep Skill Universe stable regardless of changes in other sections.
    if (el.closest("#skills")) {
      el.classList.add("reveal-up");
      return;
    }

    if (el.classList.contains("hero-left")) {
      el.classList.add("reveal-left");
      return;
    }

    if (el.classList.contains("hero-right")) {
      el.classList.add("reveal-right");
      return;
    }

    if (el.closest("#about")) {
      el.style.transitionDelay = `${sectionCounters.about * 350}ms`;
      sectionCounters.about += 1;
      el.classList.add("reveal-up");
      return;
    }

    if (el.closest("#projects")) {
      const variant = sectionCounters.projects % 2 === 0 ? "reveal-up" : "reveal-right";
      el.style.transitionDelay = `${(sectionCounters.projects % 3) * 100}ms`;
      sectionCounters.projects += 1;
      el.classList.add(variant);
      return;
    }

    const fallbackVariant = sectionCounters.default % 4;
    sectionCounters.default += 1;
    const variants = ["reveal-up", "reveal-left", "reveal-right", "reveal-down"];
    el.classList.add(variants[fallbackVariant]);
  });

  if (typeof IntersectionObserver !== "function") {
    revealElements.forEach((el) => el.classList.add("visible"));
    document
      .querySelectorAll(".about-card, .project-inner, .widget, .social-link, .orbit-chip, .contact-panel, .social-panel")
      .forEach((el) => {
        el.classList.remove("scroll-animate");
        el.classList.add("in-view");
      });
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        } else {
          entry.target.classList.remove("visible");
        }
      });
    },
    {
      threshold: mobileLite ? 0.05 : 0.12,
      rootMargin: "0px 0px -5% 0px"
    }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  const scrollAnimatedElements = document.querySelectorAll(
    ".about-card, .project-inner, .widget, .social-link, .orbit-chip, .contact-panel, .social-panel"
  );

  scrollAnimatedElements.forEach((el, index) => {
    el.classList.add("scroll-animate");
    el.style.setProperty("--scroll-delay", mobileLite ? `${(index % 4) * 20}ms` : `${(index % 8) * 45}ms`);
  });

  const staggerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        } else {
          entry.target.classList.remove("in-view");
        }
      });
    },
    {
      threshold: mobileLite ? 0.05 : 0.1,
      rootMargin: "0px 0px -5% 0px"
    }
  );

  scrollAnimatedElements.forEach((el) => staggerObserver.observe(el));
}

function initNavbar() {
  if (!navWrap || !scrollTopBtn) {
    return;
  }

  const sections = [...document.querySelectorAll("main section")];

  function onScroll() {
    const scrollY = window.scrollY;
    navWrap.classList.toggle("scrolled", scrollY > 40);
    scrollTopBtn.classList.toggle("show", scrollY > 360);

    // Scroll progress bar update
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const progressEl = document.getElementById("scroll-progress");
    if (progressEl) {
      progressEl.style.width = scrolled + "%";
    }

    sections.forEach((section) => {
      const id = section.getAttribute("id");
      const start = section.offsetTop - 120;
      const end = start + section.offsetHeight;
      if (scrollY >= start && scrollY < end) {
        navLinks.forEach((link) => {
          const hash = link.getAttribute("href");
          link.classList.toggle("active", hash === `#${id}`);
        });
      }
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      hamburger.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
    });
  });
}

function initHamburger() {
  if (!hamburger || !mobileMenu) {
    return;
  }

  function closeMobileMenu() {
    mobileMenu.classList.remove("open");
    hamburger.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
  }

  hamburger.addEventListener("click", () => {
    const expanded = hamburger.classList.toggle("open");
    mobileMenu.classList.toggle("open", expanded);
    hamburger.setAttribute("aria-expanded", String(expanded));
  });

  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > 900) {
        closeMobileMenu();
      }
    },
    { passive: true }
  );
}

function initResponsiveLayout() {
  let resizeFrame = 0;

  function refreshLayout() {
    resizeFrame = 0;
    renderOrbitSystem();
  }

  function queueRefresh() {
    if (resizeFrame) {
      cancelAnimationFrame(resizeFrame);
    }
    resizeFrame = requestAnimationFrame(refreshLayout);
  }

  window.addEventListener("resize", queueRefresh, { passive: true });
  window.addEventListener("orientationchange", queueRefresh, { passive: true });
}

function validateContactForm() {
  if (!contactForm || !formNotification) {
    return;
  }

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = contactForm.name.value.trim();
    const email = contactForm.email.value.trim();
    const message = contactForm.message.value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !email || !message) {
      showNotice("Please fill in all fields.", "error");
      return;
    }

    if (!emailOk) {
      showNotice("Please provide a valid email address.", "error");
      return;
    }

    const subject = `Portfolio Contact from ${name}`;
    const body = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    const opened = openGmailCompose({
      to: "anuphiremani123@gmail.com",
      subject,
      body
    });
    if (opened) {
      showNotice("Gmail compose opened with your message details.", "success");
      return;
    }

    showNotice("Popup blocked. Please allow popups and try again.", "error");
  });
}

function openGmailCompose({ to, subject = "", body = "" }) {
  const encodedTo = encodeURIComponent(to);
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  const gmailWebCompose = `https://mail.google.com/mail/u/0/?fs=1&tf=cm&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`;
  const composeTab = window.open("about:blank", "_blank");
  if (!composeTab) {
    return false;
  }

  try {
    composeTab.opener = null;
  } catch {
    // noop
  }

  if (!isMobilePerformanceMode()) {
    composeTab.location.href = gmailWebCompose;
    return true;
  }

  // On mobile, try Gmail app deep-link in new tab, then fallback in that same tab.
  const gmailAppCompose = `googlegmail://co?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`;
  composeTab.location.href = gmailAppCompose;

  window.setTimeout(() => {
    try {
      if (!composeTab.closed) {
        composeTab.location.href = gmailWebCompose;
      }
    } catch {
      // noop
    }
  }, 700);

  return true;
}

function initEmailLinkMode() {
  const emailSocialLink = document.getElementById("email-social-link");
  if (!emailSocialLink) {
    return;
  }

  const to = "anuphiremani123@gmail.com";
  const emailLabel = emailSocialLink.querySelector("span:last-child");
  const gmailDirect = `https://mail.google.com/mail/u/0/?fs=1&tf=cm&to=${encodeURIComponent(to)}`;

  function applyEmailLinkBehavior() {
    if (isMobilePerformanceMode()) {
      emailSocialLink.setAttribute("href", "#");
      emailSocialLink.removeAttribute("target");
      emailSocialLink.removeAttribute("rel");
      emailSocialLink.setAttribute("aria-label", `Email address: ${to}`);
      if (emailLabel) {
        emailLabel.textContent = to;
      }
      return;
    }

    emailSocialLink.setAttribute("href", gmailDirect);
    emailSocialLink.setAttribute("target", "_blank");
    emailSocialLink.setAttribute("rel", "noreferrer noopener");
    emailSocialLink.setAttribute("aria-label", "Email");
    if (emailLabel) {
      emailLabel.textContent = "Email";
    }
  }

  applyEmailLinkBehavior();

  let resizeFrame = 0;
  function onViewportChange() {
    if (resizeFrame) {
      cancelAnimationFrame(resizeFrame);
    }
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      applyEmailLinkBehavior();
    });
  }

  window.addEventListener("resize", onViewportChange, { passive: true });
  window.addEventListener("orientationchange", onViewportChange, { passive: true });

  emailSocialLink.addEventListener("click", (event) => {
    if (isMobilePerformanceMode()) {
      event.preventDefault();
      showNotice(`Email: ${to}`, "success");
      return;
    }

    event.preventDefault();
    const opened = openGmailCompose({ to });
    if (!opened) {
      showNotice("Popup blocked. Please allow popups and try again.", "error");
    }
  });
}

function showNotice(message, type) {
  formNotification.innerHTML = `<div class="notice ${type}">${message}</div>`;
}

function initScrollTop() {
  if (!scrollTopBtn) {
    return;
  }

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function animateMetrics() {
  const projectCountEl = document.getElementById("projects-count");
  const techCountEl = document.getElementById("tech-count");
  if (!projectCountEl || !techCountEl) {
    return;
  }

  const currentSkills = skillManager ? skillManager.getSkills() : (typeof skills !== 'undefined' ? skills : []);
  const targetProjects = Array.isArray(activeProjects) ? activeProjects.length : 0;
  const targetTech = Array.isArray(currentSkills) ? currentSkills.length : 0;

  function countUp(el, target) {
    const startValue = parseInt(el.textContent) || 0;
    if (startValue === target) return;
    
    const duration = 1200;
    const startTime = performance.now();

    function update(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      const current = Math.floor(easedProgress * target);
      el.textContent = String(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  countUp(projectCountEl, targetProjects);
  countUp(techCountEl, targetTech);
}

function updateTechCount() {
  const techCountEl = document.getElementById("tech-count");
  if (!techCountEl) return;

  animateMetrics();

  techCountEl.style.opacity = "0.72";
  setTimeout(() => {
    techCountEl.style.opacity = "1";
  }, 120);
  techCountEl.style.transition = "opacity 0.22s ease";
}

function initParticles() {
  const canvas = document.getElementById("particles-canvas");
  if (!canvas) {
    return;
  }

  if (reduceMotion) {
    canvas.style.display = "none";
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const stars = [];
  const shootingStars = [];
  const starCount = 55;

  function createShootingStar() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height * 0.5),
      len: Math.random() * 80 + 20,
      speed: Math.random() * 10 + 5,
      size: Math.random() * 1.5 + 0.5,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2
    };
  }
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  let mouse = { x: -1000, y: -1000 };

  function seed() {
    stars.length = 0;
    for (let i = 0; i < starCount; i += 1) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.8 + 0.4,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        glow: Math.random() * 0.6 + 0.2,
        baseGlow: Math.random() * 0.4 + 0.3,
        hue: Math.random() > 0.8 ? (Math.random() > 0.5 ? 210 : 260) : 0
      });
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render static stars
    stars.forEach((star) => {
      star.x += star.vx;
      star.y += star.vy;

      const dx = star.x - mouse.x;
      const dy = star.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const force = (150 - dist) / 150;
        star.x += (dx / dist) * force * 2.5;
        star.y += (dy / dist) * force * 2.5;
      }

      if (star.x < 0) star.x = canvas.width;
      if (star.x > canvas.width) star.x = 0;
      if (star.y < 0) star.y = canvas.height;
      if (star.y > canvas.height) star.y = 0;

      star.glow = star.baseGlow + Math.sin(Date.now() * 0.002 + star.x) * 0.2;

      ctx.beginPath();
      if (star.hue === 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.glow})`;
      } else {
        ctx.fillStyle = `hsla(${star.hue}, 80%, 85%, ${star.glow})`;
      }
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Render shooting stars
    if (Math.random() < 0.015 && shootingStars.length < 3) {
      shootingStars.push(createShootingStar());
    }

    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const s = shootingStars[i];
      s.x -= s.speed * Math.cos(s.angle);
      s.y += s.speed * Math.sin(s.angle);
      
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = s.size;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + Math.random() * 0.4})`;
      ctx.lineCap = 'round';
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.len * Math.cos(s.angle), s.y - s.len * Math.sin(s.angle));
      ctx.stroke();
      ctx.restore();

      if (s.x < -s.len || s.y > canvas.height + s.len) {
        shootingStars.splice(i, 1);
      }
    }

    requestAnimationFrame(render);
  }

  resize();
  seed();
  render();

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener("mouseleave", () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  window.addEventListener("resize", () => {
    resize();
    seed();
  });
}

function initSpaceParallax() {
  const solar = document.getElementById("solar-parallax");
  const starsCanvas = document.getElementById("particles-canvas");

  if (!solar || !starsCanvas) {
    return;
  }

  if (reduceMotion) {
    solar.style.transform = "translate(-50%, -50%)";
    return;
  }

  let targetX = 0;
  let targetY = 0;
  let targetScroll = 0;
  let currentX = 0;
  let currentY = 0;
  let currentScroll = 0;
  let rafId = 0;

  function renderParallax() {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    currentScroll += (targetScroll - currentScroll) * 0.08;

    solar.style.setProperty("--solar-mx", `${currentX}px`);
    solar.style.setProperty("--solar-my", `${currentY}px`);
    solar.style.setProperty("--solar-sy", `${currentScroll}px`);

    const starX = currentX * 0.35;
    const starY = currentY * 0.35 + currentScroll * 0.85;
    starsCanvas.style.transform = `translate3d(${starX}px, ${starY}px, 0)`;

    const active =
      Math.abs(targetX - currentX) > 0.1 ||
      Math.abs(targetY - currentY) > 0.1 ||
      Math.abs(targetScroll - currentScroll) > 0.1;

    if (active) {
      rafId = requestAnimationFrame(renderParallax);
    } else {
      rafId = 0;
    }
  }

  function queueRender() {
    if (!rafId) {
      rafId = requestAnimationFrame(renderParallax);
    }
  }

  window.addEventListener(
    "mousemove",
    (event) => {
      const nx = event.clientX / window.innerWidth - 0.5;
      const ny = event.clientY / window.innerHeight - 0.5;
      targetX = nx * 24;
      targetY = ny * 20;
      queueRender();
    },
    { passive: true }
  );

  window.addEventListener(
    "scroll",
    () => {
      targetScroll = Math.min(window.scrollY * 0.03, 26);
      queueRender();
    },
    { passive: true }
  );

  window.addEventListener(
    "deviceorientation",
    (event) => {
      if (typeof event.gamma !== "number" || typeof event.beta !== "number") {
        return;
      }

      targetX = Math.max(-12, Math.min(12, event.gamma)) * 0.9;
      targetY = Math.max(-12, Math.min(12, event.beta - 45)) * 0.55;
      queueRender();
    },
    { passive: true }
  );
}

function initModalEvents() {
  if (!modal || !modalClose) {
    return;
  }

  modal.addEventListener("click", (event) => {
    if (event.target.dataset.close === "true") {
      closeModal();
    }
  });

  modalClose.addEventListener("click", closeModal);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("open")) {
      closeModal();
    }
  });
}



async function initApp() {
  initTyping();

  if (skillManager && typeof skillManager.subscribe === "function") {
    skillManager.subscribe(() => {
      updateTechCount();
      renderOrbitSystem();
    });
  }

  renderOrbitSystem();
  window.addEventListener("resize", renderOrbitSystem);
  initResponsiveLayout();
  await loadProjectsFromGithub();
  renderProjects();
  initRevealOnScroll();
  initNavbar();
  initHamburger();
  initEmailLinkMode();
  validateContactForm();
  initScrollTop();
  animateMetrics();
  setTimeout(animateMetrics, 800);
  window.addEventListener("pageshow", animateMetrics, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      animateMetrics();
    }
  });
  initParticles();
  initSpaceParallax();
  initModalEvents();

}

initApp();
