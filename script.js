// TOGGLE GUI
document.getElementById("toggle-gui").addEventListener('click', (event) => {
    var gui = document.getElementById("gui");
    console.log(gui.style.visibility)
    gui.style.visibility = (gui.style.visibility == 'visible') ? 'hidden' : 'visible';
});


// SETTINGS
var focusOnNewTransactions = true;
var currentTrasactionID = 0;
var maxNumTransactions = 100;
var minAmountLog = 0.1;
var focusTransactionMin = 0.05;

document.getElementById("toggleFocusCheckbox").checked = focusOnNewTransactions;
document.getElementById("toggleFocusCheckbox").addEventListener('click', (event) => {
    focusOnNewTransactions = document.getElementById("toggleFocusCheckbox").checked
});

function toggleFocus(newState) {
    focusOnNewTransactions = newState;
    document.getElementById("toggleFocusCheckbox").checked = focusOnNewTransactions;
}

document.getElementById("focusTransactionMin").value = focusTransactionMin;
document.getElementById("focusTransactionMin").addEventListener('input', (event) => {
    focusTransactionMin = document.getElementById("focusTransactionMin").value;
});

document.getElementById("logTransactionMin").value = minAmountLog;
document.getElementById("logTransactionMin").addEventListener('input', (event) => {
    minAmountLog = document.getElementById("logTransactionMin").value;
});

document.getElementById("maxNumTransactions").value = maxNumTransactions;
document.getElementById("maxNumTransactions").addEventListener('input', (event) => {
    maxNumTransactions = document.getElementById("maxNumTransactions").value;
});

// STATS
var totalNumTransactions = 0;
var totalAmountTransactions = 0;

setInterval(function() {
    document.getElementById("numPlottedTransactions").innerHTML = gData.length;
    document.getElementById("totalNumTransactions").innerHTML = totalNumTransactions;
    document.getElementById("averageAmountTransactions").innerHTML = (totalAmountTransactions / totalNumTransactions).toFixed(2);
}, 500); // refreshed every few seconds

const gData = [];
const getAltitude = d => {
    return 0.01 * (Math.log(d.amount + 0.07) + 2.718);
}
const getTooltip = data => `
                <div>
                    <b>amount: ${data.amount}btc</b> <br>
                    ip: ${data.ip}<br>
                    ${data.lat} ${data.lng}<br>
                </div>
            `;

// GLOBE SETUP
const elem = document.getElementById('globeViz');
const globe = Globe()
    .backgroundColor('black')
    .globeImageUrl("img/terrain.jpg")
    .bumpImageUrl("img/bump.png")
    .showGraticules(true)
    .showAtmosphere(true)
    .labelText('amount')
    .labelSize(1.5)
    .labelDotRadius(0.25)
    .labelLabel(getTooltip)
    //.onLabelHover(label => elem.style.cursor = label ? 'pointer' : null)
    //.onLabelClick(d => window.open(d.url, '_blank')) TODO: Show transaction details from a transaction explorer website
    .pointsData(gData)
    .pointRadius(0.1)
    .pointResolution(15)
    .pointsMerge(true)
    .pointsTransitionDuration(1000)
    .pointAltitude(getAltitude)
    .pointColor("color")
    (elem);

// NEW DATA HANDLING
var socket = new WebSocket("wss://blocks.wizb.it/ws", [
    "protocolOne",
    "protocolTwo",
]);
socket.onopen = function(event) {
    document.getElementById("connecting").remove()
}
socket.onmessage = function(event) {

    var msg = JSON.parse(event.data);
    if (!msg.amount) return;

    totalNumTransactions++;
    totalAmountTransactions += parseFloat(msg.amount);

    // Append data to array to display in globe
    gData.push({
        lat: msg.lat,
        lng: msg.lon,
        ip: msg.relay,
        id: currentTrasactionID,
        amount: parseFloat(msg.amount),
        color: "white", //TODO: this has potential
    });


    // Append transaction to HTML
    if (minAmountLog < msg.amount) {
        var amount = document.createElement("P");
        amount.innerText = "amount: " + (msg.amount || "... ") + "btc";
        if (parseFloat(msg.amount) > 1) amount.classList.add("golden")


        var location = document.createElement("P");
        location.innerText =
            "location: " + (msg.lat || "...") + " " + (msg.lon || "...");
        var block = document.createElement("div");
        block.classList.add("transaction");

        // Click to focus on transaction
        block.onclick = function() {
            toggleFocus(false)
            globe.pointOfView({
                lat: msg.lat,
                lng: msg.lon,
                altitude: 0.8
            }, 600);
        }

        block.id = currentTrasactionID;

        block.appendChild(amount);
        block.appendChild(location);

        var container = document.getElementById("latest-list");
        container.insertBefore(block, container.firstChild);

        currentTrasactionID++;
        deleteExtraTransactions();
    }

    if (focusOnNewTransactions) {
        if (focusTransactionMin < parseFloat(msg.amount)) {
            globe.pointOfView({
                lat: msg.lat,
                lng: msg.lon,
                altitude: 0.8
            }, 800);
        }
    }

    globe.labelsData(gData);
    globe.pointsData(gData);
};


function deleteExtraTransactions() {
    // Might not be needed if it doesent affect performance TODO: test theory out
    while (document.getElementById("latest-list").childElementCount > maxNumTransactions) {
        document.getElementById("latest-list").removeChild(document.getElementById("latest-list").lastChild);
    }

    // Has to be done to maintain performance
    while (gData.length > 500) {
        gData.shift();
    }

}