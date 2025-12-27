const PAGE_SIZE = 16;
const MAX_ADDR = 255;
const TLB_SIZE = 4;

/* PAGE TABLE */
let pageTable = {};
for (let i = 0; i < 16; i++) pageTable[i] = i + 10;

/* TLBs */
let tlbWeb = [];
let tlbC = [];
let timeWeb = 0;
let timeC = 0;

/* PERFORMANCE */
let hitCount = 0;
let missCount = 0;

/* REPLACE */
function replaceTLB(tlb, policy) {
    if (policy === "FIFO") tlb.shift();
    else if (policy === "LRU") {
        tlb.sort((a, b) => a.lastUsed - b.lastUsed);
        tlb.shift();
    } else {
        tlb.splice(Math.floor(Math.random() * tlb.length), 1);
    }
}

/* SEARCH ANIMATION */
async function glow(el) {
    el.classList.add("search");
    await new Promise(r => setTimeout(r, 600));
    el.classList.remove("search");
}

/* SIMULATE */
async function simulate() {
    const addr = parseInt(document.getElementById("logical").value);
    const policy = document.getElementById("policy").value;
    if (isNaN(addr) || addr < 0 || addr > MAX_ADDR) return;

    const page = Math.floor(addr / PAGE_SIZE);
    const offset = addr % PAGE_SIZE;

    document.getElementById("cpu").innerHTML =
        `<div class="block">Page: ${page}<br>Offset: ${offset}</div>`;

    await glow(document.getElementById("tlb"));

    let entry = tlbWeb.find(e => e.page === page);
    let frame;

    if (entry) {
        frame = entry.frame;
        entry.lastUsed = ++timeWeb;
        hitCount++;
        showResult("TLB HIT", true);
    } else {
        await glow(document.getElementById("pt"));
        frame = pageTable[page];
        missCount++;

        if (tlbWeb.length === TLB_SIZE) replaceTLB(tlbWeb, policy);
        tlbWeb.push({ page, frame, lastUsed: ++timeWeb });

        showResult("TLB MISS", false);
    }

    /* PAGE TABLE (SIDE BY SIDE BLOCKS) */
    document.getElementById("pt").innerHTML = `
        <div class="pt-block">
            <div class="pt-header"><span>Page</span><span>Frame</span></div>
            ${Object.keys(pageTable).slice(0,8).map(p =>
                `<div class="pt-row ${parseInt(p)===page?'pt-active':''}">
                    <span>${p}</span><span>${pageTable[p]}</span>
                </div>`).join("")}
        </div>

        <div class="pt-block">
            <div class="pt-header"><span>Page</span><span>Frame</span></div>
            ${Object.keys(pageTable).slice(8,16).map(p =>
                `<div class="pt-row ${parseInt(p)===page?'pt-active':''}">
                    <span>${p}</span><span>${pageTable[p]}</span>
                </div>`).join("")}
        </div>
    `;

    document.getElementById("tlb").innerHTML =
        tlbWeb.map(e => `<div class="block">P${e.page} → F${e.frame}</div>`).join("");

    const physical = frame * 16 + offset;

    document.getElementById("mem").innerHTML =
        `<div class="block">Physical Address = ${physical}</div>`;

    document.getElementById("mem-middle").innerHTML =
        `<div class="block">Physical Address = ${physical}</div>`;

    updatePerformance();
}

/* PERFORMANCE */
function updatePerformance() {
    const total = hitCount + missCount;
    const ratio = total === 0 ? 0 : ((hitCount / total) * 100).toFixed(2);
    document.getElementById("performance").innerText =
        `Hits: ${hitCount} | Misses: ${missCount} | Hit Ratio: ${ratio}%`;
}

/* RESULT POPUP */
function showResult(text, isHit) {
    const pop = document.getElementById("resultPopup");
    pop.classList.remove("hidden","hit","miss");
    pop.classList.add(isHit ? "hit" : "miss");
    pop.querySelector("h2").innerText = text;
    setTimeout(() => pop.classList.add("hidden"), 1500);
}

/* C TERMINAL */
function runCProgram() {
    const addr = parseInt(document.getElementById("cInput").value);
    const policy = document.getElementById("cPolicy").value;
    if (isNaN(addr)) return;

    const page = Math.floor(addr / 16);
    const offset = addr % 16;
    const term = document.getElementById("terminalOutput");

    term.innerHTML +=
        `Enter Logical Address (-1 to exit): ${addr}<br>
         Page Number: ${page}<br>
         Offset: ${offset}<br>`;

    let entry = tlbC.find(e => e.page === page);
    let frame;

    if (entry) {
        frame = entry.frame;
        entry.lastUsed = ++timeC;
        term.innerHTML += `TLB HIT ✅<br>`;
    } else {
        frame = pageTable[page];
        if (tlbC.length === TLB_SIZE) replaceTLB(tlbC, policy);
        tlbC.push({ page, frame, lastUsed: ++timeC });
        term.innerHTML += `TLB MISS ❌ (Policy: ${policy})<br>`;
    }

    term.innerHTML += `Physical Address = ${frame * 16 + offset}<br><br>`;
}

/* THEORY */
function showTheory(title, text) {
    document.getElementById("theoryTitle").innerText = title;
    document.getElementById("theoryText").innerText = text;
    document.getElementById("overlay").classList.remove("hidden");
    document.getElementById("theoryModal").classList.remove("hidden");
}
function closeTheory() {
    document.getElementById("overlay").classList.add("hidden");
    document.getElementById("theoryModal").classList.add("hidden");
}

function showTLBTheory() {
    showTheory("Translation Lookaside Buffer (TLB)",
        "TLB is a small, fast associative memory that stores page-to-frame mappings.");
}
function showHitTheory() {
    showTheory("TLB Hit & Miss",
        "TLB Hit avoids page table access. TLB Miss requires page table lookup.");
}
function showAddressTheory() {
    showTheory("Physical Address Calculation",
        "Physical Address = (Frame × Page Size) + Offset");
}
function showPerformanceTheory() {
    showTheory("TLB Performance",
        "Hit Ratio = Hits / Total Memory References");
}
