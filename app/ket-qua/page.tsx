import MatchResults from "@/components/MatchResults";

export default function ResultsPage() {
  return (
    <main className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-2">Kết quả trận đấu</h1>
        <p className="text-gray-600 mb-6">
          Kết quả bóng đá mới nhất và kết quả trận đấu từ các giải đấu lớn
        </p>
        <MatchResults />
      </div>
    </main>
  );
}
