// Initialize Kaboom
function getAspectRatioDimensions() {
    const aspectRatio = 16 / 9;
    let width = window.innerWidth;
    let height = window.innerHeight;

    if (width / height > aspectRatio) {
        width = height * aspectRatio;
    } else {
        height = width / aspectRatio;
    }

    return { width, height };
}

// Function to calculate dynamic text size
function getTextSize(baseSize) {
    const baseWidth = 2337;
    const baseHeight = 1315;
    const scaleFactor = Math.min(width / baseWidth, height / baseHeight);
    return baseSize * scaleFactor;
}

const { width, height } = getAspectRatioDimensions();

kaboom({
    background: [0, 0, 0], // Set background to black for margins
    fullscreen: true,
    width: width, // Adapted width for 16:9 aspect ratio
    height: height, // Adapted height for 16:9 aspect ratio
    scale: 1,
    letterbox: true, // Enable letterboxing
});

// === CONSTANTS ===
const GAME_DURATION = 300; // 5 minutes in seconds
const INITIAL_TREES = 90;
const INITIAL_MONEY = 0;
const INITIAL_TREE_PRICE = 50;
const TREE_PRICE_MULTIPLIER = 1.04;
const REGEN_RATE = 0.01;
const INITIAL_TOOL_PRICE = 100;
const TOOL_PRICE_INCREASE = 1.15;
const TOOL_CUT_DELAY_REDUCTION = 0.1;
const REPLANT_COST = 200;
const REPLANT_TIME = 60;
const NATURE_RESERVE_COST = 1000; // Cost to create a reserve
const PROTECTED_TREES = 10; // Trees protected by reserve
const BOYCOTT_THRESHOLD = 12;
const BOYCOTT_PENALTY_TIME = 30;
const BOYCOTT_PENALTY_MULTIPLIER = 4;

// === GAME STATE ===
let trees = INITIAL_TREES;
let money = INITIAL_MONEY;
let treePrice = INITIAL_TREE_PRICE;
let toolPrice = INITIAL_TOOL_PRICE;
let timeLeft = GAME_DURATION;
let cutDelay = 2; // Delay in seconds for cutting a tree
let lastCutTime = -cutDelay; // Initialize to allow immediate cutting
let replantQueue = [];
let protectedTrees = 0;
let treesCut = 0;

// === SPRITE LOADING ===
loadSprite("tree", "assets/image/tree_2.png");
loadSprite("boycott", "assets/image/newspaper.png");
loadSprite("info", "assets/image/info.png");
loadSprite("background", "assets/image/background.png");
loadSprite("pause", "assets/image/pause.png");
loadSprite("play", "assets/image/play.png");

loadSound("cut", "assets/sons/wood_crack.mp3");
loadSound("buy", "assets/sons/buy.mp3");
loadSound("music", "assets/sons/music.mp3");

play("music", {
    loop: true
});

let treeSprites = [];

let boycottProgressBar;
let boycottProgressBarBg;

// === HELPER FUNCTIONS ===

// Update the price of a tree based on the number left
function updateTreePrice() {
    treePrice = Math.floor(INITIAL_TREE_PRICE * Math.pow(TREE_PRICE_MULTIPLIER, INITIAL_TREES - trees));
}

// Dynamically add new trees to the screen
function addNewTrees(count) {
    const screenWidth = width;
    const screenHeight = height;
    const marginX = screenWidth * 0.13; // 10% margin on sides
    const marginTop = screenHeight * 0.17; // 10% margin on top
    const marginBottom = screenHeight * 0.2; // 20% margin on bottom
    const areaWidth = screenWidth - 2 * marginX;
    const areaHeight = screenHeight - marginTop - marginBottom;

    // Calculate tree size dynamically
    const maxTrees = 200;
    const treeWidth = Math.sqrt((areaWidth * areaHeight) / maxTrees);
    const treeHeight = treeWidth * (122 / 110); // Keep original aspect ratio

    // Generate positions for new trees
    let positions = treeSprites.map(tree => tree.pos);
    for (let i = 0; i < count; i++) {
        let x, y, valid;
        do {
            x = Math.random() * (areaWidth - treeWidth) + marginX;
            y = Math.random() * (areaHeight - treeHeight) + marginTop;
            valid = positions.every(pos => {
                const dx = x - pos.x;
                const dy = y - pos.y;
                return Math.sqrt(dx * dx + dy * dy) > treeWidth;
            });
        } while (!valid);
        positions.push({ x, y });

        // Add new tree sprite
        const treeSprite = add([
            sprite("tree", { width: treeWidth, height: treeHeight }),
            pos(x, y),
        ]);
        treeSprites.push(treeSprite);
    }
}

// Remove trees from the screen
function removeTrees(count) {
    for (let i = 0; i < count; i++) {
        const tree = treeSprites.pop();
        if (tree) destroy(tree);
    }
}

// Update the entire UI
function updateUI() {
    // Mise à jour des étiquettes
    treesLabel.text = `Arbres : ${trees - protectedTrees}`;
    protectedTreesLabel.text = `Arbres protégés : ${protectedTrees}`;
    moneyLabel.text = `Argent : $${money}`;
    timeLabel.text = `Temps restant : ${Math.ceil(timeLeft)}s`;
}

// Update the boycott progress bar
function updateBoycottProgressBar() {
    const progress = Math.min(treesCut / BOYCOTT_THRESHOLD, 1);
    boycottProgressBar.width = progress * boycottProgressBarBg.width;
}

// Create a nature reserve
function createNatureReserve() {
    if (money >= NATURE_RESERVE_COST) {
        money -= NATURE_RESERVE_COST;
        protectedTrees += PROTECTED_TREES;
        treesCut = Math.max(0, treesCut - 8);
        updateUI();
    }
}

// === ACTION FUNCTIONS ===

function cutTree() {
    if (trees > protectedTrees && time() - lastCutTime > cutDelay) {
        trees--;
        treesCut++;
        removeTrees(1);
        money += treePrice;
        updateTreePrice();
        lastCutTime = time();
        play("cut"); // Play cut sound
        updateUI();
        if (treesCut >= BOYCOTT_THRESHOLD) {
            triggerBoycott();
        }
    } else if (trees <= protectedTrees) {
        console.log("No more trees to cut! Some trees are protected.");
    }
}

function replantTree() {
    if (money >= REPLANT_COST) {
        money -= REPLANT_COST;
        replantQueue.push(time() + REPLANT_TIME);
        treesCut = Math.max(0, treesCut - 0.5);
        play("buy"); // Play buy sound
        updateUI();
    }
}

function buyTool() {
    if (money >= toolPrice) {
        money -= toolPrice;
        cutDelay = Math.max(0.5, cutDelay - TOOL_CUT_DELAY_REDUCTION);
        toolPrice = Math.floor(toolPrice * TOOL_PRICE_INCREASE);
        play("buy"); // Play buy sound
        updateUI();
    }
}

// Check if replanted trees are ready to grow
function checkReplantedTrees() {
    const now = time();
    const grownTrees = replantQueue.filter(growTime => now >= growTime);
    if (grownTrees.length > 0) {
        replantQueue = replantQueue.filter(growTime => now < growTime);
        trees += grownTrees.length;
        addNewTrees(grownTrees.length);
        updateTreePrice();
        updateUI();
    }
}

// Regenerate the forest over time
function regenerateForest() {
    const regeneratedTrees = Math.floor(trees * REGEN_RATE);
    const treesToAdd = Math.min(regeneratedTrees, INITIAL_TREES - trees);
    trees += treesToAdd;
    addNewTrees(treesToAdd);
    updateTreePrice();
    updateUI();
}

// === BUTTON HANDLING ===
let buttons = [];

function createButton(label, x, y, color, action, infoText) {
    const buttonWidth = width * 0.2;
    const buttonHeight = height * 0.06;
    const infoBubbleHeight = buttonHeight / 2; // Set info bubble height to half the button height
    const button = add([
        rect(buttonWidth, buttonHeight),
        pos(x, y),
        color,
        area(),
        "button",
        { action, originalColor: color, active: true }
    ]);
    const buttonText = button.add([text(label, { size: getTextSize(20), width: buttonWidth - 20 }), anchor("center"), pos(buttonWidth / 2, buttonHeight / 2)]);
    const infoBubble = button.add([
        sprite('info'), 
        anchor("topright"),
        pos(buttonWidth - 10, -10),
        scale(infoBubbleHeight / 16), // Assuming the original height of the info sprite is 16
        area({ scale: 1.5 }),
        "infoBubble",
        { infoText }
    ]);
    infoBubble.onClick(() => {
        showInfoPopup(infoText);
        if (!isPaused) {
            togglePause("infoBubble"); // Ensure the game is paused when infoBubble is clicked
        }
    });
    button.onClick(() => {
        if (button.active) {
            button.action();
        }
    });
    buttons.push({ button, buttonText, infoBubble });
    return { button, buttonText, infoBubble };
}

// Enable or disable all buttons
function setButtonsActive(active) {
    buttons.forEach(({ button }) => {
        button.active = active;
        button.color = active ? button.originalColor : rgb(100, 100, 100);
    });
}

function showInfoPopup(infoText) {
    const popupWidth = width * 0.4;
    const popupHeight = height * 0.3;

    const infoPopup = add([
        rect(popupWidth, popupHeight),
        pos((width - popupWidth) / 2, (height - popupHeight) / 2),
        color(255, 255, 255),
        area(),
        "infoPopup",
    ]);
    const infoTextLabel = infoPopup.add([
        text(infoText, { size: getTextSize(30), width: popupWidth - 40 }),
        pos(20, 20),
        color(0, 0, 0),
    ]);
    const closeButton = infoPopup.add([
        rect(100, 40),
        pos(popupWidth - 120, popupHeight - 60),
        color(200, 0, 0),
        area(),
        "closeButton",
    ]);
    const closeButtonText = closeButton.add([
        text("Fermer", { size: getTextSize(20) }),
        anchor("center"),
        pos(50, 20),
    ]);

    // Pause the game
    togglePause("infoBubble");

    closeButton.onClick(() => {
        destroy(infoPopup);
        if (pauseReason === "infoBubble") {
            togglePause(); // Resume the game only if paused by infoBubble
        }
    });
}

function triggerBoycott() {
    const popupWidth = width * 0.4;
    const popupHeight = height * 0.5;
    const imageSize = Math.min(popupWidth * 0.8, popupHeight * 0.8);
    const buttonWidth = imageSize / 2 - 10; // Two buttons should fit under the image with some margin
    const buttonHeight = height * 0.08;

    const boycottPopup = add([
        rect(popupWidth, popupHeight),
        pos((width - popupWidth) / 2, (height - popupHeight) / 2),
        color(255, 255, 255),
        area(),
        "boycottPopup",
    ]);
    const boycottImage = boycottPopup.add([
        sprite("boycott", { width: imageSize, height: imageSize }),
        pos((popupWidth - imageSize) / 2, 20),
    ]);
    const timePenaltyButton = boycottPopup.add([
        rect(buttonWidth, buttonHeight),
        pos((popupWidth - imageSize) / 2 + 10, popupHeight - buttonHeight - 20),
        color(255, 0, 0),
        area(),
        "timePenaltyButton",
    ]);
    const timePenaltyText = timePenaltyButton.add([
        text("Perdre 30 secondes", { size: getTextSize(20) }),
        anchor("center"),
        pos(buttonWidth / 2, buttonHeight / 2),
    ]);

    const canPay = money >= treePrice * BOYCOTT_PENALTY_MULTIPLIER;
    const moneyPenaltyButton = boycottPopup.add([
        rect(buttonWidth, buttonHeight),
        pos((popupWidth + imageSize) / 2 - buttonWidth - 10, popupHeight - buttonHeight - 20),
        color(canPay ? rgb(0, 255, 0) : rgb(100, 100, 100)),
        area(),
        "moneyPenaltyButton",
    ]);
    const moneyPenaltyText = moneyPenaltyButton.add([
        text(`Payer $${treePrice * BOYCOTT_PENALTY_MULTIPLIER}`, { size: getTextSize(20) }),
        anchor("center"),
        pos(buttonWidth / 2, buttonHeight / 2),
    ]);

    // Pause the game
    const originalCutDelay = cutDelay;
    const originalLastCutTime = lastCutTime;
    cutDelay = Infinity;
    const originalTimeLeft = timeLeft;

    // Disable other buttons
    setButtonsActive(false);

    timePenaltyButton.onClick(() => {
        timeLeft = originalTimeLeft - BOYCOTT_PENALTY_TIME;
        destroy(boycottPopup);
        cutDelay = originalCutDelay; // Resume the game
        lastCutTime = originalLastCutTime; // Restore last cut time
        treesCut = 0; // Reset the counter
        // Enable other buttons
        setButtonsActive(true);
    });

    moneyPenaltyButton.onClick(() => {
        if (canPay) {
            money -= treePrice * BOYCOTT_PENALTY_MULTIPLIER;
            destroy(boycottPopup);
            cutDelay = originalCutDelay; // Resume the game
            lastCutTime = originalLastCutTime; // Restore last cut time
            timeLeft = originalTimeLeft;
            treesCut = 0; // Reset the counter
            // Enable other buttons
            setButtonsActive(true);
        }
    });
}

// === FINAL SCENE ===
function showFinalScene(win) {
    scene("final", () => {
        add([
            text(win ? "Gagné !" : "Perdu", { size: getTextSize(48) }),
            pos(width / 2, height / 4),
            anchor("center"),
        ]);

        add([
            text(`Arbres restants : ${trees}`, { size: getTextSize(24) }),
            pos(width / 2, height / 2 - 40),
            anchor("center"),
        ]);

        add([
            text(`Argent gagné : $${money}`, { size: getTextSize(24) }),
            pos(width / 2, height / 2),
            anchor("center"),
        ]);

        add([
            text(`Temps joué : ${GAME_DURATION - Math.ceil(timeLeft)}s`, { size: getTextSize(24) }),
            pos(width / 2, height / 2 + 40),
            anchor("center"),
        ]);

        const replayButton = add([
            rect(400, 100),
            pos(width / 2, height * 0.75),
            anchor("center"),
            color(0, 0, 0),
            area(),
            "replayButton",
        ]);

        const replayButtonText = replayButton.add([
            text("Rejouer", { size: getTextSize(24) }),
            anchor("center"),
            //pos(200, 50), // Align text with the button
        ]);

        replayButton.onClick(() => {
            resetGame();
            go("main");
        });
    });

    go("final");
}

// Reset game stats
function resetGame() {
    trees = INITIAL_TREES;
    money = INITIAL_MONEY;
    treePrice = INITIAL_TREE_PRICE;
    toolPrice = INITIAL_TOOL_PRICE;
    timeLeft = GAME_DURATION;
    cutDelay = 2;
    lastCutTime = -cutDelay;
    replantQueue = [];
    protectedTrees = 0;
    treesCut = 0;
    treeSprites.forEach(tree => destroy(tree));
    treeSprites = [];
}

// === PAUSE FUNCTIONALITY ===
let isPaused = false;
let originalCutDelay = cutDelay;
let originalLastCutTime = lastCutTime;
let playButton;
let pauseReason = null; // null signifie que le jeu n'est pas en pause.

function togglePause(reason = null) {
    if (!isPaused) {
        // Mise en pause
        isPaused = true;
        pauseReason = reason;
        originalCutDelay = cutDelay;
        originalLastCutTime = lastCutTime;
        cutDelay = Infinity;
        setButtonsActive(false);

        // Afficher le bouton "Play" uniquement si la raison est le bouton "Pause"
        if (reason === "pauseButton") {
            showPlayButton();
        }
    } else {
        // Reprendre le jeu
        isPaused = false;
        pauseReason = null;
        cutDelay = originalCutDelay;
        lastCutTime = originalLastCutTime;
        setButtonsActive(true);

        if (playButton) destroy(playButton); // Supprimer le bouton "Play"
    }
}


function createPauseButton(x, y, size, spriteName, onClickAction) {
    const button = add([
        sprite(spriteName, { width: size, height: size }),
        pos(x, y),
        anchor("top"),
        area(),
        "pauseButton",
    ]);

    button.onClick(() => {
        onClickAction("pauseButton");
    });

    return button;
}

function showPlayButton() {
    const playButtonSize = height / 4;
    playButton = createPauseButton(width / 2, height / 2, playButtonSize, "play", togglePause);
}

// === MAIN GAME SCENE ===
scene("main", () => {
    // Add background image
    const scaleRatio = Math.max(width / 400, height / 225);
    add([
        sprite("background"),
        pos(width / 2, height / 2),
        anchor("center"),
        scale(scaleRatio),
    ]);

    // UI Elements
    treesLabel = add([text("Arbres : 0", { size: getTextSize(28) }), pos(20, 20)]);
    protectedTreesLabel = add([text("Arbres protégés : 0", { size: getTextSize(28) }), pos(20, 60)]);
    moneyLabel = add([text("Argent : $0", { size: getTextSize(28) }), pos(20, 100)]);
    timeLabel = add([text("Temps restant : 0s", { size: getTextSize(28) }), pos(20, 140)]);

    // Boycott progress bar
    add([
        text("Risque de boycott", { size: getTextSize(28) }),
        pos(20, 180),
    ]);
    boycottProgressBarBg = add([
        rect(width * 0.12, 20), // Shortened width
        pos(20, 220),
        color(200, 200, 200),
    ]);
    boycottProgressBar = add([
        rect(0, 20),
        pos(20, 220),
        color(255, 0, 0),
    ]);

    // Pause button
    const pauseButtonSize = height / 12;
    createPauseButton(width - pauseButtonSize - 20, 20, pauseButtonSize, "pause", togglePause);

    // Button dimensions
    const buttonY = height - height * 0.06 - 20;

    // Buttons
    const { button: cutButton, buttonText: cutButtonText } = createButton("Couper un arbre", width * 0.05, buttonY, rgb(255, 0, 0), cutTree, "Coupez un arbre pour gagner de l'argent. Plus les arbres se font rares plus les arbres rapportent de l'argent mais attention le taux de génération est aussi réduit.");
    const { button: toolButton, buttonText: toolButtonText } = createButton(`Acheter un outil ($${toolPrice})`, width * 0.3, buttonY, rgb(200, 200, 0), buyTool, "Achetez des haches pour réduire le délais d'abattage. Attention le prix augmente à chaque achat.");
    const { button: replantButton, buttonText: replantButtonText } = createButton(`Replanter un arbre ($${REPLANT_COST})`, width * 0.55, buttonY, rgb(0, 200, 0), replantTree, "Replantez un arbre en échange d'argent. Attention le temps de croissance est d'une minute, pensez à anticiper vos besoins futurs.");
    const { button: reserveButton, buttonText: reserveButtonText } = createButton(`Créer une réserve ($${NATURE_RESERVE_COST})`, width * 0.8, buttonY, rgb(0, 0, 200), createNatureReserve, "Créez une réserve naturelle pour protéger 10 arbres par réserve. Attention les arbre protégés ne peuvent plus être abattus, mais en échange le risque de boycott est diminué.");

    // === UPDATE BUTTON COLOR AND TEXT BASED ON CUT DELAY ===
    function updateCutButton() {
        const timeSinceLastCut = time() - lastCutTime;
        const progress = Math.min(timeSinceLastCut / cutDelay, 1);
        const red = 255 * (1 - progress);
        const green = 255 * progress;
        cutButton.color = rgb(red, green, 0);
        if (progress < 1) {
            cutButtonText.text = `abattage... ${Math.floor(progress * 100)}%`;
        } else {
            cutButtonText.text = "Couper un arbre";
        }
    }

    // Initialize button state
    updateCutButton();

    // === GAME LOOP ===
    onUpdate(() => {
        if (!isPaused) {
            if (cutDelay !== Infinity) {
                timeLeft -= dt();
            }
            if (timeLeft <= 0 || (money >= 20000 && trees >= 30)) {
                showFinalScene(money >= 20000 && trees >= 30);
            }
            checkReplantedTrees();
            updateCutButton();
            updateUI();
            updateBoycottProgressBar();

            // Update button states based on money
            toolButton.color = money >= toolPrice ? rgb(200, 200, 0) : rgb(100, 100, 100);
            replantButton.color = money >= REPLANT_COST ? rgb(0, 200, 0) : rgb(100, 100, 100);
            reserveButton.color = money >= NATURE_RESERVE_COST ? rgb(0, 0, 200) : rgb(100, 100, 100);

            // Update button texts with prices
            toolButtonText.text = `Acheter un outil ($${toolPrice})`;
            replantButtonText.text = `Replanter un arbre ($${REPLANT_COST})`;
            reserveButtonText.text = `Créer une réserve ($${NATURE_RESERVE_COST})`;
        }
    });

    // Forest regeneration
    loop(1, regenerateForest);

    // Initialize game
    addNewTrees(trees);
    updateTreePrice();
    updateUI();
});

// === INSTRUCTION SCENE ===
scene("instructions", () => {
    // Add background image
    const scaleRatio = Math.max(width / 400, height / 225);
    add([
        sprite("background"),
        pos(width / 2, height / 2),
        anchor("center"),
        scale(scaleRatio),
    ]);

    // Instruction text
    const instructionText = `
Bienvenue dans Équilibre Forestier !

Objectifs :
1. À la fin des 5 minutes, vous devez :
   - Avoir au moins 30 arbres.
   - Posséder 20,000 dollars ou plus.

2. Vous perdez si :
   - Le nombre d'arbres atteint 0 avant la fin du temps.

Attention :
- Le boycott vous fait perdre du temps ou de l'argent.
- Couper des arbres augmente le risque de boycott.
- Replanter des arbres réduit ce risque.

Bonne chance !
`;

    add([
        text(instructionText, { size: getTextSize(38), width: width * 0.8, align: "left" }),
        pos(width / 1.5, height / 2.5),
        anchor("center"),
        color(0, 0, 0), // Set text color to black
    ]);

    // Play button
    const playButton = add([
        rect(300, 70),
        pos(width / 2, height * 0.75),
        anchor("center"),
        color(0, 200, 0),
        area(),
        "playButton",
    ]);

    const playButtonText = playButton.add([
        text("Jouer", { size: getTextSize(44) }),
        anchor("center"),
    ]);

    playButton.onClick(() => {
        go("main");
    });
});

// Start the game with the instruction scene
go("instructions");
