(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const form = $("trip-form");
  const currencyMeta = {
    INR: { symbol: "₹", formatter: "en-IN", rates: { budget: [1800,450,350,300], premium: [4500,900,700,700], luxury: [12000,2200,1800,1500] }, fuel: 105, ticket: 1500 },
    USD: { symbol: "$", formatter: "en-US", rates: { budget: [45,18,12,12], premium: [115,38,30,24], luxury: [300,95,85,55] }, fuel: .95, ticket: 90 },
    GBP: { symbol: "£", formatter: "en-GB", rates: { budget: [38,16,10,10], premium: [100,35,27,22], luxury: [270,85,75,50] }, fuel: 1.45, ticket: 75 },
    EUR: { symbol: "€", formatter: "de-DE", rates: { budget: [42,17,11,11], premium: [105,36,28,23], luxury: [280,90,78,52] }, fuel: 1.65, ticket: 80 },
    AUD: { symbol: "A$", formatter: "en-AU", rates: { budget: [65,25,18,18], premium: [155,55,42,35], luxury: [390,135,115,80] }, fuel: 1.85, ticket: 120 },
    CAD: { symbol: "C$", formatter: "en-CA", rates: { budget: [60,23,16,16], premium: [145,50,38,32], luxury: [360,125,105,72] }, fuel: 1.65, ticket: 110 }
  };
  const expenseTypes = [
    { key: "stay", label: "Accommodation", icon: "⌂" },
    { key: "food", label: "Food & dining", icon: "◌" },
    { key: "activities", label: "Activities & experiences", icon: "✳" },
    { key: "transport", label: "Main transport", icon: "↗" },
    { key: "local", label: "Local transport", icon: "⌖" },
    { key: "tolls", label: "Tolls & parking", icon: "▤" }
  ];
  let lastCalculation = null;
  let toastTimer = null;

  function number(id, fallback) {
    const value = Number($(id).value);
    return Number.isFinite(value) && value >= 0 ? value : (fallback || 0);
  }
  function formatMoney(value) {
    const currency = $("currency").value;
    return new Intl.NumberFormat(currencyMeta[currency].formatter, { style: "currency", currency: currency, maximumFractionDigits: 0 }).format(Math.round(value || 0));
  }
  function setCurrencySymbols() {
    const symbol = currencyMeta[$("currency").value].symbol;
    document.querySelectorAll(".currency-symbol").forEach((node) => { node.textContent = symbol; });
  }
  function applySampleRates() {
    const selected = currencyMeta[$("currency").value];
    const rates = selected.rates[$("style").value];
    $("stay-rate").value = rates[0];
    $("food-rate").value = rates[1];
    $("activity-rate").value = rates[2];
    $("local-rate").value = rates[3];
    $("fuel-price").value = selected.fuel;
    $("ticket-rate").value = selected.ticket;
    setCurrencySymbols();
  }
  function setTransportFields() {
    const isCar = $("transport").value === "car";
    $("car-fields").classList.toggle("hidden", !isCar);
    $("other-transport-fields").classList.toggle("hidden", isCar);
  }
  function calculate() {
    const days = Math.max(1, Math.min(30, Math.round(number("days", 3))));
    const travellers = Math.max(1, Math.min(40, Math.round(number("travellers", 1))));
    const nights = Math.max(0, days - 1);
    const rooms = Math.max(0, Math.min(20, Math.round(number("rooms", Math.ceil(travellers / 2)))));
    const transportMode = $("transport").value;
    const stay = nights * rooms * number("stay-rate");
    const food = days * travellers * number("food-rate");
    const activities = days * travellers * number("activity-rate");
    const local = days * number("local-rate");
    let mainTransport = 0;
    let tolls = 0;
    if (transportMode === "car") {
      const efficiency = Math.max(.1, number("efficiency", 15));
      mainTransport = (number("distance") / efficiency) * number("fuel-price");
      tolls = number("tolls");
    } else {
      mainTransport = travellers * number("ticket-rate");
    }
    const subtotal = stay + food + activities + mainTransport + local + tolls;
    const buffer = subtotal * .10;
    const total = subtotal + buffer;
    const target = number("target-budget");
    return {
      currency: $("currency").value, days, nights, travellers, rooms,
      destination: $("destination").value.trim(), origin: $("origin").value.trim(),
      style: $("style").value, transportMode,
      breakdown: { stay, food, activities, transport: mainTransport, local, tolls },
      subtotal, buffer, total, perPerson: total / travellers, target,
      withinBudget: target > 0 ? total <= target : null
    };
  }
  function createItinerary(plan) {
    const host = $("itinerary-list");
    host.innerHTML = "";
    for (let day = 1; day <= plan.days; day++) {
      let title = "Explore " + plan.destination;
      let detail = "Choose one main experience, leave room for a relaxed meal and keep travel between stops realistic.";
      if (plan.days === 1) {
        title = "One-day escape";
        detail = "Travel to " + plan.destination + ", enjoy one or two priority experiences, then return with time to spare.";
      } else if (day === 1) {
        title = "Arrive & settle in";
        detail = "Travel from " + plan.origin + ", check in and explore nearby at an easy pace.";
      } else if (day === plan.days) {
        title = "A slow morning & return";
        detail = "Enjoy breakfast, check out and allow a sensible return-travel buffer.";
      } else if (day === 2) {
        title = "Discover the highlights";
        detail = "Plan your main sightseeing or outdoor experience. Keep a backup option for weather or closures.";
      } else if (day === plan.days - 1) {
        title = "A little more exploring";
        detail = "Choose a quieter neighbourhood, local food stop or activity you have not tried yet.";
      }
      const item = document.createElement("div");
      item.className = "itinerary-day";
      const chip = document.createElement("span");
      chip.className = "day-chip";
      chip.textContent = "DAY " + String(day).padStart(2, "0");
      const content = document.createElement("div");
      const heading = document.createElement("strong");
      heading.textContent = title;
      const text = document.createElement("p");
      text.textContent = detail;
      content.append(heading, text);
      item.append(chip, content);
      host.appendChild(item);
    }
  }
  function showBreakdown(plan) {
    const host = $("cost-breakdown");
    host.innerHTML = "";
    const maxValue = Math.max.apply(null, Object.keys(plan.breakdown).map((key) => plan.breakdown[key]).concat([1]));
    expenseTypes.forEach((item) => {
      const value = plan.breakdown[item.key];
      const row = document.createElement("div");
      row.className = "breakdown-row";
      const icon = document.createElement("span");
      icon.className = "breakdown-icon";
      icon.textContent = item.icon;
      const main = document.createElement("div");
      main.className = "breakdown-main";
      const label = document.createElement("span");
      label.textContent = item.label;
      const track = document.createElement("div");
      track.className = "breakdown-track";
      const fill = document.createElement("i");
      fill.style.width = Math.max(value > 0 ? 3 : 0, (value / maxValue) * 100) + "%";
      track.appendChild(fill);
      main.append(label, track);
      const amount = document.createElement("strong");
      amount.textContent = formatMoney(value);
      row.append(icon, main, amount);
      host.appendChild(row);
    });
  }
  function renderResults(plan) {
    lastCalculation = plan;
    $("results").classList.remove("hidden");
    $("total-cost").textContent = formatMoney(plan.total);
    $("per-person").textContent = formatMoney(plan.perPerson);
    $("total-subtitle").textContent = plan.travellers + " traveller" + (plan.travellers === 1 ? "" : "s") + " · " + plan.days + " day" + (plan.days === 1 ? "" : "s") + " · " + plan.destination;
    $("buffer-cost").textContent = formatMoney(plan.buffer);
    $("rooms").value = plan.rooms;
    $("cost-assumption").textContent = plan.rooms + " room" + (plan.rooms === 1 ? "" : "s") + " × " + plan.nights + " night" + (plan.nights === 1 ? "" : "s") + ". Change the room count below and update the stay cost.";
    const status = $("budget-status");
    status.className = "budget-status";
    if (plan.withinBudget === null) status.textContent = "Budget not set";
    else if (plan.withinBudget) {
      status.textContent = "Within target by " + formatMoney(plan.target - plan.total);
      status.classList.add("within");
    } else {
      status.textContent = "Over target by " + formatMoney(plan.total - plan.target);
      status.classList.add("over");
    }
    showBreakdown(plan);
    createItinerary(plan);
    $("results").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function makePlanText(plan) {
    const lines = ["ROAMORA TRIP PLAN", "Route: " + plan.origin + " → " + plan.destination, "Duration: " + plan.days + " days (" + plan.nights + " nights)", "Travellers: " + plan.travellers, "Style: " + plan.style.charAt(0).toUpperCase() + plan.style.slice(1), "", "ESTIMATED COST BREAKDOWN"];
    expenseTypes.forEach((item) => lines.push(item.label + ": " + formatMoney(plan.breakdown[item.key])));
    lines.push("Contingency (10%): " + formatMoney(plan.buffer), "Estimated total: " + formatMoney(plan.total), "Per person: " + formatMoney(plan.perPerson), "", "Daily outline:");
    for (let day = 1; day <= plan.days; day++) {
      let activity = "Explore " + plan.destination + " at a comfortable pace.";
      if (plan.days === 1) activity = "One-day escape and return.";
      else if (day === 1) activity = "Travel, check in and explore nearby.";
      else if (day === plan.days) activity = "Slow morning, check out and return.";
      lines.push("Day " + day + ": " + activity);
    }
    lines.push("", "Planning estimate only. Rates are editable assumptions, not live quotes or confirmed bookings.");
    return lines.join("\n");
  }
  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    renderResults(calculate());
  });
  $("style").addEventListener("change", applySampleRates);
  $("currency").addEventListener("change", applySampleRates);
  $("transport").addEventListener("change", setTransportFields);
  $("reset-rates").addEventListener("click", () => { applySampleRates(); showToast("Sample cost assumptions reset."); });
  $("recalculate-rooms").addEventListener("click", () => {
    if (!lastCalculation) return;
    renderResults(calculate());
    showToast("Stay estimate updated.");
  });
  $("copy-plan").addEventListener("click", async () => {
    if (!lastCalculation) return;
    const text = makePlanText(lastCalculation);
    try {
      await navigator.clipboard.writeText(text);
      showToast("Trip plan copied.");
    } catch (error) {
      const helper = document.createElement("textarea");
      helper.value = text;
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
      showToast("Trip plan copied.");
    }
  });
  $("print-plan").addEventListener("click", () => window.print());
  document.querySelectorAll("[data-destination]").forEach((button) => {
    button.addEventListener("click", () => {
      $("destination").value = button.dataset.destination;
      $("planner").scrollIntoView({ behavior: "smooth" });
      $("destination").focus({ preventScroll: true });
    });
  });
  $("year").textContent = new Date().getFullYear();
  applySampleRates();
  setTransportFields();
})();