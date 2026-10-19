"use strict";

// Shared functionality: footer year and persistent dark/light mode.
const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

const themeToggle = document.querySelector("#themeToggle");
let savedTheme = null;
try {
  savedTheme = localStorage.getItem("portfolio-theme");
} catch (error) {
  // The toggle still works when browser storage is unavailable.
}
let theme = savedTheme === "dark" ? "dark" : "light";
function applyTheme() {
  document.documentElement.setAttribute("data-bs-theme", theme);
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
    themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
    themeToggle.hidden = false;
  }
}
applyTheme();
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    theme = theme === "light" ? "dark" : "light";
    applyTheme();
    try {
      localStorage.setItem("portfolio-theme", theme);
    } catch (error) {
      // Browser privacy settings may prevent saving the preference.
    }
  });
}

// Only run project-loading code on the Projects page.
const projectsContainer = document.querySelector("#projectsContainer");
if (projectsContainer) {
  const status = document.querySelector("#projectStatus");
  const filters = document.querySelector("#projectFilters");
  const search = document.querySelector("#projectSearch");
  let projects = [];
  let selectedCategory = "All";
  let loaded = false;

  // textContent inserts plain text rather than interpreting JSON values as HTML.
  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderProjects() {
    if (!loaded) return;
    const query = search.value.trim().toLowerCase();
    const matches = projects.filter((project) => {
      const categoryMatches = selectedCategory === "All" || project.category === selectedCategory;
      const searchableText = [project.title, project.description, project.category, ...project.technologies].join(" ").toLowerCase();
      return categoryMatches && searchableText.includes(query);
    });
    projectsContainer.replaceChildren();
    matches.forEach((project) => {
      const column = element("div", "col-md-6 col-lg-4");
      const card = element("article", "card h-100");
      const body = element("div", "card-body d-flex flex-column");
      body.append(element("span", "badge category-badge align-self-start mb-3", project.category));
      body.append(element("h2", "h4", project.title));
      body.append(element("p", "mb-4", project.description));
      const technologies = element("div", "d-flex flex-wrap gap-2 mt-auto");
      technologies.setAttribute("aria-label", "Technologies used");
      project.technologies.forEach((technology) => {
        technologies.append(element("span", "badge tech-badge", technology));
      });
      body.append(technologies);
      card.append(body);
      column.append(card);
      projectsContainer.append(column);
    });
    status.textContent = matches.length
      ? `Showing ${matches.length} of ${projects.length} projects.`
      : "No projects match your selection. Try another category or search term.";
  }

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    selectedCategory = button.dataset.category;
    filters.querySelectorAll("button").forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    renderProjects();
  });
  search.addEventListener("input", renderProjects);

  async function loadProjects() {
    try {
      const response = await fetch("data/projects.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // response.json() converts JSON text into JavaScript objects.
      projects = await response.json();
      if (!Array.isArray(projects) || !projects.every((project) =>
        typeof project.title === "string" && typeof project.category === "string" &&
        typeof project.description === "string" && Array.isArray(project.technologies) &&
        project.technologies.every((technology) => typeof technology === "string")
      )) throw new Error("Invalid project data");
      loaded = true;
      renderProjects();
    } catch (error) {
      status.textContent = "Projects could not load. Run this website through Live Server and check that data/projects.json exists. Refresh to try again.";
      status.classList.add("alert", "alert-danger");
      console.error("Project loading failed:", error);
    }
  }
  loadProjects();
}
