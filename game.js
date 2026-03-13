(function () {
  'use strict';

  const SUITS = ['♠', '♥', '♦', '♣'];
  const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const RANK = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
  const RED_SUITS = ['♥', '♦'];

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

  function createCardEl(card, faceUp = true) {
    const div = document.createElement('div');
    div.className = 'card face-up' + (card.isRed ? ' red' : '');
    if (!faceUp) div.classList.add('back');
    div.textContent = faceUp ? card.value + ' ' + card.suit : '◆';
    div.dataset.rank = card.rank;
    return div;
  }

  let playerHand = [];
  let computerHand = [];
  let isInWar = false;
  let warPot = [];

  const computerCountEl = document.getElementById('computer-count');
  const playerCountEl = document.getElementById('player-count');
  const computerSlotEl = document.getElementById('computer-slot');
  const playerSlotEl = document.getElementById('player-slot');
  const computerCardEl = document.getElementById('computer-card');
  const playerCardEl = document.getElementById('player-card');
  const messageEl = document.getElementById('message');
  const battleBtn = document.getElementById('battle-btn');
  const warOverlay = document.getElementById('war-overlay');
  const resultOverlay = document.getElementById('result-overlay');
  const resultTitle = document.getElementById('result-title');
  const playAgainBtn = document.getElementById('play-again-btn');

  function updateCounts() {
    computerCountEl.textContent = computerHand.length;
    playerCountEl.textContent = playerHand.length;
  }

  function giveCardsTo(hand, cards) {
    const shuffled = shuffle(cards);
    shuffled.forEach(c => hand.push(c));
  }

  function showWar(show) {
    if (show) {
      warOverlay.classList.remove('hidden');
      setTimeout(() => {
        warOverlay.classList.add('hidden');
      }, 600);
    }
  }

  function setMessage(text) {
    messageEl.textContent = text;
  }

  function showCards(pc, cc) {
    playerCardEl.textContent = pc.value + ' ' + pc.suit;
    playerCardEl.className = 'card face-up revealed' + (pc.isRed ? ' red' : '');
    computerCardEl.textContent = cc.value + ' ' + cc.suit;
    computerCardEl.className = 'card face-up revealed' + (cc.isRed ? ' red' : '');
  }

  function clearSlots() {
    playerCardEl.textContent = '◆';
    playerCardEl.className = 'card back';
    computerCardEl.textContent = '◆';
    computerCardEl.className = 'card back';
  }

  function resolveWar() {
    const faceDownCount = 3;
    const cardsNeeded = faceDownCount + 1;

    if (playerHand.length < cardsNeeded || computerHand.length < cardsNeeded) {
      const pShort = playerHand.length < cardsNeeded;
      const cShort = computerHand.length < cardsNeeded;
      const pCards = playerHand.splice(0, playerHand.length);
      const cCards = computerHand.splice(0, computerHand.length);
      const all = warPot.concat(pCards, cCards);
      if (pShort && cShort) {
        giveCardsTo(playerHand, all.slice(0, Math.floor(all.length / 2)));
        giveCardsTo(computerHand, all.slice(Math.floor(all.length / 2)));
      } else if (pShort) {
        giveCardsTo(computerHand, all);
      } else {
        giveCardsTo(playerHand, all);
      }
      warPot = [];
      isInWar = false;
      clearSlots();
      updateCounts();
      setMessage('Short on cards—pot split or awarded.');
      checkGameOver();
      return true;
    }

    const pFaceDown = playerHand.splice(0, faceDownCount);
    const cFaceDown = computerHand.splice(0, faceDownCount);
    warPot.push(...pFaceDown, ...cFaceDown);

    const pCard = playerHand.shift();
    const cCard = computerHand.shift();
    warPot.push(pCard, cCard);

    showCards(pCard, cCard);
    updateCounts();

    if (pCard.rank > cCard.rank) {
      giveCardsTo(playerHand, warPot);
      warPot = [];
      isInWar = false;
      setMessage('You win the war!');
      checkGameOver();
      return true;
    }
    if (cCard.rank > pCard.rank) {
      giveCardsTo(computerHand, warPot);
      warPot = [];
      isInWar = false;
      setMessage('Computer wins the war.');
      checkGameOver();
      return true;
    }

    setMessage('Another war!');
    showWar(true);
    return false;
  }

  function doWarLoop() {
    const resolved = resolveWar();
    if (!resolved) setTimeout(doWarLoop, 800);
  }

  function battle() {
    if (playerHand.length === 0 || computerHand.length === 0) {
      checkGameOver();
      return;
    }

    if (isInWar) return;

    const playerCard = playerHand.shift();
    const computerCard = computerHand.shift();

    showCards(playerCard, computerCard);
    updateCounts();

    if (playerCard.rank > computerCard.rank) {
      giveCardsTo(playerHand, [playerCard, computerCard]);
      setMessage('You take the round.');
    } else if (computerCard.rank > playerCard.rank) {
      giveCardsTo(computerHand, [playerCard, computerCard]);
      setMessage('Computer takes the round.');
    } else {
      warPot = [playerCard, computerCard];
      isInWar = true;
      battleBtn.disabled = true;
      setMessage('War!');
      showWar(true);
      setTimeout(() => {
        doWarLoop();
        battleBtn.disabled = false;
      }, 700);
    }

    checkGameOver();
  }

  function checkGameOver() {
    if (computerHand.length === 0) {
      battleBtn.disabled = true;
      resultTitle.textContent = 'You win!';
      resultOverlay.classList.remove('hidden');
    } else if (playerHand.length === 0) {
      battleBtn.disabled = true;
      resultTitle.textContent = 'Computer wins.';
      resultOverlay.classList.remove('hidden');
    }
  }

  function newGame() {
    const deck = shuffle(buildDeck());
    playerHand = deck.slice(0, 26);
    computerHand = deck.slice(26);
    isInWar = false;
    warPot = [];
    clearSlots();
    updateCounts();
    setMessage('Click Battle to play a round.');
    battleBtn.disabled = false;
    resultOverlay.classList.add('hidden');
  }

  battleBtn.addEventListener('click', battle);
  playAgainBtn.addEventListener('click', newGame);

  newGame();
})();
