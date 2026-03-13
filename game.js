(function () {
  'use strict';

  const SUITS = ['♠', '♥', '♦', '♣'];
  const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const RANK = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
  const RED_SUITS = ['♥', '♦'];
  const REVEAL_ANIMATION_MS = 450;
  const REVEAL_FLIP_HALF = 225;
  const POST_REVEAL_DELAY_MS = 900;
  const CARD_FLY_MS = 650;

  function buildDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const value of VALUES) {
        deck.push({ value, suit, rank: RANK[value], isRed: RED_SUITS.includes(suit) });
      }
    }
    return deck;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function giveCardsTo(hand, cards) {
    shuffle(cards).forEach(c => hand.push(c));
  }

  // ----- DOM refs -----
  const homeScreen = document.getElementById('home-screen');
  const gameScreen = document.getElementById('game-screen');
  const onePlayerBtn = document.getElementById('one-player-btn');
  const twoPlayerBtn = document.getElementById('two-player-btn');
  const topLabel = document.getElementById('top-label');
  const bottomLabel = document.getElementById('bottom-label');
  const topCount = document.getElementById('top-count');
  const bottomCount = document.getElementById('bottom-count');
  const topCardEl = document.getElementById('top-card');
  const bottomCardEl = document.getElementById('bottom-card');
  const topWarCardsEl = document.getElementById('top-war-cards');
  const bottomWarCardsEl = document.getElementById('bottom-war-cards');
  const messageEl = document.getElementById('message');
  const battleBtn = document.getElementById('battle-btn');
  const keyHint = document.getElementById('key-hint');
  const warRevealHint = document.getElementById('war-reveal-hint');
  const warOverlay = document.getElementById('war-overlay');
  const warRevealOverlay = document.getElementById('war-reveal-overlay');
  const warRevealText = document.getElementById('war-reveal-text');
  const warRevealBtn = document.getElementById('war-reveal-btn');
  const resultOverlay = document.getElementById('result-overlay');
  const resultTitle = document.getElementById('result-title');
  const playAgainBtn = document.getElementById('play-again-btn');

  let gameMode = null; // 'one' | 'two'
  let topHand = [];
  let bottomHand = [];
  let currentTopCard = null;
  let currentBottomCard = null;
  let topRevealed = false;
  let bottomRevealed = false;
  let isInWar = false;
  let warPot = [];
  let warPhase = null; // null | 'face-down' | 'reveal'
  let warTopCard = null;
  let warBottomCard = null;
  let awaitingKeyReveal = false;

  function showHome() {
    homeScreen.classList.remove('hidden');
    gameScreen.classList.add('hidden');
  }

  function showGame() {
    homeScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
  }

  function setLabels() {
    if (gameMode === 'one') {
      topLabel.textContent = 'Computer';
      bottomLabel.textContent = 'You';
    } else {
      topLabel.textContent = 'Player 1 (A)';
      bottomLabel.textContent = 'Player 2 (L)';
    }
  }

  function updateCounts() {
    topCount.textContent = topHand.length;
    bottomCount.textContent = bottomHand.length;
  }

  function setMessage(text) {
    messageEl.textContent = text;
  }

  function setCardBack(el) {
    el.textContent = '◆';
    el.className = 'card back';
  }

  function setCardFace(el, card) {
    el.textContent = card.value + ' ' + card.suit;
    el.className = 'card face-up' + (card.isRed ? ' red' : '');
  }

  function animateRevealCard(el, card, onDone) {
    el.classList.add('revealing');
    setTimeout(() => {
      setCardFace(el, card);
      el.classList.remove('back');
    }, REVEAL_FLIP_HALF);
    setTimeout(() => {
      el.classList.remove('revealing');
      el.classList.add('revealed');
      if (onDone) onDone();
    }, REVEAL_ANIMATION_MS);
  }

  function clearSlots() {
    setCardBack(topCardEl);
    setCardBack(bottomCardEl);
    topCardEl.classList.remove('revealed');
    bottomCardEl.classList.remove('revealed');
    currentTopCard = null;
    currentBottomCard = null;
    topRevealed = false;
    bottomRevealed = false;
  }

  function clearWarFaceDown() {
    topWarCardsEl.innerHTML = '';
    bottomWarCardsEl.innerHTML = '';
  }

  function showWarFaceDownAnimation() {
    topWarCardsEl.innerHTML = '';
    bottomWarCardsEl.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const t = document.createElement('div');
      t.className = 'card-back-mini';
      topWarCardsEl.appendChild(t);
      const b = document.createElement('div');
      b.className = 'card-back-mini';
      bottomWarCardsEl.appendChild(b);
    }
  }

  function startNewGame(mode) {
    gameMode = mode;
    const deck = shuffle(buildDeck());
    topHand = deck.slice(0, 26);
    bottomHand = deck.slice(26);
    isInWar = false;
    warPot = [];
    warPhase = null;
    warTopCard = null;
    warBottomCard = null;
    awaitingKeyReveal = false;
    setLabels();
    updateCounts();
    clearSlots();
    clearWarFaceDown();
    resultOverlay.classList.add('hidden');
    warRevealOverlay.classList.add('hidden');
    warRevealHint.classList.add('hidden');
    if (mode === 'one') {
      battleBtn.classList.remove('hidden');
      keyHint.classList.add('hidden');
      setMessage('Click Battle to play a round.');
      battleBtn.disabled = false;
    } else {
      battleBtn.classList.add('hidden');
      keyHint.classList.remove('hidden');
      setMessage('Player 1: press A — Player 2: press L');
    }
    showGame();
  }

  function checkGameOver() {
    const topEmpty = topHand.length === 0;
    const bottomEmpty = bottomHand.length === 0;
    if (topEmpty || bottomEmpty) {
      if (gameMode === 'one') {
        battleBtn.disabled = true;
        resultTitle.textContent = bottomEmpty ? 'Computer wins.' : 'You win!';
      } else {
        resultTitle.textContent = bottomEmpty ? 'Player 1 wins!' : 'Player 2 wins!';
      }
      resultOverlay.classList.remove('hidden');
    }
  }

  function finishRoundWithFly(winnerIsTop, wonCards, message) {
    setMessage(message);
    topCardEl.classList.remove('revealed');
    bottomCardEl.classList.remove('revealed');
    topCardEl.classList.add(winnerIsTop ? 'fly-to-top' : 'fly-to-bottom');
    bottomCardEl.classList.add(winnerIsTop ? 'fly-to-top' : 'fly-to-bottom');
    const winnerHand = winnerIsTop ? topHand : bottomHand;
    setTimeout(() => {
      giveCardsTo(winnerHand, wonCards);
      clearSlots();
      topCardEl.classList.remove('fly-to-top', 'fly-to-bottom');
      bottomCardEl.classList.remove('fly-to-top', 'fly-to-bottom');
      updateCounts();
      checkGameOver();
      if (gameMode === 'two') {
        setMessage('Player 1: press A — Player 2: press L');
      } else {
        setMessage('Click Battle to play a round.');
      }
    }, CARD_FLY_MS);
  }

  function doBattleRevealAndResolve() {
    setTimeout(() => {
      if (currentTopCard.rank > currentBottomCard.rank) {
        finishRoundWithFly(true, [currentTopCard, currentBottomCard],
          gameMode === 'one' ? 'Computer takes the round.' : 'Player 1 takes the round.');
      } else if (currentBottomCard.rank > currentTopCard.rank) {
        finishRoundWithFly(false, [currentTopCard, currentBottomCard],
          gameMode === 'one' ? 'You take the round.' : 'Player 2 takes the round.');
      } else {
        startWar();
      }
    }, POST_REVEAL_DELAY_MS);
  }

  function startWar() {
    warPot = [currentTopCard, currentBottomCard];
    currentTopCard = null;
    currentBottomCard = null;
    setCardBack(topCardEl);
    setCardBack(bottomCardEl);
    topCardEl.classList.remove('revealed');
    bottomCardEl.classList.remove('revealed');
    isInWar = true;
    warOverlay.classList.remove('hidden');
    setMessage('War!');
    setTimeout(() => {
      warOverlay.classList.add('hidden');
      warPhase = 'face-down';
      runWarFaceDown();
    }, 800);
  }

  const faceDownCount = 3;
  const cardsNeededForWar = faceDownCount + 1;

  function runWarFaceDown() {
    if (topHand.length < cardsNeededForWar || bottomHand.length < cardsNeededForWar) {
      resolveWarShortCards();
      return;
    }
    const pFaceDown = topHand.splice(0, faceDownCount);
    const cFaceDown = bottomHand.splice(0, faceDownCount);
    warPot.push(...pFaceDown, ...cFaceDown);
    warTopCard = topHand.shift();
    warBottomCard = bottomHand.shift();
    warPot.push(warTopCard, warBottomCard);
    updateCounts();
    showWarFaceDownAnimation();
    setCardBack(topCardEl);
    setCardBack(bottomCardEl);
    warPhase = 'reveal';
    topRevealed = false;
    bottomRevealed = false;
    if (gameMode === 'one') {
      setMessage('Click Battle to reveal the war cards.');
      battleBtn.disabled = false;
      warRevealText.textContent = 'Click Battle to reveal';
      warRevealBtn.classList.remove('hidden');
      warRevealOverlay.classList.remove('hidden');
    } else {
      setMessage('Player 1: A to reveal — Player 2: L to reveal');
      warRevealHint.textContent = 'Player 1: press A — Player 2: press L';
      warRevealHint.classList.remove('hidden');
      warRevealText.textContent = 'Player 1: press A — Player 2: press L to reveal';
      warRevealBtn.classList.add('hidden');
      warRevealOverlay.classList.remove('hidden');
      awaitingKeyReveal = true;
    }
  }

  function resolveWarShortCards() {
    const pShort = topHand.length < cardsNeededForWar;
    const cShort = bottomHand.length < cardsNeededForWar;
    const pCards = topHand.splice(0, topHand.length);
    const cCards = bottomHand.splice(0, bottomHand.length);
    const all = warPot.concat(pCards, cCards);
    if (pShort && cShort) {
      giveCardsTo(topHand, all.slice(0, Math.floor(all.length / 2)));
      giveCardsTo(bottomHand, all.slice(Math.floor(all.length / 2)));
    } else if (pShort) {
      giveCardsTo(bottomHand, all);
    } else {
      giveCardsTo(topHand, all);
    }
    warPot = [];
    isInWar = false;
    warPhase = null;
    warTopCard = null;
    warBottomCard = null;
    clearSlots();
    clearWarFaceDown();
    updateCounts();
    setMessage('Short on cards—pot split or awarded.');
    warRevealOverlay.classList.add('hidden');
    warRevealHint.classList.add('hidden');
    awaitingKeyReveal = false;
    if (gameMode === 'one') battleBtn.disabled = false;
    checkGameOver();
  }

  function resolveWarAfterReveal() {
    const topWins = warTopCard.rank > warBottomCard.rank;
    const bottomWins = warBottomCard.rank > warTopCard.rank;
    if (topWins || bottomWins) {
      setMessage(gameMode === 'one'
        ? (topWins ? 'Computer wins the war.' : 'You win the war!')
        : (topWins ? 'Player 1 wins the war!' : 'Player 2 wins the war!'));
      topCardEl.classList.remove('revealed');
      bottomCardEl.classList.remove('revealed');
      topCardEl.classList.add(topWins ? 'fly-to-top' : 'fly-to-bottom');
      bottomCardEl.classList.add(topWins ? 'fly-to-top' : 'fly-to-bottom');
      const winnerHand = topWins ? topHand : bottomHand;
      setTimeout(() => {
        giveCardsTo(winnerHand, warPot);
        warPot = [];
        isInWar = false;
        warPhase = null;
        warTopCard = null;
        warBottomCard = null;
        clearSlots();
        topCardEl.classList.remove('fly-to-top', 'fly-to-bottom');
        bottomCardEl.classList.remove('fly-to-top', 'fly-to-bottom');
        clearWarFaceDown();
        updateCounts();
        warRevealOverlay.classList.add('hidden');
        warRevealHint.classList.add('hidden');
        awaitingKeyReveal = false;
        if (gameMode === 'one') battleBtn.disabled = false;
        checkGameOver();
        if (gameMode === 'two') setMessage('Player 1: press A — Player 2: press L');
      }, CARD_FLY_MS);
      return;
    }
    warPot = [];
    setMessage('Another war!');
    warOverlay.classList.remove('hidden');
    setTimeout(() => {
      warOverlay.classList.add('hidden');
      warPhase = 'face-down';
      runWarFaceDown();
    }, 700);
  }

  function doWarRevealOnePlayer() {
    warRevealOverlay.classList.add('hidden');
    animateRevealCard(topCardEl, warTopCard, () => {});
    animateRevealCard(bottomCardEl, warBottomCard, () => {
      setTimeout(resolveWarAfterReveal, POST_REVEAL_DELAY_MS);
    });
  }

  function doWarRevealTwoPlayer(side) {
    if (side === 'top' && !topRevealed && warTopCard) {
      topRevealed = true;
      animateRevealCard(topCardEl, warTopCard, () => {});
    }
    if (side === 'bottom' && !bottomRevealed && warBottomCard) {
      bottomRevealed = true;
      animateRevealCard(bottomCardEl, warBottomCard, () => {});
    }
    if (topRevealed && bottomRevealed) {
      awaitingKeyReveal = false;
      warRevealHint.classList.add('hidden');
      warRevealOverlay.classList.add('hidden');
      setTimeout(resolveWarAfterReveal, POST_REVEAL_DELAY_MS);
    }
  }

  // ----- 1-player: Battle click -> draw both, reveal one then other, then resolve
  function battle() {
    if (isInWar && warPhase === 'reveal') {
      doWarRevealOnePlayer();
      return;
    }
    if (isInWar) return;
    if (topHand.length === 0 || bottomHand.length === 0) {
      checkGameOver();
      return;
    }
    currentTopCard = topHand.shift();
    currentBottomCard = bottomHand.shift();
    setCardBack(topCardEl);
    setCardBack(bottomCardEl);
    battleBtn.disabled = true;
    setMessage('...');
    updateCounts();
    animateRevealCard(topCardEl, currentTopCard, () => {
      animateRevealCard(bottomCardEl, currentBottomCard, () => {
        doBattleRevealAndResolve();
        battleBtn.disabled = false;
      });
    });
  }

  // ----- 2-player: A/L to reveal; first keypress draws both and reveals that side, second reveals the other
  function revealTwoPlayer(side) {
    if (isInWar && warPhase === 'reveal' && awaitingKeyReveal) {
      doWarRevealTwoPlayer(side);
      return;
    }
    if (isInWar) return;
    if (topHand.length === 0 || bottomHand.length === 0) {
      checkGameOver();
      return;
    }
    const needToDraw = currentTopCard === null && currentBottomCard === null;
    if (needToDraw) {
      currentTopCard = topHand.shift();
      currentBottomCard = bottomHand.shift();
      setCardBack(topCardEl);
      setCardBack(bottomCardEl);
      topRevealed = false;
      bottomRevealed = false;
      updateCounts();
    }
    if (side === 'top' && currentTopCard !== null && !topRevealed) {
      topRevealed = true;
      animateRevealCard(topCardEl, currentTopCard, () => {
        if (bottomRevealed) doBattleRevealAndResolve();
      });
    }
    if (side === 'bottom' && currentBottomCard !== null && !bottomRevealed) {
      bottomRevealed = true;
      animateRevealCard(bottomCardEl, currentBottomCard, () => {
        if (topRevealed) doBattleRevealAndResolve();
      });
    }
  }

  document.addEventListener('keydown', (e) => {
    if (!gameScreen.classList.contains('hidden') && gameMode === 'two') {
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        revealTwoPlayer('top');
      }
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        revealTwoPlayer('bottom');
      }
    }
  });

  onePlayerBtn.addEventListener('click', () => startNewGame('one'));
  twoPlayerBtn.addEventListener('click', () => startNewGame('two'));
  battleBtn.addEventListener('click', battle);
  warRevealBtn.addEventListener('click', () => {
    if (gameMode === 'one' && isInWar && warPhase === 'reveal') doWarRevealOnePlayer();
  });
  playAgainBtn.addEventListener('click', () => {
    resultOverlay.classList.add('hidden');
    startNewGame(gameMode);
  });

  showHome();
})();
