let homeScore = 0, guestScore = 0;

function updateScore(side, pts) {
  if(side==='home') homeScore += pts;
  else guestScore += pts;
  renderScores();
}

function newGame() {
  homeScore = 0;
  guestScore = 0;
  renderScores();
}

function renderScores() {
  document.getElementById('home-score').textContent = homeScore;
  document.getElementById('guest-score').textContent = guestScore;

  // Highlight leader
  let homeContainer = document.getElementById('home-container');
  let guestContainer = document.getElementById('guest-container');
  homeContainer.classList.remove('highlight-leader');
  guestContainer.classList.remove('highlight-leader');
  let leaderText = '';
  if (homeScore > guestScore) {
    homeContainer.classList.add('highlight-leader');
    leaderText = 'Home leads!';
  } else if (guestScore > homeScore) {
    guestContainer.classList.add('highlight-leader');
    leaderText = 'Guest leads!';
  } else {
    leaderText = 'Scores are tied!';
  }
  document.getElementById('leader-indicator').textContent = leaderText;
}

renderScores();
