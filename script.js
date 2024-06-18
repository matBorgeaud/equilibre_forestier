var boutonArbre = document.getElementById("abattreArbre");
//var compteurArbre = 0;
var compteurArgent = 0;
var prixArbre = 1;
var vitesseAbattage;
var efficacite = 1;
const CLICK_JUMP = 1.05;


// boutonArbre.addEventListener("click", function(){
//     vitesseAbattage = 1 + vitesseDonneeParBonus;
//     console.log(vitesseAbattage)
//     compteurArbre = compteurArbre + vitesseAbattage
//     console.log("nombre d'arbres abattus: " + compteurArbre)
    
// })


function vendreArbe(nombreArbreVendu) {
    if (nombreArbreVendu <= compteurArbre) {
        compteurArgent += nombreArbreVendu*prixArbre
        compteurArbre -= nombreArbreVendu
        console.log("argent disponible: " + compteurArgent)
        console.log("nombre arbres vendus: " + nombreArbreVendu)  
    }
    else
        console.log("pas assez d'arbres disponibles")
    
}