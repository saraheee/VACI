/**
 * Show all patients that are grouped to the specified cluster.
 *
 * @param {integer} clusterID - the ID number of the cluster.
 */
function showPatientsOfClusters(clusterID) {
    let patientData = getAllPatientData();
    let resPatients = "";
    for (let i = 0; i < clusterLabelData.length; i++) {
        if (clusterLabelData[i].label === clusterID) {
            resPatients += patientData[i].pca + " - " + patientData[i].cohort;
            if (i < clusterLabelData.length - 1) {
                resPatients += "  |  \n";
            }
        }
    }
    resPatients.replace(/|([^|]*)$/, '$1');
    document.getElementById("patientArea").style.backgroundColor = colorBrewerScale[clusterID];
    document.getElementById("patientArea").textContent = "";
}

/**
 * Hide patient cluster information from the interface.
 */
function hidePatientsOfClusters() {
    document.getElementById("patientArea").style.backgroundColor = "gray";
    document.getElementById("patientArea").textContent = "";
}

/**
 * Show patient distributions grouped by the scatterplot clusters.
 *
 * @param d - the data that holds the cluster and feature information for all patients.
 */
function showPatientDistributions(d) {
    let clusterID = d.cluster; // cluster number
    let feature = d.feature; // feature name
    let groupedDataObj = groupDataToBins(feature)

    //get groupedData as array of objects; example: { range: "2 - 3", cluster1: 0, cluster2: 12 }
    showFeatureDistributionsPerCluster(feature, clusterID, groupedDataObj);
}

/**
 * Group data into bin ranges to show them in the distribution plot.
 * Identify the count per cluster starting by 1. (The cluster ID of `0` is therefore assigned to `cluster1`.)
 *
 * @param singleFeatureName - the name of the feature to group the data for.
 * @returns {*[]} - the grouped data as an array of objects that holds the ranges and patient count per cluster.
 */
function groupDataToBins(singleFeatureName) {
    let singleFeatureData = Array.from(featureMap.get(singleFeatureName));
    let patientLabels = clusterLabelData.map(clusterLabelData => clusterLabelData.label);

    if (selectedIndices.length > 0) {
        let currentlySelectedSingleFeatureData = [];
        let currentlySelectedLabels = [];
        for (let i = 0; i < selectedIndices.length; i++) {
            let index = selectedIndices[i];
            currentlySelectedSingleFeatureData.push(singleFeatureData[index]);
            currentlySelectedLabels.push(patientLabels[index]);
        }
        singleFeatureData = currentlySelectedSingleFeatureData;
        patientLabels = currentlySelectedLabels;
    }

    let featureValuesWithoutZero = [];
    let patientLabelsWithoutZeroFeatures = [];
    for (let i = 0; i < singleFeatureData.length; i++) {
        let currentFeature = singleFeatureData[i];
        let dataSetType = getIndicationOfDataset(currentFeature);
        if (dataSetType !== genomicIcon || (dataSetType === genomicIcon && currentFeature !== 0)) {
            featureValuesWithoutZero.push(currentFeature);
            patientLabelsWithoutZeroFeatures.push(patientLabels[i]);
        }
    }

    singleFeatureData = featureValuesWithoutZero;
    patientLabels = patientLabelsWithoutZeroFeatures;

    let minFeatureValue = Math.floor(Math.min(...singleFeatureData));
    let maxFeatureValue = Math.ceil(Math.max(...singleFeatureData));

    if(minFeatureValue === maxFeatureValue && minFeatureValue === 0.0) {
        return [];
    }

    const numBins = 32;
    let binSize = ((maxFeatureValue - minFeatureValue) / numBins);
    if (binSize > 0.8 && binSize < 1.2) {
        binSize = 1;
    }

    let r1 = minFeatureValue;
    let r2 = minFeatureValue + binSize

    let maxLabel = Math.max(...patientLabels)
    let clusterCounter = new Array(maxLabel + 1).fill(0);

    let rangeArray = [];
    let currentLabel;
    while (r2 - binSize <= maxFeatureValue) {
        let range = r1 + " - " + (r2 - binSize);

        for (let i = 0; i < singleFeatureData.length; i++) {
            let patientValue = singleFeatureData[i];
            if (patientValue >= r1 && patientValue < r2) {
                currentLabel = patientLabels[i];
                clusterCounter[currentLabel] = clusterCounter[currentLabel] + 1;
            }
        }

        let rangeElem = {};
        rangeElem.range = range;
        for (let j = 0; j <= maxLabel; j++) {
            rangeElem["cluster" + (j + 1)] = clusterCounter[j];
        }
        rangeArray.push(rangeElem);

        clusterCounter = new Array(maxLabel + 1).fill(0);
        r1 += binSize;
        r2 += binSize;
    }
    return rangeArray;
}