// Initialize Kaboom
kaboom({
    background: [135, 206, 235],
    fullscreen: true,
});

// Game constants
const GAME_DURATION = 300; // 5 minutes in seconds
const INITIAL_TREES = 100;
const INITIAL_MONEY = 0;
const INITIAL_TREE_PRICE = 50;
const TREE_PRICE_MULTIPLIER = 1.1; // Price increases as trees are cut
const REGEN_RATE = 0.01; // Percentage of forest regenerated per second
const INITIAL_TOOL_PRICE = 100; // Initial price of the tool
const TOOL_PRICE_INCREASE = 1.15; // Price increase per purchase
const TOOL_CUT_DELAY_REDUCTION = 0.1; // Reduction in cut delay per tool
const REPLANT_COST = 200; // Cost to replant trees
const REPLANT_TIME = 60; // Time for replanted trees to grow (in seconds)

// Game state
let trees = INITIAL_TREES;
let money = INITIAL_MONEY;
let treePrice = INITIAL_TREE_PRICE;
let toolPrice = INITIAL_TOOL_PRICE;
let timeLeft = GAME_DURATION;

// Delays
let cutDelay = 2; // Delay in seconds for cutting a tree
let lastCutTime = 0;

// Replanting state
let replantQueue = [];

// UI Elements
let treesLabel, moneyLabel, timeLabel, cutButton, toolButton, replantButton;

// Helper functions
function updateTreePrice() {
    treePrice = Math.floor(INITIAL_TREE_PRICE * Math.pow(TREE_PRICE_MULTIPLIER, INITIAL_TREES - trees));
}

function cutTree() {
    if (trees > 0 && time() - lastCutTime > cutDelay) {
        trees--;
        money += treePrice;
        updateTreePrice();
        lastCutTime = time();
        console.log("Tree cut! Money earned: $", treePrice);
        updateUI();
    } else if (trees <= 0) {
        console.log("No more trees to cut!");
    } else {
        console.log("Please wait before cutting another tree.");
    }
}

function buyTool() {
    if (money >= toolPrice) {
        money -= toolPrice;
        cutDelay = Math.max(0.5, cutDelay - TOOL_CUT_DELAY_REDUCTION); // Prevent cutDelay from going below 0.5s
        toolPrice = Math.floor(toolPrice * TOOL_PRICE_INCREASE);
        console.log("Tool purchased! New cut delay: ", cutDelay, "s. Next tool price: $", toolPrice);
        updateUI();
    } else {
        console.log("Not enough money to buy the tool. Current money: $", money);
    }
}

function replantTree() {
    if (money >= REPLANT_COST) {
        money -= REPLANT_COST;
        replantQueue.push(time() + REPLANT_TIME);
        console.log("Tree replanted! It will grow in 1 minute.");
        updateUI();
    } else {
        console.log("Not enough money to replant a tree. Current money: $", money);
    }
}

function checkReplantedTrees() {
    const now = time();
    replantQueue = replantQueue.filter(growTime => {
        if (now >= growTime) {
            trees++;
            console.log("A replanted tree has grown! Trees available: ", trees);
            return false;
        }
        return true;
    });
    updateTreePrice();
}

function regenerateForest() {
    trees += Math.floor(trees * REGEN_RATE);
    if (trees > INITIAL_TREES) trees = INITIAL_TREES;
    updateTreePrice();
    console.log("Forest regenerated. Trees available: ", trees);
}

function updateUI() {
    treesLabel.text = `Trees: ${trees}`;
    moneyLabel.text = `Money: $${money}`;
    timeLabel.text = `Time Left: ${Math.ceil(timeLeft)}s`;
    const progress = Math.min(1, (time() - lastCutTime) / cutDelay);
    cutButton.color = trees > 0 && progress < 1
        ? rgb(255 * (1 - progress), 255 * progress, 0)
        : rgb(0, 200, 0);
    cutButton.get("buttonText")[0].text = trees > 0 && progress < 1
        ? `Cutting... ${Math.floor(progress * 100)}%`
        : "Cut Tree";
}

function endGame() {
    if (trees === 0) {
        go("end", "defeat");
    } else if (money >= 10000 && trees >= 20) {
        go("end", "victory");
    } else {
        go("end", "timeout");
    }
}

// Main game scene
scene("main", () => {
    // Labels
    treesLabel = add([text("Trees: 0", { size: 24 }), pos(20, 20)]);
    moneyLabel = add([text("Money: $0", { size: 24 }), pos(20, 50)]);
    timeLabel = add([text("Time Left: 0s", { size: 24 }), pos(20, 80)]);

    // Cut button
    cutButton = add([
        rect(200, 50),
        pos(300, 450),
        color(0, 200, 0),
        area(),
        "cutButton",
        {
            update() {
                const progress = Math.min(1, (time() - lastCutTime) / cutDelay);
                this.color = trees > 0 && progress < 1
                    ? rgb(255 * (1 - progress), 255 * progress, 0)
                    : rgb(0, 200, 0);
            },
        },
    ]);

    cutButton.add([text("Cut Tree", { size: 20 }), anchor("center"), pos(cutButton.width / 2, cutButton.height / 2), "buttonText"]);

    // Tool button
    toolButton = add([
        rect(200, 50),
        pos(300, 520),
        color(200, 200, 0),
        area(),
        "toolButton",
    ]);
    toolButton.add([text("Buy Tool", { size: 20 }), anchor("center"), pos(toolButton.width / 2, toolButton.height / 2)]);

    // Replant button
    replantButton = add([
        rect(200, 50),
        pos(300, 590),
        color(0, 100, 200),
        area(),
        "replantButton",
    ]);
    replantButton.add([text("Replant Tree", { size: 20 }), anchor("center"), pos(replantButton.width / 2, replantButton.height / 2)]);

    // Game loop
    onUpdate(() => {
        timeLeft -= dt();
        if (timeLeft <= 0) {
            endGame();
        }
        checkReplantedTrees();
        updateUI();
    });

    // Forest regeneration
    loop(1, regenerateForest);

    // Button actions
    onClick("cutButton", () => {
        cutTree();
    });

    onClick("toolButton", () => {
        buyTool();
    });

    onClick("replantButton", () => {
        replantTree();
    });

    // Initialize game state
    updateTreePrice();
    updateUI();
});



