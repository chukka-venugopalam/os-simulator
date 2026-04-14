const colors = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

const explanations = {
    "FCFS": "<b>FCFS (First Come First Serve):</b> The simplest scheduling algorithm. Processes are executed exactly in the order they arrive. It is non-preemptive, meaning once a process starts, it cannot be interrupted.",
    "SJF": "<b>SJF (Shortest Job First):</b> Looks at all currently available processes and executes the one with the shortest burst time. This mathematically minimizes the average waiting time for the current queue, but it is non-preemptive.",
    "SRTF": "<b>SRTF (Shortest Remaining Time First):</b> The preemptive version of SJF. If a new process arrives with a shorter burst time than what is currently left on the running process, the CPU switches to the new, shorter job.",
    "Priority": "<b>Priority (Non-Preemptive):</b> CPU is allocated to the process with the highest priority (lowest number). Once started, the process runs to completion regardless of new arrivals.",
    "Priority_Preemptive": "<b>Priority (Preemptive):</b> CPU executes the highest priority process available. If a new process arrives with a higher priority than the running one, the current process is interrupted.",
    "RR": "<b>Round Robin:</b> Every process gets a small, equal amount of CPU time (Quantum). If a process doesn't finish within its quantum, it is paused and sent to the back of the queue. Great for responsiveness."
};

function toggleMode() {
    let mode = document.querySelector('input[name="simMode"]:checked').value;
    let singleGroup = document.getElementById("singleControls");
    
    if (mode === 'single') {
        singleGroup.style.opacity = '1';
        singleGroup.style.pointerEvents = 'auto';
        checkAlgorithmUI(); // Show explanation
    } else {
        singleGroup.style.opacity = '0.5';
        singleGroup.style.pointerEvents = 'none';
        document.getElementById("explanationSection").classList.add("hidden");
    }
    document.getElementById("singleOutput").classList.add("hidden");
    document.getElementById("compareOutput").classList.add("hidden");
}

function checkAlgorithmUI() {
    let algo = document.getElementById("algorithm").value;
    document.getElementById("quantumDiv").classList.toggle("hidden", algo !== "RR");
    
    document.querySelectorAll(".priority-col").forEach(c => c.classList.toggle("hidden", !algo.includes("Priority")));
    
    let expBox = document.getElementById("explanationSection");
    expBox.innerHTML = `<h3>Algorithm Explanation</h3><p>${explanations[algo]}</p>`;
    expBox.classList.remove("hidden");
}

function createInputs() {
    let count = parseInt(document.getElementById("processCount").value);
    if(count < 1 || count > 10) count = 4;

    let html = `<table><tr><th>Process</th><th>Arrival Time</th><th>Burst Time</th><th class="priority-col hidden">Priority</th></tr>`;
    for (let i = 1; i <= count; i++) {
        html += `<tr>
            <td style="font-weight:600; color:var(--primary);">P${i}</td>
            <td><input type="number" class="at-input" value="${i-1}" min="0"></td>
            <td><input type="number" class="bt-input" value="${Math.floor(Math.random()*4)+3}" min="1"></td>
            <td class="priority-col hidden"><input type="number" class="priority-input" value="${i}" min="1"></td>
        </tr>`;
    }
    
    document.getElementById("dynamicInputs").innerHTML = html + `</table>`;
    document.getElementById("controls").classList.remove("hidden");
    checkAlgorithmUI();
}

function getBaseProcesses() {
    let atInputs = document.querySelectorAll(".at-input");
    let btInputs = document.querySelectorAll(".bt-input");
    let prioInputs = document.querySelectorAll(".priority-input");
    
    let processes = [];
    for (let i = 0; i < atInputs.length; i++) {
        // Safe parsing to handle hidden/undefined inputs
        let at = parseInt(atInputs[i].value);
        let bt = parseInt(btInputs[i].value);
        let prio = (prioInputs[i] && prioInputs[i].value) ? parseInt(prioInputs[i].value) : 1;

        processes.push({ id: "P" + (i + 1), at, bt, priority: prio, rem: bt, isDone: false });
    }
    return processes;
}

// --- VALIDATION ---
function validateInputs(processes) {
    for (let p of processes) {
        if (isNaN(p.at) || p.at < 0) return `Arrival Time for ${p.id} cannot be negative or empty.`;
        if (isNaN(p.bt) || p.bt <= 0) return `Burst Time for ${p.id} must be greater than 0.`;
        if (isNaN(p.priority) || p.priority < 1) return `Priority for ${p.id} must be 1 or greater.`;
    }
    return null;
}

function showError(msg) {
    let box = document.getElementById("errorBox");
    box.innerText = msg;
    box.classList.remove("hidden");
    setTimeout(() => box.classList.add("hidden"), 4000);
}

function cloneData(data) { return JSON.parse(JSON.stringify(data)); }

// --- CONTROLLER ---
function startSimulation() {
    let baseProcesses = getBaseProcesses();
    let error = validateInputs(baseProcesses);
    
    if (error) {
        showError(error);
        return;
    }

    let mode = document.querySelector('input[name="simMode"]:checked').value;
    mode === 'single' ? runSingleMode(baseProcesses) : runCompareMode(baseProcesses);
}

function runSingleMode(processes) {
    let algo = document.getElementById("algorithm").value;
    let quantum = parseInt(document.getElementById("quantum").value) || 2;
    
    let result = Algorithms[algo](processes, quantum);
    
    renderSingleTable(result.processes);
    document.getElementById("averages").innerHTML = `<span class="badge">Avg WT: ${result.avgWT}</span> <span class="badge">Avg TAT: ${result.avgTAT}</span>`;
    renderGantt(result.gantt);
    renderLog(result.log);
    
    document.getElementById("singleOutput").classList.remove("hidden");
}

function runCompareMode(baseProcesses) {
    let quantum = parseInt(document.getElementById("quantum").value) || 2;
    
    let results = [
        { name: "FCFS", data: Algorithms.FCFS(cloneData(baseProcesses)) },
        { name: "SJF", data: Algorithms.SJF(cloneData(baseProcesses)) },
        { name: "SRTF", data: Algorithms.SRTF(cloneData(baseProcesses)) },
        { name: "Priority (NP)", data: Algorithms.Priority(cloneData(baseProcesses)) },
        { name: "Priority (P)", data: Algorithms.Priority_Preemptive(cloneData(baseProcesses)) },
        { name: `RR (Q=${quantum})`, data: Algorithms.RR(cloneData(baseProcesses), quantum) }
    ];

    results.sort((a, b) => a.data.avgWT - b.data.avgWT);
    let winner = results[0];

    // Smart Explanation Generator
    let reasonText = `It achieved the lowest Average Waiting Time of <b>${winner.data.avgWT}</b> units. `;
    if (winner.name === "SRTF") reasonText += "SRTF naturally minimizes waiting time by preempting longer jobs the moment a shorter job arrives.";
    else if (winner.name === "SJF") reasonText += "SJF minimizes waiting time by prioritizing the shortest jobs in the queue.";
    else if (winner.name === "FCFS") reasonText += "FCFS won here because the processes arrived in an optimal, ascending order of burst times.";

    document.getElementById("winnerBanner").innerHTML = `
        <h2>🏆 Best Algorithm: ${winner.name}</h2>
        <p>${reasonText}</p>
    `;

    renderBarChart(results);

    let html = `<table><tr><th>Algorithm</th><th>Avg Waiting Time</th><th>Avg Turnaround Time</th><th>Rank</th></tr>`;
    results.forEach((res, index) => {
        let rank = index === 0 ? "🥇 1st" : (index === 1 ? "🥈 2nd" : (index === 2 ? "🥉 3rd" : `${index+1}th`));
        html += `<tr>
            <td style="font-weight:600;">${res.name}</td>
            <td style="${index === 0 ? 'color: var(--success); font-weight:bold;' : ''}">${res.data.avgWT}</td>
            <td>${res.data.avgTAT}</td>
            <td style="color:var(--text-muted); font-weight:600;">${rank}</td>
        </tr>`;
    });
    
    document.getElementById("comparisonTableContainer").innerHTML = html + `</table>`;
    document.getElementById("compareOutput").classList.remove("hidden");
}

// --- RENDERERS ---
function renderSingleTable(processes) {
    let html = `<table><tr><th>Process</th><th>AT</th><th>BT</th><th>CT</th><th>TAT</th><th>WT</th></tr>`;
    processes.forEach(p => {
        html += `<tr><td style="font-weight:600;">${p.id}</td><td>${p.at}</td><td>${p.bt}</td><td>${p.ct}</td><td>${p.tat}</td><td>${p.wt}</td></tr>`;
    });
    document.getElementById("tableContainer").innerHTML = html + `</table>`;
}

function renderGantt(gantt) {
    let chart = document.getElementById("ganttChart");
    chart.innerHTML = ""; 
    if (gantt.length === 0) return;

    let totalTime = gantt[gantt.length - 1].end;

    gantt.forEach((block, i) => {
        let div = document.createElement("div");
        div.className = "gantt-block " + (block.id === "Idle" ? "idle" : "");
        div.style.width = ((block.duration / totalTime) * 100) + "%";
        
        if(block.id !== "Idle") {
            let colorIndex = parseInt(block.id.replace('P', '')) % colors.length;
            div.style.backgroundColor = colors[colorIndex === 0 ? colors.length - 1 : colorIndex - 1];
        }
        
        div.innerHTML = block.id;
        if (i === 0) div.innerHTML += `<span class="start-time">${block.start}</span>`;
        div.innerHTML += `<span class="gantt-time">${block.end}</span>`;
        chart.appendChild(div);
    });
}

function renderLog(logData) {
    let ul = document.getElementById("executionLog");
    ul.innerHTML = "";
    logData.forEach(entry => {
        let li = document.createElement("li");
        li.innerHTML = entry;
        ul.appendChild(li);
    });
}

function renderBarChart(results) {
    let maxWT = Math.max(...results.map(r => parseFloat(r.data.avgWT)));
    let container = document.getElementById("barChartContainer");
    
    let html = '';
    results.forEach(res => {
        let height = maxWT === 0 ? 5 : (parseFloat(res.data.avgWT) / maxWT) * 100;
        if(height < 5) height = 5; // Minimum visible bar height
        
        html += `
        <div class="bar-wrapper">
            <span class="bar-value">${res.data.avgWT}</span>
            <div class="bar" style="height: ${height}%;"></div>
            <span class="bar-label">${res.name}</span>
        </div>`;
    });
    container.innerHTML = html;
}
