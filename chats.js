

class Game {
    constructor(question, hints,answer) {
        this.question = question;
        this.hints = hints; // Array of hints
        this.revealedHints = []; // Array of revealed hints
        this.score = 0;
        this.answer = answer;
        this.inputCount = 0; 
        this.history = []; // Array of { question, response }
    }

     start() {
           addMessageToChatBox("ゲームを開始します。",'system');
           addMessageToChatBox(`問題: ${this.question}`,'system');
    }


    async evaluateQuestion(userQuestion, password) {
        this.inputCount++;
        let response;
        if (this.inputCount < 10) {
            const result = await SubmitToAPI(userQuestion, password);
            if (result.err === 0) {
              if( result.score > 0.85)
                if (qdata[result.id] === 'Y') {
                    response = "はい。そうです。";
                } else if (qdata[result.id] === 'N') {
                    response = "いいえ。違います。";
                } else if (qdata[result.id] === 'I') {
                    response = "関係ありません。";
                }
              else //scoreが低い
                response = "関係ありません。";
            } else {
                response = "エラーが発生しました。再度入力してください";
                this.inputCount--; // エラー時はカウントを進めない
            }
        }

        // ヒントや答えを自動で出力
        if (this.inputCount === 2 || this.inputCount === 4 || this.inputCount === 6) {
            const hint = this.addHint();
            response += `\n${hint}`;
        } else if (this.inputCount >= 9) {
            response = `正解は: ${this.answer}`;
        }

        this.addToHistory(userQuestion, response);
        return response;
    }
        
        
addHint() {
    // Reveal the next hint that is not revealed yet
    if (this.revealedHints.length === this.hints.length) {
    	    return "すべてのヒントが開示されました。";
    }

	    const hint = this.hints[this.revealedHints.length];
	    this.revealedHints.push(hint);
	    return hint;
	}

    submitAnswer(userAnswer) {
        if (userAnswer === this.answer) { // Replace with the actual correct answer
            this.score += 100;
            return "正解!";
        } else {
            return "残念、不正解です。";
        }
    }

    addToHistory(userQuestion, systemResponse) {
        this.history.push({
            question: userQuestion,
            response: systemResponse
        });
    }

    getRevealedHints() {
        return this.revealedHints;
    }
}

class Player {
    constructor(name) {
        this.name = name;
        this.currentQuestion = null;
        this.answer = null;
    }

    askQuestion(question) {
        this.currentQuestion = question;
    }

    submitAnswer(answer) {
        this.answer = answer;
    }
}
//質問の提出
async function sendQuestion() {
    const inputBox = document.getElementById('userInput');
    const answerCheckbox = document.getElementById('answerCheckbox');

    const userInput = inputBox.value;
    addMessageToChatBox(userInput, 'user');

    let response;
    const password = document.getElementById('password').value;
    
    
    if (answerCheckbox.checked) {
        // 解答を評価
        response = game.answer; // 正解を表示
        
    } else if(game.inputCount> 9) {
        response = "入力回数をオーバーしました。";
    } else {
        response = await game.evaluateQuestion(userInput, password);
    }

    addMessageToChatBox(response, 'system');

    inputBox.value = ''; // 入力欄をクリア
}

//スクリプトインジェクション対策
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


//メッセージを表示
function addMessageToChatBox(message, sender) {
    const chatBox = document.getElementById('chatBox');
    
    let messageClass;
    let iconElement = '';
    if (sender === 'user') {
        messageClass = 'user-message';
    } else if (sender === 'system') {
        messageClass = 'system-message';
        iconElement = '<img src="./icon.png" alt="System Icon" class="system-icon">'; 
    } else {
        messageClass = '';
    }


    // メッセージのサニタイズ
    const sanitizedMessage = escapeHtml(message);

    // 改行文字を<br>に変換
    const formattedMessage = sanitizedMessage.replace(/\n/g, '<br>');
    
    const messageElement = `<div class="message ${messageClass}">${iconElement}${formattedMessage}</div>`;
    chatBox.innerHTML += messageElement;
    chatBox.scrollTop = chatBox.scrollHeight; // スクロールを下に移動
}

//画像を表示
function addImageToChatBox(src) {
    const chatBox = document.getElementById('chatBox');
    
    const imageElement = `<img src="${src}" alt="Chat Image" class="image-message">`;
    chatBox.innerHTML += imageElement;
    chatBox.scrollTop = chatBox.scrollHeight; // スクロールを下に移動
}

async function SubmitToAPI(text, password) {
  const data = {
    text: text,
    password: password,
  };
  const address = "https://script.google.com/macros/s/AKfycbybOdpiaKT3W2u9n3fE_5mc0GcbCdjSKMUnyyLufDkFJHgFGxkIYVNq3wCJaMZFgriv/exec";

	const fetchdata = {};
    fetchdata.method = 'POST';
    fetchdata.contentType='application/json';
    fetchdata.body = JSON.stringify(data);

    let result;
      await fetch(address, fetchdata).then(response => response.json()).then(data => {
        console.log('Success:', data);
        result= data;
      })
      .catch((error) => {
        console.error('Error:', error);
    	result={ err: 2 };
      });
      
      return result;
}



// 使用例
const problem="ある高級レストランで、一人の男が目立っていた。その男のテーブルの周りは、スプーンやフォーク、ナイフなどが散乱していた。ウェイターたちは彼に対して敬意を持って接していたが、彼の周りの物を落とす行動には困惑していた。さて、男は食器を散らかしてしまうのなぜか？"
const hintsList = ["ヒント[感覚]: 長い時間をある特定の環境で過ごすと、人の身体や感覚はその環境に適応することがあります。", 
					"ヒント[尊敬]:彼の職業は非常に特殊で、数少ない人々だけが経験することができるものです。",
					"ヒント[職業]:この男は、地球上だけでなく、地球外の特定の環境での経験も持っています。"];
const answer = "男は宇宙飛行士だった。すっかり無重力空間に慣れてしまった彼は、頻繁に持っているものを落としてしまうようになった。";

const qdata=['N', 'I', 'I', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'Y', 'N', 'N', 'N', 'Y', 'N', 'I', 'Y', 'I', 'N', 'I', 'N', 'I', 'Y', 'I', 'N', 'I', 'I', 'I', 'N', 'N', 'I', 'I', 'N', 'N', 'N', 'I', 'N', 'N', 'I', 'N', 'I', 'N', 'N', 'N', 'Y', 'N', 'N', 'N', 'N', 'Y', 'Y', 'Y', 'N', 'Y', 'Y', 'Y', 'Y', 'N', 'Y', 'N', 'Y', 'N', 'N', 'N', 'N', 'N', 'N', 'Y', 'Y', 'Y', 'N', 'N', 'N', 'Y', 'N', 'N', 'Y', 'N', 'Y', 'Y', 'N', 'Y', 'N', 'Y', 'N', 'N', 'N', 'Y', 'Y', 'I', 'Y', 'I', 'I', 'Y', 'Y', 'I', 'Y', 'Y', 'Y', 'N', 'N', 'Y', 'Y', 'Y', 'I', 'N', 'Y', 'Y', 'N', 'Y', 'N', 'N', 'Y', 'Y', 'N', 'N', 'N', 'I', 'N', 'I', 'I', 'N', 'N', 'I', 'N', 'N', 'N', 'Y', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'Y', 'N', 'N', 'N', 'N', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'];
const game = new Game(problem, hintsList,answer);
const player = new Player("John");

game.start();
addImageToChatBox("./question1.png")