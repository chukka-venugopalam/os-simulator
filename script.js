// --- 1. INPUT SECTION ---

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
                    <td><input type="number" class="bt-input" value="${Math.floor(Math.random()*5)+1}"></td>
                 </tr>`;
    }
    html += `</table>`;
    container.innerHTML = html;
    document.getElementById('controls').classList.remove('hidden');
}

function getProcesses() {
    const atInputs = document.querySelectorAll('.at-input');
    const btInputs = document.querySelectorAll('.bt-input');
    
    return Array.from(atInputs).map((at, i) => ({
        id: `P${i + 1}`,
        at: parseInt(at.value),
        bt: parseInt(btInputs[i].value),
        isDone: false
    }));
}

// --- 2. CONTROLLER LAYER ---

function startSimulation() {
    const algorithm = document.getElementById('algorithm').value;
    const processes = getProcesses();
    let result;

    if (algorithm === "FCFS") {
        result = runFCFS(processes);
    } else {
        result = runSJF(processes);
    }

    displayTable(result.processedData);
    drawGantt(result.ganttData);
    document.getElementById('outputSection').classList.remove('hidden');
}

// --- 3. ALGORITHMS ---

function runFCFS(procs) {
    procs.sort((a, b) => a.at - b.at);
    let time = 0;
    let ganttData = [];

    procs.forEach(p => {
        if (time < p.at) {
            ganttData.push({ id: 'Idle', start: time, end: p.at, duration: p.at - time });
            time = p.at;
        }
        let start = time;
        p.ct = time + p.bt;
        p.tat = p.ct - p.at;
        p.wt = p.tat - p.bt;
        time = p.ct;
        ganttData.push({ id: p.id, start, end: p.ct, duration: p.bt });
    });

    return { processedData: procs, ganttData };
}

function runSJF(procs) {
    let time = 0;
    let completed = 0;
    let n = procs.length;
    let ganttData = [];
    let processedData = [];

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
            
            ganttData.push({ id: p.id, start, end: p.ct, duration: p.bt });
            processedData.push(p);
            time = p.ct;
            completed++;
        } else {
            let nextArrival = Math.min(...procs.filter(p => !p.isDone).map(p => p.at));
            ganttData.push({ id: 'Idle', start: time, end: nextArrival, duration: nextArrival - time });
            time = nextArrival;
        }
    }
    return { processedData, ganttData };
}

// --- 4. OUTPUT RENDERERS ---

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
    return { processedData: procs, ganttData: gantt };
}

function runSJF(procs) {
    let time = 0;
    let completed = 0;
    let n = procs.length;
    let gantt = [];
    let result = [];

    while (completed < n) {
        // Find arrived processes that aren't done
        let available = procs.filter(p => p.at <= time && !p.isDone);

        if (available.length > 0) {
            // Pick shortest burst time
            available.sort((a, b) => a.bt - b.bt);
            let p = available[0];
            
            let start = time;
            p.ct = time + p.bt;
            p.tat = p.ct - p.at;
            p.wt = p.tat - p.bt;
            p.isDone = true;
            
            gantt.push({ id: p.id, start, end: p.ct, duration: p.bt });
            result.push(p);
            time = p.ct;
            completed++;
        } else {
            // CPU Idle
            let nextArrival = Math.min(...procs.filter(p => !p.isDone).map(p => p.at));
            gantt.push({ id: 'Idle', start: time, end: nextArrival, duration: nextArrival - time });
            time = nextArrival;
        }
    }
    return { processedData: result, ganttData: gantt };
}

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
    
        const widthPercentage = (block.duration / totalTime) * 100;
        div.style.width = widthPercentage + "%";
        
        div.innerHTML = `${block.id}`;

        
        if (i === 0) {
            div.innerHTML += `<span class="start-time-label">${block.start}</span>`;
        }
        div.innerHTML += `<span class="gantt-time">${block.end}</span>`;
        
        chart.appendChild(div);
    });
}
        processes.push({
            id: `P${index + 1}`,
            at: parseInt(input.value),
            bt: parseInt(btInputs[index].value)
        });
    });
    return processes;
}

function runFCFS() {
    let processes = getProcesses();
    processes.sort((a, b) => a.at - b.at);

    let currentTime = 0;
    
    
    processes.forEach((p, index) => {
        
        if (currentTime < p.at) {
            currentTime = p.at;
        }
        
        p.ct = currentTime + p.bt;      
        p.tat = p.ct - p.at;            
        p.wt = p.tat - p.bt;            
        
        currentTime = p.ct;             
    });

    displayTable(processes);
    drawGantt(processes);
    document.getElementById('outputSection').classList.remove('hidden');
}

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

function drawGantt(processes) {
    const gantt = document.getElementById('ganttChart');
    gantt.innerHTML = "";

    processes.forEach((p, index) => {
        const block = document.createElement('div');
        block.className = 'gantt-block';
        block.innerText = p.id;

    
        if (index === 0) {
            const startTime = document.createElement('span');
            startTime.className = 'start-time';
            startTime.innerText = p.at;
            block.appendChild(startTime);
        }

        
        const timeLabel = document.createElement('span');
        timeLabel.className = 'gantt-time';
        timeLabel.innerText = p.ct;
        
        block.appendChild(timeLabel);
        gantt.appendChild(block);
    });
}
