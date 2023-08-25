let ldaData = []; // array with values per cluster
let sgdData = [];

let numbOfInterclassPlots = 0;
let currentInterclassCluster = 0;

/**
 * Starting point for showing the pairwise differentiating features per cluster.
 *
 * @param interclassData - the data that holds the pairwise cluster differences.
 */
function d3InterclassValues(interclassData) {
    if (typeof (interclassData) == "string") {
        interclassData = parseDataToJson(interclassData);
    }
    numbOfInterclassPlots = 1;
    ldaData = interclassData[0];
    sgdData = interclassData[1];
}

/**
 * Show interclass differences for the specified cluster pair as a ranked list.
 *
 * @param clusterNr - the specified cluster pair to show the differentiating features for.
 */
function d3SingleInterclassPlot(clusterNr) {
    currentInterclassCluster = clusterNr;
    let clusterFound = false;
    let currentData = ldaData;
    if (selectedInterclass === interclass.SGD) {
        currentData = sgdData;
    }
    let sorted;
    let curr;
    for (let clusterID = 0; !clusterFound && clusterID < currentData.length; clusterID++) {
        curr = currentData[clusterID];

        if (curr[0].cluster === clusterNr) {
            d3.select("#shapInterPlot").remove();
            sorted = currentData[clusterID].sort((prev, next) => next.value - prev.value);
            showBarPlot(currentData[clusterID].slice(0, TF), clusterNr.toString(), "gray");
            clusterFound = true;
        }
    }
}

/**
 * Update the interclass plot by removing and recreating it.
 *
 * @param data - the data to use for the interclass plot.
 * @param clusterNr - the cluster pair to show the clustering differences for.
 */
function updateSingleInterclassPlot(data, clusterNr) {
    let clusterFound = false;
    let currentData = data;

    let curr;
    let sorted;
    if (data.length > 0 && data[0].length === 0) {
        d3.select("#shapInterPlot").remove();
        showBarPlot([], clusterNr.toString(), "gray");
        console.log("No dataset is selected.");

    } else {
        for (let clusterID = 0; !clusterFound && clusterID < currentData.length; clusterID++) {
            curr = currentData[clusterID];
            if (curr.length > 0 && curr[0].cluster === clusterNr) {
                d3.select("#shapInterPlot").remove();
                sorted = currentData[clusterID].sort((prev, next) => next.value - prev.value);
                showBarPlot(currentData[clusterID].slice(0, TF), clusterNr.toString(), "gray");
                clusterFound = true;
            }
        }
    }
}

/**
 * Called, when the interclass dropdown method is changed to update the data in the bar chart accordingly.
 */
function interclassDropdownChanged() {
    const interclassElem = document.getElementById("interclassDropdown");
    selectedInterclass = interclassElem.options[interclassElem.selectedIndex].value;
    console.log("Interclass dropdown changed to: ", selectedInterclass);
    let interD = getInterclassDataOfMarkedCheckboxes();
    updateSingleInterclassPlot(interD, currentInterclassCluster);
}

/**
 * Get the filtered bar chart data of the interclass values by considering the selection of the checkboxes.
 *
 * @returns {*[]} the interclass data filtered by the checkboxes.
 */
function getInterclassDataOfMarkedCheckboxes() {
    const radiomicsCheckbox = document.getElementById("radiomicsCheckBoxOnShapPlot");
    const genomicsCheckbox = document.getElementById("genomicsCheckBoxOnShapPlot");
    const clinicalCheckbox = document.getElementById("clinicalCheckBoxOnShapPlot");

    let result = [];
    let filteredData = [];
    let singlePlotData = ldaData;
    let cluster_res;

    console.log("SELECTED Interclass: ", selectedInterclass)
    if (selectedInterclass === interclass.SGD) {
        singlePlotData = sgdData;
    }
    singlePlotData.forEach(cluster => {
        cluster_res = [];
        cluster.forEach(element => {

            let dsIcon = getIndicationOfDataset(element.feature)
            if (radiomicsCheckbox.checked && dsIcon === radiomicIcon) {
                filteredData.push(element);

            } else if (genomicsCheckbox.checked && dsIcon === genomicIcon) {
                filteredData.push(element);

            } else if (clinicalCheckbox.checked && dsIcon === clinicalIcon) {
                filteredData.push(element);
            }
        });
        cluster_res.push(filteredData);
        console.log("Cluster res: ", cluster_res)
    });
    result.push(cluster_res[0]);
    return result
}