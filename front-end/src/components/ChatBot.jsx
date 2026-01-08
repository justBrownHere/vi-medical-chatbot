// import avatar from "../assets/avatar.jpg";
import chatbot from "../assets/images/chatbot.png";
import { useState, useRef, useEffect } from "react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { TypeAnimation } from "react-type-animation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage, faTrashAlt, faEdit } from "@fortawesome/free-regular-svg-icons";
import { getStorage, setStorage } from "../utils";

// API Base URL
const API_BASE_URL = "https://ruling-plainly-jaguar.ngrok-free.app";

// getStorage('chat-history') ?? []
function ChatBot(props) {
  const messagesEndRef = useRef(null);
  const [timeOfRequest, SetTimeOfRequest] = useState(0);
  let [promptInput, SetPromptInput] = useState("");
  let [sourceData, SetSourceData] = useState("vi-medical");
  let [chatHistory, SetChatHistory] = useState(getStorage('chat-history') ?? []);
  const [currentSessionId, setCurrentSessionId] = useState(new Date().getTime());
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingChatName, setEditingChatName] = useState("");

  const commonQuestions = [
    "Dấu hiệu bị nhiễm COVID-19",
    "Phòng tránh gan nhiễm mỡ",
    "Phải làm gì khi bị kiến ba khoan cắn",
  ]
  let [isLoading, SetIsLoad] = useState(false);
  let [isGen, SetIsGen] = useState(false);
  const [dataChat, SetDataChat] = useState({
  id: new Date().getTime(),
  name: 'New chat',  // ✅ Giống ChatGPT - lowercase 'c'
  context: [],
  chats: [
    [
      "start",
      [
        "Xin chào! Đây là Vi Medical Chatbot, Bạn đang có thắc mắc gì về vấn đề sức khoẻ - y tế?",
        null,
      ],
    ],
  ]
  });

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



  console.log(dataChat)

  // Helper function để extract chat history từ dataChat
  const extractChatHistory = (chats) => {
    const history = [];
    for (let i = 0; i < chats.length; i++) {
      if (chats[i][0] === "end" && chats[i + 1] && chats[i + 1][0] === "start") {
        history.push({
          question: chats[i][1][0],
          answer: chats[i + 1][1][0]
        });
      }
    }
    return history;
  };

  // Helper function để check xem có nên lưu vào history không
  const shouldSaveToHistory = (answer) => {
    if (!answer) return false;
    
    // Patterns của non-medical responses (greeting, irrelevant, error)
    const skipPatterns = [
      // Greeting patterns
      /^xin chào/i,
      /^chào bạn/i,
      /^hello/i,
      /^hi/i,
      /tôi là vi-?medical/i,
      
      // Irrelevant patterns
      /câu hỏi.*không liên quan/i,
      /không liên quan.*y tế/i,
      /không thể tư vấn/i,
      /chỉ có thể tư vấn về sức khỏe/i,
      
      // Error patterns
      /lỗi.*không thể kết nối/i,
      /không thể kết nối.*server/i,
      /^⚠️.*lỗi/i,
    ];
    
    // Nếu match một trong các patterns → KHÔNG lưu
    for (const pattern of skipPatterns) {
      if (pattern.test(answer)) {
        return false;
      }
    }
    
    // Default: lưu vào history
    return true;
  };

  // Helper function để generate chat title
  const generateChatTitle = async (question) => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-title`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
        },
        body: JSON.stringify({ question }),
        signal: AbortSignal.timeout(5000)  // Timeout 5s
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.title;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Error generating title:", error);
    }
    
    // Fallback: Lấy 6 từ đầu
    const words = question.split(' ').slice(0, 6);  // FIX: split(' ') với space
    return words.join(" ") + (question.split(' ').length > 6 ? "..." : "");
  };

  function SendMessageChat() {
    if (promptInput !== "" && isLoading === false) {
      SetTimeOfRequest(0);
      SetIsGen(true);
      const currentQuestion = promptInput;
      SetPromptInput("");
      SetIsLoad(true);
      
      // Lấy session_id từ dataChat
      const sessionId = dataChat.id;
      setCurrentSessionId(sessionId);
      
      // Kiểm tra nếu là câu hỏi đầu tiên (chỉ có greeting message)
      const isFirstQuestion = dataChat.chats.length === 1;
      
      // Tạo updated dataChat với câu hỏi mới
      const updatedDataChat = {
        ...dataChat,
        name: dataChat.name,  // ✅ Giữ nguyên "New chat" ban đầu
        chats: [...dataChat.chats, ["end", [currentQuestion, sourceData]]]
      };
      
      SetDataChat(updatedDataChat);
      
      // ✅ Generate title nếu là câu hỏi đầu tiên - GIỐNG CHATGPT
      if (isFirstQuestion) {
        // Gọi API generate title sau khi đã có response
        generateChatTitle(currentQuestion).then(title => {
          if (title) {
            console.log(`📝 Generated title: ${title}`);
            SetDataChat(prev => ({ ...prev, name: title }));
            // Update trong history nếu đã có
            SetChatHistory(prevHistory => {
              const updated = prevHistory.map(chat => 
                chat.id === sessionId ? { ...chat, name: title } : chat
              );
              setStorage('chat-history', updated);
              return updated;
            });
          }
        }).catch(err => {
          console.error("Failed to generate title:", err);
          // Fallback nếu API fail hoàn toàn - giữ "New chat"
        });
      }

      // Gọi API với session_id
      fetch(`${API_BASE_URL}/rag/${sourceData}?q=${encodeURIComponent(currentQuestion)}&session_id=${sessionId}`, {
        method: "get",
        headers: new Headers({
          "ngrok-skip-browser-warning": "69420",
        }),
      })
      .then((response) => response.json())
      .then((result) => {
        // Thêm response vào dataChat
        SetDataChat((prev) => {
          const newDataChat = {
            ...prev,
            chats: [
              ...prev.chats,
              ["start", [result.result, result.source_documents, sourceData]],
            ]
          };
          
          // ✅ CHỈ lưu vào history nếu là câu hỏi y tế
          if (shouldSaveToHistory(result.result)) {
            SetChatHistory(prevHistory => {
              let copyArray = [...prevHistory]
              const chatIndex = copyArray.findIndex(chat => chat.id === sessionId)
              
              if(chatIndex > -1) {
                // Update existing chat
                copyArray[chatIndex] = newDataChat
              } else {
                // Add new chat
                copyArray.push(newDataChat)
              }
              
              setStorage('chat-history', copyArray)
              return copyArray
            })
          } else {
            console.log("Non-medical response - skipping history save");
          }
          
          return newDataChat;
        });
        
        SetIsLoad(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        
        // Hiển thị error trong UI
        SetDataChat((prev) => ({
          ...prev, 
          chats:[
            ...prev.chats,
            ["start", ["⚠️ Lỗi, không thể kết nối với server. Vui lòng thử lại.", null]],
          ]
        }));
        
        // ❌ KHÔNG lưu error vào history
        console.log("Connection error - not saving to history");
        
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

  const onAddChat = () => {
    // Clear memory cho session hiện tại trước khi tạo mới
    if (currentSessionId) {
      fetch(`${API_BASE_URL}/clear/${sourceData}?session_id=${currentSessionId}`, {
        method: "POST",
        headers: new Headers({
          "ngrok-skip-browser-warning": "69420",
        }),
      })
      .then(() => {
        console.log(`Memory cleared for session ${currentSessionId}`);
      })
      .catch((error) => {
        console.error("Error clearing memory:", error);
      });
    }

    // Tạo session mới
    const newSessionId = new Date().getTime();
    setCurrentSessionId(newSessionId);
    
    const newChat = {
      id: newSessionId,
      name: 'New chat',
      chats: [
        [
          "start",
          [
            "Xin chào! Đây là Vi Medical Chatbot, Bạn đang có thắc mắc gì về vấn đề sức khoẻ - y tế?",
            null,
          ],
        ],
      ]
    };
    
    SetDataChat(newChat);
    
    // ✅ THÊM NGAY VÀO CHAT HISTORY để hiển thị trong sidebar
    SetChatHistory(prev => {
      const updated = [...prev, newChat];
      setStorage('chat-history', updated);
      return updated;
    });
  }

  // Function để load history khi chuyển sang chat cũ
  const onSwitchChat = async (chat) => {
    // Nếu đang ở chat này rồi thì không làm gì
    if (dataChat.id === chat.id) {
      console.log("Already on this chat");
      return;
    }
    
    // Switch UI ngay lập tức
    SetDataChat(chat);
    setCurrentSessionId(chat.id);
    
    // Extract chat history từ chat
    const chatHistoryData = extractChatHistory(chat.chats);
    
    // ✅ CHỈ gọi API nếu có medical history để load
    if (chatHistoryData.length > 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/load-history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "69420",
          },
          body: JSON.stringify({
            session_id: chat.id.toString(),
            source: sourceData,
            chat_history: chatHistoryData
          }),
          signal: AbortSignal.timeout(5000)  // Timeout 5s
        });
        
        if (response.ok) {
          console.log(`Loaded ${chatHistoryData.length} history items for chat ${chat.id}`);
        } else {
          console.error("Failed to load history");
        }
      } catch (error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
          console.warn("Load history timeout - continuing anyway");
        } else {
          console.error("Error loading history:", error);
        }
      }
    } else {
      console.log("No medical history to load (greeting/irrelevant only)");
    }
  }

  // Function để xóa chat
  const onDeleteChat = async (e, chatToDelete) => {
    e.stopPropagation(); // Prevent triggering onSwitchChat
    
    if (!confirm(`Bạn có chắc muốn xóa đoạn chat "${chatToDelete.name}"?`)) {
      return;
    }

    // Xóa khỏi chatHistory (localStorage)
    const updatedHistory = chatHistory.filter(chat => chat.id !== chatToDelete.id);
    SetChatHistory(updatedHistory);
    setStorage('chat-history', updatedHistory);

    // ✅ Clear memory TẤT CẢ sources trên backend cho session này
    try {
      // Clear vi-medical memory
      await fetch(`${API_BASE_URL}/clear/vi-medical?session_id=${chatToDelete.id}`, {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "69420",
        }
      });
      
      // Clear wiki memory
      await fetch(`${API_BASE_URL}/clear/wiki?session_id=${chatToDelete.id}`, {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "69420",
        }
      });
      
      console.log(`✅ Cleared ALL memories for session ${chatToDelete.id} (vi-medical + wiki)`);
    } catch (error) {
      console.error("⚠️ Error clearing memory:", error);
    }

    // Nếu đang ở chat bị xóa, chuyển về chat mới
    if (dataChat.id === chatToDelete.id) {
      const newSessionId = new Date().getTime();
      setCurrentSessionId(newSessionId);
      SetDataChat({
        id: newSessionId,
        name: 'New chat',
        chats: [
          [
            "start",
            [
              "Xin chào! Đây là Vi Medical Chatbot, Bạn đang có thắc mắc gì về vấn đề sức khoẻ - y tế?",
              null,
            ],
          ],
        ]
      });
    }
  }

  // Function để bắt đầu edit tên chat (double click)
  const onStartEditChatName = (e, chat) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingChatName(chat.name);
  }

  // Function để lưu tên chat mới
  const onSaveChatName = (chatId) => {
    if (editingChatName.trim() === "") {
      alert("Tên chat không được để trống!");
      return;
    }

    const updatedHistory = chatHistory.map(chat => 
      chat.id === chatId 
        ? { ...chat, name: editingChatName.trim() }
        : chat
    );
    
    SetChatHistory(updatedHistory);
    setStorage('chat-history', updatedHistory);

    // Nếu đang edit chat hiện tại, cập nhật dataChat
    if (dataChat.id === chatId) {
      SetDataChat(prev => ({ ...prev, name: editingChatName.trim() }));
    }

    setEditingChatId(null);
    setEditingChatName("");
  }

  // Function để hủy edit
  const onCancelEdit = () => {
    setEditingChatId(null);
    setEditingChatName("");
  }

  // Function để handle Enter key khi edit
  const onEditKeyDown = (e, chatId) => {
    if (e.key === 'Enter') {
      onSaveChatName(chatId);
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-100 h-[calc(100vh-72px)]">
      <div className="hidden lg:block  drawer-side absolute w-64 h-[20vh] left-3 mt-2 drop-shadow-md">
        <div className="menu p-4 w-full min-h-full bg-gray-50 text-base-content rounded-2xl mt-3  overflow-auto scroll-y-auto max-h-[80vh]">
          {/* Sidebar content here */}
          <ul className="menu text-sm">
            <button style={{backgroundColor: 'rgb(52, 211, 153)'}} className="rounded-md p-2" onClick={onAddChat}>
              Add new chat
            </button>
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
            {chatHistory.map((chat, i) => (
              <li 
                key={i} 
                onClick={() => onSwitchChat(chat)}
                className={`${dataChat.id === chat.id ? "bg-emerald-100" : ""} hover:bg-emerald-50 transition-colors`}
              >
                {editingChatId === chat.id ? (
                  // Edit mode
                  <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                    <FontAwesomeIcon icon={faEdit} className="text-emerald-600" />
                    <input
                      type="text"
                      value={editingChatName}
                      onChange={(e) => setEditingChatName(e.target.value)}
                      onKeyDown={(e) => onEditKeyDown(e, chat.id)}
                      onBlur={() => onSaveChatName(chat.id)}
                      className="flex-1 px-2 py-1 border border-emerald-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                    />
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-center justify-between w-full group">
                    <p 
                      className="flex items-center gap-2 flex-1 cursor-pointer"
                      onDoubleClick={(e) => onStartEditChatName(e, chat)}
                      title="Double-click để đổi tên"
                    >
                      <FontAwesomeIcon icon={faMessage} />
                      <span className="flex-1">
                        {chat.name.length < 20 ? chat.name : chat.name.slice(0, 20) + "..."}
                      </span>
                    </p>
                    <button
                      onClick={(e) => onDeleteChat(e, chat)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1"
                      title="Xóa đoạn chat"
                    >
                      <FontAwesomeIcon icon={faTrashAlt} />
                    </button>
                  </div>
                )}
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
                    const newSource = e.target.value;
                    
                    // Clear memory của source cũ khi đổi source
                    if (sourceData !== newSource && currentSessionId) {
                      fetch(`${API_BASE_URL}/clear/${sourceData}?session_id=${currentSessionId}`, {
                        method: "POST",
                        headers: new Headers({
                          "ngrok-skip-browser-warning": "69420",
                        }),
                      })
                      .then(() => {
                        console.log(`Memory cleared for ${sourceData}`);
                      })
                      .catch((error) => {
                        console.error("Error clearing memory:", error);
                      });
                    }
                    
                    SetSourceData(newSource);
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
                    const newSource = e.target.value;
                    
                    // Clear memory của source cũ khi đổi source
                    if (sourceData !== newSource && currentSessionId) {
                      fetch(`${API_BASE_URL}/clear/${sourceData}?session_id=${currentSessionId}`, {
                        method: "POST",
                        headers: new Headers({
                          "ngrok-skip-browser-warning": "69420",
                        }),
                      })
                      .then(() => {
                        console.log(`Memory cleared for ${sourceData}`);
                      })
                      .catch((error) => {
                        console.error("Error clearing memory:", error);
                      });
                    }
                    
                    SetSourceData(newSource);
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
          {dataChat.chats.map((dataMessages, i) =>
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
                      {/* <p className="font-semibold text-xs">
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
                      </p> */}
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
