// Browser history navigation for portfolio

import state from '../../core/state.js';
import { setVisibleChunks } from '../portfolio/render.js';
import { resultsToChunkIds, searchEmbeddings } from '../portfolio/search.js';
import { setExperimentalMode } from './header.js';
import { closeExpandedView, initChat } from './input.js';

function buildNavigationState() {
    return {
        experimentalMode: state.experimentalMode,
        expandedProject: state.expandedProject,
        searchActive: state.searchActive,
        searchQuery: state.searchQuery || ''
    };
}

function getBasePathname() {
    const baseHref = document.querySelector('base')?.href;
    if (!baseHref) return '/';

    const { pathname } = new URL(baseHref);
    return pathname.endsWith('/') ? pathname.slice(0, -1) || '/' : pathname;
}

function getRelativePathname(pathname = window.location.pathname) {
    const basePathname = getBasePathname();

    if (basePathname !== '/' && pathname.startsWith(basePathname)) {
        const sliced = pathname.slice(basePathname.length);
        return sliced || '/';
    }

    return pathname || '/';
}

function buildRouteFromState(stateData) {
    if (stateData.experimentalMode) {
        return '/goma';
    }

    if (stateData.expandedProject) {
        return `/${encodeURIComponent(stateData.expandedProject)}`;
    }

    if (stateData.searchActive && stateData.searchQuery) {
        return `/search/${encodeURIComponent(stateData.searchQuery)}`;
    }

    return '/';
}

function buildUrlFromRoute(routePath) {
    const basePathname = getBasePathname();
    const normalizedBase = basePathname === '/' ? '' : basePathname;
    return `${normalizedBase}${routePath}`;
}

function parseLocationState(pathname = getRelativePathname()) {
    const relativePath = pathname || '/';
    const segments = relativePath.split('/').filter(Boolean).map(decodeURIComponent);

    if (segments[0] === 'goma') {
        return {
            experimentalMode: true,
            expandedProject: null,
            searchActive: false,
            searchQuery: ''
        };
    }

    if (segments[0] === 'search' && segments[1]) {
        return {
            experimentalMode: false,
            expandedProject: null,
            searchActive: true,
            searchQuery: segments.slice(1).join('/')
        };
    }

    if (segments[0]) {
        return {
            experimentalMode: false,
            expandedProject: segments[0],
            searchActive: false,
            searchQuery: ''
        };
    }

    return {
        experimentalMode: false,
        expandedProject: null,
        searchActive: false,
        searchQuery: ''
    };
}

async function applyNavigationState(stateData) {
    const nextState = {
        experimentalMode: Boolean(stateData?.experimentalMode),
        expandedProject: stateData?.expandedProject || null,
        searchActive: Boolean(stateData?.searchActive),
        searchQuery: stateData?.searchQuery || ''
    };

    if (state.experimentalMode !== nextState.experimentalMode) {
        setExperimentalMode(nextState.experimentalMode);
    }

    if (nextState.experimentalMode) {
        initChat();
        state.expandedProject = null;
        state.searchActive = false;
        state.searchQuery = '';
        return;
    }

    if (nextState.expandedProject) {
        setVisibleChunks([`project-${nextState.expandedProject}`], 'project');
        state.expandedProject = nextState.expandedProject;
        state.searchActive = false;
        state.searchQuery = '';

        const main = document.getElementById('main-content');
        if (main) main.scrollTop = 0;
        return;
    }

    if (nextState.searchActive && nextState.searchQuery) {
        const results = await searchEmbeddings(nextState.searchQuery, { minWords: 1 });
        const chunkIds = resultsToChunkIds(results);
        setVisibleChunks(chunkIds, 'filter', nextState.searchQuery);
        state.searchActive = true;
        state.searchQuery = nextState.searchQuery;
        state.expandedProject = null;

        const statusEl = document.getElementById('search-status-content') || document.getElementById('search-status');
        if (statusEl) statusEl.textContent = `${results.length} result${results.length === 1 ? '' : 's'} found`;

        const main = document.getElementById('main-content');
        if (main) main.scrollTop = 0;
        return;
    }

    closeExpandedView();
    setExperimentalMode(false);
}

// Initialize history navigation
export function initNavigation() {
    window.addEventListener('popstate', handlePopState);

    const routeState = parseLocationState();
    window.history.replaceState(routeState, '', buildUrlFromRoute(buildRouteFromState(routeState)));
    void applyNavigationState(routeState);
}

// Push navigation state to history
export function pushNavigationState() {
    const stateData = buildNavigationState();

    // Only push if state actually changed
    const currentState = window.history.state;
    if (currentState && JSON.stringify(currentState) === JSON.stringify(stateData)) {
        return;
    }

    window.history.pushState(stateData, '', buildUrlFromRoute(buildRouteFromState(stateData)));
}

// Replace current history state without creating new entry
export function replaceNavigationState() {
    const stateData = buildNavigationState();
    window.history.replaceState(stateData, '', buildUrlFromRoute(buildRouteFromState(stateData)));
}

// Handle browser back/forward button
async function handlePopState(event) {
    const stateData = event.state || parseLocationState();
    await applyNavigationState(stateData);
}
