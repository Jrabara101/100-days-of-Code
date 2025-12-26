const APIURL = 'https://api.github.com/users/';

const main = document.getElementById('main');
const form = document.getElementById('form');
const search = document.getElementById('search');
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Theme Initialization
const currentTheme = localStorage.getItem('theme');
if (currentTheme) {
    body.classList.add(currentTheme);
    updateThemeIcon();
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const theme = body.classList.contains('dark-mode') ? 'dark-mode' : '';
    localStorage.setItem('theme', theme);
    updateThemeIcon();
});

function updateThemeIcon() {
    const isDark = body.classList.contains('dark-mode');
    themeToggle.innerHTML = isDark
        ? '<i class="fas fa-sun"></i> <span>Light</span>'
        : '<i class="fas fa-moon"></i> <span>Dark</span>';
}

// Search
getUser('octocat'); // Initial load

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = search.value;
    if (user) {
        getUser(user);
        search.value = '';
    }
});

async function getUser(username) {
    // Show Loading Skeleton or Spinner
    main.innerHTML = `<div class="card" style="align-items:center; justify-content:center; height: 400px;"><h2>Loading...</h2></div>`;

    try {
        const { data } = await axios(APIURL + username);
        createUserCard(data);
        getRepos(username);
    } catch (err) {
        if (err.response && err.response.status === 404) {
            createErrorCard('No profile with this username');
        } else {
            console.error(err);
            createErrorCard('Problem fetching user');
        }
    }
}

async function getRepos(username) {
    try {
        const { data } = await axios(APIURL + username + '/repos?sort=created');
        addReposToCard(data);
    } catch (err) {
        createErrorCard('Problem fetching repos');
    }
}

function createUserCard(user) {
    const userID = user.name || user.login;
    const userBio = user.bio ? `${user.bio}` : 'This profile has no bio';
    const joinedDate = new Date(user.created_at).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    const cardHTML = `
    <div class="card">
        <div class="avatar-section">
            <img src="${user.avatar_url}" alt="${user.name}" class="avatar-desktop">
        </div>
        
        <div class="user-info">
            <div class="profile-header-mobile">
                 <img src="${user.avatar_url}" alt="${user.name}" class="avatar-mobile">
                 <div class="mobile-info">
                    <h2>${userID}</h2>
                    <a href="${user.html_url}" target="_blank" class="login-handle">@${user.login}</a>
                    <span class="joined-date">Joined ${joinedDate}</span>
                 </div>
            </div>

            <div class="profile-header">
                <div class="name-section">
                    <h2>${userID}</h2>
                    <a href="${user.html_url}" target="_blank" class="login-handle">@${user.login}</a>
                </div>
                <span class="joined-date">Joined ${joinedDate}</span>
            </div>

            <p class="bio">${userBio}</p>

            <div class="user-stats">
                <div class="stat-item">
                    <span class="stat-title">Repos</span>
                    <span class="stat-value">${user.public_repos}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-title">Followers</span>
                    <span class="stat-value">${user.followers}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-title">Following</span>
                    <span class="stat-value">${user.following}</span>
                </div>
            </div>

            <div class="user-links">
                <div class="link-item ${!user.location ? 'disabled' : ''}">
                    <i class="fas fa-map-marker-alt"></i> ${user.location || 'Not Available'}
                </div>
                <div class="link-item ${!user.twitter_username ? 'disabled' : ''}">
                    <i class="fab fa-twitter"></i> 
                    ${user.twitter_username ? `<a href="https://twitter.com/${user.twitter_username}" target="_blank">${user.twitter_username}</a>` : 'Not Available'}
                </div>
                <div class="link-item ${!user.blog ? 'disabled' : ''}">
                    <i class="fas fa-link"></i> 
                    ${user.blog ? `<a href="${user.blog.startsWith('http') ? user.blog : 'https://' + user.blog}" target="_blank">Website</a>` : 'Not Available'}
                </div>
                <div class="link-item ${!user.company ? 'disabled' : ''}">
                    <i class="fas fa-building"></i> ${user.company || 'Not Available'}
                </div>
            </div>

            <div class="repos-container">
                <div class="repo-title">Top Repos</div>
                <div id="repos" class="repos"></div>
            </div>
        </div>
    </div>
    `;
    main.innerHTML = cardHTML;
}

function createErrorCard(msg) {
    const cardHTML = `
        <div class="card" style="text-align:center; display:block;">
            <h1>${msg}</h1>
            <p style="margin-top:10px;">Please try a different username</p>
        </div>
    `;
    main.innerHTML = cardHTML;
}

function addReposToCard(repos) {
    const reposEl = document.getElementById('repos');
    // Take top 5
    repos
        .slice(0, 5)
        .forEach(repo => {
            const repoEl = document.createElement('a');
            repoEl.classList.add('repo');
            repoEl.href = repo.html_url;
            repoEl.target = '_blank';
            repoEl.innerText = repo.name;
            reposEl.appendChild(repoEl);
        });
}

// Simple axios polyfill if not using CDN or npm in Environment
// Since user requirement says "fetch or axios", and we don't have axios included in head in the provided index.html snippet above.
// EDIT: I should probably add Axios CDN to index.html to make this work.
// I will just use fetch to be safe and dependency-free, but I wrote axios in code.
// Let's quickly replace axios with fetch in this same file write to be robust.

async function axios(url) {
    const res = await fetch(url);
    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.');
        error.response = res; // attach response
        error.response.status = res.status;
        throw error;
    }
    const data = await res.json();
    return { data };
}
