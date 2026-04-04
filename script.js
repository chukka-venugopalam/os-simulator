function createInputs() {
    const count = document.getElementById('processCount').value;
    const container = document.getElementById('dynamicInputs');
    
    if (count < 1) return alert("Please enter at least 1 process.");

    let html = `<h3>Process Details</h3>
                <table>
                    <tr>
                        <th>Process ID</th>
                        <th>Arrival Time</th>
                        <th>Burst Time</th>
                    </tr>`;

    for (let i = 1; i <= count; i++) {
        html += `<tr>
                    <td>P${i}</td>
                    <td><input type="number" class="at-input" value="0" min="0"></td>
                    <td><input type="number" class="bt-input" value="1" min="1"></td>
                 </tr>`;
    }
    html += `</table>`;
    
    container.innerHTML = html;
    document.getElementById('controls').classList.remove('hidden');
}

/**
 * Reads data from the HTML inputs and returns an array of process objects.
 */
function getProcesses() {
    const atInputs = document.querySelectorAll('.at-input');
    const btInputs = document.querySelectorAll('.bt-input');
    let processes = [];

    atInputs.forEach((input, index) => {
        processes.push({
            id: `P${index + 1}`,
            at: parseInt(input.value),
            bt: parseInt(btInputs[index].value)
        });
    });
    return processes;
}

/**
 * Core Logic: First Come First Serve (FCFS)
 */
function runFCFS() {
    let processes = getProcesses();

    // 1. Sort by Arrival Time
    processes.sort((a, b) => a.at - b.at);

    let currentTime = 0;
    
    // 2. Calculate Metrics
    processes.forEach((p, index) => {
        // If CPU is idle (current time is less than arrival), jump to arrival
        if (currentTime < p.at) {
            currentTime = p.at;
        }
        
        p.ct = currentTime + p.bt;      // Completion Time
        p.tat = p.ct - p.at;            // Turnaround Time
        p.wt = p.tat - p.bt;            // Waiting Time
        
        currentTime = p.ct;             // Update time for next process
    });

    displayTable(processes);
    drawGantt(processes);
    document.getElementById('outputSection').classList.remove('hidden');
}

/**
 * Builds the results table dynamically.
 */
function displayTable(processes) {
    const container = document.getElementById('tableContainer');
    let html = `<table>
                <tr>
                    <th>Process</th>
                    <th>Arrival Time</th>
                    <th>Burst Time</th>
                    <th>Completion Time</th>
                    <th>Turnaround Time</th>
                    <th>Waiting Time</th>
                </tr>`;

    processes.forEach(p => {
        html += `<tr>
            <td>${p.id}</td>
            <td>${p.at}</td>
            <td>${p.bt}</td>
            <td>${p.ct}</td>
            <td>${p.tat}</td>
            <td>${p.wt}</td>
        </tr>`;
    });
    html += `</table>`;
    container.innerHTML = html;
}

/**
 * Visualizes the execution order.
 */
function drawGantt(processes) {
    const gantt = document.getElementById('ganttChart');
    gantt.innerHTML = ""; // Clear old chart

    processes.forEach((p, index) => {
        const block = document.createElement('div');
        block.className = 'gantt-block';
        block.innerText = p.id;

        // Show start time only for the very first process
        if (index === 0) {
            const startTime = document.createElement('span');
            startTime.className = 'start-time';
            startTime.innerText = p.at;
            block.appendChild(startTime);
        }

        // Completion time label
        const timeLabel = document.createElement('span');
        timeLabel.className = 'gantt-time';
        timeLabel.innerText = p.ct;
        
        block.appendChild(timeLabel);
        gantt.appendChild(block);
    });
}
