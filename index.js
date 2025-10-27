const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;
const HARD_TIME = 60;

    const WORDS = [
      'AMORU','CASAS','SOLAR','LIMAO','FAROL','LINHA','PONTO','CARRO',
      'GATOS','CACHO','ROSAO','BOLAS','FRUTA','TEXTO','NIVEL','LIVRO',
      'PLANO','MUNDO','FESTA','JOGAR','TERMO','VIVER','PODER','FORCA'
    ];
    const VALID = new Set([...WORDS,'FALAR','DIZER','TRAIR','PENSO','LUGAR','FIMAO']);

    // --- ELEMENTOS ---
    let solution = '';
    const boardEl = document.getElementById('board');
    const keyboardEl = document.getElementById('keyboard');
    const msgEl = document.getElementById('message');
    const timerEl = document.getElementById('timer');
    const timeLeftEl = document.getElementById('timeLeft');
    const attemptsLeftEl = document.getElementById('attemptsLeft');
    const newBtn = document.getElementById('newGame');

    // --- ESTADO ---
    let grid = [];
    let currentRow = 0;
    let currentCol = 0;
    let gameOver = false;
    let timeRemaining = HARD_TIME;
    let timerInterval = null;
    let modo = 'facil'; // padrão

    // --- INICIALIZAÇÃO ---
    window.onload = () => {
      const params = new URLSearchParams(window.location.search);
      modo = params.get('modo') || 'facil';
      startGame();
    };

    function voltarMenu(){
      if(confirm('Deseja voltar ao menu principal? O progresso atual será perdido.')){
        window.location.href = 'index.html';
      }
    }

    newBtn.addEventListener('click', startGame);

    function pickSolution(){ return WORDS[Math.floor(Math.random()*WORDS.length)]; }

    function startGame(){
      stopTimer();
      solution = pickSolution().toUpperCase();
      currentRow = 0; currentCol = 0; gameOver = false;
      initBoard(); initKeyboard();
      msgEl.textContent = 'Use o teclado ou clique nas teclas abaixo. Pressione ENTER para enviar.';
      attemptsLeftEl.textContent = MAX_ATTEMPTS;

      if(modo === 'dificil'){
        startTimer();
        showMessage('Modo difícil: 60 segundos no total. Boa sorte!', 2500);
      } else {
        stopTimer();
        showMessage('Modo fácil: sem limite de tempo.', 2000);
      }
    }

    function initBoard(){
      boardEl.innerHTML = '';
      grid = [];
      for(let r=0;r<MAX_ATTEMPTS;r++){
        const row = document.createElement('div');
        row.className = 'row';
        const arr = [];
        for(let c=0;c<WORD_LENGTH;c++){
          const tile = document.createElement('div');
          tile.className = 'tile';
          tile.dataset.row=r; tile.dataset.col=c;
          row.appendChild(tile);
          arr.push('');
        }
        boardEl.appendChild(row);
        grid.push(arr);
      }
    }

    function initKeyboard() {
    console.log("O teclado está sendo carregado");
    keyboardEl.innerHTML = '';

    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

    rows.forEach((letters, rowIndex) => {
        const kbRow = document.createElement('div');
        kbRow.className = 'kb-row';

        // Adiciona o botão ENTER na terceira linha
        if (rowIndex === 2) kbRow.appendChild(makeKey('ENTER', true));

        // Cria cada tecla normal
        for (const ch of letters) {
            kbRow.appendChild(makeKey(ch));
        }

        // Adiciona o botão de backspace na terceira linha
        if (rowIndex === 2) kbRow.appendChild(makeKey('⌫', true));

        keyboardEl.appendChild(kbRow);
    });
}


    function makeKey(label,wide=false){
      const btn=document.createElement('button');
      btn.className='key'+(wide?' wide':'');
      btn.textContent=label;
      btn.onclick=()=>onKey(label);
      return btn;
    }

    function onKey(k){
      if(gameOver) return;
      if(k==='ENTER') return submitGuess();
      if(k==='⌫') return backspace();
      addLetter(k);
    }

    function addLetter(l){
      if(currentCol>=WORD_LENGTH) return;
      grid[currentRow][currentCol]=l.toUpperCase();
      getTile(currentRow,currentCol).textContent=l;
      currentCol++;
    }

    function backspace(){
      if(currentCol<=0) return;
      currentCol--;
      grid[currentRow][currentCol]='';
      getTile(currentRow,currentCol).textContent='';
    }

    function submitGuess(){
      if(currentCol<WORD_LENGTH) return showMessage('A palavra precisa ter 5 letras.');
      const guess=grid[currentRow].join('');
      if(!VALID.has(guess)) return showMessage('Palavra não encontrada.');
      revealRow(currentRow,guess);
    }

    function revealRow(row,guess){
      const sol=solution.split('');
      const guessArr=guess.split('');
      const result=Array(WORD_LENGTH).fill('absent');
      const solCount={};
      for(const ch of sol) solCount[ch]=(solCount[ch]||0)+1;
      for(let i=0;i<WORD_LENGTH;i++){
        if(guessArr[i]===sol[i]){result[i]='correct';solCount[guessArr[i]]--;}
      }
      for(let i=0;i<WORD_LENGTH;i++){
        if(result[i]!=='correct'&&solCount[guessArr[i]]>0){
          result[i]='present';solCount[guessArr[i]]--;
        }
      }
      for(let i=0;i<WORD_LENGTH;i++){
        const t=getTile(row,i);
        setTimeout(()=>{
          t.classList.add('flip');
          t.style.background=result[i]==='correct'?'var(--correct)':result[i]==='present'?'var(--present)':'var(--absent)';
          t.style.color='#021012';
          t.classList.remove('flip');
          updateKeyColor(guessArr[i],result[i]);
        },i*250);
      }
      setTimeout(()=>{
        if(guess===solution) gameWin();
        else{
          currentRow++;
          currentCol=0;
          attemptsLeftEl.textContent=MAX_ATTEMPTS-currentRow;
          if(currentRow>=MAX_ATTEMPTS) gameLose();
        }
      },WORD_LENGTH*250+300);
    }

    function updateKeyColor(letter,result){
      for(const b of keyboardEl.querySelectorAll('.key')){
        if(b.textContent===letter){
          const order={absent:0,present:1,correct:2};
          const prev=b.dataset.state;
          if(!prev||order[result]>order[prev]){
            b.dataset.state=result;
            b.style.background=result==='correct'?'var(--correct)':result==='present'?'var(--present)':'var(--absent)';
            b.style.color='#021012';
          }
        }
      }
    }

    function getTile(r,c){return boardEl.querySelector(`.tile[data-row='${r}'][data-col='${c}']`);}
    function showMessage(t,time=2000){msgEl.textContent=t;if(time>0)setTimeout(()=>{if(!gameOver)msgEl.textContent='Use o teclado ou clique nas teclas abaixo. Pressione ENTER para enviar.';},time);}
    function gameWin(){gameOver=true;showMessage('Parabéns — você acertou!');stopTimer();}
    function gameLose(){gameOver=true;showMessage('Fim de jogo — a palavra era: '+solution);stopTimer();}

    // TIMER
    function startTimer(){
      stopTimer();
      timeRemaining=HARD_TIME;
      timeLeftEl.textContent=timeRemaining;
      timerEl.classList.remove('hidden');
      timerInterval=setInterval(()=>{
        timeRemaining--;
        timeLeftEl.textContent=timeRemaining;
        if(timeRemaining<=0){
          clearInterval(timerInterval);
          timerInterval=null;
          if(!gameOver){gameOver=true;showMessage('Tempo esgotado! A palavra era: '+solution);}
        }
      },1000);
    }
    function stopTimer(){if(timerInterval)clearInterval(timerInterval);timerInterval=null;timerEl.classList.add('hidden');}

    // teclado físico
    window.addEventListener('keydown',e=>{
      if(gameOver) return;
      if(e.key==='Enter') return submitGuess();
      if(e.key==='Backspace') return backspace();
      const k=e.key.toUpperCase();
      if(k.length===1&&k>='A'&&k<='Z') addLetter(k);
    });