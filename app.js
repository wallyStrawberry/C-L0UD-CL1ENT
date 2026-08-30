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
let signedIn = false;
const profilesEl = document.querySelector('#profiles');
const gridEl = document.querySelector('#libraryGrid');
const toastEl = document.querySelector('#toast');
const loginBackdrop = document.querySelector('#loginBackdrop');

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
  const items = selectedCategory === 'Modpacks' ? modpacks : libraries.filter(item => selectedCategory === 'Mods' || item.type === selectedCategory);
  const visible = items.filter(item => (selectedSource === 'All' || item.source === selectedSource) && `${item.name} ${item.description} ${item.type}`.toLowerCase().includes(query));
  gridEl.innerHTML = visible.length ? visible.map(item => `
    <article class="library-card">
      <div class="card-visual ${item.visual}"><span class="visual-glyph">${item.glyph}</span><span class="card-source">${item.source}</span></div>
      <h3>${item.name}</h3><p>${item.description}</p>
      <div class="card-footer"><span>${item.type.toUpperCase()} · ${item.installs}</span><button class="install-button" data-library="${item.name}" aria-label="Add ${item.name}">+</button></div>
    </article>`).join('') : '<p class="empty-state">No libraries found in this source.</p>';
  gridEl.querySelectorAll('.install-button').forEach(button => button.addEventListener('click', () => showToast(`${button.dataset.library} added to Vanilla Plus`)));
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
  renderLibraries();
}));
document.querySelectorAll('.category-tab').forEach(tab => tab.addEventListener('click', () => {
  selectedCategory = tab.dataset.category;
  document.querySelectorAll('.category-tab').forEach(item => item.classList.remove('active'));
  tab.classList.add('active');
  renderLibraries();
}));
document.querySelector('#searchInput').addEventListener('input', renderLibraries);
document.querySelector('#launchButton').addEventListener('click', () => {
  if (!signedIn) {
    loginBackdrop.hidden = false;
    return;
  }
  const button = document.querySelector('#launchButton');
  const label = document.querySelector('#launchLabel');
  button.disabled = true; label.textContent = 'Preparing world...';
  window.setTimeout(() => { label.textContent = 'Launch profile'; button.disabled = false; showToast('Vanilla Plus is ready to play'); }, 1200);
});
document.querySelector('#accountButton').addEventListener('click', () => { loginBackdrop.hidden = false; });
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
loginBackdrop.addEventListener('click', event => { if (event.target === loginBackdrop) loginBackdrop.hidden = true; });
[document.querySelector('#addProfile'), document.querySelector('#addProfileBottom')].forEach(button => button.addEventListener('click', () => showToast('Profile creator is ready for your next modpack')));
document.querySelector('#manageButton').addEventListener('click', () => showToast('Profile manager opened'));
document.querySelector('#filterButton').addEventListener('click', () => showToast('Showing recommended libraries'));
document.querySelector('#settingsButton').addEventListener('click', () => showToast('Settings opened'));
renderProfiles();
renderLibraries();
