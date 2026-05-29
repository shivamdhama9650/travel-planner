"use client";
import { useState, useEffect } from "react";

const DESTINATIONS = [
  { id: "manali", name: "Manali" },
  { id: "shimla", name: "Shimla" },
  { id: "jaipur", name: "Jaipur" },
  { id: "rishikesh", name: "Rishikesh" },
  { id: "varanasi", name: "Varanasi" },
  { id: "goa", name: "Goa" },
  { id: "meghalaya", name: "Meghalaya" },
  { id: "ladakh", name: "Leh-Ladakh" },
  { id: "kedarnath", name: "Kedarnath" },
  { id: "madhyamaheshwar", name: "Madhya Maheshwar" },
  { id: "dharamshala", name: "Dharamshala" },
  { id: "ujjain", name: "Ujjain" },
];

const EXPENSE_DATA = {
  manali: {
    budget: { accommodation: 800, food: 500, transport: 400, activities: 600, misc: 200 },
    midRange: { accommodation: 2500, food: 1000, transport: 800, activities: 1500, misc: 500 },
    luxury: { accommodation: 8000, food: 2500, transport: 2000, activities: 3000, misc: 1000 },
  },
  shimla: {
    budget: { accommodation: 700, food: 400, transport: 300, activities: 400, misc: 200 },
    midRange: { accommodation: 2200, food: 900, transport: 600, activities: 1200, misc: 400 },
    luxury: { accommodation: 7000, food: 2000, transport: 1500, activities: 2500, misc: 800 },
  },
  jaipur: {
    budget: { accommodation: 600, food: 400, transport: 300, activities: 500, misc: 200 },
    midRange: { accommodation: 2000, food: 800, transport: 600, activities: 1200, misc: 400 },
    luxury: { accommodation: 10000, food: 2500, transport: 2000, activities: 3000, misc: 1000 },
  },
  rishikesh: {
    budget: { accommodation: 500, food: 350, transport: 300, activities: 800, misc: 200 },
    midRange: { accommodation: 1800, food: 700, transport: 500, activities: 2000, misc: 400 },
    luxury: { accommodation: 6000, food: 1500, transport: 1500, activities: 4000, misc: 800 },
  },
  varanasi: {
    budget: { accommodation: 500, food: 300, transport: 250, activities: 400, misc: 150 },
    midRange: { accommodation: 1500, food: 700, transport: 500, activities: 1000, misc: 300 },
    luxury: { accommodation: 5000, food: 1500, transport: 1500, activities: 2500, misc: 700 },
  },
  goa: {
    budget: { accommodation: 600, food: 500, transport: 400, activities: 500, misc: 300 },
    midRange: { accommodation: 2500, food: 1200, transport: 800, activities: 1500, misc: 500 },
    luxury: { accommodation: 8000, food: 3000, transport: 2000, activities: 3500, misc: 1000 },
  },
  meghalaya: {
    budget: { accommodation: 600, food: 400, transport: 500, activities: 300, misc: 200 },
    midRange: { accommodation: 2000, food: 800, transport: 1000, activities: 800, misc: 400 },
    luxury: { accommodation: 5000, food: 1500, transport: 2000, activities: 1500, misc: 700 },
  },
  ladakh: {
    budget: { accommodation: 800, food: 500, transport: 1000, activities: 500, misc: 300 },
    midRange: { accommodation: 3000, food: 1200, transport: 2500, activities: 1500, misc: 600 },
    luxury: { accommodation: 10000, food: 2500, transport: 5000, activities: 3000, misc: 1500 },
  },
  kedarnath: {
    budget: { accommodation: 600, food: 400, transport: 500, activities: 300, misc: 200 },
    midRange: { accommodation: 2000, food: 900, transport: 1000, activities: 1000, misc: 400 },
    luxury: { accommodation: 6000, food: 2000, transport: 4000, activities: 2500, misc: 800 },
  },
  madhyamaheshwar: {
    budget: { accommodation: 500, food: 300, transport: 400, activities: 200, misc: 150 },
    midRange: { accommodation: 1500, food: 700, transport: 800, activities: 500, misc: 300 },
    luxury: { accommodation: 4000, food: 1500, transport: 2500, activities: 1200, misc: 600 },
  },
  dharamshala: {
    budget: { accommodation: 600, food: 400, transport: 300, activities: 400, misc: 200 },
    midRange: { accommodation: 2200, food: 900, transport: 600, activities: 1200, misc: 400 },
    luxury: { accommodation: 8000, food: 2500, transport: 1800, activities: 3000, misc: 1000 },
  },
  ujjain: {
    budget: { accommodation: 500, food: 300, transport: 250, activities: 300, misc: 150 },
    midRange: { accommodation: 1800, food: 700, transport: 500, activities: 700, misc: 300 },
    luxury: { accommodation: 5000, food: 1500, transport: 1500, activities: 1500, misc: 700 },
  },
};

const BAR_COLORS = {
  accommodation: "accommodation",
  food: "food",
  transport: "transport",
  activities: "activities",
  miscellaneous: "misc",
};

const ICONS = {
  accommodation: "🏨",
  food: "🍽️",
  transport: "🚗",
  activities: "🎯",
  miscellaneous: "🛍️",
};

export default function ExpenseCalculator({ defaultDestination = "" }) {
  const [destination, setDestination] = useState(defaultDestination);
  const [travelers, setTravelers] = useState(2);
  const [days, setDays] = useState(3);
  const [tier, setTier] = useState("midRange");
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (defaultDestination) setDestination(defaultDestination);
  }, [defaultDestination]);

  useEffect(() => {
    if (!destination || !EXPENSE_DATA[destination]) {
      setResult(null);
      return;
    }

    const costs = EXPENSE_DATA[destination][tier];
    const breakdown = {
      accommodation: costs.accommodation * days * Math.ceil(travelers / 2),
      food: costs.food * days * travelers,
      transport: costs.transport * days * Math.ceil(travelers / 4),
      activities: costs.activities * days * travelers,
      miscellaneous: costs.misc * days * travelers,
    };
    const total = Object.values(breakdown).reduce((s, v) => s + v, 0);
    setResult({
      breakdown,
      total,
      perPerson: Math.round(total / travelers),
      dailyPerPerson: Math.round(total / travelers / days),
    });
  }, [destination, travelers, days, tier]);

  const maxBarValue = result
    ? Math.max(...Object.values(result.breakdown))
    : 0;

  return (
    <div className="calculator" id="expense-calculator">
      {/* ── Form ── */}
      <div className="calc-form">
        <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-xl)" }}>
          🧮 Plan Your Budget
        </h2>

        <div className="calc-field">
          <label className="calc-label">Destination</label>
          <select
            className="calc-select"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            id="calc-destination"
          >
            <option value="">Select a destination</option>
            {DESTINATIONS.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="calc-field">
          <label className="calc-label">Number of Travelers</label>
          <input
            type="range"
            min="1"
            max="10"
            value={travelers}
            onChange={(e) => setTravelers(Number(e.target.value))}
            className="calc-input"
            id="calc-travelers"
            style={{ cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-xs)" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>1</span>
            <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--primary-light)" }}>
              {travelers} {travelers === 1 ? "traveler" : "travelers"}
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>10</span>
          </div>
        </div>

        <div className="calc-field">
          <label className="calc-label">Trip Duration (days)</label>
          <input
            type="range"
            min="1"
            max="15"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="calc-input"
            id="calc-days"
            style={{ cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-xs)" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>1</span>
            <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--primary-light)" }}>
              {days} {days === 1 ? "day" : "days"}
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>15</span>
          </div>
        </div>

        <div className="calc-field">
          <label className="calc-label">Budget Tier</label>
          <div className="budget-tiers">
            <button
              className={`budget-tier ${tier === "budget" ? "active" : ""}`}
              onClick={() => setTier("budget")}
              id="tier-budget"
            >
              <div className="budget-tier-icon">🎒</div>
              <div className="budget-tier-name">Budget</div>
              <div className="budget-tier-desc">Hostels & local food</div>
            </button>
            <button
              className={`budget-tier ${tier === "midRange" ? "active mid" : ""}`}
              onClick={() => setTier("midRange")}
              id="tier-midrange"
            >
              <div className="budget-tier-icon">🏨</div>
              <div className="budget-tier-name">Mid-Range</div>
              <div className="budget-tier-desc">Hotels & restaurants</div>
            </button>
            <button
              className={`budget-tier ${tier === "luxury" ? "active luxury" : ""}`}
              onClick={() => setTier("luxury")}
              id="tier-luxury"
            >
              <div className="budget-tier-icon">👑</div>
              <div className="budget-tier-name">Luxury</div>
              <div className="budget-tier-desc">Resorts & fine dining</div>
            </button>
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="calc-result">
        {!result ? (
          <div style={{ textAlign: "center", padding: "var(--space-4xl) 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "var(--space-md)" }}>✈️</div>
            <p style={{ fontSize: "var(--text-lg)" }}>Select a destination to see your expense breakdown</p>
          </div>
        ) : (
          <>
            <div className="expense-total">
              <div className="expense-total-label">Estimated Total Cost</div>
              <div className="expense-total-amount">₹{result.total.toLocaleString("en-IN")}</div>
              <div className="expense-per-person">
                ₹{result.perPerson.toLocaleString("en-IN")} per person &nbsp;·&nbsp;
                ₹{result.dailyPerPerson.toLocaleString("en-IN")}/day per person
              </div>
            </div>

            <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-lg)" }}>
              Expense Breakdown
            </h3>

            <div className="expense-bars">
              {Object.entries(result.breakdown).map(([key, value]) => (
                <div key={key} className="expense-bar-item">
                  <div className="expense-bar-header">
                    <span className="expense-bar-name">
                      {ICONS[key]} {key.charAt(0).toUpperCase() + key.slice(1)}
                    </span>
                    <span className="expense-bar-value">₹{value.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="expense-bar-track">
                    <div
                      className={`expense-bar-fill ${BAR_COLORS[key]}`}
                      style={{ width: `${(value / maxBarValue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: "var(--space-xl)",
              padding: "var(--space-md)",
              background: "hsla(150, 70%, 45%, 0.08)",
              border: "1px solid hsla(150, 70%, 45%, 0.2)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--text-sm)",
              color: "var(--success)",
            }}>
              💡 Tip: {tier === "budget"
                ? "Book hostels and eat at local dhabas to stay within budget!"
                : tier === "luxury"
                  ? "Book early for the best luxury resort deals and airport transfers."
                  : "Mix budget activities with one or two splurge experiences for the best value."}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
