const TLB_SIZE = 4;
let tlb = [];

// Page Table: Page → Frame
let pageTable = {};
for (let i = 0; i < 16; i++) {
    pageTable[i] = i + 10;
}

// INITIAL DISPLAY (PREVENT BLANK UI)
window.onload = () => {
    document.getElementById("cpu").innerHTML =
        `<div class="block">Waiting for input</div>`;

    document.getElementById("tlb").innerHTML =
        `<div class="block">TLB Empty</div>`;

    const ptDiv = document.getElementById("pt");
    ptDiv.innerHTML = "";
    for (let p in pageTable) {
        ptDiv.innerHTML += `<div class="block">P${p} → F${pageTable[p]}</div>`;
    }

    document.getElementById("mem").innerHTML =
        `<div class="block">No access yet</div>`;
};

async function simulate() {
    const addr = document.getElementById("logical").value;
    if (addr === "") return;

    const page = Math.floor(addr / 16);
    const offset = addr % 16;

    const cpu = document.getElementById("cpu");
    const tlbDiv = document.getElementById("tlb");
    const ptDiv = document.getElementById("pt");
    const memDiv = document.getElementById("mem");
    const status = document.getElementById("status");

    // RESET VISUALS
    cpu.innerHTML = "";
    tlbDiv.classList.remove("search");
    ptDiv.classList.remove("search");
    memDiv.classList.remove("search");

    // CPU STEP
    cpu.innerHTML =
        `<div class="block search">Page: ${page}<br>Offset: ${offset}</div>`;
    await delay(800);

    // TLB SEARCH
    tlbDiv.classList.add("search");
    status.innerText = "Searching TLB...";
    status.style.color = "#38bdf8";
    await delay(1000);
    tlbDiv.classList.remove("search");

    let hit = tlb.find(e => e.page === page);

    if (hit) {
        status.innerText = "✅ TLB HIT";
        status.style.color = "#22c55e";

    } else {
        status.innerText = "❌ TLB MISS";
        status.style.color = "#ef4444";
        await delay(800);

        // PAGE TABLE SEARCH
        ptDiv.classList.add("search");
        status.innerText = "Searching Page Table...";
        status.style.color = "#38bdf8";
        await delay(1200);
        ptDiv.classList.remove("search");

        // UPDATE TLB (FIFO)
        if (tlb.length === TLB_SIZE) {
            tlb.shift();
        }
        tlb.push({ page: page, frame: pageTable[page] });

        status.innerText = "Page Found → Updating TLB";
        await delay(800);
    }

    // UPDATE TLB DISPLAY (PERSISTENT)
    tlbDiv.innerHTML = "";
    if (tlb.length === 0) {
        tlbDiv.innerHTML = `<div class="block">TLB Empty</div>`;
    } else {
        tlb.forEach(e => {
            tlbDiv.innerHTML += `<div class="block">P${e.page} → F${e.frame}</div>`;
        });
    }

    // MAIN MEMORY ACCESS
    memDiv.classList.add("search");
    await delay(1000);
    memDiv.classList.remove("search");

    memDiv.innerHTML =
        `<div class="block">
            Physical Address:<br>
            ${(pageTable[page] * 16) + offset}
        </div>`;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

