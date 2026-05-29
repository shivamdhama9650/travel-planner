"use client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ExpenseCalculator from "../components/ExpenseCalculator";

export default function CalculatorPage() {
  return (
    <>
      <Navbar />

      <div className="calc-page-header">
        <div className="container">
          <h1 className="animate-fadeInUp">
            🧮 Smart <span className="gradient-text">Expense Calculator</span>
          </h1>
          <p className="animate-fadeInUp stagger-1">
            Plan your budget intelligently. Estimate accommodation, food, transport, and activity costs across different destinations in India.
          </p>
        </div>
      </div>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container animate-fadeInUp stagger-2">
          <ExpenseCalculator />
        </div>
      </section>

      <Footer />
    </>
  );
}
