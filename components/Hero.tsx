export default function Hero() {
  return (
    <section
      className="relative bg-cover bg-center h-[300px] flex flex-col items-center justify-center text-white"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1950&q=80')",
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 text-center">
        <h1 className="text-3xl font-bold mb-2">Tỷ số bóng đá trực tiếp và hơn thế nữa</h1>
        <p className="max-w-xl mx-auto text-gray-200 mb-4">
          Nhận tỷ số, lịch thi đấu, kết quả, bảng xếp hạng, tỷ lệ cược và dự đoán AI theo thời gian thực cho tất cả các giải đấu bóng đá lớn.
        </p>
        <div className="flex justify-center gap-4">
          <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg">Xem diễn trực tiếp</button>
          <button className="bg-gray-100 text-gray-800 hover:bg-gray-200 px-5 py-2 rounded-lg">Nhận dự đoán</button>
        </div>
      </div>
    </section>
  );
}
