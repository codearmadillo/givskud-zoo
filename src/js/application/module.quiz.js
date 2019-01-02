class Game {
    constructor(gameId, QuestionCount) {
        this.cookies = {
            session: 'gamesession-' + gameId,
            score: 'gamesession-' + gameId + '-score',
            question: 'gamesession-' + gameId + '-question',
            endgame: 'gamesession-' + gameId + '-endgame'
        }

        this.settings = {
            score: 0,
            currentquestion: 0,
            isidle: false,
            questions: quizjson
        }

        this.settings.count = QuestionCount;

        this.startgame();
    }
    restartsessions(){
        for(let key in this.cookies) {
            Cookies.remove(this.cookies[key]);
        }
    }
    restartcontrols() {
        let self = this;
        this.settings.isidle = false;

        let current = this.settings.questions[this.settings.currentquestion];
        let answers = document.querySelectorAll('.question__item');
        let hints = document.querySelectorAll('.hint__content');
        let controllers = document.querySelectorAll("#hint-controls");

        Array.from(controllers).forEach(link => {
            link.style.display = "inline-block";
        });
        Array.from(hints).forEach(link => {
            link.style.display = "none";
        });
        Array.from(answers).forEach(link => {
            link.classList.remove('correct');
            link.classList.remove('incorrect');

            link.addEventListener('click', function(event){
                event.preventDefault();

                if(self.settings.isidle === false){
                    self.settings.isidle = true;

                    if(link.getAttribute('game-key') == current.CorrectAnswer) {
                        link.className += " correct";
                        self.addscore();
                    } else {
                        link.className += " incorrect";
                    }

                    self.nextquestion();
                }
            });
        });
    }
    startgame() {
        if(Cookies.get(this.cookies.endgame)) {
            Cookies.remove(this.cookies.endgame);
        } else {
            this.restartsessions();
        }
        this.restartcontrols();
    }
    closegame() {
        Cookies.set(this.cookies.endgame, true, 7);
        location.reload();
    }
    nextquestion() {
        let self = this;

        this.settings.currentquestion += 1;

        let refresh = setTimeout(function(){
            if(self.settings.currentquestion >= self.settings.count) {
                self.closegame();
            } else {
                self.restartcontrols();
                
                let question = self.settings.questions[self.settings.currentquestion];
                
                document.getElementsByClassName('question__text')[0].textContent = question.Text;
                document.getElementsByClassName('hint__content')[0].textContent = question.Hint;
                document.getElementsByClassName('question__image')[0].setAttribute('src', question.ImageUrl);

                let questions = document.getElementsByClassName('question__item');
                Array.from(questions).forEach(function(element, key) {
                    let answerlabel = element.getElementsByTagName('span')[1];
                    answerlabel.textContent = question.Answers[key];
                });

                document.getElementsByClassName('game__counter')[0].textContent = (self.settings.currentquestion + 1) + ' of ' + self.settings.count;

            }
        }, 600);
    }
    addscore() {
        this.settings.score += 1;
        Cookies.set(this.cookies.score, this.settings.score, 7);
    }
    showhint() {
        let hints = document.querySelectorAll('.hint__content');
        let controls = document.querySelectorAll('#hint-controls');

        Array.from(controls).forEach(link => {
            link.style.display = "none";
        });
        Array.from(hints).forEach(link => {
            link.style.display = "block";
        });
    }
}