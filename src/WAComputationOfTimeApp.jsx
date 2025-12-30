import { useState } from "react";
import jsPDF from "jspdf";

// Auto-calculated Washington State legal holidays by year (simplified list)
function getWAHolidays(year) {
  return [
    `${year}-01-01`, // New Year's Day
    `${year}-01-20`, // MLK Day (example)
    `${year}-02-17`, // Presidents Day
    `${year}-05-26`, // Memorial Day
    `${year}-07-04`, // Independence Day
    `${year}-09-01`, // Labor Day
    `${year}-11-27`, // Thanksgiving
    `${year}-12-25`, // Christmas Day
  ];
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export default function WAComputationOfTimeApp() {
  const [acceptanceDate, setAcceptanceDate] = useState("");
  const [timeline, setTimeline] = useState("custom");
  const [days, setDays] = useState("");
  const [result, setResult] = useState(null);

  function isHoliday(date, holidays) {
    const iso = date.toISOString().split("T")[0];
    return holidays.includes(iso);
  }

  function calculateDeadline() {
    if (!acceptanceDate || !days) return;

    const start = new Date(acceptanceDate);
    const year = start.getFullYear();
    const LEGAL_HOLIDAYS = getWAHolidays(year);
    const totalDays = parseInt(days, 10);

    // Period begins the day AFTER mutual acceptance
    let current = new Date(start);
    current.setDate(current.getDate() + 1);

    let countedDays = 0;

    while (countedDays < totalDays) {
      const skipNonBusiness = totalDays <= 5;

      if (!skipNonBusiness || (!isWeekend(current) && !isHoliday(current, LEGAL_HOLIDAYS))) {
        countedDays++;
        if (countedDays === totalDays) break;
      }

      current.setDate(current.getDate() + 1);
    }

    // If last day falls on weekend or holiday, move to next business day
    while (isWeekend(current) || isHoliday(current, LEGAL_HOLIDAYS)) {
      current.setDate(current.getDate() + 1);
    }

    // Deadline ends at 9:00 PM
    current.setHours(21, 0, 0, 0);

    setResult(new Date(current));
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow">
      <div className="flex items-center gap-2 mb-4">
        <img src="/logo.svg" alt="Logo" className="h-10" />
        <h1 className="text-xl font-semibold">WA Computation of Time</h1>
      </div>

      <label className="block mb-2 text-sm">Mutual Acceptance Date</label>
      <input
        type="date"
        className="w-full border rounded p-2 mb-4"
        value={acceptanceDate}
        onChange={(e) => setAcceptanceDate(e.target.value)}
      />

      <label className="block mb-2 text-sm">Timeline</label>
      <select
        className="w-full border rounded p-2 mb-4"
        value={timeline}
        onChange={(e) => {
          setTimeline(e.target.value);
          if (e.target.value === "inspection") setDays("5");
          if (e.target.value === "financing") setDays("21");
          if (e.target.value === "appraisal") setDays("10");
        }}
      >
        <option value="custom">Custom</option>
        <option value="inspection">Inspection (Form 35 – 5 days)</option>
        <option value="financing">Financing (Form 22A – 21 days)</option>
        <option value="appraisal">Appraisal (Form 22A – 10 days)</option>
      </select>

      <label className="block mb-2 text-sm">Number of Days</label>
      <input
        type="number"
        className="w-full border rounded p-2 mb-4"
        value={days}
        onChange={(e) => setDays(e.target.value)}
      />

      <button
        onClick={calculateDeadline}
        className="w-full bg-black text-white rounded-xl py-2"
      >
        Calculate Deadline
      </button>

      {result && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => navigator.clipboard.writeText(result.toLocaleString())}
            className="flex-1 border rounded py-1 text-sm"
          >Copy</button>
          <button
            onClick={() => {
              const pdf = new jsPDF();
              pdf.text("Washington Real Estate Deadline", 10, 10);
              pdf.text(result.toLocaleString(), 10, 20);
              pdf.save("deadline.pdf");
            }}
            className="flex-1 border rounded py-1 text-sm"
          >PDF</button>
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p className="text-sm">Deadline (9:00 PM):</p>
          <p className="text-lg font-medium">
            {result.toLocaleString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        For informational purposes only. This tool is intended for use by licensed real estate brokers. Brokers should independently verify all deadlines and timelines. This calculator does not replace the Washington State Purchase and Sale Agreement, addenda, or NWMLS rules.
      </p>
    </div>
  );
}
