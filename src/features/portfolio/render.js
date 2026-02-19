// Portfolio DOM generation from embeddings data

import state from '../../core/state.js';

// Render the full portfolio into the container
export function renderPortfolio(container, data) {
  if (!container || !data) {
    console.error('[render] Missing container or data');
    return;
  }

  console.log('[render] Rendering portfolio');
  container.innerHTML = '';

  // Profile section
  if (data.personal) {
    container.appendChild(createProfileSection(data.personal));
  }

  // Skills section
  if (data.personal?.skills?.length) {
    container.appendChild(createSkillsSection(data.personal.skills));
  }

  // Languages section
  if (data.personal?.languages) {
    container.appendChild(createLanguagesSection(data.personal.languages));
  }

  // Experience section
  if (data.experience?.length) {
    container.appendChild(createExperienceSection(data.experience));
  }

  // Education section
  if (data.education?.length) {
    container.appendChild(createEducationSection(data.education));
  }

  // Projects section
  if (data.projects?.length) {
    container.appendChild(createProjectsSection(data.projects));
  }

  // Footer
  if (data.footer) {
    container.appendChild(createFooter(data.footer));
  }
}

// Create profile/summary section
function createProfileSection(personal) {
  const section = document.createElement('section');
  section.className = 'portfolio__section portfolio__profile';
  section.id = 'summary-container';
  section.setAttribute('data-chunk', 'summary');
  section.setAttribute('aria-label', 'Profile summary');

  const avatar = document.createElement('img');
  avatar.className = 'portfolio__avatar';
  avatar.src = 'res/img/profile_circle_2_bw_sm.webp';
  avatar.alt = `Photo of ${personal.name}`;
  avatar.loading = 'lazy';
  section.appendChild(avatar);

  const name = document.createElement('h2');
  name.className = 'portfolio__name';
  name.textContent = personal.name;
  section.appendChild(name);

  const title = document.createElement('p');
  title.className = 'portfolio__title-text';
  title.textContent = personal.title;
  section.appendChild(title);

  const summary = document.createElement('p');
  summary.className = 'portfolio__summary';
  summary.textContent = personal.summary;
  section.appendChild(summary);

  // Contact links
  const contact = document.createElement('div');
  contact.className = 'portfolio__contact';

  if (personal.email) {
    contact.appendChild(createContactLink(`mailto:${personal.email}`, 'mail', personal.email));
  }
  if (personal.linkedin) {
    contact.appendChild(createContactLink(personal.linkedin, 'linkedin', 'LinkedIn', true));
  }
  if (personal.location) {
    const loc = document.createElement('span');
    loc.className = 'portfolio__contact-link';
    loc.innerHTML = `<i data-feather="map-pin"></i> ${personal.location}`;
    contact.appendChild(loc);
  }

  section.appendChild(contact);
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
  heading.textContent = 'Skills';
  section.appendChild(heading);

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

    section.appendChild(chunk);
  });

  return section;
}

// Languages section  
function createLanguagesSection(languages) {
  const section = document.createElement('section');
  section.className = 'portfolio__section';
  section.id = 'languages-container';
  section.setAttribute('data-chunk', 'languages');
  section.setAttribute('aria-label', 'Languages');

  const heading = document.createElement('h2');
  heading.className = 'portfolio__section-title';
  heading.textContent = 'Languages';
  section.appendChild(heading);

  const langContainer = document.createElement('div');
  langContainer.className = 'portfolio__languages';

  Object.entries(languages).forEach(([lang, level]) => {
    const langEl = document.createElement('span');
    langEl.className = 'portfolio__language';
    langEl.innerHTML = `<span class="portfolio__language-name">${capitalize(lang)}</span> <span class="portfolio__language-level">(${level})</span>`;
    langContainer.appendChild(langEl);
  });

  section.appendChild(langContainer);
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
  heading.textContent = 'Experience';
  section.appendChild(heading);

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

    const desc = document.createElement('p');
    desc.className = 'portfolio__entry-description';
    desc.textContent = exp.description;
    chunk.appendChild(desc);

    section.appendChild(chunk);
  });

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
  heading.textContent = 'Education';
  section.appendChild(heading);

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

    section.appendChild(chunk);
  });

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
  heading.textContent = 'Projects';
  section.appendChild(heading);

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

    // Details (visually hidden, accessible to SR)
    const details = document.createElement('div');
    details.className = 'portfolio__project-details portfolio__project-details--collapsed';
    details.id = `project-details-${project.id}`;
    details.setAttribute('role', 'region');
    details.setAttribute('aria-label', `${project.title} details`);

    if (project.contentBlocks?.length) {
      project.contentBlocks.forEach(block => {
        // Skip overview block since shortDescription covers it
        if (block.id === 'overview') return;

        const blockEl = document.createElement('div');
        blockEl.className = 'portfolio__content-block';

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

    article.appendChild(details);
    section.appendChild(article);
  });

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
export function setVisibleChunks(chunkIds, mode = 'filter') {
  const allChunks = document.querySelectorAll('[data-chunk]');
  const closeBtn = document.getElementById('close-view-btn');
  const inputBar = document.getElementById('input-bar');

  if (!chunkIds || chunkIds.length === 0) {
    // Reset: show all, hide details
    allChunks.forEach(chunk => {
      chunk.classList.remove('portfolio__chunk--hidden');
      chunk.classList.remove('portfolio__chunk--sr-only');
    });
    // Collapse all project details
    document.querySelectorAll('.portfolio__project-details').forEach(d => {
      d.classList.add('portfolio__project-details--collapsed');
    });
    document.querySelectorAll('.portfolio__project-summary').forEach(s => {
      s.setAttribute('aria-expanded', 'false');
    });
    if (closeBtn) closeBtn.hidden = true;
    if (inputBar) inputBar.hidden = false;
    state.expandedProject = null;
    state.searchActive = false;
    return;
  }

  // Hide input bar, show close button
  if (closeBtn) closeBtn.hidden = false;
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

    // Expand the project details
    const projectId = chunkIds[0]?.replace('project-', '');
    if (projectId) {
      const details = document.getElementById(`project-details-${projectId}`);
      const summary = document.querySelector(`[data-project-id="${projectId}"] .portfolio__project-summary`);
      if (details) details.classList.remove('portfolio__project-details--collapsed');
      if (summary) summary.setAttribute('aria-expanded', 'true');
      state.expandedProject = projectId;
    }
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
  }

  // Re-render feather icons for any newly visible elements
  if (window.feather) {
    window.feather.replace();
  }
}

// Utility
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
