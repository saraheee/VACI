console.log("Application started");

const urls = [scatterPlotDataUrl, scatterPlotHoverDataUrl, clusterDataUrl, shapDataUrl, interclassDataUrl, dataTagUrl];
Promise.all(urls.map(url => d3.json(url))).then(run);

/**
 * Starting point of the frontend. Assign the datasets to the respective methods.
 *
 * @param dataset - the datasets received from the backend.
 */
function run(dataset) {
    d3ScatterPlot(dataset[0], dataset[1], dataset[5]);
    d3ShapValues(dataset[3]);
    d3InterclassValues(dataset[4]);
    d3Heatmap(dataset[3], dataset[4]);
}

/**
 * Show the content of the selected tab view.
 *
 * @param evt - the event of the tab change.
 * @param tabName - the name of the selected tab.
 */
function openTab(evt, tabName) {
    let i, tabcontent, tablinks;

    // Hide tab content
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Make tab links inactive
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the selected tab and make the tab button active
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

