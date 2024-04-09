function calculateHand(mappedCards){
    const handCombos = returnHandCombos(mappedCards);
    let score = 0

    handCombos.suit.forEach(card => {score += card.value})
    
    if (handCombos.icon.length == 3 && score < 31){
        score = 30.5
    }

    return score
}

function testCardCombos(mappedHand, mappedBank, attr){
    let score = 0;
    let combo = [];
    mappedBank.forEach(bankCard => { 
        // skips hand if no match in bank !!! //
        const handFiltered = mappedHand.filter(handCard => bankCard[attr] == handCard[attr] )
        if (handFiltered.length != 0){
            let calcScore = 0;
            if (attr == 'suit'){
                calcScore = bankCard.value;
                handFiltered.forEach(card => calcScore += card.value);
            }
            if (attr == 'icon'){
                calcScore = 1;
                handFiltered.forEach(() => calcScore += 1);
            }
            

            if (calcScore > score){
                score = calcScore;
                combo = [bankCard, ...handFiltered];
            }
        }
        else {
            const handCombos = returnHandCombos(mappedHand);
            let calcScore = 0;
            if (attr == 'suit'){
                // calcScore = bankCard.value;
                handCombos.suit.forEach(card => calcScore += card.value);
            }
            if (attr == 'icon'){
                // calcScore = 1;
                handCombos.icon.forEach(() => calcScore += 1);
            }
            if (calcScore > score){
                score = calcScore;
                combo = [...handCombos[attr]];
            }
        }   
        
    })

    return combo
}


function returnHandCombos(mappedCards){
    let suit = [];
    let icon = [];
    mappedCards.forEach(card => {
        const testSuit = mappedCards.filter(item => item.suit == card.suit);
        if (testSuit.length > suit.length){
            suit = testSuit;
        }
        const testIcon = mappedCards.filter(item => item.icon == card.icon);
        if (testIcon.length > icon.length){
            icon = testIcon;
        }
    })

    return {suit:suit, icon:icon}
}


function pickBestCombo(mappedHand, mappedBank){
    let bestCombo = null;
    const bestSuitCombo = testCardCombos(mappedHand, mappedBank, 'suit');
    // console.log('SUIT',bestSuitCombo);
    const bestIconCombo = testCardCombos(mappedHand, mappedBank, 'icon');
    // console.log('ICON', bestIconCombo);
    
    if (bestSuitCombo.length == bestIconCombo.length){
        if(bestSuitCombo.length != 0 && bestIconCombo.length != 0){
            if (Math.random() > 0.5){
                bestCombo = bestSuitCombo
                console.log('RANDOM SUIT')
            }
            else {
                bestCombo = bestIconCombo
                console.log('RANDOM ICON')
            }
        }
    }

    if(bestSuitCombo.length > bestIconCombo.length){
        bestCombo = bestSuitCombo
    }

    if(bestSuitCombo.length < bestIconCombo.length){
        bestCombo = bestIconCombo
    }

    // console.log('BEST COMBO', bestCombo)

    return bestCombo
}


function pickBankCard(bestCombo){
    let pickedBank = null;
  
    if (bestCombo.length == 4){
        const bankCard = bestCombo[0];
        const handCards = bestCombo.slice(1);
        const lowestValueCard = returnLowestValueCard(handCards);
        if(lowestValueCard.value < bankCard.value){
            pickedBank = bankCard
        }
        else {
            // playerPass()
            pickedBank = 'player_pass'
        }
    }

    if (bestCombo.length == 2 || bestCombo.length == 3){
        pickedBank = bestCombo[0];
    }

    return pickedBank;
}


function returnLowestValueCard(mappedCards){
    let lowestValue = 100;
    let lowestValueCard = null;
    mappedCards.forEach(card => {
        if (card.value < lowestValue){
            lowestValue = card.value;
            lowestValueCard = card;
        }
    })
    return lowestValueCard
}


function returnHighestValueCard(mappedCards){
    let highestValue = 0;
    let highestValueCard = null;
    mappedCards.forEach(card => {
        if (card.value > highestValue){
            highestValue = card.value;
            highestValueCard = card;
        }
    })
    return highestValueCard
}


function pickHandCard(mappedHand, keepCards){
    let pickedHand = null;
    // console.log('KEEP CARDS in hand', keepCards);
    let pickHandCards = mappedHand.filter(card => !keepCards.includes(card));
    if (pickHandCards.length == 0){
        pickHandCards = [...keepCards];
    }

    pickedHand = returnLowestValueCard(pickHandCards);

    return pickedHand;
}


function autoPlayerPass(mappedCards){
    let playerPass = false
    const score = calculateHand(mappedCards);
    if (score >= 29){
        playerPass = true
    }
    if (score >= 26 && score < 29){
        if (Math.random() < 0.74){
            playerPass = true
        }
        else {
            console.log('TAKING A GAMBLE ???')
        }
    }
    return playerPass
}


function takeBank(mappedHand, pickedHand, mappedBank, pickedBank, ){
    const testHand = mappedHand.filter(card => card != pickedHand);
    testHand.push(pickedBank);
    const handScore = calculateHand(testHand);
    const bankScore = calculateHand(mappedBank);

    if (bankScore > handScore){
        if (autoPlayerPass(mappedBank)){
            console.log('AUTO PLAYER BANK SWAP')
            return true
        }
    }
    return false
}


export function autoPlayerPick(mappedHand, mappedBank){
    // let pickedBank = null;
    // let pickedHand = null;
    let pickedBank = [];
    let pickedHand = [];
    const bestCombo = pickBestCombo(mappedHand, mappedBank);
    
    if (!bestCombo){
        // pick highest card bank //
        pickedBank = returnHighestValueCard(mappedBank);
        pickedHand = returnLowestValueCard(mappedHand);

    }
    else {
        pickedBank = pickBankCard(bestCombo);

        if (pickedBank != 'player_pass' && mappedBank.includes(pickedBank)){
            const keepCards = bestCombo.slice(1);
            pickedHand = pickHandCard(mappedHand, keepCards);

        }
        
        else {
            // No Card in Bank (2 or 3 card bestCombo) || pickedBank == player_pass //
            // With 3 card bestCombo or player_pass, autoplayer can deside to take a gamble //
            if (!autoPlayerPass(mappedHand)){
                const keepCards = [...bestCombo];
                pickedHand = pickHandCard(mappedHand, keepCards);
                pickedBank = returnHighestValueCard(mappedBank);


            }
            else {

                // console.log('AUTO PLAYER PASS');
                return {hand: [], bank: []}
            }
        }
    }

    // console.log('PICKED BANK', pickedBank);
    // console.log('PICKED HAND', pickedHand);

    if (takeBank(mappedHand, pickedHand, mappedBank, pickedBank)){
        // pickedHand = Object.keys(mappedHand);
        // pickedBank = Object.keys(mappedBank);
        const hand = [];
        const bank = [];
        for (let i = 0; i < 3; i++){
            hand.push(`${mappedHand[i].suit}_${mappedHand[i].icon}`);
            bank.push(`${mappedBank[i].suit}_${mappedBank[i].icon}`);
        }
        return {hand: hand, bank: bank}
    }
    else {
        return {hand: [`${pickedHand.suit}_${pickedHand.icon}`], bank: [`${pickedBank.suit}_${pickedBank.icon}`]}
    }

    // console.log('PICKED BANK', pickedBank);
    // console.log('PICKED HAND', pickedHand);
    // // 
    // return {hand: `${pickedHand.suit}_${pickedHand.icon}`, bank: `${pickedBank.suit}_${pickedBank.icon}`}
}


