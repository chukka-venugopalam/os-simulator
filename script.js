// --- UI Functions ---

function checkAlgorithm() {
    let algo = document.getElementById("algorithm").value;
    
    // Show/hide quantum input for Round Robin
    if (algo === "RR") {
        document.getElementById("quantumDiv").classList.remove("hidden");
    } else {
        document.getElementById("quantumDiv").classList.add("hidden");
    }

    // Show/hide priority column
    let priorityCells = document.querySelectorAll(".priority-col");
    for (let i = 0; i < priorityCells.length; i++) {
        if (algo === "Priority") {
            priorityCells[i].classList.remove("hidden");
        } else {
            priorityCells[i].classList.add("hidden");
        }
    }
}

function createInputs() {
    let count = parseInt(document.getElementById("processCount").value);
    let container = document.getElementById("dynamicInputs");

    let tableHTML = `
        <table>
            <tr>
                <th>Process</th>
                <th>Arrival Time</th>
                <th>Burst Time</th>
                <th class="priority-col hidden">Priority</th>
            </tr>
    `;

    for (let i = 1; i <= count; i++) {
        tableHTML += `
            <tr>
                <td>P${i}</td>
                <td><input type="number" class="at-input" value="0" min="0"></td>
                <td><input type="number" class="bt-input" value="5" min="1"></td>
                <td class="priority-col hidden"><input type="number" class="priority-input" value="${i}" min="1"></td>
            </tr>
        `;
    }
    
    tableHTML += `</table>`;
    container.innerHTML = tableHTML;
    
    document.getElementById("controls").classList.remove("hidden");
    checkAlgorithm(); // Run this to set initial visibility of priority column
}

// Read inputs from table
function getProcesses() {
    let atInputs = document.querySelectorAll(".at-input");
    let btInputs = document.querySelectorAll(".bt-input");
    let priorityInputs = document.querySelectorAll(".priority-input");
    
    let processes = [];
    
    for (let i = 0; i < atInputs.length; i++) {
        processes.push({
            id: "P" + (i + 1),
            at: parseInt(atInputs[i].value),
            bt: parseInt(btInputs[i].value),
            priority: parseInt(priorityInputs[i].value),
            rem: parseInt(btInputs[i].value), // Remaining time for RR
            isDone: false
        });
    }
    return processes;
}

// --- Main Controller ---

function startSimulation() {
    let algo = document.getElementById("algorithm").value;
    let processes = getProcesses();
    let result;

    if (algo === "FCFS") {
        result = runFCFS(processes);
    } else if (algo === "SJF") {
        result = runSJF(processes);
    } else if (algo === "Priority") {
        result = runPriority(processes);
    } else if (algo === "RR") {
        let quantum = parseInt(document.getElementById("quantum").value);
        result = runRR(processes, quantum);
    }

    displayResults(result.processes);
    drawGanttChart(result.gantt);
    document.getElementById("outputSection").classList.remove("hidden");
}

// --- Scheduling Algorithms ---

function runFCFS(processes) {
    // Sort by arrival time
    processes.sort((a, b) => a.at - b.at);
    
    let time = 0;
    let gantt = [];

    for (let i = 0; i < processes.length; i++) {
        let p = processes[i];
        
        // Handle idle time if CPU is empty
        if (time < p.at) {
            gantt.push({ id: "Idle", start: time, end: p.at, duration: p.at - time });
            time = p.at;
        }

        p.ct = time + p.bt;
        p.tat = p.ct - p.at;
        p.wt = p.tat - p.bt;
        
        gantt.push({ id: p.id, start: time, end: p.ct, duration: p.bt });
        time = p.ct;
    }

    return { processes: processes, gantt: gantt };
}

function runSJF(processes) {
    let time = 0, completed = 0;
    let gantt = [], resultArray = [];
    let n = processes.length;

    while (completed < n) {
        // Find arrived processes
        let available = [];
        for (let i = 0; i < n; i++) {
            if (processes[i].at <= time && processes[i].isDone === false) {
                available.push(processes[i]);
            }
        }

        if (available.length > 0) {
            // Sort by burst time
            available.sort((a, b) => a.bt - b.bt);
            let p = available[0];

            p.ct = time + p.bt;
            p.tat = p.ct - p.at;
            p.wt = p.tat - p.bt;
            p.isDone = true;

            gantt.push({ id: p.id, start: time, end: p.ct, duration: p.bt });
            resultArray.push(p);
            
            time = p.ct;
            completed++;
        } else {
            // CPU is idle
            let nextArrival = 9999;
            for(let i=0; i<n; i++) {
                if(!processes[i].isDone && processes[i].at < nextArrival) {
                    nextArrival = processes[i].at;
                }
            }
            gantt.push({ id: "Idle", start: time, end: nextArrival, duration: nextArrival - time });
            time = nextArrival;
        }
    }
    return { processes: resultArray, gantt: gantt };
}

function runPriority(processes) {
    let time = 0, completed = 0;
    let gantt = [], resultArray = [];
    let n = processes.length;

    while (completed < n) {
        let available = [];
        for (let i = 0; i < n; i++) {
            if (processes[i].at <= time && processes[i].isDone === false) {
                available.push(processes[i]);
            }
        }

        if (available.length > 0) {
            // Sort by priority (lower number = higher priority)
            available.sort((a, b) => a.priority - b.priority);
            let p = available[0];

            p.ct = time + p.bt;
            p.tat = p.ct - p.at;
            p.wt = p.tat - p.bt;
            p.isDone = true;

            gantt.push({ id: p.id, start: time, end: p.ct, duration: p.bt });
            resultArray.push(p);
            
            time = p.ct;
            completed++;
        } else {
            let nextArrival = 9999;
            for(let i=0; i<n; i++) {
                if(!processes[i].isDone && processes[i].at < nextArrival) {
                    nextArrival = processes[i].at;
                }
            }
            gantt.push({ id: "Idle", start: time, end: nextArrival, duration: nextArrival - time });
            time = nextArrival;
        }
    }
    return { processes: resultArray, gantt: gantt };
}

function runRR(processes, quantum) {
    processes.sort((a, b) => a.at - b.at);
    let time = 0, completed = 0, n = processes.length;
    let queue = [], gantt = [], resultArray = [];

    while (completed < n) {
        // Add new arrivals to queue
        for (let i = 0; i < n; i++) {
            if (processes[i].at <= time && processes[i].isDone === false && !queue.includes(processes[i])) {
                queue.push(processes[i]);
            }
        }

        if (queue.length > 0) {
            let p = queue.shift();
            
            // Execute for either quantum or remaining time
            let executeTime = p.rem;
            if (p.rem > quantum) {
                executeTime = quantum;
            }

            let start = time;
            p.rem = p.rem - executeTime;
            time = time + executeTime;

            // Combine blocks if same process runs again immediately
            if (gantt.length > 0 && gantt[gantt.length - 1].id === p.id) {
                gantt[gantt.length - 1].end = time;
                gantt[gantt.length - 1].duration += executeTime;
            } else {
                gantt.push({ id: p.id, start: start, end: time, duration: executeTime });
            }

            // Check arrivals during execution
            for (let i = 0; i < n; i++) {
                if (processes[i].at <= time && processes[i].isDone === false && !queue.includes(processes[i]) && processes[i] !== p) {
                    queue.push(processes[i]);
                }
            }

            if (p.rem === 0) {
                p.ct = time;
                p.tat = p.ct - p.at;
                p.wt = p.tat - p.bt;
                p.isDone = true;
                resultArray.push(p);
                completed++;
            } else {
                queue.push(p); // Go back to end of line
            }
        } else {
            // Idle time
            let nextArrival = 9999;
            for(let i=0; i<n; i++) {
                if(!processes[i].isDone && processes[i].at < nextArrival) {
                    nextArrival = processes[i].at;
                }
            }
            gantt.push({ id: "Idle", start: time, end: nextArrival, duration: nextArrival - time });
            time = nextArrival;
        }
    }
    
    // Sort array back to original P1, P2 order for table
    resultArray.sort((a, b) => {
        let numA = parseInt(a.id.replace('P', ''));
        let numB = parseInt(b.id.replace('P', ''));
        return numA - numB;
    });

    return { processes: resultArray, gantt: gantt };
}

// --- Output Functions ---

function displayResults(processes) {
    let tableContainer = document.getElementById("tableContainer");
    let html = `
        <table>
            <tr>
                <th>Process</th>
                <th>Arrival Time</th>
                <th>Burst Time</th>
                <th>Completion Time</th>
                <th>Turnaround Time</th>
                <th>Waiting Time</th>
            </tr>
    `;

    let sumTAT = 0;
    let sumWT = 0;

    for (let i = 0; i < processes.length; i++) {
        let p = processes[i];
        sumTAT += p.tat;
        sumWT += p.wt;

        html += `
            <tr>
                <td>${p.id}</td>
                <td>${p.at}</td>
                <td>${p.bt}</td>
                <td>${p.ct}</td>
                <td>${p.tat}</td>
                <td>${p.wt}</td>
            </tr>
        `;
    }

    html += `</table>`;
    tableContainer.innerHTML = html;

    // Display Averages
    let avgTAT = sumTAT / processes.length;
    let avgWT = sumWT / processes.length;

    document.getElementById("averages").innerHTML = 
        `Average Turnaround Time: ${avgTAT.toFixed(2)} &nbsp;&nbsp;|&nbsp;&nbsp; Average Waiting Time: ${avgWT.toFixed(2)}`;
}

function drawGanttChart(gantt) {
    let chartContainer = document.getElementById("ganttChart");
    chartContainer.innerHTML = ""; // Clear old chart
    
    if (gantt.length === 0) return;

    let totalTime = gantt[gantt.length - 1].end;

    for (let i = 0; i < gantt.length; i++) {
        let block = gantt[i];
        
        let div = document.createElement("div");
        div.className = "gantt-block";
        if (block.id === "Idle") {
            div.classList.add("idle");
        }

        // Width based on percentage of total time
        let widthPercent = (block.duration / totalTime) * 100;
        div.style.width = widthPercent + "%";
        div.innerHTML = block.id;

        // Add 0 only on the very first block
        if (i === 0) {
            div.innerHTML += `<span class="start-time-label">${block.start}</span>`;
        }
        
        // Add end time for every block
        div.innerHTML += `<span class="gantt-time">${block.end}</span>`;
        
        chartContainer.appendChild(div);
    }
}
