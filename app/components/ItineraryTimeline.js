export default function ItineraryTimeline({ itinerary }) {
  if (!itinerary || itinerary.length === 0) return null;

  return (
    <div className="timeline" id="itinerary-timeline">
      {itinerary.map((day, i) => (
        <div
          key={day.day}
          className="timeline-item"
          style={{ animationDelay: `${i * 0.15}s` }}
        >
          <div className="timeline-dot" />
          <div className="timeline-day">Day {day.day}</div>
          <h3 className="timeline-title">{day.title}</h3>
          <div className="timeline-activities">
            {day.activities.map((activity, j) => (
              <div key={j} className="timeline-activity">
                <span className="timeline-activity-icon">▸</span>
                <span>{activity}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
