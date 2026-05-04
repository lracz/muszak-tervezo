import { useState, useEffect, useRef } from "react";

/**
 * Modern, nagyméretű egyedi dátumválasztó komponens.
 * Kiváltja a böngésző natív, nem skálázható naptárát.
 */
function ModernDatePicker({ value, onChange, min, max, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef(null);

  // Bezárás külső kattintásra
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const honapok = [
    "Január", "Február", "Március", "Április", "Május", "Június",
    "Július", "Augusztus", "Szeptember", "Október", "November", "December"
  ];

  const napok = ["H", "K", "Sz", "Cs", "P", "Sz", "V"];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Hétfőtől kezdődő indexelés
  };

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const daysCount = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));

  const selectDay = (day) => {
    const selected = new Date(currentYear, currentMonth, day);
    // Időzóna korrekció az ISO stringhez
    const offset = selected.getTimezoneOffset();
    const corrected = new Date(selected.getTime() - (offset * 60 * 1000));
    onChange(corrected.toISOString().split("T")[0]);
    setIsOpen(false);
  };

  const isSelected = (day) => {
    if (!value) return false;
    const d = new Date(value);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() === day;
  };

  const isDisabled = (day) => {
    const d = new Date(currentYear, currentMonth, day);
    const dateStr = d.toISOString().split("T")[0];
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;
  };

  return (
    <div className="modern-datepicker" ref={containerRef}>
      <div className="form-mezo" onClick={() => setIsOpen(!isOpen)}>
        <label>{label}</label>
        <div className={`datepicker-input ${isOpen ? "active" : ""}`}>
          <span className="date-display">{value || "ÉÉÉÉ-HH-NN"}</span>
          <span className="calendar-icon">📅</span>
        </div>
      </div>

      {isOpen && (
        <div className="calendar-popup animate-in">
          <div className="calendar-header">
            <button type="button" onClick={(e) => { e.stopPropagation(); prevMonth(); }}>◀</button>
            <div className="calendar-title">
              {honapok[currentMonth]} {currentYear}
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); nextMonth(); }}>▶</button>
          </div>

          <div className="calendar-grid">
            {napok.map(d => <div key={d} className="weekday-header">{d}</div>)}
            
            {Array(firstDay).fill(null).map((_, i) => (
              <div key={`empty-${i}`} className="day empty"></div>
            ))}

            {Array(daysCount).fill(null).map((_, i) => {
              const day = i + 1;
              const disabled = isDisabled(day);
              return (
                <div
                  key={day}
                  className={`day ${isSelected(day) ? "selected" : ""} ${isToday(day) ? "today" : ""} ${disabled ? "disabled" : ""}`}
                  onClick={(e) => { e.stopPropagation(); if (!disabled) selectDay(day); }}
                >
                  {day}
                </div>
              );
            })}
          </div>
          
          <div className="calendar-footer">
            <button type="button" className="btn-close-calendar" onClick={() => setIsOpen(false)}>Bezárás</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModernDatePicker;
