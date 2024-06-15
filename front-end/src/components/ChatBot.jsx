// import avatar from "../assets/avatar.jpg";
import chatbot from "../assets/images/chatbot.png";
import { useState, useRef, useEffect } from "react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { TypeAnimation } from "react-type-animation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage } from "@fortawesome/free-regular-svg-icons";
import { getStorage, setStorage } from "../utils";
function ChatBot(props) {
  const messagesEndRef = useRef(null);
  const [timeOfRequest, SetTimeOfRequest] = useState(0);
  let [promptInput, SetPromptInput] = useState("");
  let [sourceData, SetSourceData] = useState("vi-medical");
  let [chatHistory, SetChatHistory] = useState(getStorage('chat-history') ?? []);

  const commonQuestions = [
    "Dấu hiệu bị nhiễm COVID-19",
    "Phòng tránh gan nhiễm mỡ",
    "Phải làm gì khi bị kiến ba khoan cắn",
  ]
  let [isLoading, SetIsLoad] = useState(false);
  let [isGen, SetIsGen] = useState(false);
  const [dataChat, SetDataChat] = useState([
    [
      "start",
      [
        "Xin chào! Đây là Vi Medical Chatbot, Bạn đang có thắc mắc gì về vấn đề sức khoẻ - y tế?",
        null,
      ],
    ],
  ]);
  useEffect(() => {
    ScrollToEndChat();
  }, [isLoading]);
  useEffect(() => {
    const interval = setInterval(() => {
      SetTimeOfRequest((timeOfRequest) => timeOfRequest + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function ScrollToEndChat() {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }
  const onChangeHandler = (event) => {
    SetPromptInput(event.target.value);
  };

  async function SendMessageChat() {
    if (promptInput !== "" && isLoading === false) {
      SetTimeOfRequest(0);
      SetIsGen(true), SetPromptInput("");
      SetIsLoad(true);
      SetDataChat((prev) => [...prev, ["end", [promptInput, sourceData]]]);
      SetChatHistory((prev) => {
        setStorage('chat-history', [promptInput, ...prev])
        return [promptInput, ...prev]
      });

      fetch("https://ruling-plainly-jaguar.ngrok-free.app/rag/" + sourceData + "?q=" + promptInput,
        {
          method: "get",
          headers: new Headers({
            "ngrok-skip-browser-warning": "69420",
          }),
        })
        .then((response) => response.json())
        .then((result) => {
          SetDataChat((prev) => [
            ...prev,
            ["start", [result.result, result.source_documents, sourceData]],
          ]);
          SetIsLoad(false);
        })
        .catch((error) => {
          SetDataChat((prev) => [
            ...prev,
            ["start", ["Lỗi, không thể kết nối với server", null]],
          ]);
          SetIsLoad(false);
        });
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      SendMessageChat();
    }
  };
  let [reference, SetReference] = useState({
    title: "",
    source: "",
    url: "",
    text: ``,
  });
  const handleReferenceClick = (sources, sourceType) => {
    SetReference({
      title:
        sourceType == "wiki"
          ? sources.metadata.title
          : sources.metadata.page == undefined ? "Cẩm nang bệnh học" : "",
      source: sourceType == "wiki" ? "Wikipedia" : "Cẩm nang bệnh học",
      url:
        sourceType == "wiki"
          ? sources.metadata.source
          : "https://tamanhhospital.vn/benh/",
      text:
        sourceType == "wiki" ? sources.metadata.summary : sources.page_content,
    });
  };
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-100 h-[calc(100vh-72px)]">
      <div className="hidden lg:block  drawer-side absolute w-64 h-[20vh] left-3 mt-2 drop-shadow-md">
        <div className="menu p-4 w-full min-h-full bg-gray-50 text-base-content rounded-2xl mt-3  overflow-auto scroll-y-auto max-h-[80vh]">
          {/* Sidebar content here */}
          <ul className="menu text-sm">
            <h2 className="font-bold mb-2  text-emerald-600">
              Lịch sử trò chuyện
            </h2>
            {chatHistory.length == 0 ? (
              <p className="text-sm text-gray-500">
                Hiện chưa có cuộc hội thoại nào
              </p>
            ) : (
              ""
            )}
            {chatHistory.map((mess, i) => (
              <li key={i}>
                <p>
                  <FontAwesomeIcon icon={faMessage} />
                  {mess.length < 20 ? mess : mess.slice(0, 20) + "..."}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="hidden lg:block  drawer-side absolute w-64 h-[20vh] mt-2 right-3 drop-shadow-md">
        <div className="menu p-4 w-full min-h-full bg-gray-50 text-base-content rounded-2xl mt-3">
          {/* Sidebar content here */}
          <h2 className="font-bold text-sm mb-2 text-emerald-600">
            Nguồn tham khảo
          </h2>
          <ul className="menu">
            <li>
              <label className="label cursor-pointer">
                <span className="label-text font-medium">
                  Bách khoa toàn thư Wikipedia
                </span>
                <input
                  type="radio"
                  name="radio-10"
                  value={"wiki"}
                  checked={sourceData === "wiki"}
                  onChange={(e) => {
                    SetSourceData(e.target.value);
                  }}
                  className="radio checked:bg-emerald-500"
                />
              </label>
            </li>
            <li>
              <label className="label cursor-pointer">
                <span className="label-text font-medium">
                  Cẩm nang sức khoẻ
                </span>
                <input
                  value={"vi-medical"}
                  type="radio"
                  checked={sourceData === "vi-medical"}
                  onChange={(e) => {
                    SetSourceData(e.target.value);
                  }}
                  name="radio-10"
                  className="radio checked:bg-emerald-500 selection:bg-emerald-400"
                />
              </label>
            </li>
          </ul>
        </div>
        <div
          className="menu p-4 w-full min-h-full bg-gray-50 text-base-content 
        rounded-2xl mt-3  overflow-auto scroll-y-auto max-h-[43vh]
        scrollbar-thin scrollbar-thumb-gray-300 
          scrollbar-thumb-rounded-full scrollbar-track-rounded-full
        "
        >
          {/* Sidebar content here */}
          <ul className="menu text-sm">
            <h2 className="font-bold mb-2 text-emerald-600">
              Những câu hỏi phổ biến
            </h2>

            {commonQuestions.map((mess, i) => (
              <li key={i} onClick={() => SetPromptInput(mess)}>
                <p className="max-w-64">
                  <FontAwesomeIcon icon={faMessage} />
                  {mess}
                  {/* {mess.length < 20 ? mess : mess.slice(0, 20) + "..."} */}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={"flex justify-center h-[80vh]"}>
        {/* Put this part before </body> tag */}
        <input type="checkbox" id="my_modal_6" className="modal-toggle" />
        <div className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{reference.title}</h3>{" "}
            <p className="font-normal text-sm">Nguồn: {reference.source}</p>
            <p className="py-4 text-sm">
              {reference.text.slice(0, 700) + "..."}
            </p>
            <p className="link link-primary truncate">
              <a href={reference.url} target="_blank">
                {reference.url}
              </a>
            </p>
            <div className="modal-action">
              <label htmlFor="my_modal_6" className="btn btn-error">
                ĐÓNG
              </label>
            </div>
          </div>
        </div>

        <div
          id="chat-area"
          className="
          mt-5 text-sm 
          scrollbar-thin scrollbar-thumb-gray-300 bg-white  
          scrollbar-thumb-rounded-full scrollbar-track-rounded-full
          rounded-3xl border-2 md:w-[50%] md:p-3 p-1  w-full overflow-auto scroll-y-auto h-[80%] "
        >
          {dataChat.map((dataMessages, i) =>
            dataMessages[0] === "start" ? (
              <div className="chat chat-start drop-shadow-md" key={i}>
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full border-2 border-blue-500">
                    <img className="scale-150" src={chatbot} />
                  </div>
                </div>
                <div className="chat-bubble chat-bubble-info colo break-words bg-emerald-300">
                  <TypeAnimation
                    sequence={[
                      // () => ScrollToEndChat(),
                      dataMessages[1][0]

                      ,
                      () => SetIsGen(false),
                      // SetIsLoad(false),
                      // .replace("\n\n", "")
                      // .split("\n")
                      // .map((item, key) => {
                      //   return (
                      //     <>
                      //       {item.replace(/ /g, "\u00A0")}
                      //       <br />
                      //     </>
                      //   );
                      // })
                    ]}
                    cursor={false}
                    // wrapper="span"
                    speed={100}
                  />
                  {dataMessages[1][1] === null ||
                    dataMessages[1][1].length == 0 ? (
                    ""
                  ) : (
                    <>
                      <div className="divider m-0"></div>
                      <p className="font-semibold text-xs">
                        Tham khảo:{" "}
                        {dataMessages[1][1].map((source, j) => (
                          <label
                            htmlFor="my_modal_6"
                            className="kbd kbd-xs mr-1 hover:bg-sky-300 cursor-pointer"
                            onClick={() =>
                              handleReferenceClick(source, dataMessages[1][2])
                            }
                            key={j}
                          >
                            {dataMessages[1][2] == "wiki"
                              ? source.metadata.title
                              : source.metadata.page == undefined ? "Cẩm nang sức khoẻ" : ""}
                          </label>
                        ))}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="chat chat-end">
                {/* bg-gradient-to-r from-cyan-500 to-blue-500 */}
                <div className="chat-bubble shadow-xl chat-bubble-primary bg-emerald-300 text-black">
                  {dataMessages[1][0]}
                  <>
                    <div className="divider m-0"></div>
                    <p className="font-light text-xs text-black">
                      Tham khảo:{" "}
                      {dataMessages[1][1] == "wiki" ? "Wikipedia" : "Cẩm nang sức khoẻ"}
                    </p>
                  </>
                </div>
              </div>
            )
          )}
          {isLoading ? (
            <div className="chat chat-start">
              <div className="chat-image avatar">
                <div className="w-10 rounded-full border-2 border-emerald-500">
                  <img src={chatbot} />
                </div>
              </div>
              <div className="chat-bubble chat-bubble-info bg-emerald-300">
                <ScaleLoader
                  color="#000000"
                  loading={true}
                  height={10}
                  width={10}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
                <p className="text-xs font-medium">{timeOfRequest + "/60s"}</p>
              </div>
            </div>
          ) : (
            ""
          )}
          <div ref={messagesEndRef} />
          <div className="absolute bottom-[0.2rem] md:w-[50%] grid ">
            <input
              type="text"
              placeholder="Nhập câu hỏi tại đây..."
              className="mr-1 shadow-xl border-2 focus:outline-none px-2 rounded-2xl border-emerald-600 col-start-1 md:col-end-12 col-end-11 "
              onChange={onChangeHandler}
              onKeyDown={handleKeyDown}
              disabled={isGen}
              value={promptInput}
            />

            <button
              disabled={isGen}
              onClick={() => SendMessageChat()}
              className={
                "md:col-start-12 rounded-2xl col-start-11 col-end-12 md:col-end-13 btn-square btn"
              }
              style={{
                backgroundColor: 'rgb(52 211 153)'
              }}
            >
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                color="white"
                height="15px"
                width="15px"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
            <p className=" text-xs col-start-1 col-end-12 text-justify p-1">
              <b>Lưu ý: </b>Mô hình có thể đưa ra câu trả lời không chính xác ở
              một số trường hợp, vì vậy hãy luôn kiểm chứng thông tin bạn nhé!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ChatBot;
