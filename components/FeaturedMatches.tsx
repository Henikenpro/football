export default function FeaturedMatches() {
  const matches = [
    { home: "Manchester United", away: "Liverpool", status: "Live", score: "1 - 1" },
    { home: "Real Madrid", away: "Barcelona", status: "FT", score: "2 - 0" },
    { home: "Bayern Munich", away: "Borussia Dortmund", status: "FT", score: "3 - 2" },
  ];

  return (
    <section className="bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="font-semibold text-lg mb-4">Các trận đấu nổi bật</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {matches.map((m, i) => (
            <div key={i} className="border rounded-xl p-4 bg-white hover:shadow-md transition">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">{m.status}</span>
                <span className="font-semibold">{m.score}</span>
              </div>
              <div className="text-gray-800">
                <div>{m.home}</div>
                <div>{m.away}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
