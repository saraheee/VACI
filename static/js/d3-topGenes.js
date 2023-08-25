/**
 * Determine and show the top gene mutations of the active scatterplot selection through ranking the genes by their
 * frequency. If no patients are actively selected on the scatterplot, rank the genes in all patients.
 */
function topGenesOfSelection() {
    let geneArray = [];
    if (selectedIndices.length < 1) {
        featureMap = getPatientsFeatureMap();
        selectedIndices = Array.from(featureMap.get("index")); // feature indices
    }
    for (const [key, value] of featureMap.entries()) {

        if (key !== "index" && getIndicationOfDataset(key) === genomicIcon) {
            let genesOfSelection = [];

            for (let i = 0; i < selectedIndices.length; i++) {
                let currentIndex = selectedIndices[i];
                genesOfSelection.push(value[currentIndex]);
            }
            let geneObj = {};
            geneObj.feature = key;
            geneObj.value = genesOfSelection.filter(v => v > 0).length;
            geneArray.push(geneObj);
        }
    }
    geneArray.sort((a, b) => b.value - a.value);
    d3.select("#topGenesPlot").remove();
    showBarPlot(geneArray.slice(0, TF), "Top genes", "gray")
}

