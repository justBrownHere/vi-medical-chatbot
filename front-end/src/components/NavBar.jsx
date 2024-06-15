import { useLocation, useNavigate, Link } from 'react-router-dom';
function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className="navbar bg-base-100 w-[95%] h-[72px]">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </label>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li>
              <Link to="/home">
                <a>Trang chủ</a>
              </Link>
            </li>
            <li>
              <Link to="/chat">
                <a>Trò chuyện</a>
              </Link>
            </li>
            <li>
              <Link to="/faq">
                <a>FAQs</a>
              </Link>
            </li>
            <li>
              <Link to="/issue">
                <a>Báo lỗi/ Góp ý</a>
              </Link>
            </li>
          </ul>
        </div>
        <a onClick={() => navigate("/home")} className="btn btn-ghost normal-case font-extrabold text-xl will-change-auto text-emerald-600">
          Vi Medical Chatbot
        </a>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 font-semibold ">
          <li className='p-1'>
            <button onClick={() => navigate("/home")} className={`hover:bg-emerald-400 ${location.pathname == "/home" ? "btn btn-outline" : ""}`}>Trang chủ</button>
          </li>
          <li className='p-1'>
            <button onClick={() => navigate("/chat")} className={`hover:bg-emerald-400 ${location.pathname == "/chat" ? "btn btn-outline" : ""}`}>Trò chuyện</button>
          </li>
          <li className='p-1'>
            <button onClick={() => navigate("/faq")} className={`hover:bg-emerald-400 ${location.pathname == "/faq" ? "btn btn-outline" : ""}`}>FAQs</button>
          </li>
        </ul>
      </div>
      <div className="navbar-end">
        {/* <a className="btn btn-outline btn-primary md:flex hidden">
            Đăng nhập
          </a> */}
      </div>
    </div>
  );
}
export default NavBar;
