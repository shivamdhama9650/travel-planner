"use client";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function SplitwisePage() {
  const [travelers, setTravelers] = useState(() => {
    try {
      const saved = localStorage.getItem("yatra_travelers");
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length ? parsed : ["Amit", "Pooja", "Rahul", "Neha"];
    } catch {
      return ["Amit", "Pooja", "Rahul", "Neha"];
    }
  });
  const [newTraveler, setNewTraveler] = useState("");
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem("yatra_expenses");
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Form state
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState(() => travelers[0] || "");
  const [splitWith, setSplitWith] = useState(() => [...travelers]);

  // Save to local storage when state changes
  useEffect(() => {
    localStorage.setItem("yatra_travelers", JSON.stringify(travelers));
  }, [travelers]);

  useEffect(() => {
    localStorage.setItem("yatra_expenses", JSON.stringify(expenses));
  }, [expenses]);

  const handleAddTraveler = (e) => {
    e.preventDefault();
    if (!newTraveler.trim()) return;
    if (travelers.includes(newTraveler.trim())) {
      alert("Traveler already exists!");
      return;
    }
    const updated = [...travelers, newTraveler.trim()];
    setTravelers(updated);
    setSplitWith((prev) => {
      const next = new Set(prev);
      next.add(newTraveler.trim());
      return Array.from(next);
    });
    if (!payer) setPayer(updated[0] || "");
    setNewTraveler("");
  };

  const handleRemoveTraveler = (name) => {
    if (confirm(`Are you sure you want to remove ${name}? This will clear any associated expenses.`)) {
      const updatedTravelers = travelers.filter((t) => t !== name);
      setTravelers(updatedTravelers);
      setSplitWith((prev) => prev.filter((t) => t !== name));
      setExpenses(expenses.filter((exp) => exp.payer !== name));
      if (payer === name) setPayer(updatedTravelers[0] || "");
    }
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const cost = parseFloat(amount);
    if (!desc.trim() || isNaN(cost) || cost <= 0 || !payer || splitWith.length === 0) {
      alert("Please fill out all fields and select at least one traveler to split with.");
      return;
    }

    const newExpense = {
      id: Date.now(),
      desc: desc.trim(),
      amount: cost,
      payer,
      splitWith: [...splitWith]
    };

    setExpenses([newExpense, ...expenses]);
    setDesc("");
    setAmount("");
  };

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter((exp) => exp.id !== id));
  };

  const handleToggleSplit = (name) => {
    if (splitWith.includes(name)) {
      setSplitWith(splitWith.filter((t) => t !== name));
    } else {
      setSplitWith([...splitWith, name]);
    }
  };

  const handleSelectAllSplit = () => {
    if (splitWith.length === travelers.length) {
      setSplitWith([]);
    } else {
      setSplitWith([...travelers]);
    }
  };

  // ── Debt Settlement Minimizer Algorithm ──
  const calculateBalancesAndSettlements = () => {
    const balances = {};
    travelers.forEach((t) => (balances[t] = 0));

    expenses.forEach((exp) => {
      const payerName = exp.payer;
      const amountPaid = exp.amount;
      const shareCount = exp.splitWith.length;

      if (shareCount === 0) return;

      const shareAmount = amountPaid / shareCount;

      // Add to payer's credit
      if (balances[payerName] !== undefined) {
        balances[payerName] += amountPaid;
      }

      // Subtract share from each participant
      exp.splitWith.forEach((p) => {
        if (balances[p] !== undefined) {
          balances[p] -= shareAmount;
        }
      });
    });

    // Debt Simplification Algorithm
    const debtors = [];
    const creditors = [];

    Object.entries(balances).forEach(([name, balance]) => {
      // round to 2 decimal places to avoid floating point issues
      const roundedVal = Math.round(balance * 100) / 100;
      if (roundedVal < -0.1) {
        debtors.push({ name, amount: -roundedVal });
      } else if (roundedVal > 0.1) {
        creditors.push({ name, amount: roundedVal });
      }
    });

    const settlements = [];

    // Sort descending
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const settlementAmount = Math.min(debtor.amount, creditor.amount);
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(settlementAmount)
      });

      debtor.amount -= settlementAmount;
      creditor.amount -= settlementAmount;

      if (debtor.amount < 0.1) dIdx++;
      if (creditor.amount < 0.1) cIdx++;
    }

    return { balances, settlements };
  };

  const { balances, settlements } = calculateBalancesAndSettlements();

  return (
    <>
      <Navbar />

      <div className="calc-page-header">
        <div className="container">
          <h1 className="animate-fadeInUp">
            💸 Split-yatra <span className="gradient-text">Group Splitter</span>
          </h1>
          <p className="animate-fadeInUp stagger-1">
            Keep track of group travel expenses and settle debts seamlessly with your fellow companions.
          </p>
        </div>
      </div>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container animate-fadeInUp stagger-2">

          <div className="calculator">

            {/* Left side: Setup travelers & Add expense */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>

              {/* Traveler Setup Card */}
              <div className="calc-form">
                <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-md)" }}>
                  👥 Trip Companions
                </h3>

                <form onSubmit={handleAddTraveler} style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-md)" }}>
                  <input
                    type="text"
                    placeholder="Add companion name..."
                    value={newTraveler}
                    onChange={(e) => setNewTraveler(e.target.value)}
                    className="calc-input"
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem 1.25rem" }}>
                    ＋ Add
                  </button>
                </form>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)" }}>
                  {travelers.map((name) => (
                    <span
                      key={name}
                      className="badge badge-primary"
                      style={{
                        padding: "0.4rem 0.8rem",
                        fontSize: "var(--text-sm)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      {name}
                      <button
                        onClick={() => handleRemoveTraveler(name)}
                        style={{ background: "none", color: "inherit", border: "none", fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                        title={`Remove ${name}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {travelers.length === 0 && (
                    <span style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>No travelers added yet. Add companions to start.</span>
                  )}
                </div>
              </div>

              {/* Add Expense Card */}
              <div className="calc-form">
                <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-md)" }}>
                  💸 Add Trip Expense
                </h3>

                <form onSubmit={handleAddExpense} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                  <div className="calc-field">
                    <label className="calc-label">Expense Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Dinner, Fuel, Entry tickets"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      className="calc-input"
                      required
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "var(--space-md)",
                    }}
                  >
                    <div className="calc-field">
                      <label className="calc-label">Total Amount (₹)</label>
                      <input
                        type="number"
                        placeholder="Cost"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="calc-input"
                        min="1"
                        step="any"
                        required
                      />
                    </div>

                    <div className="calc-field">
                      <label className="calc-label">Who Paid?</label>
                      <select
                        className="calc-select"
                        value={payer}
                        onChange={(e) => setPayer(e.target.value)}
                        required
                      >
                        {travelers.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Split with checkboxes */}
                  <div className="calc-field" style={{ marginBottom: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-xs)" }}>
                      <label className="calc-label" style={{ marginBottom: 0 }}>Split Between</label>
                      <button
                        type="button"
                        onClick={handleSelectAllSplit}
                        style={{ background: "none", color: "var(--primary-light)", fontSize: "var(--text-xs)", textDecoration: "underline" }}
                      >
                        {splitWith.length === travelers.length ? "Deselect All" : "Select All"}
                      </button>
                    </div>

                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "8px",
                      background: "var(--bg-dark)",
                      padding: "var(--space-sm) var(--space-md)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)"
                    }}>
                      {travelers.map((name) => (
                        <label
                          key={name}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "var(--text-sm)",
                            cursor: "pointer",
                            padding: "4px 0",
                            color: splitWith.includes(name) ? "var(--text-primary)" : "var(--text-secondary)"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={splitWith.includes(name)}
                            onChange={() => handleToggleSplit(name)}
                            style={{ cursor: "pointer", accentColor: "var(--primary)" }}
                          />
                          {name}
                        </label>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "var(--space-sm)" }}>
                    ＋ Add Expense
                  </button>
                </form>
              </div>

            </div>

            {/* Right side: Balances, Settlement & Ledger */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>

              {/* Debts & Settlement Card */}
              <div className="calc-result">
                <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-md)" }}>
                  🤝 Balances & Debt Settlement
                </h3>

                {expenses.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📊</div>
                    <p style={{ fontSize: "var(--text-sm)" }}>Add expenses to calculate settlements.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>

                    {/* Visual Settlements */}
                    <div>
                      <div className="calc-label" style={{ marginBottom: "var(--space-sm)" }}>Optimized Settlement Transactions</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {settlements.map((s, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "10px 14px",
                              background: "hsla(35, 100%, 60%, 0.05)",
                              border: "1px solid hsla(35, 100%, 60%, 0.15)",
                              borderRadius: "var(--radius-md)",
                              fontSize: "var(--text-sm)"
                            }}
                          >
                            <div>
                              <strong style={{ color: "var(--accent)" }}>{s.from}</strong>
                              <span style={{ color: "var(--text-secondary)" }}> owes </span>
                              <strong style={{ color: "var(--primary-light)" }}>{s.to}</strong>
                            </div>
                            <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--success)" }}>
                              ₹{s.amount.toLocaleString("en-IN")}
                            </div>
                          </div>
                        ))}

                        {settlements.length === 0 && (
                          <div style={{
                            padding: "10px 14px",
                            background: "hsla(150, 70%, 45%, 0.08)",
                            border: "1px solid hsla(150, 70%, 45%, 0.2)",
                            borderRadius: "var(--radius-md)",
                            color: "var(--success)",
                            textAlign: "center",
                            fontSize: "var(--text-sm)"
                          }}>
                            🎉 Everyone is completely settled! All balances are net zero.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Net Balances breakdown */}
                    <div>
                      <div className="calc-label" style={{ marginBottom: "var(--space-sm)" }}>Individual Net Balances</div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: "8px",
                        }}
                      >
                        {Object.entries(balances).map(([name, bal]) => {
                          const isCreditor = bal > 0.1;
                          const isDebtor = bal < -0.1;
                          return (
                            <div
                              key={name}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "8px 12px",
                                background: "var(--bg-dark)",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border-light)",
                                fontSize: "var(--text-sm)"
                              }}
                            >
                              <span>{name}</span>
                              <span style={{
                                fontWeight: 700,
                                color: isCreditor ? "var(--success)" : isDebtor ? "var(--danger)" : "var(--text-muted)"
                              }}>
                                {isCreditor ? "+" : ""}{Math.round(bal).toLocaleString("en-IN")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Expense Ledger */}
              <div className="calc-result">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)" }}>
                  <h3 style={{ fontSize: "var(--text-lg)", marginBottom: 0 }}>
                    🗒️ Expense Ledger ({expenses.length})
                  </h3>
                  {expenses.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm("Clear all trip expenses?")) setExpenses([]);
                      }}
                      style={{ background: "none", color: "var(--danger)", fontSize: "var(--text-xs)", textDecoration: "underline" }}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "350px", overflowY: "auto", paddingRight: "4px" }}>
                  {expenses.map((exp) => (
                    <div
                      key={exp.id}
                      style={{
                        padding: "12px",
                        background: "var(--bg-dark)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-light)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                          {exp.desc}
                        </div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "2px" }}>
                          Paid by <strong>{exp.payer}</strong> · Split with {exp.splitWith.join(", ")}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)" }}>
                          ₹{exp.amount.toLocaleString("en-IN")}
                        </div>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          style={{
                            background: "none",
                            color: "var(--text-muted)",
                            fontSize: "14px",
                            cursor: "pointer",
                            padding: "4px"
                          }}
                          className="hover-danger"
                          title="Delete expense"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}

                  {expenses.length === 0 && (
                    <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                      No expenses logged yet. Save your first bills above!
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      <Footer />
    </>
  );
}
