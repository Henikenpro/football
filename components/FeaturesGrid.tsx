const features = [
  { title: "Tỷ số trực tiếp", desc: "Cập nhật thời gian thực cho tất cả các giải đấu.", color: "bg-red-100" },
  { title: "Lịch thi đấu", desc: "Xem lịch thi đấu và kết quả của từng giải.", color: "bg-blue-100" },
  { title: "Bảng xếp hạng", desc: "Thống kê bảng xếp hạng chi tiết.", color: "bg-green-100" },
  { title: "Tỷ lệ cá cược", desc: "Theo dõi tỷ lệ cược và phân tích xu hướng.", color: "bg-yellow-100" },
  { title: "Dự đoán AI", desc: "AI phân tích và dự đoán kết quả chính xác.", color: "bg-purple-100" },
  { title: "Kết quả trọn đấu", desc: "Tổng hợp kết quả từ các giải đấu lớn.", color: "bg-gray-100" },
];

export default function FeaturesGrid() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-center font-semibold text-lg mb-6">Mọi thứ bạn cần</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className={`p-6 rounded-2xl text-center ${f.color} hover:shadow-lg transition`}
            >
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
