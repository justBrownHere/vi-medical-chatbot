import chatbot from "../assets/images/chatbot.png";
import { Link } from "react-router-dom";
function HomePage() {
  return (
    <div className="flex items-center justify-center hero w-full bg-gradient-to-r from-emerald-400 to-emerald-600 h-[calc(100vh-72px)]">
      <div className="hero-content text-center min-w-[200px] ">
        <div className="max-w-md flex-1 text-white">
          <img
            className="block w-[200px] h-auto mx-auto"
            src={chatbot}
          ></img>
          <h1 className="text-2xl lg:text-5xl font-bold ">Xin chào! Đây là</h1>
          <h1 className="text-3xl lg:text-5xl font-bold">
            Vi Medical Chatbot
          </h1>
          <p className="py-6 font-semibold lg:text-lg text-sm">
            Giúp bạn tìm kiếm thông tin y tế, tư vấn về các triệu chứng - bệnh lý,
            đưa ra các lời khuyên hợp lý để bạn có thể có một cuộc sống khỏe mạnh và cân bằng.
          </p>
          <Link to="/chat">
            <button className="btn btn-info">Bắt đầu ngay</button>
          </Link>
        </div>
      </div>

    </div>
  );
}

export default HomePage;
