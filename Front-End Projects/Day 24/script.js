document.addEventListener('DOMContentLoaded', () => {
    const questionContainer = document.getElementById('Question');
    const answerContainer = document.getElementById('Answers');
    const resultContainer = document.getElementById('Result');
    const progressContainer = document.getElementById('progress');
    const currentScoreDisplay = document.getElementById('current-score');
    const highScoreDisplay = document.getElementById('HighScore');
    const gameSetupDiv = document.getElementById('game-setup');
    const quizDiv = document.getElementById('quiz');
    const categorySelect = document.getElementById('category');
    const amountInput = document.getElementById('amount');
    const startButton = document.getElementById('start-btn');
    const difficultySelect = document.getElementById('difficulty');

    let currentQuestions = [];
    let score = 0;
    let questionIndex = 0;
    let highscore = parseInt(localStorage.getItem('HighScoreTrivia')) || 0;
    let questionStartTime;
    const baseScorePerQuestion = 1000;
    const penaltyPerSecond = 10;

    highScoreDisplay.innerText = `High Score: ${highscore}`;

    function startGame() {
        const category = categorySelect.value;
        const amount = amountInput.value;
        const difficulty = difficultySelect.value;
        fetchQuestions(amount, category, difficulty);
        gameSetupDiv.style.display = 'none';
        quizDiv.style.display = 'block';
    }

    function fetchQuestions(amount, category, difficulty) {
        // Map your custom categories to OpenTDB IDs
        const categoryMap = {
            general: 9,
            science: 17,
            history: 23,
            geography: 22,
            entertainment: 11,
            sports: 21,
            art: 25
        };

        let url = `https://opentdb.com/api.php?amount=${amount}`;
        if (category && categoryMap[category]) url += `&category=${categoryMap[category]}`;
        if (difficulty) url += `&difficulty=${difficulty}`;
        url += '&type=multiple';

        fetch(url)
            .then(response => response.json())
            .then(data => {
                currentQuestions = data.results;
                questionIndex = 0;
                score = 0;
                displayQuestion();
            })
            .catch(() => alert('Error fetching questions. Please try again.'));
    }

    function displayQuestion() {
        if (questionIndex < currentQuestions.length) {
            let currentQuestion = currentQuestions[questionIndex];
            questionContainer.innerHTML = decodeHTML(currentQuestion.question);
            displayAnswers(currentQuestion);
            updateProgress();
            questionStartTime = Date.now();
        } else {
            updateHighScore();
            showResults();
        }
    }

    function displayAnswers(question) {
        answerContainer.innerHTML = '';
        const answers = [...question.incorrect_answers, question.correct_answer];
        shuffleArray(answers);

        answers.forEach(answer => {
            const button = document.createElement('button');
            button.innerHTML = decodeHTML(answer);
            button.className = 'answer-btn';
            button.addEventListener('click', () =>
                selectAnswer(button, question.correct_answer)
            );
            answerContainer.appendChild(button);
        });
    }

    function selectAnswer(selectedButton, correctAnswer) {
        const timeTaken = (Date.now() - questionStartTime) / 1000;
        let scoreForThisQuestion = Math.max(
            baseScorePerQuestion - Math.floor(timeTaken) * penaltyPerSecond,
            0
        );

        disableButtons();
        let correctButton;

        const buttons = answerContainer.querySelectorAll('.answer-btn');
        buttons.forEach(button => {
            if (decodeHTML(button.innerHTML) === decodeHTML(correctAnswer)) {
                correctButton = button;
            }
        });

        if (decodeHTML(selectedButton.innerHTML) === decodeHTML(correctAnswer)) {
            selectedButton.classList.add('correct');
            score += scoreForThisQuestion;
            resultContainer.innerText = `✅ Correct! You scored ${scoreForThisQuestion} points.`;
        } else {
            selectedButton.classList.add('incorrect');
            if (correctButton) correctButton.classList.add('correct');
            resultContainer.innerText = `❌ Incorrect! The correct answer was: ${decodeHTML(correctAnswer)}.`;
        }

        updateCurrentScore();
        setTimeout(() => {
            questionIndex++;
            displayQuestion();
            resultContainer.innerText = '';
        }, 3000);
    }

    function updateCurrentScore() {
        currentScoreDisplay.innerText = `Current Score: ${score}`;
    }

    function disableButtons() {
        const buttons = answerContainer.querySelectorAll('.answer-btn');
        for (let button of buttons) {
            button.disabled = true;
        }
    }

    function showResults() {
        questionContainer.innerText = '🎉 Quiz Over!';
        answerContainer.innerHTML = '';
        resultContainer.innerText = `Your final score is: ${score}`;
        updateHighScoreDisplay();
        progressContainer.innerText = '';

        const restartButton = document.createElement('button');
        restartButton.textContent = 'Restart Quiz';
        restartButton.addEventListener('click', () => {
            quizDiv.style.display = 'none';
            gameSetupDiv.style.display = 'block';
        });
        answerContainer.appendChild(restartButton);
    }

    function updateHighScore() {
        if (score > highscore) {
            highscore = score;
            localStorage.setItem('HighScoreTrivia', highscore.toString());
            updateHighScoreDisplay();
        }
    }

    function updateHighScoreDisplay() {
        highScoreDisplay.innerText = `High Score: ${highscore}`;
    }

    function updateProgress() {
        progressContainer.innerText = `Question ${questionIndex + 1}/${currentQuestions.length}`;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function decodeHTML(html) {
        var txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    startButton.addEventListener('click', startGame);
});
