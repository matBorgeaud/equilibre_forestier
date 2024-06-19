const database = {
    bonus: [
        { id: 1, name: 'hache', assetLocation: 'assets/image/axe.jpg', prix: 15, vitesse: 0.2, quantite: 0 },
        { id: 2, name: 'tronçonneuse', assetLocation: 'assets/image/motorsaw.png', prix: 50, vitesse: 0.5, quantite: 0 },
        { id: 3, name: 'bûcheron', assetLocation: 'assets/image/lumber.png', prix: 150, vitesse: 2, quantite: 0 },
        { id: 4, name: 'bulldozer', assetLocation: 'assets/image/bulldozer.png', prix: 1500, vitesse: 10, quantite: 0 }
    ],
};


const images = [
    { name: 'layer0', path: 'forest background layers/Forest layer9.png' },
    { name: 'layer1', path: 'forest background layers/Forest layer3.png' },
    { name: 'layer2', path: 'forest background layers/Forest layer1.png' },
    { name: 'layer3', path: 'forest background layers/Forest layer5.png' },
    { name: 'layer4', path: 'forest background layers/Forest layer2.png' },
  ];

const fin = [
    { name: 'layer0', path: 'forest background layers/Forest layer9.png' },
    { name: 'layer1', path: 'forest background layers/Forest layer3.png' },
]

  const treeButton = [
    {name: 'tree1', assetLocation: 'assets/image/tree/tree_2.png'},
    {name: 'tree2', assetLocation: 'assets/image/tree/tree_3.png'}
  ]

var vitesseDonneeParBonus = 0;

function queryDB() {
    database.bonus.forEach(item => {
        let speed = item.vitesse * item.quantite;
        vitesseDonneeParBonus += speed;
        console.log("vitesse donnée par bonus: " + vitesseDonneeParBonus);
    });
}

function resetQuantite(database) {
  database.bonus.forEach(item => {
      item.quantite = 0;
  });
}

queryDB();

