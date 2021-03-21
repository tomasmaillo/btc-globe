var focusOnNewTransactions = true;
var currentTrasactionID = 0;
var maxNumTransactions = 100;
var minAmountLog = 0.01;


document.getElementById("toggleFocusCheckbox").checked = focusOnNewTransactions;
document.getElementById("toggleFocusCheckbox").addEventListener('change', (event) => {
    focusOnNewTransactions = document.getElementById("toggleFocusCheckbox").checked
});

function toggleFocus(newState) {
    focusOnNewTransactions = newState;
    document.getElementById("toggleFocusCheckbox").checked = focusOnNewTransactions;
}


document.getElementById("logTransactionMin").value = minAmountLog;
document.getElementById("logTransactionMin").addEventListener('input', (event) => {
    minAmountLog = document.getElementById("logTransactionMin").value;
});


document.getElementById("maxNumTransactions").value = maxNumTransactions;
document.getElementById("maxNumTransactions").addEventListener('input', (event) => {
    maxNumTransactions = document.getElementById("maxNumTransactions").value;
});


const gData = [];
const getAltitude = d => {
    return 0.01 * (Math.log(d.amount + 0.07) + 2.718);
}
const getTooltip = d => `
                <div>
                    <b>amount: ${d.amount}btc</b> <br>
                    ip: ${d.ip}<br>
                    ${d.lat} ${d.lng}<br>
                </div>
            `;





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
    //.onLabelClick(d => window.open(d.url, '_blank'))
    .pointsData(gData)
    .pointRadius(0.1)
    .pointResolution(15)
    .pointsMerge(true)
    .pointsTransitionDuration(1000)
    .pointAltitude(getAltitude)
    .pointColor("color")
    (elem);


var socket = new WebSocket("wss://blocks.wizb.it/ws", [
    "protocolOne",
    "protocolTwo",
]);
socket.onmessage = function(event) {
    console.log(`Length of gData: ${gData.length}`)
    var msg = JSON.parse(event.data);

    if (!msg.amount) return;
    // Append data to point array
    gData.push({
        lat: msg.lat,
        lng: msg.lon,
        ip: msg.relay,
        id: currentTrasactionID,
        amount: parseFloat(msg.amount),
        color: "white", //TODO: change this, think of something
    });

    // Construct Transaction Log HTML
    // TODO: add expiry date for transaction log
    if (minAmountLog < msg.amount) {
        var amount = document.createElement("P");
        amount.innerText = "amount: " + (msg.amount || "... ") + "btc";
        if (parseFloat(msg.amount) > 1) amount.classList.add("golden")


        var location = document.createElement("P");
        location.innerText =
            "location: " + (msg.lat || "...") + " " + (msg.lon || "...");
        var block = document.createElement("div");
        block.classList.add("transaction");


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


        if (focusOnNewTransactions) {
            if (parseFloat(msg.amount) > 0.1)
                globe.pointOfView({
                    lat: msg.lat,
                    lng: msg.lon,
                    altitude: 0.8
                }, 800);
        }



        currentTrasactionID++;
        deleteExtraTransactions();
    }

    globe.labelsData(gData);
    globe.pointsData(gData);
};


function deleteExtraTransactions() {
    console.log(`gData: ${gData.length}    maxNumTransactions: ${maxNumTransactions}`)
    console.log(gData)
    while (gData.length > maxNumTransactions) {
        console.log(gData[0])
        console.log(`Deleted: ${(gData[0].id)}`)

        document.getElementById((gData[0].id)).remove();
        console.log(gData[0])
        gData.shift()



    }
}