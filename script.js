// --- UI Functions ---

function checkAlgorithm() {
    let algo = document.getElementById("algorithm").value;
    
    // Show/hide quantum input for Round Robin
    if (algo === "RR") {
        document.getElementById("quantumDiv").classList.remove("hidden");
    } else {
        document.getElementById("quantumDiv").classList.add("hidden");
    }

    // Show/hide priority column for both priority algorithms
    let priorityCells = document.querySelectorAll(".priority-col");
    for (let i = 0; i < priorityCells.length; i++) {
        if (algo === "Priority" || algo === "Priority_Preemptive") {
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
    checkAlgorithm(); 
}

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
            rem: parseInt(btInputs[i].value), // Remaining time used for SRTF, Preemptive Priority, and RR
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
    } else if (algo === "SRTF") {
        result = runSRTF(processes);
    } else if (algo === "Priority") {
        result = runPriority(processes);
    } else if (algo === "Priority_Preemptive") {
        result = runPreemptivePriority(processes);
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
    processes.sort((a, b) => a.at - b.at);
    let time = 0;
    let gantt = [];

    for (let i = 0; i < processes.length; i++) {
        let p = processes[i];
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
    let time = 0, completed = 0, gantt = [], resultArray = [];
    let n = processes.length;

    while (completed < n) {
        let available = processes.filter(p => p.at <= time && !p.isDone);

        if (available.length > 0) {
            available.sort((a, b) => a.bt - b.bt); // Sort by Burst Time
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
            // Find next arrival time to skip idle period quickly
            let nextArrival = Math.min(...processes.filter(p => !p.isDone).map(p => p.at));
            gantt.push({ id: "Idle", start: time, end: nextArrival, duration: nextArrival - time });
            time = nextArrival;
        }
    }
    return { processes: resultArray, gantt: gantt };
}

// NEW: SRTF (Preemptive SJF)
function runSRTF(processes) {
    let time = 0, completed = 0, gantt = [], resultArray = [];
    let n = processes.length;

    while (completed < n) {
        let available = processes.filter(p => p.at <= time && !p.isDone);

        if (available.length > 0) {
            // Sort by remaining time. If tie, sort by arrival time.
            available.sort((a, b) => a.rem - b.rem || a.at - b.at);
            let p = available[0];

            // Execute for 1 unit of time
            p.rem -= 1;
            time += 1;

            // Merge gantt blocks if same process continues
            if (gantt.length > 0 && gantt[gantt.length - 1].id === p.id) {
                gantt[gantt.length - 1].end = time;
                gantt[gantt.length - 1].duration += 1;
            } else {
                gantt.push({ id: p.id, start: time - 1, end: time, duration: 1 });
            }

            // Check if process finished
            if (p.rem === 0) {
                p.ct = time;
                p.tat = p.ct - p.at;
                p.wt = p.tat - p.bt;
                p.isDone = true;
                resultArray.push(p);
                completed++;
            }
        } else {
            let nextArrival = Math.min(...processes.filter(p => !p.isDone).map(p => p.at));
            gantt.push({ id: "Idle", start: time, end: nextArrival, duration: nextArrival - time });
            time = nextArrival;
        }
    }
    
    // Restore original P1, P2 order for the table
    resultArray.sort((a, b) => parseInt(a.id.replace('P', '')) - parseInt(b.id.replace('P', '')));
    return { processes: resultArray, gantt: gantt };
}

function runPriority(processes) {
    let time = 0, completed = 0, gantt = [], resultArray = [];
    let n = processes.length;

    while (completed < n) {
        let available = processes.filter(p => p.at <= time && !p.isDone);

        if (available.length > 0) {
            available.sort((a, b) => a.priority - b.priority || a.at - b.at); // Sort by Priority
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
            let nextArrival = Math.min(...processes.filter(p => !p.isDone).map(p => p.at));
            gantt.push({ id: "Idle", start: time, end: nextArrival, duration: nextArrival - time });
            time = nextArrival;
        }
    }
    return { processes: resultArray, gantt: gantt };
}

// NEW: Preemptive Priority
function runPreemptivePriority(processes) {
    let time = 0, completed = 0, gantt = [], resultArray = [];
    let n = processes.length;

    while (completed < n) {
        let available = processes.filter(p => p.at <= time && !p.isDone);

        if (available.length > 0) {
            // Sort by Priority (lower number = higher priority). If tie, arrival time.
            available.sort((a, b) => a.priority - b.priority || a.at - b.at);
            let p = available[0];

            // Execute for 1 unit of time
            p.rem -= 1;
            time += 1;

            // Merge gantt blocks if same process continues
            if (gantt.length > 0 && gantt[gantt.length - 1].id === p.id) {
                gantt[gantt.length - 1].end = time;
                gantt[gantt.length - 1].duration += 1;
            } else {
                gantt.push({ id: p.id, start: time - 1, end: time, duration: 1 });
            }

            // Check if process finished
            if (p.rem === 0) {
                p.ct = time;
                p.tat = p.ct - p.at;
                p.wt = p.tat - p.bt;
                p.isDone = true;
                resultArray.push(p);
                completed++;
            }
        } else {
            let nextArrival = Math.min(...processes.filter(p => !p.isDone).map(p => p.at));
            gantt.push({ id: "Idle", start: time, end: nextArrival, duration: nextArrival - time });
            time = nextArrival;
        }
    }
    
    // Restore original P1, P2 order for the table
    resultArray.sort((a, b) => parseInt(a.id.replace('P', '')) - parseInt(b.id.replace('P', '')));
    return { processes: resultArray, gantt: gantt };
}

function runRR(processes, quantum) {
    processes.sort((a, b) => a.at - b.at);
    let time = 0, completed = 0, n = processes.length;
    let queue = [], gantt = [], resultArray = [];

    while (completed < n) {
        for (let i = 0; i < n; i++) {
            if (processes[i].at <= time && processes[i].isDone === false && !queue.includes(processes[i])) {
                queue.push(processes[i]);
            }
        }

        if (queue.length > 0) {
            let p = queue.shift();
            let executeTime = p.rem > quantum ? quantum : p.rem;

            let start = time;
            p.rem -= executeTime;
            time += executeTime;

            if (gantt.length > 0 && gantt[gantt.length - 1].id === p.id) {
                gantt[gantt.length - 1].end = time;
                gantt[gantt.length - 1].duration += executeTime;
            } else {
                gantt.push({ id: p.id, start: start, end: time, duration: executeTime });
            }

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
                queue.push(p); 
            }
        } else {
            let nextArrival = Math.min(...processes.filter(p => !p.isDone).map(p => p.at));
            gantt.push({ id: "Idle", start: time, end: nextArrival, duration: nextArrival - time });
            time = nextArrival;
        }
    }
    
    resultArray.sort((a, b) => parseInt(a.id.replace('P', '')) - parseInt(b.id.replace('P', '')));
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

    let avgTAT = sumTAT / processes.length;
    let avgWT = sumWT / processes.length;

    document.getElementById("averages").innerHTML = 
        `Average Turnaround Time: ${avgTAT.toFixed(2)} &nbsp;&nbsp;|&nbsp;&nbsp; Average Waiting Time: ${avgWT.toFixed(2)}`;
}

function drawGanttChart(gantt) {
    let chartContainer = document.getElementById("ganttChart");
    chartContainer.innerHTML = ""; 
    
    if (gantt.length === 0) return;

    let totalTime = gantt[gantt.length - 1].end;

    for (let i = 0; i < gantt.length; i++) {
        let block = gantt[i];
        
        let div = document.createElement("div");
        div.className = "gantt-block";
        if (block.id === "Idle") {
            div.classList.add("idle");
        }

        let widthPercent = (block.duration / totalTime) * 100;
        div.style.width = widthPercent + "%";
        div.innerHTML = block.id;

        if (i === 0) {
            div.innerHTML += `<span class="start-time-label">${block.start}</span>`;
        }
        
        div.innerHTML += `<span class="gantt-time">${block.end}</span>`;
        
        chartContainer.appendChild(div);
    }
        }
            
