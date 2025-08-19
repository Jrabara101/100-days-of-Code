document.addEventListener('DOMContentLoaded', () => {
    const questionContainer = document.getElementById('question-container');
    const answerContainer = document.getElementById('answer-container');
    const resultContainer = document.getElementById('result-container');
    const progressContainer = document.getElementById('progress-container');
    const currentScoreDisplay = document.getElementById('current-score');
    const highScoreDisplay = document.getElementById('high-score');
    const gameSetupDiv = document.getElementById('game-setup');
    const quizDiv = document.getElementById('quiz');
    const categorySelect = document.getElementById('category');
    const amountInput = document.getElementById('amount');
    const startButton = document.getElementById('start-button');
    const difficultySelect = document.getElementById('difficulty');

    let currentQuestions = [];
    let score = 0;
    let questionIndex = 0;
    let highscore = parseInt(localStorage.getItem('HighScoreTrivia')) || 0;
    let questionStartTime;
    const baseScorePerQuestion = 1000;
    const penaltyPerSecond = 10;

    highScoreDisplay.innerText = `High Score: ${highscore}`;

    function fetchCategories() {
        fetch('https://opentdb.com/api_category.php')
            .then(response => response.json())
            .then(data => {
                data.trivia_categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            });
    }

    function startGame() {
        const category = categorySelect.value;
        const amount = amountInput.value;
        const difficulty = difficultySelect.value;
        fetchQuestions(amount, category, difficulty);
        gameSetupDiv.style.display = 'none';
        quizDiv.style.display = 'block';
    }

    function fetchQuestions(amount, category, difficulty) {
        let url = `https://opentdb.com/api.php?amount=${amount}`;
        if (category) url += `&category=${category}`;
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
                selectAnswer(button, question.correct_answer, answer)
            );
            answerContainer.appendChild(button);
        });
    }

    function selectAnswer(selectedButton, correctAnswer, chosenAnswer) {
        const timeTaken = (Date.now() - questionStartTime) / 1000;
        let scoreForThisQuestion = Math.max(
            baseScorePerQuestion - Math.floor(timeTaken) * penaltyPerSecond,
            0
        );

        if (chosenAnswer === correctAnswer) {
            score += scoreForThisQuestion;
            selectedButton.classList.add('correct');
        } else {
            selectedButton.classList.add('wrong');
        }


        Array.from(answerContainer.children).forEach(btn => btn.disabled = true);

        currentScoreDisplay.innerText = `Score: ${score}`;

        setTimeout(() => {
            questionIndex++;
            displayQuestion();
        }, 1000);
    }

    function updateProgress() {
        progressContainer.innerText = `Question ${questionIndex + 1} of ${currentQuestions.length}`;
    }

    function updateHighScore() {
        if (score > highscore) {
            highscore = score;
            localStorage.setItem('HighScoreTrivia', highscore);
        }
        highScoreDisplay.innerText = `High Score: ${highscore}`;
    }

    function showResults() {
        quizDiv.style.display = 'none';
        resultContainer.innerHTML = `Final Score: ${score}`;
        gameSetupDiv.style.display = 'block';
    }


    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }


    function decodeHTML(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    startButton.addEventListener('click', startGame);
    fetchCategories();
});
