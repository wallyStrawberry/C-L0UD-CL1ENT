const profiles = [
  { name: 'Vanilla Plus', version: 'Fabric 1.21.1', glyph: 'VP' },
  { name: 'Sky Factory', version: 'Forge 1.20.1', glyph: 'SF' },
  { name: 'Adventure', version: 'Fabric 1.20.4', glyph: 'AD' }
];

const libraries = [
  { name: 'Sodium', description: 'Rendering optimization', source: 'Modrinth', type: 'Performance', glyph: 'S', visual: 'visual-perf', installs: '19.2M' },
  { name: 'Lithium', description: 'Game physics optimization', source: 'Modrinth', type: 'Performance', glyph: 'L', visual: 'visual-foliage', installs: '12.7M' },
  { name: 'Terrablender', description: 'Biome generation library', source: 'CurseForge', type: 'Library', glyph: 'T', visual: 'visual-map', installs: '48.1M' },
  { name: 'Iris Shaders', description: 'Shader pack loader', source: 'Modrinth', type: 'Shaders', glyph: 'I', visual: 'visual-shader', installs: '9.8M' },
  { name: 'Create', description: 'Aesthetic technology', source: 'CurseForge', type: 'Content', glyph: 'C', visual: 'visual-map', installs: '38.4M' },
  { name: 'Xaero’s Map', description: 'World map and minimap', source: 'CurseForge', type: 'Utility', glyph: 'X', visual: 'visual-foliage', installs: '27.5M' },
  { name: 'FerriteCore', description: 'Memory usage optimization', source: 'Modrinth', type: 'Performance', glyph: 'F', visual: 'visual-perf', installs: '8.1M' },
  { name: 'AppleSkin', description: 'Food information HUD', source: 'CurseForge', type: 'Utility', glyph: 'A', visual: 'visual-foliage', installs: '72.0M' }
];
const modpacks = [
  { name: 'Better MC', description: 'An expansive vanilla-plus adventure', source: 'CurseForge', type: 'Modpack', glyph: 'BM', visual: 'visual-foliage', installs: '6.2M' },
  { name: 'Fabulously Optimized', description: 'Smooth performance, zero compromises', source: 'Modrinth', type: 'Modpack', glyph: 'FO', visual: 'visual-perf', installs: '4.8M' },
  { name: 'Create: Arcane Engineering', description: 'Magic and machines, thoughtfully combined', source: 'CurseForge', type: 'Modpack', glyph: 'CA', visual: 'visual-map', installs: '1.7M' },
  { name: 'Simply Optimized', description: 'A lightweight pack for every machine', source: 'Modrinth', type: 'Modpack', glyph: 'SO', visual: 'visual-shader', installs: '920K' }
];

let selectedSource = 'All';
let selectedCategory = 'Mods';
let currentOffset = 0;
let loadingCatalog = false;
let liveItems = [];
let signedIn = false;
const profilesEl = document.querySelector('#profiles');
const gridEl = document.querySelector('#libraryGrid');
const toastEl = document.querySelector('#toast');
const loginBackdrop = document.querySelector('#loginBackdrop');
const browserMode = ['http:', 'https:'].includes(window.location.protocol);
if (browserMode) {
  document.body.classList.add('browser-mode');
  document.querySelector('#pageLabel').textContent = 'Discover';
  document.querySelector('#installLink').textContent = '↓ Install desktop app';
  document.querySelector('.hero-section').remove();
  document.querySelector('#accountButton').remove();
}

function renderProfiles() {
  profilesEl.innerHTML = profiles.map((profile, index) => `
    <button class="profile-item ${index === 0 ? 'active' : ''}" data-profile="${profile.name}">
      <span class="profile-glyph">${profile.glyph}</span>
      <span class="profile-info"><span class="profile-name">${profile.name}</span><span class="profile-version">${profile.version}</span></span>
    </button>`).join('');
  profilesEl.querySelectorAll('.profile-item').forEach(button => button.addEventListener('click', () => {
    profilesEl.querySelectorAll('.profile-item').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    document.querySelector('#profileTitle').textContent = button.dataset.profile;
    showToast(`${button.dataset.profile} profile selected`);
  }));
}

function renderLibraries() {
  const query = document.querySelector('#searchInput').value.toLowerCase();
  const fallbackItems = selectedCategory === 'Modpacks' ? modpacks : libraries.filter(item => selectedCategory === 'Mods' || item.type === selectedCategory);
  const items = liveItems.length ? [...liveItems, ...fallbackItems.filter(item => item.source === 'CurseForge')] : fallbackItems;
  const visible = items.filter(item => (selectedSource === 'All' || item.source === selectedSource) && `${item.name} ${item.description} ${item.type}`.toLowerCase().includes(query));
  gridEl.innerHTML = visible.length ? visible.map(item => `
    <article class="library-card">
      <div class="card-visual ${item.visual}"${item.icon ? ` style="background-image: linear-gradient(90deg, rgba(10, 14, 13, .42), rgba(10, 14, 13, .72)), url('${item.icon}')"` : ''}>
        <span class="card-source">${item.source}</span>
      <h3>${item.name}</h3><p>${item.description}</p>
      <div class="card-footer"><span>${item.type.toUpperCase()} · ${item.installs}</span><button class="install-button" data-library="${item.name}" aria-label="Install ${item.name}">Install</button></div>
    </article>`).join('') : '<p class="empty-state">No libraries found in this source.</p>';
  document.querySelector('#loadMore').hidden = loadingCatalog || selectedSource === 'CurseForge';
  gridEl.querySelectorAll('.install-button').forEach(button => button.addEventListener('click', () => showToast(`${button.dataset.library} added to Vanilla Plus`)));
}

async function loadModrinth(reset = false) {
  if (loadingCatalog || selectedSource === 'CurseForge') return;
  loadingCatalog = true;
  if (reset) { currentOffset = 0; liveItems = []; }
  renderLibraries();
  const projectType = selectedCategory === 'Modpacks' ? 'modpack' : selectedCategory === 'Shaders' ? 'shader' : selectedCategory === 'Resource Packs' ? 'resourcepack' : 'mod';
  const query = encodeURIComponent(document.querySelector('#searchInput').value.trim());
  const facets = encodeURIComponent(JSON.stringify([[`project_type:${projectType}`]]));
  try {
    const response = await fetch(`https://api.modrinth.com/v2/search?query=${query}&facets=${facets}&limit=24&offset=${currentOffset}&index=downloads`);
    if (!response.ok) throw new Error('Modrinth request failed');
    const data = await response.json();
    const results = data.hits.map(item => ({
      name: item.title, description: item.description || 'Modrinth project', source: 'Modrinth', type: projectType === 'mod' ? 'Mod' : selectedCategory, glyph: item.title.slice(0, 2).toUpperCase(), visual: 'visual-foliage', installs: `${(item.downloads / 1000000).toFixed(1)}M`, icon: item.icon_url
    }));
    liveItems = reset ? results : [...liveItems, ...results];
    currentOffset += results.length;
    document.querySelector('#loadMore').hidden = results.length < 24;
  } catch (error) {
    showToast('Live Modrinth results unavailable');
  } finally {
    loadingCatalog = false;
    renderLibraries();
  }
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toastEl.classList.remove('show'), 2400);
}

document.querySelectorAll('.source-tab').forEach(tab => tab.addEventListener('click', () => {
  selectedSource = tab.dataset.source;
  document.querySelectorAll('.source-tab').forEach(item => item.classList.remove('active'));
  tab.classList.add('active');
  loadModrinth(true);
}));
document.querySelectorAll('.category-tab').forEach(tab => tab.addEventListener('click', () => {
  selectedCategory = tab.dataset.category;
  document.querySelectorAll('.category-tab').forEach(item => item.classList.remove('active'));
  tab.classList.add('active');
  loadModrinth(true);
}));
let searchTimer;
document.querySelector('#searchInput').addEventListener('input', () => { window.clearTimeout(searchTimer); searchTimer = window.setTimeout(() => loadModrinth(true), 350); });
document.querySelector('#loadMore').addEventListener('click', () => loadModrinth());
if (!browserMode) document.querySelector('#launchButton').addEventListener('click', () => {
  if (!signedIn) {
    loginBackdrop.hidden = false;
    return;
  }
  const button = document.querySelector('#launchButton');
  const label = document.querySelector('#launchLabel');
  button.disabled = true; label.textContent = 'Preparing world...';
  window.setTimeout(() => { label.textContent = 'Launch profile'; button.disabled = false; showToast('Vanilla Plus is ready to play'); }, 1200);
});
if (!browserMode) document.querySelector('#accountButton').addEventListener('click', () => { loginBackdrop.hidden = false; });
document.querySelector('#closeLogin').addEventListener('click', () => { loginBackdrop.hidden = true; });
document.querySelector('#microsoftButton').addEventListener('click', () => {
  const button = document.querySelector('#microsoftButton');
  const status = document.querySelector('#loginStatus');
  button.disabled = true;
  button.firstChild.textContent = 'Microsoft OAuth not configured';
  status.textContent = 'Add an Azure client ID and redirect URL to enable live Microsoft sign-in.';
  showToast('Microsoft login needs OAuth setup');
  window.setTimeout(() => {
    button.disabled = false;
    button.firstChild.textContent = 'Continue with Microsoft';
  }, 2200);
});
document.querySelector('#modrinthButton').addEventListener('click', () => {
  document.querySelector('#loginStatus').textContent = 'Modrinth sign-in needs a registered OAuth client and redirect URL.';
  showToast('Modrinth login needs OAuth setup');
});
document.querySelector('#installLink').addEventListener('click', () => showToast('Desktop app download will be available soon'));
loginBackdrop.addEventListener('click', event => { if (event.target === loginBackdrop) loginBackdrop.hidden = true; });
[document.querySelector('#addProfile'), document.querySelector('#addProfileBottom')].forEach(button => button.addEventListener('click', () => showToast('Profile creator is ready for your next modpack')));
if (!browserMode) document.querySelector('#manageButton').addEventListener('click', () => showToast('Profile manager opened'));
document.querySelector('#filterButton').addEventListener('click', () => showToast('Showing recommended libraries'));
document.querySelector('#settingsButton').addEventListener('click', () => showToast('Settings opened'));
renderProfiles();
loadModrinth(true);

