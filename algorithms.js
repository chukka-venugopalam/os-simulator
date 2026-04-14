function calculateAverages(processes) {
    let sumWT = 0, sumTAT = 0;
    processes.forEach(p => { sumWT += p.wt; sumTAT += p.tat; });
    return {
        avgWT: (sumWT / processes.length).toFixed(2),
        avgTAT: (sumTAT / processes.length).toFixed(2)
    };
}

const Algorithms = {
    FCFS: function(processes) {
        processes.sort((a, b) => a.at - b.at);
        let time = 0, gantt = [], log = [];
        processes.forEach(p => {
            if (time < p.at) {
                log.push(`[Time ${time}] CPU Idle.`);
                gantt.push({ id: "Idle", start: time, end: p.at, duration: p.at - time });
                time = p.at;
            }
            log.push(`[Time ${time}] ${p.id} starts.`);
            p.ct = time + p.bt; p.tat = p.ct - p.at; p.wt = p.tat - p.bt;
            gantt.push({ id: p.id, start: time, end: p.ct, duration: p.bt });
            time = p.ct;
            log.push(`[Time ${time}] ${p.id} finished.`);
        });
        return { processes, gantt, log, ...calculateAverages(processes) };
    },

    SJF: function(processes) {
        let time = 0, completed = 0, n = processes.length, gantt = [], log = [], res = [];
        while (completed < n) {
            let available = processes.filter(p => p.at <= time && !p.isDone);
            if (available.length > 0) {
                available.sort((a, b) => a.bt - b.bt || a.at - b.at);
                let p = available[0];
                log.push(`[Time ${time}] ${p.id} selected (Shortest Burst).`);
                p.ct = time + p.bt; p.tat = p.ct - p.at; p.wt = p.tat - p.bt; p.isDone = true;
                gantt.push({ id: p.id, start: time, end: p.ct, duration: p.bt });
                res.push(p); time = p.ct; completed++;
            } else {
                let nextAt = Math.min(...processes.filter(p => !p.isDone).map(p => p.at));
                gantt.push({ id: "Idle", start: time, end: nextAt, duration: nextAt - time });
                time = nextAt;
            }
        }
        res.sort((a, b) => a.at - b.at);
        return { processes: res, gantt, log, ...calculateAverages(res) };
    },

    SRTF: function(processes) {
        let time = 0, completed = 0, n = processes.length, gantt = [], log = [], res = [], lastId = null;
        while (completed < n) {
            let available = processes.filter(p => p.at <= time && !p.isDone);
            if (available.length > 0) {
                available.sort((a, b) => a.rem - b.rem || a.at - b.at);
                let p = available[0];
                if (lastId !== p.id) log.push(`[Time ${time}] ${p.id} executes.`);
                p.rem -= 1; time += 1;
                if (gantt.length > 0 && gantt[gantt.length - 1].id === p.id) gantt[gantt.length - 1].end = time, gantt[gantt.length - 1].duration += 1;
                else gantt.push({ id: p.id, start: time - 1, end: time, duration: 1 });
                if (p.rem === 0) { p.ct = time; p.tat = p.ct - p.at; p.wt = p.tat - p.bt; p.isDone = true; res.push(p); completed++; lastId = null; } 
                else lastId = p.id;
            } else {
                let nextAt = Math.min(...processes.filter(p => !p.isDone).map(p => p.at));
                gantt.push({ id: "Idle", start: time, end: nextAt, duration: nextAt - time }); time = nextAt; lastId = "Idle";
            }
        }
        res.sort((a, b) => a.at - b.at);
        return { processes: res, gantt, log, ...calculateAverages(res) };
    },

    RR: function(processes, quantum) {
        processes.sort((a, b) => a.at - b.at);
        let time = 0, completed = 0, n = processes.length, queue = [], gantt = [], log = [], res = [];
        while (completed < n) {
            processes.forEach(p => { if (p.at <= time && !p.isDone && !queue.includes(p)) queue.push(p); });
            if (queue.length > 0) {
                let p = queue.shift();
                let take = Math.min(p.rem, quantum);
                log.push(`[Time ${time}] ${p.id} executes for ${take} units.`);
                p.rem -= take; time += take;
                if (gantt.length > 0 && gantt[gantt.length - 1].id === p.id) gantt[gantt.length - 1].end = time, gantt[gantt.length - 1].duration += take;
                else gantt.push({ id: p.id, start: time - take, end: time, duration: take });
                processes.forEach(newP => { if (newP.at <= time && !newP.isDone && !queue.includes(newP) && newP !== p) queue.push(newP); });
                if (p.rem === 0) { p.ct = time; p.tat = p.ct - p.at; p.wt = p.tat - p.bt; p.isDone = true; res.push(p); completed++; } 
                else queue.push(p);
            } else {
                let nextAt = Math.min(...processes.filter(p => !p.isDone).map(p => p.at));
                gantt.push({ id: "Idle", start: time, end: nextAt, duration: nextAt - time }); time = nextAt;
            }
        }
        res.sort((a, b) => a.at - b.at);
        return { processes: res, gantt, log, ...calculateAverages(res) };
    },

    Priority: function(processes) {
        let time = 0, completed = 0, n = processes.length, gantt = [], log = [], res = [];
        while (completed < n) {
            let available = processes.filter(p => p.at <= time && !p.isDone);
            if (available.length > 0) {
                available.sort((a, b) => a.priority - b.priority || a.at - b.at);
                let p = available[0];
                log.push(`[Time ${time}] ${p.id} selected (Priority: ${p.priority}).`);
                p.ct = time + p.bt; p.tat = p.ct - p.at; p.wt = p.tat - p.bt; p.isDone = true;
                gantt.push({ id: p.id, start: time, end: p.ct, duration: p.bt }); res.push(p); time = p.ct; completed++;
            } else {
                let nextAt = Math.min(...processes.filter(p => !p.isDone).map(p => p.at));
                gantt.push({ id: "Idle", start: time, end: nextAt, duration: nextAt - time }); time = nextAt;
            }
        }
        res.sort((a, b) => a.at - b.at);
        return { processes: res, gantt, log, ...calculateAverages(res) };
    },

    Priority_Preemptive: function(processes) {
        let time = 0, completed = 0, n = processes.length, gantt = [], log = [], res = [], lastId = null;
        while (completed < n) {
            let available = processes.filter(p => p.at <= time && !p.isDone);
            if (available.length > 0) {
                available.sort((a, b) => a.priority - b.priority || a.at - b.at);
                let p = available[0];
                if(lastId !== p.id) log.push(`[Time ${time}] ${p.id} executes.`);
                p.rem -= 1; time += 1;
                if (gantt.length > 0 && gantt[gantt.length - 1].id === p.id) gantt[gantt.length - 1].end = time, gantt[gantt.length - 1].duration += 1;
                else gantt.push({ id: p.id, start: time - 1, end: time, duration: 1 });
                if (p.rem === 0) { p.ct = time; p.tat = p.ct - p.at; p.wt = p.tat - p.bt; p.isDone = true; res.push(p); completed++; lastId = null; } 
                else lastId = p.id;
            } else {
                let nextAt = Math.min(...processes.filter(p => !p.isDone).map(p => p.at));
                gantt.push({ id: "Idle", start: time, end: nextAt, duration: nextAt - time }); time = nextAt; lastId = "Idle";
            }
        }
        res.sort((a, b) => a.at - b.at);
        return { processes: res, gantt, log, ...calculateAverages(res) };
    }
};
                  
