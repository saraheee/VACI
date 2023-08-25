let number_of_default_features = 3;
let defaultDataToShow = [];

/**
 * Show scores of an active patient selection on the scatterplot for the specified feature.
 *
 * @param feature - the feature specified.
 */
function showPatientScoresOfSelection(feature) {
    defaultDataToShow = featuresPerDataset['clinical'].slice(0, number_of_default_features);
    let patientData = getAllPatientData();

    let selectedPatients = [];
    selectedIndices.forEach((ind) => {
        selectedPatients.push(patientData[ind]);
    });

    if (!defaultDataToShow.includes(feature)) {
        defaultDataToShow.push(feature);
    }

    for (let i = 0; i < defaultDataToShow.length; i++) {
        d3.select("#miniPlot").remove();
    }
    let featureMap = getPatientsFeatureMap();
    defaultDataToShow.forEach((singleFeatureName) => {
        // shallow copy to not modify the original order
        let singleFeatureData = Array.from(featureMap.get(singleFeatureName));
        singleFeatureData = singleFeatureData.sort(function (a, b) {
            return a - b;
        });
        let minFeatureValue = singleFeatureData[0];
        let maxFeatureValue = singleFeatureData[singleFeatureData.length - 1];

        const numBins = 5;
        const binSize = Math.round((maxFeatureValue - minFeatureValue) / numBins);

        let singleFeatureObject = [];

        let min = minFeatureValue;
        let max = minFeatureValue + binSize;
        let counter = 0;

        let isLastElem;
        for (let i = 0; i < singleFeatureData.length; i++) {
            let f = singleFeatureData[i];
            if (f >= min && f < max) {
                counter++;
            } else {
                let singleFeatureElem = {};
                isLastElem = i === singleFeatureData.length - 1;
                singleFeatureElem.feature = min + "-" + (isLastElem ? max : max - 1);
                singleFeatureElem.value = isLastElem ? counter + 1 : counter;
                singleFeatureObject.push(singleFeatureElem);

                counter = 1;
                min += binSize;
                max += binSize;
            }
        }
        showBars(singleFeatureObject, singleFeatureName, selectedPatients);
    });
}

/**
 * Show bar charts for the active patient selection on the scatterplot.
 *
 * @param cohortDataOfFeature - the patient data of a feature.
 * @param currentFeatureName - the name of the feature.
 * @param selectedPatients - the patients selected on the scatterplot.
 */
function showBars(cohortDataOfFeature, currentFeatureName, selectedPatients) {
    d3.select("#interclassPlot").remove();
    d3.select("#topGenesPlot").remove();
    d3.select("#distributionPyramid").remove();
    d3.select("#clusterComparison").remove();

    const margin = { top: 30, right: 30, bottom: 70, left: 60 },
        width = 230 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

    const svg = d3.select("#patientScoreArea")
        .append("svg")
        .attr("id", "miniPlot")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.top + 20)
        .attr("class", "title")
        .attr("text-anchor", "middle")
        .text(currentFeatureName)
        .attr("font-size", "18px");

    const x = d3
        .scaleBand()
        .range([0, width])
        .domain(cohortDataOfFeature.map((d) => d.feature))
        .padding(0.2);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .attr("fill", "black")
        .style("text-anchor", "end");

    const y = d3.scaleLinear().domain([0, 30]).range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .attr("fill", "black")
        .attr("font-size", "8px");

    svg.selectAll("bars")
        .data(cohortDataOfFeature)
        .join("rect")
        .attr("x", (d) => x(d.feature))
        .attr("y", (d) => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", (d) => height - y(d.value))
        .attr("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", 1);

    let patientValuesOfFeature;
    if (selectedIndices.length > 0) {
        let selectedFeatureObject = [];
        patientValuesOfFeature = [];
        let labelsPerPatient = []

        selectedPatients.forEach((patient) => {
            let patientLabel;
            let featureValueOfPatient;
            if (patient !== undefined) {
                featureValueOfPatient = patient[currentFeatureName];
                patientValuesOfFeature.push(featureValueOfPatient);

                let patientInd = patient.index
                if (patientInd < clusterLabelData.length) {
                    patientLabel = clusterLabelData[patientInd].label
                    labelsPerPatient.push(patientLabel)
                }
            }

        });

        // show selected bars on top
        let selectedFeatureElem = {};
        cohortDataOfFeature.forEach((group) => {

            let range = group.feature.split("-");
            let min = range[0];
            let max = range[1];

            let valueCounterPerCluster = new Array(numberOfClusters).fill(0);

            let patientValue;
            for (let i = 0; i < patientValuesOfFeature.length; i++) {
                patientValue = patientValuesOfFeature[i];
                if (patientValue >= min && patientValue <= max) {
                    let patientLabel = labelsPerPatient[i];
                    valueCounterPerCluster[patientLabel]++;
                }
            }

            let clusterCount;
            if (valueCounterPerCluster.length > 0) {
                for (let i = 0; i < valueCounterPerCluster.length; i++) {
                    clusterCount = valueCounterPerCluster[i];
                    if (clusterCount > 0) {
                        selectedFeatureElem = {};
                        selectedFeatureElem.feature = group.feature;
                        selectedFeatureElem.value = clusterCount;
                        selectedFeatureElem.cluster = i;

                        selectedFeatureObject.push(selectedFeatureElem);
                    }
                }
            }
        });

        let selectedFeatureObjectAllClusters = new Array(numberOfClusters).fill(0).map(() => []);
        for (let i = 0; i < selectedFeatureObject.length; i++) {
            let cluster = selectedFeatureObject[i].cluster;
            selectedFeatureObjectAllClusters[cluster].push(selectedFeatureObject[i]);
        }
        selectedFeatureObjectAllClusters.forEach(cluster => {
            svg.selectAll("bars")
                .data(cluster)
                .join("rect")
                .attr("x", (d) => x(d.feature) + d.cluster * (x.bandwidth() / (numberOfClusters + 1) + 4))
                .attr("y", (d) => y(d.value))
                .attr("width", x.bandwidth() / (numberOfClusters + 1))
                .attr("height", (d) => height - y(d.value))
                .style("stroke", (d) => colorBrewerScale[d.cluster])
                .style("stroke-width", 3)
                .attr("fill", (d) => {
                    return colorBrewerScale[d.cluster]
                })
        });
    }
}
