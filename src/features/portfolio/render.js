// Portfolio DOM generation from embeddings data

import state from '../../core/state.js';

// Render the full portfolio into the container
export function renderPortfolio(container, data) {
  if (!container || !data) {
    console.error('[render] Missing container or data');
    return;
  }

  container.innerHTML = '';

  // Profile section
  if (data.personal) {
    container.appendChild(createProfileSection(data.personal, data.current));
  }

  // Skills section
  if (data.personal?.skills?.length) {
    container.appendChild(createSkillsSection(data.personal.skills));
  }

  // Experience section
  if (data.experience?.length) {
    container.appendChild(createExperienceSection(data.experience));
  }

  // Projects section
  if (data.projects?.length) {
    container.appendChild(createProjectsSection(data.projects));
  }

  // Education section
  if (data.education?.length) {
    container.appendChild(createEducationSection(data.education));
  }

  // Languages section
  if (data.personal?.languages) {
    container.appendChild(createLanguagesSection(data.personal.languages));
  }

  // Footer
  if (data.footer) {
    container.appendChild(createFooter(data.footer));
  }

  // Wire up section accordions
  initAccordions();
}

function createCurrentGroup(label, items) {
  const group = document.createElement('div');
  group.className = 'portfolio__current-group';

  const heading = document.createElement('h3');
  heading.className = 'portfolio__group-label';
  heading.textContent = label;
  group.appendChild(heading);

  const list = document.createElement('ul');
  list.className = 'portfolio__current-list';
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'portfolio__current-item';
    li.textContent = item;
    list.appendChild(li);
  });
  group.appendChild(list);
  return group;
}

// Create profile/summary section
function createProfileSection(personal, current) {
  const section = document.createElement('section');
  section.className = 'portfolio__section portfolio__profile';
  section.id = 'summary-container';
  section.setAttribute('data-chunk', 'summary');

  const srHeading = document.createElement('h2');
  srHeading.className = 'visually-hidden';
  srHeading.textContent = `About ${personal.name.split(' ')[0]}`;
  section.appendChild(srHeading);

  const avatar = document.createElement('img');
  avatar.className = 'portfolio__avatar';
  avatar.src = 'res/img/profile_circle_2_bw_sm.webp';
  avatar.alt = `Photo of ${personal.name}`;
  avatar.loading = 'lazy';

  const name = document.createElement('p');
  name.className = 'portfolio__name';
  name.textContent = personal.name;

  const title = document.createElement('p');
  title.className = 'portfolio__title-text';
  title.textContent = personal.title;

  const identity = document.createElement('div');
  identity.className = 'portfolio__identity';
  identity.appendChild(avatar);
  identity.appendChild(name);
  identity.appendChild(title);
  section.appendChild(identity);

  // Current: working on / thinking about + AI teaser
  if (current) {
    const currentEl = document.createElement('div');
    currentEl.className = 'portfolio__current';
    currentEl.id = 'current-container';

    const groups = document.createElement('div');
    groups.className = 'portfolio__current-groups';
    if (current.working?.length) groups.appendChild(createCurrentGroup('Working on', current.working));
    if (current.thinking?.length) groups.appendChild(createCurrentGroup('Thinking about', current.thinking));
    currentEl.appendChild(groups);

    const teaser = document.createElement('button');
    teaser.className = 'portfolio__ai-teaser';
    teaser.id = 'ai-teaser-btn';
    teaser.type = 'button';
    teaser.innerHTML = '<span class="portfolio__ai-teaser-badge">Experimental</span><span class="portfolio__ai-teaser-text">This portfolio runs an AI — entirely in your browser, zero servers</span><i data-feather="arrow-right"></i>';
    currentEl.appendChild(teaser);

    section.appendChild(currentEl);
  }

  const summaryLabel = document.createElement('h3');
  summaryLabel.className = 'portfolio__group-label';
  summaryLabel.textContent = 'Summary';
  section.appendChild(summaryLabel);

  const summary = document.createElement('p');
  summary.className = 'portfolio__summary';
  summary.textContent = personal.summary;
  section.appendChild(summary);

  return section;
}

function createContactLink(href, icon, text, external = false) {
  const a = document.createElement('a');
  a.className = 'portfolio__contact-link';
  a.href = href;
  a.innerHTML = `<i data-feather="${icon}"></i> ${text}`;
  if (external) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  return a;
}

// Skills section
function createSkillsSection(skills) {
  const section = document.createElement('section');
  section.className = 'portfolio__section';
  section.id = 'skills-container';
  section.setAttribute('aria-label', 'Skills');

  const heading = document.createElement('h2');
  heading.className = 'portfolio__section-title';
  const skillsBtn = document.createElement('button');
  skillsBtn.className = 'portfolio__section-btn';
  skillsBtn.setAttribute('aria-expanded', 'false');
  skillsBtn.setAttribute('aria-controls', 'skills-body');
  skillsBtn.textContent = 'Skills';
  heading.appendChild(skillsBtn);
  section.appendChild(heading);

  const body = document.createElement('div');
  body.id = 'skills-body';
  body.className = 'portfolio__section-body';
  body.hidden = true;

  skills.forEach(skill => {
    const chunk = document.createElement('div');
    chunk.className = 'portfolio__chunk portfolio__skill';
    chunk.setAttribute('data-chunk', `skill-${skill.category.toLowerCase().replace(/\s+/g, '-')}`);

    const category = document.createElement('h3');
    category.className = 'portfolio__skill-category';
    category.textContent = skill.category;
    chunk.appendChild(category);

    const desc = document.createElement('p');
    desc.className = 'portfolio__skill-description';
    desc.textContent = skill.description;
    chunk.appendChild(desc);

    if (skill.tools?.length) {
      const toolsList = document.createElement('ul');
      toolsList.className = 'portfolio__skill-tools';
      toolsList.setAttribute('aria-label', `${skill.category} tools`);
      skill.tools.forEach(tool => {
        const li = document.createElement('li');
        li.className = 'portfolio__skill-tool';
        li.textContent = tool;
        toolsList.appendChild(li);
      });
      chunk.appendChild(toolsList);
    }

    body.appendChild(chunk);
  });

  section.appendChild(body);
  return section;
}

// Languages section
function createLanguagesSection(languages) {
  const section = document.createElement('section');
  section.className = 'portfolio__section';
  section.id = 'languages-container';
  section.setAttribute('aria-label', 'Languages');

  const heading = document.createElement('h2');
  heading.className = 'portfolio__section-title';
  const langsBtn = document.createElement('button');
  langsBtn.className = 'portfolio__section-btn';
  langsBtn.setAttribute('aria-expanded', 'false');
  langsBtn.setAttribute('aria-controls', 'languages-body');
  langsBtn.textContent = 'Languages';
  heading.appendChild(langsBtn);
  section.appendChild(heading);

  const body = document.createElement('div');
  body.id = 'languages-body';
  body.className = 'portfolio__section-body';
  body.hidden = true;

  const langContainer = document.createElement('div');
  langContainer.className = 'portfolio__chunk portfolio__languages';
  langContainer.setAttribute('data-chunk', 'languages');

  Object.entries(languages).forEach(([lang, level]) => {
    const langEl = document.createElement('span');
    langEl.className = 'portfolio__language';
    langEl.innerHTML = `<span class="portfolio__language-name">${capitalize(lang)}</span> <span class="portfolio__language-level">(${level})</span>`;
    langContainer.appendChild(langEl);
  });

  body.appendChild(langContainer);
  section.appendChild(body);
  return section;
}

// Experience section
function createExperienceSection(experience) {
  const section = document.createElement('section');
  section.className = 'portfolio__section';
  section.id = 'experience-container';
  section.setAttribute('aria-label', 'Work experience');

  const heading = document.createElement('h2');
  heading.className = 'portfolio__section-title';
  const expBtn = document.createElement('button');
  expBtn.className = 'portfolio__section-btn';
  expBtn.setAttribute('aria-expanded', 'false');
  expBtn.setAttribute('aria-controls', 'experience-body');
  expBtn.textContent = 'Experience';
  heading.appendChild(expBtn);
  section.appendChild(heading);

  const body = document.createElement('div');
  body.id = 'experience-body';
  body.className = 'portfolio__section-body';
  body.hidden = true;

  experience.forEach(exp => {
    const chunk = document.createElement('div');
    chunk.className = 'portfolio__chunk portfolio__entry';
    chunk.setAttribute('data-chunk', `experience-${exp.company.toLowerCase().replace(/\s+/g, '-')}`);

    const title = document.createElement('h3');
    title.className = 'portfolio__entry-title';
    title.textContent = exp.title;
    chunk.appendChild(title);

    if (exp.companyUrl) {
      const company = document.createElement('a');
      company.className = 'portfolio__entry-company';
      company.href = exp.companyUrl;
      company.target = '_blank';
      company.rel = 'noopener noreferrer';
      company.textContent = exp.company;
      chunk.appendChild(company);
    } else {
      const company = document.createElement('p');
      company.className = 'portfolio__entry-company';
      company.textContent = exp.company;
      chunk.appendChild(company);
    }

    const meta = document.createElement('p');
    meta.className = 'portfolio__entry-meta';
    meta.textContent = `${exp.location} | ${exp.period}`;
    chunk.appendChild(meta);

    if (Array.isArray(exp.description)) {
      const ul = document.createElement('ul');
      ul.className = 'portfolio__entry-description';
      exp.description.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      });
      chunk.appendChild(ul);
    } else {
      const desc = document.createElement('p');
      desc.className = 'portfolio__entry-description';
      desc.textContent = exp.description;
      chunk.appendChild(desc);
    }

    body.appendChild(chunk);
  });

  section.appendChild(body);
  return section;
}

// Education section
function createEducationSection(education) {
  const section = document.createElement('section');
  section.className = 'portfolio__section';
  section.id = 'education-container';
  section.setAttribute('aria-label', 'Education');

  const heading = document.createElement('h2');
  heading.className = 'portfolio__section-title';
  const eduBtn = document.createElement('button');
  eduBtn.className = 'portfolio__section-btn';
  eduBtn.setAttribute('aria-expanded', 'false');
  eduBtn.setAttribute('aria-controls', 'education-body');
  eduBtn.textContent = 'Education';
  heading.appendChild(eduBtn);
  section.appendChild(heading);

  const body = document.createElement('div');
  body.id = 'education-body';
  body.className = 'portfolio__section-body';
  body.hidden = true;

  education.forEach(edu => {
    const chunk = document.createElement('div');
    chunk.className = 'portfolio__chunk portfolio__entry';
    chunk.setAttribute('data-chunk', `education-${edu.institution.toLowerCase().replace(/\s+/g, '-')}`);

    const degree = document.createElement('h3');
    degree.className = 'portfolio__entry-title';
    degree.textContent = edu.degree;
    chunk.appendChild(degree);

    if (edu.institutionUrl) {
      const inst = document.createElement('a');
      inst.className = 'portfolio__entry-company';
      inst.href = edu.institutionUrl;
      inst.target = '_blank';
      inst.rel = 'noopener noreferrer';
      inst.textContent = edu.institution;
      chunk.appendChild(inst);
    } else {
      const inst = document.createElement('p');
      inst.className = 'portfolio__entry-company';
      inst.textContent = edu.institution;
      chunk.appendChild(inst);
    }

    const meta = document.createElement('p');
    meta.className = 'portfolio__entry-meta';
    meta.textContent = `${edu.location} | ${edu.period}`;
    chunk.appendChild(meta);

    if (edu.focus) {
      const focus = document.createElement('p');
      focus.className = 'portfolio__entry-description';
      focus.textContent = edu.focus;
      chunk.appendChild(focus);
    }

    body.appendChild(chunk);
  });

  section.appendChild(body);
  return section;
}

// Projects section
function createProjectsSection(projects) {
  const section = document.createElement('section');
  section.className = 'portfolio__section';
  section.id = 'projects-container';
  section.setAttribute('aria-label', 'Projects');

  const heading = document.createElement('h2');
  heading.className = 'portfolio__section-title';
  const projBtn = document.createElement('button');
  projBtn.className = 'portfolio__section-btn';
  projBtn.setAttribute('aria-expanded', 'false');
  projBtn.setAttribute('aria-controls', 'projects-body');
  projBtn.textContent = 'Projects';
  heading.appendChild(projBtn);
  section.appendChild(heading);

  const body = document.createElement('div');
  body.id = 'projects-body';
  body.className = 'portfolio__section-body';
  body.hidden = true;

  // Only show active projects by default
  const activeProjects = projects.filter(p => p.active);
  const inactiveProjects = projects.filter(p => !p.active);

  [...activeProjects, ...inactiveProjects].forEach(project => {
    const article = document.createElement('article');
    article.className = 'portfolio__project';
    article.id = `project-${project.id}`;
    article.setAttribute('data-chunk', `project-${project.id}`);
    article.setAttribute('data-project-id', project.id);

    // Summary panel (always visible, clickable)
    const summary = document.createElement('div');
    summary.className = 'portfolio__project-summary';
    summary.setAttribute('role', 'button');
    summary.setAttribute('tabindex', '0');
    summary.setAttribute('aria-expanded', 'false');
    summary.setAttribute('aria-controls', `project-details-${project.id}`);

    const titleRow = document.createElement('div');
    const projTitle = document.createElement('h3');
    projTitle.className = 'portfolio__project-title';
    projTitle.textContent = project.title;
    titleRow.appendChild(projTitle);

    const subtitle = document.createElement('p');
    subtitle.className = 'portfolio__project-subtitle';
    subtitle.textContent = project.subtitle;

    const yearBadge = document.createElement('span');
    yearBadge.className = 'portfolio__project-year';
    yearBadge.textContent = project.year;

    summary.appendChild(titleRow);
    summary.appendChild(subtitle);
    summary.appendChild(yearBadge);

    const shortDesc = document.createElement('p');
    shortDesc.className = 'portfolio__project-short';
    shortDesc.textContent = project.shortDescription;
    summary.appendChild(shortDesc);

    // Skills tags
    if (project.skills?.length) {
      const skillsList = document.createElement('ul');
      skillsList.className = 'portfolio__project-skills';
      skillsList.setAttribute('aria-label', 'Project skills');
      project.skills.forEach(skill => {
        const li = document.createElement('li');
        li.className = 'portfolio__project-skill-tag';
        li.textContent = skill;
        skillsList.appendChild(li);
      });
      summary.appendChild(skillsList);
    }

    article.appendChild(summary);

    // "Read full project" button — only for projects with content beyond the summary
    const hasDetails = project.contentBlocks?.some(b => b.id !== 'overview');
    if (hasDetails) {
      article.setAttribute('data-has-details', 'true');
      const readFullBtn = document.createElement('button');
      readFullBtn.className = 'portfolio__read-full-btn';
      readFullBtn.type = 'button';
      readFullBtn.textContent = 'Read full project';
      readFullBtn.hidden = true;
      article.appendChild(readFullBtn);
    }

    // Details (visually hidden, accessible to SR)
    const details = document.createElement('div');
    details.className = 'portfolio__project-details portfolio__project-details--collapsed';
    details.id = `project-details-${project.id}`;
    details.setAttribute('role', 'region');
    details.setAttribute('aria-label', `${project.title} details`);

    if (project.contentBlocks?.length) {
      project.contentBlocks.forEach(block => {
        if (block.id === 'overview') return; // shortDescription covers it

        const blockEl = document.createElement('div');
        blockEl.className = 'portfolio__content-block';
        blockEl.setAttribute('data-chunk', `project-${project.id}-${block.id}`);

        if (block.heading) {
          const blockHeading = document.createElement('h4');
          blockHeading.className = 'portfolio__content-heading';
          blockHeading.textContent = block.heading;
          blockEl.appendChild(blockHeading);
        }

        if (block.text) {
          const blockText = document.createElement('p');
          blockText.className = 'portfolio__content-text';
          blockText.textContent = block.text;
          blockEl.appendChild(blockText);
        }

        if (block.image) {
          const imgWrap = document.createElement('figure');
          imgWrap.className = 'portfolio__content-image';

          const img = document.createElement('img');
          img.className = 'portfolio__content-img';
          img.src = block.image.src;
          img.alt = block.image.alt || '';
          img.loading = 'lazy';
          if (block.image.class) {
            block.image.class.split(' ').forEach(c => img.classList.add(c));
          }
          imgWrap.appendChild(img);

          if (block.image.caption) {
            const caption = document.createElement('figcaption');
            caption.className = 'portfolio__content-caption';
            caption.textContent = block.image.caption;
            imgWrap.appendChild(caption);
          }

          if (block.image.link) {
            const link = document.createElement('a');
            link.className = 'portfolio__content-link';
            link.href = block.image.link.href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = block.image.caption || 'View';
            link.innerHTML += ' <i data-feather="external-link"></i>';
            imgWrap.appendChild(link);
          }

          blockEl.appendChild(imgWrap);
        }

        details.appendChild(blockEl);
      });
    }

    if (!project.contentBlocks?.some(b => b.id !== 'overview')) {
      const empty = document.createElement('p');
      empty.className = 'portfolio__empty-state';
      empty.textContent = "That's all for now, folks.";
      details.appendChild(empty);
    }

    article.appendChild(details);
    body.appendChild(article);
  });

  section.appendChild(body);
  return section;
}

// Footer
function createFooter(footer) {
  const footerEl = document.createElement('footer');
  footerEl.className = 'portfolio__footer';
  footerEl.setAttribute('role', 'contentinfo');

  if (footer.contact) {
    const links = document.createElement('div');
    links.className = 'portfolio__footer-links';

    if (footer.contact.email) {
      links.appendChild(createFooterLink(`mailto:${footer.contact.email}`, 'mail', 'Email'));
    }
    if (footer.contact.linkedin) {
      links.appendChild(createFooterLink(footer.contact.linkedin, 'linkedin', 'LinkedIn'));
    }
    if (footer.contact.github) {
      links.appendChild(createFooterLink(footer.contact.github, 'github', 'GitHub'));
    }
    footerEl.appendChild(links);
  }

  if (footer.copyright) {
    const copyright = document.createElement('p');
    copyright.className = 'portfolio__copyright';
    copyright.textContent = footer.copyright;
    footerEl.appendChild(copyright);
  }

  return footerEl;
}

function createFooterLink(href, icon, text) {
  const a = document.createElement('a');
  a.className = 'portfolio__footer-link';
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.innerHTML = `<i data-feather="${icon}"></i> ${text}`;
  return a;
}

// Show/hide chunks for search results or project expansion
export function setVisibleChunks(chunkIds, mode = 'filter', query = '') {
  const allChunks = document.querySelectorAll('[data-chunk]');
  const closeBar = document.getElementById('close-bar');
  const closeLabel = document.getElementById('close-view-label');
  const inputBar = document.getElementById('input-bar');

  if (!chunkIds || chunkIds.length === 0) {
    // Reset: show all chunks, hide project details
    allChunks.forEach(chunk => {
      chunk.classList.remove('portfolio__chunk--hidden');
      chunk.classList.remove('portfolio__chunk--sr-only');
    });
    document.querySelectorAll('.portfolio__project-details').forEach(d => {
      d.classList.add('portfolio__project-details--collapsed');
    });
    document.querySelectorAll('.portfolio__project-summary').forEach(s => {
      s.hidden = false;
      s.setAttribute('aria-expanded', 'false');
      s.removeAttribute('data-search-locked');
    });
    document.querySelectorAll('.portfolio__read-full-btn').forEach(btn => { btn.hidden = true; });
    // Close all section accordions, show all sections and their headings
    document.querySelectorAll('.portfolio__section').forEach(s => { s.hidden = false; });
    document.querySelectorAll('.portfolio__section-title').forEach(h => { h.hidden = false; });
    document.querySelectorAll('.portfolio__section-btn').forEach(btn => {
      btn.setAttribute('aria-expanded', 'false');
      const body = document.getElementById(btn.getAttribute('aria-controls'));
      if (body) body.hidden = true;
    });
    if (closeBar) closeBar.hidden = true;
    if (inputBar) inputBar.hidden = false;
    state.expandedProject = null;
    state.searchActive = false;
    return;
  }

  // Hide input bar, show close bar with mode label
  if (closeBar) closeBar.hidden = false;
  if (closeLabel) {
    closeLabel.textContent = mode === 'project' ? 'Project View' : query ? `"${query}"` : 'Vector Search';
  }
  if (inputBar) inputBar.hidden = true;

  if (mode === 'project') {
    // Project expansion: show only the target project's chunks
    allChunks.forEach(chunk => {
      const chunkId = chunk.getAttribute('data-chunk');
      if (chunkIds.includes(chunkId)) {
        chunk.classList.remove('portfolio__chunk--hidden');
        chunk.classList.remove('portfolio__chunk--sr-only');
      } else {
        chunk.classList.add('portfolio__chunk--hidden');
      }
    });

    // Un-hide all nested chunks inside the visible project (content blocks within details)
    const projectArticle = document.querySelector(`[data-chunk="${chunkIds[0]}"]`);
    if (projectArticle) {
      projectArticle.querySelectorAll('[data-chunk]').forEach(child => {
        child.classList.remove('portfolio__chunk--hidden');
        child.classList.remove('portfolio__chunk--sr-only');
      });
    }

    // Expand the project details
    const projectId = chunkIds[0]?.replace('project-', '');
    if (projectId) {
      const details = document.getElementById(`project-details-${projectId}`);
      const summary = document.querySelector(`[data-project-id="${projectId}"] .portfolio__project-summary`);
      if (details) details.classList.remove('portfolio__project-details--collapsed');
      if (summary) summary.setAttribute('aria-expanded', 'true');
      state.expandedProject = projectId;
    }

    // Hide Projects h2, show projects-body so the article is accessible
    const projectsHeading = document.querySelector('#projects-container .portfolio__section-title');
    if (projectsHeading) projectsHeading.hidden = true;
    const projectsBody = document.getElementById('projects-body');
    if (projectsBody) projectsBody.hidden = false;
  } else {
    // Search filter: show matching chunks
    allChunks.forEach(chunk => {
      const chunkId = chunk.getAttribute('data-chunk');
      if (chunkIds.includes(chunkId)) {
        chunk.classList.remove('portfolio__chunk--hidden');
        chunk.classList.remove('portfolio__chunk--sr-only');
      } else {
        chunk.classList.add('portfolio__chunk--hidden');
      }
    });
    state.searchActive = true;

    document.querySelectorAll('.portfolio__project').forEach(article => {
      if (article.classList.contains('portfolio__chunk--hidden')) return;

      const projectId = article.getAttribute('data-project-id');
      const details = article.querySelector('.portfolio__project-details');
      const summary = article.querySelector('.portfolio__project-summary');
      if (!details || !summary) return;

      const overviewMatched = chunkIds.includes(`project-overview-${projectId}`);
      const matchedBlocks = Array.from(details.querySelectorAll('[data-chunk]')).filter(
        c => !c.classList.contains('portfolio__chunk--hidden')
      );
      const hasBlocks = matchedBlocks.length > 0;
      console.log(`[render] project=${projectId} overviewMatched=${overviewMatched} hasBlocks=${hasBlocks} matchedBlocks=${matchedBlocks.map(b => b.getAttribute('data-chunk'))}`);
      if (hasBlocks) console.log(`[render] details expanded for ${projectId}`);
      else console.log(`[render] summary-only shown for ${projectId}`);

      // Project title always shows for any matched project article
      summary.hidden = false;

      // Show "Read full project" if some blocks of this project are hidden
      const readFullBtn = article.querySelector('.portfolio__read-full-btn');
      if (readFullBtn) {
        const allBlocks = details.querySelectorAll('[data-chunk]');
        const someHidden = Array.from(allBlocks).some(c => c.classList.contains('portfolio__chunk--hidden'));
        readFullBtn.hidden = !someHidden;
      }

      if (hasBlocks) {
        // Blocks matched: expand details
        details.classList.remove('portfolio__project-details--collapsed');
        summary.setAttribute('aria-expanded', 'true');
        // Lock toggle if overview also matched (already the right view)
        if (overviewMatched) {
          summary.setAttribute('data-search-locked', 'true');
        } else {
          summary.removeAttribute('data-search-locked');
        }
      } else {
        // Overview only: collapsed, clickable to enter project mode
        summary.setAttribute('aria-expanded', 'false');
        summary.removeAttribute('data-search-locked');
      }
    });
  }

  // Open sections with visible chunks, hide sections with none
  document.querySelectorAll('.portfolio__section-btn').forEach(btn => {
    const body = document.getElementById(btn.getAttribute('aria-controls'));
    if (!body) return;
    const chunks = body.querySelectorAll('[data-chunk]');
    const hasVisible = chunks.length === 0 || Array.from(chunks).some(c => !c.classList.contains('portfolio__chunk--hidden'));
    btn.setAttribute('aria-expanded', hasVisible ? 'true' : 'false');
    body.hidden = !hasVisible;
    btn.closest('.portfolio__section').hidden = !hasVisible;
  });

  // Re-render feather icons for any newly visible elements
  if (window.feather) {
    window.feather.replace();
  }
}

function initAccordions() {
  document.querySelectorAll('.portfolio__section-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      // Close all sections
      document.querySelectorAll('.portfolio__section-btn').forEach(b => {
        b.setAttribute('aria-expanded', 'false');
        const body = document.getElementById(b.getAttribute('aria-controls'));
        if (body) body.hidden = true;
      });
      // Open clicked section (if it was closed)
      if (!expanded) {
        btn.setAttribute('aria-expanded', 'true');
        const body = document.getElementById(btn.getAttribute('aria-controls'));
        if (body) body.hidden = false;
      }
    });
  });
}

// Utility
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
