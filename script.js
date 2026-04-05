function toggleQuantumInput() {
    const algo = document.getElementById('algorithm').value;
    const container = document.getElementById('quantumContainer');
    algo === "RR" ? container.classList.remove('hidden') : container.classList.add('hidden');
}

function createInputs() {
    const count = document.getElementById('processCount').value;
    const container = document.getElementById('dynamicInputs');
    if (count < 1) return;

    let html = `<h3>Process Details</h3>
                <table>
                    <tr><th>Process</th><th>Arrival Time</th><th>Burst Time</th></tr>`;
    for (let i = 1; i <= count; i++) {
        html += `<tr>
                    <td>P${i}</td>
                    <td><input type="number" class="at-input" value="${(i-1)*2}"></td>
                    <td><input type="number" class="bt-input" value="${Math.floor(Math.random()*5)+2}"></td>
                 </tr>`;
    }
    html += `</table>`;
    container.innerHTML = html;
    document.getElementById('controls').classList.remove('hidden');
    toggleQuantumInput();
}

function getProcesses() {
    return Array.from(document.querySelectorAll('.at-input')).map((at, i) => ({
        id: `P${i + 1}`,
        at: parseInt(at.value),
        bt: parseInt(document.querySelectorAll('.bt-input')[i].value),
        rem: parseInt(document.querySelectorAll('.bt-input')[i].value), // Remaining time for RR
        isDone: false
    }));
}

// --- 2. CONTROLLER ---

function startSimulation() {
    const algo = document.getElementById('algorithm').value;
    const processes = getProcesses();
    let result;

    if (algo === "FCFS") result = runFCFS(processes);
    else if (algo === "SJF") result = runSJF(processes);
    else if (algo === "RR") {
        const q = parseInt(document.getElementById('quantum').value) || 2;
        result = runRR(processes, q);
    }

    displayTable(result.processedData);
    drawGantt(result.ganttData);
    document.getElementById('outputSection').classList.remove('hidden');
}

// --- 3. ALGORITHMS ---

function runFCFS(procs) {
    procs.sort((a, b) => a.at - b.at);
    let time = 0, gantt = [];
    procs.forEach(p => {
        if (time < p.at) {
            gantt.push({ id: 'Idle', start: time, end: p.at, duration: p.at - time });
            time = p.at;
        }
        let start = time;
        p.ct = time + p.bt;
        p.tat = p.ct - p.at;
        p.wt = p.tat - p.bt;
        time = p.ct;
        gantt.push({ id: p.id, start, end: p.ct, duration: p.bt });
    });
    return { processedData: procs, ganttData: gantt };
}

function runSJF(procs) {
    let time = 0, completed = 0, n = procs.length, gantt = [], res = [];
    while (completed < n) {
        let available = procs.filter(p => p.at <= time && !p.isDone);
        if (available.length > 0) {
            available.sort((a, b) => a.bt - b.bt);
            let p = available[0];
            let start = time;
            p.ct = time + p.bt;
            p.tat = p.ct - p.at;
            p.wt = p.tat - p.bt;
            p.isDone = true;
            gantt.push({ id: p.id, start, end: p.ct, duration: p.bt });
            res.push(p);
            time = p.ct;
            completed++;
        } else {
            let nextAt = Math.min(...procs.filter(p => !p.isDone).map(p => p.at));
            gantt.push({ id: 'Idle', start: time, end: nextAt, duration: nextAt - time });
            time = nextAt;
        }
    }
    return { processedData: res, ganttData: gantt };
}

function runRR(procs, q) {
    let time = 0, completed = 0, n = procs.length;
    let queue = [], gantt = [], res = [];
    
    // Sort initially by arrival
    procs.sort((a, b) => a.at - b.at);

    while (completed < n) {
        // Add newly arrived processes to queue
        procs.forEach(p => {
            if (p.at <= time && !p.isDone && !queue.includes(p)) {
                queue.push(p);
            }
        });

        if (queue.length > 0) {
            let p = queue.shift();
            let start = time;
            let take = Math.min(p.rem, q);
            
            p.rem -= take;
            time += take;

            gantt.push({ id: p.id, start, end: time, duration: take });

            // Check if any process arrived WHILE this one was running
            procs.forEach(newP => {
                if (newP.at <= time && !newP.isDone && !queue.includes(newP) && newP !== p) {
                    queue.push(newP);
                }
            });

            if (p.rem === 0) {
                p.ct = time;
                p.tat = p.ct - p.at;
                p.wt = p.tat - p.bt;
                p.isDone = true;
                res.push(p);
                completed++;
            } else {
                queue.push(p); // Put back at end of queue
            }
        } else {
            // Idle
            let nextAt = Math.min(...procs.filter(p => !p.isDone).map(p => p.at));
            gantt.push({ id: 'Idle', start: time, end: nextAt, duration: nextAt - time });
            time = nextAt;
        }
    }
    return { processedData: res.sort((a,b) => a.id.localeCompare(b.id, undefined, {numeric: true})), ganttData: gantt };
}

// --- 4. RENDERERS ---

function displayTable(procs) {
    const container = document.getElementById('tableContainer');
    let html = `<table><tr><th>Process</th><th>AT</th><th>BT</th><th>CT</th><th>TAT</th><th>WT</th></tr>`;
    procs.forEach(p => {
        html += `<tr><td>${p.id}</td><td>${p.at}</td><td>${p.bt}</td><td>${p.ct}</td><td>${p.tat}</td><td>${p.wt}</td></tr>`;
    });
    container.innerHTML = html + `</table>`;
}

function drawGantt(ganttData) {
    const chart = document.getElementById('ganttChart');
    chart.innerHTML = "";
    const totalTime = ganttData[ganttData.length - 1].end;

    ganttData.forEach((block, i) => {
        const div = document.createElement('div');
        div.className = `gantt-block ${block.id === 'Idle' ? 'idle' : ''}`;
        div.style.width = (block.duration / totalTime * 100) + "%";
        div.innerHTML = block.id;
        if (i === 0) div.innerHTML += `<span class="start-time-label">${block.start}</span>`;
        div.innerHTML += `<span class="gantt-time">${block.end}</span>`;
        chart.appendChild(div);
    });
}

