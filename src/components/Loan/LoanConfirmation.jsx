import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import bankSignatureImage from "../../assets/xacminh/chuky.jpg";
import doneImage from "../../assets/xacminh/done.png";
import { useAuth } from "../../context/AuthContext";
import "./LoanConfirmation.css";
import "./LoanStyles.css";

const LoanConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, saveUserContract } = useAuth();
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractAccepted, setContractAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loanData, setLoanData] = useState({
    loanAmount: "222.222.222",
    loanTerm: "3",
    loanDate: "18/4/2025",
    bank: "Ngân hàng MB Quân đội",
  });
  const [isSigned, setIsSigned] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [showSignatureReview, setShowSignatureReview] = useState(false);
  const [showCompletedScreen, setShowCompletedScreen] = useState(false);
  const [contractInfo, setContractInfo] = useState(null);
  const [settings, setSettings] = useState({
    interestRate: 0.01,
    maxLoanAmount: 500000000,
    maxLoanTerm: 36,
  });

  const sigCanvasRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

        const [profileRes, bankInfoRes] = await Promise.all([
          axios.get(`${API_URL}/api/users/${user.id}/profile`),
          axios.get(`${API_URL}/api/users/${user.id}/bank-info`),
        ]);

        if (profileRes.data.success && bankInfoRes.data.success) {
          let loanAmount = "222.222.222";
          let loanTerm = "3";

          if (location.state && location.state.loanAmount) {
            loanAmount = location.state.loanAmount;
            loanTerm = location.state.loanTerm || "3";
          } else {
            const storedLoanData = localStorage.getItem("loanData");
            if (storedLoanData) {
              const parsedData = JSON.parse(storedLoanData);
              loanAmount = parsedData.loanAmount || loanAmount;
              loanTerm = parsedData.loanTerm || loanTerm;
            }
          }

          setLoanData({
            loanAmount: loanAmount,
            loanTerm: loanTerm,
            loanDate: "18/4/2025",
            bank: bankInfoRes.data.bankInfo?.bank || "Ngân hàng MB Quân đội",
            fullName: profileRes.data.user?.fullName || "Chưa cập nhật",
            idNumber:
              profileRes.data.user?.personalInfo?.idNumber || "Chưa cập nhật",
            bankLogo: bankInfoRes.data.bankInfo?.bankLogo || null,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (location.state && location.state.loanAmount) {
          setLoanData({
            loanAmount: location.state.loanAmount || "222.222.222",
            loanTerm: location.state.loanTerm || "3",
            loanDate: location.state.loanDate || "18/4/2025",
            bank: location.state.bank || "Ngân hàng MB Quân đội",
          });
        } else {
          const storedLoanData = localStorage.getItem("loanData");
          if (storedLoanData) {
            setLoanData(JSON.parse(storedLoanData));
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user && user.id) {
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, [user, location]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const response = await axios.get(`${API_URL}/api/settings`);
        if (response.data.success) {
          setSettings(response.data.settings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);

  const handleBackClick = () => {
    if (showCompletedScreen) {
      return;
    }

    if (showSignatureReview) {
      setShowSignatureReview(false);
      return;
    }
    navigate(-1);
  };

  const handleShowContract = () => {
    setShowContractModal(true);
  };

  const handleCloseContract = () => {
    setShowContractModal(false);
  };

  const handleFinalConfirmation = async () => {
    if (!contractAccepted) return;

    setIsLoading(true);

    try {
      // Lấy nội dung hợp đồng từ contract modal
      const contractContent =
        document.querySelector(".contract-modal-content")?.innerText || "";

      // Lưu hợp đồng vào database
      const response = await saveUserContract({
        loanAmount: loanData.loanAmount,
        loanTerm: loanData.loanTerm,
        bankName: loanData.bank,
        contractContent: contractContent,
        signatureImage: signatureData,
      });

      if (response.success) {
        console.log("Hợp đồng đã được lưu thành công:", response.contract);
        setContractInfo(response.contract);

        // Sau khi lưu hợp đồng, hiển thị màn hình hoàn thành
        setShowCompletedScreen(true);

        // Thêm thông báo log để xác nhận trạng thái xác minh được cập nhật
        console.log("Trạng thái xác minh đã được cập nhật: Đã xác minh");
      } else {
        console.error("Lỗi khi lưu hợp đồng:", response.message);
        alert("Có lỗi xảy ra khi lưu hợp đồng. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToSupport = () => {
    navigate("/");
  };

  const clearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
      setIsSigned(false);
      console.log("Đã xóa chữ ký");
    }
  };

  const handleEnd = () => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      setIsSigned(true);
    }
  };

  const handleSubmitLoan = () => {
    if (!isSigned || !contractAccepted) return;

    try {
      const signatureDataURL = sigCanvasRef.current.toDataURL("image/png");
      setSignatureData(signatureDataURL);
      setShowSignatureReview(true);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu chữ ký:", error);
      alert("Đã xảy ra lỗi khi xử lý chữ ký. Vui lòng thử lại.");
    }
  };

  const formatCurrency = (value) => {
    if (!value) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const _formattedLoanAmount = formatCurrency(loanData.loanAmount);

  const currentDate = new Date();
  const formattedDate = `08:41 PM ${currentDate.getDate()}/${
    currentDate.getMonth() + 1
  }/${currentDate.getFullYear() + 1}`;

  // Generate loan term options based on settings.maxLoanTerm
  const generateLoanTermOptions = () => {
    const terms = [];
    for (let i = 6; i <= settings.maxLoanTerm; i += 6) {
      terms.push(i.toString());
    }
    return terms;
  };

  function CustomDropdown({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
      function handleClickOutside(event) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    return (
      <div
        className="custom-dropdown"
        ref={dropdownRef}
        style={{ position: "relative", width: "40%" }}
      >
        <div
          className="custom-dropdown-header"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            padding: "10px 15px",
            backgroundColor: "white",
            borderRadius: "8px",
            border: "1px solid #ddd",
            color: "black",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <span>{value} tháng</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 10l5 5 5-5"
              stroke="#999"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {isOpen && (
          <div
            className="custom-dropdown-list"
            style={{
              position: "absolute",
              top: "calc(100% + 5px)",
              left: 0,
              width: "100%",
              color: "black",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              zIndex: 9999,
              border: "1px solid #ddd",
            }}
          >
            {generateLoanTermOptions().map((option) => (
              <div
                key={option}
                className={option === value ? "active" : ""}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                style={{
                  padding: "10px 15px",
                  cursor: "pointer",
                  backgroundColor: option === value ? "#e6f7ff" : "white",
                  borderBottom: "1px solid #f5f5f5",
                }}
              >
                {option} tháng
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="loan-page-container">
        <header className="loan-header">
          <button className="back-button" onClick={handleBackClick}>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 19L8 12L15 5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="header-title">Xác nhận vay</h1>
        </header>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (showCompletedScreen) {
    return (
      <div className="verification-container">
        <header className="verification-header">
          <button
            className="back-button"
            onClick={() => {}}
            style={{ visibility: "hidden" }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 19L8 12L15 5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="header-title">Xác nhận vay</h1>
        </header>

        <div className="success-container">
          <div className="success-image">
            <img
              src={doneImage}
              alt="Success"
              className="success-illustration"
            />
          </div>

          <div className="success-check">
            <div className="check-circle">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
                  fill="#4CAF50"
                />
              </svg>
            </div>
          </div>

          <div className="success-message">
            <h2>Chúc mừng</h2>
            <p>Hợp đồng vay của bạn đã được đăng ký thành công.</p>
            {contractInfo && (
              <div className="contract-details">
                <p>
                  Mã hợp đồng: <strong>{contractInfo.contractId}</strong>
                </p>
                <p>Ngày tạo: {contractInfo.createdDate}</p>
                <p>Thời gian: {contractInfo.createdTime}</p>
              </div>
            )}
          </div>

          <button onClick={handleContinueToSupport} className="continue-button">
            Liên hệ CSKH để duyệt hồ sơ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="loan-page-container">
      <header className="loan-header">
        <button className="back-button" onClick={handleBackClick}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 19L8 12L15 5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="header-title">
          {showSignatureReview ? "Xác nhận vay" : "Xác nhận vay"}
        </h1>
      </header>

      <div className="loan-confirmation-container">
        {showSignatureReview ? (
          <div className="signature-review-container">
            <h2 className="confirmation-title">Xác nhận khoản vay</h2>

            <div className="loan-info-details">
              <div className="loan-detail-row">
                <span className="loan-detail-label">Khoản tiền vay :</span>
                <span className="loan-detail-value">
                  {_formattedLoanAmount}VND
                </span>
              </div>
              <div className="loan-detail-row">
                <span className="loan-detail-label">Thời hạn thanh toán :</span>
                <span className="loan-detail-value">
                  {loanData.loanTerm} tháng
                </span>
              </div>
            </div>

            <button
              className="view-contract-button"
              onClick={handleShowContract}
            >
              Xem hợp đồng
            </button>

            <div className="contract-agreement">
              <label className="agreement-checkbox">
                <input
                  type="checkbox"
                  checked={contractAccepted}
                  onChange={() => setContractAccepted(!contractAccepted)}
                />
                <span>Xác nhận đồng ý với hợp đồng</span>
              </label>
            </div>

            <div className="signature-review-section">
              <p>Chữ ký của bạn:</p>
              <div className="signature-image-container">
                <img
                  src={signatureData}
                  alt="Chữ ký"
                  className="signature-image"
                />
              </div>
            </div>

            <div className="loan-confirmation-actions">
              <button
                type="button"
                className="submit-loan-button"
                onClick={handleFinalConfirmation}
                disabled={!contractAccepted}
              >
                Xác nhận và hoàn thành
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="confirmation-title">Xác nhận khoản vay</h2>

            <div className="loan-info-details">
              <div className="loan-detail-row">
                <span className="loan-detail-label">Khoản tiền vay :</span>
                <span className="loan-detail-value">
                  {_formattedLoanAmount}VND
                </span>
              </div>
              <div className="loan-detail-row">
                <span className="loan-detail-label">Thời hạn thanh toán :</span>
                <span className="loan-detail-value">
                  {loanData.loanTerm} tháng
                </span>
              </div>
            </div>

            <button
              className="view-contract-button"
              onClick={handleShowContract}
            >
              Xem hợp đồng
            </button>

            <div className="contract-agreement">
              <label className="agreement-checkbox">
                <input
                  type="checkbox"
                  checked={contractAccepted}
                  onChange={() => setContractAccepted(!contractAccepted)}
                />
                <span>Xác nhận đồng ý với hợp đồng</span>
              </label>
            </div>

            <div className="signature-section">
              <h3 className="signature-header">Ký vào khung bên dưới</h3>
              <div className="signature-canvas-container">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  penColor="black"
                  canvasProps={{
                    className: "signature-canvas",
                  }}
                  backgroundColor="rgba(255, 255, 255, 0.1)"
                  onEnd={handleEnd}
                />
              </div>
              <a className="clear-signature-button" onClick={clearSignature}>
                Làm mới
              </a>
            </div>

            <div className="loan-confirmation-actions">
              <button
                type="button"
                className="submit-loan-button"
                onClick={handleSubmitLoan}
                disabled={!isSigned || !contractAccepted}
              >
                Xác nhận
              </button>
            </div>
          </>
        )}
      </div>

      {showContractModal && (
        <div className="contract-modal-overlay">
          <div className="contract-modal">
            <div className="contract-modal-header">
              <span className="close-button" onClick={handleCloseContract}>
                ×
              </span>
            </div>
            <div className="contract-modal-content">
              <div className="contract-title">
                <h2>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
                <p>ĐỘC LẬP - TỰ DO - HẠNH PHÚC</p>
              </div>

              <h1 className="contract-main-title">HỢP ĐỒNG VAY TIỀN</h1>

              <div className="contract-parties">
                <p>
                  <a className="title">Bên A (Bên cho vay):</a> Ngân hàng MB
                  Quân đội
                </p>
                <p>
                  <a className="title">Bên B (Bên vay) Ông / Bà :</a>
                  Cập nhật khi hoàn thành
                </p>
                <p>
                  <a className="title">Số CMT / CCCD :</a>
                  Cập nhật khi hoàn thành
                </p>
                <p>
                  <a className="title">Ngày ký : </a>
                  Cập nhật khi hoàn thành
                </p>
                <p>
                  <a className="title">Số tiền khoản vay : </a>
                  Cập nhật khi hoàn thành
                </p>
                <p>
                  <a className="title">Mã hợp đồng : </a>Cập nhật khi hoàn thành
                </p>
                <p>
                  <a className="title">Thời gian vay : </a>
                  Cập nhật khi hoàn thành
                </p>
                <p>
                  <a className="title">Lãi suất vay : </a>
                  <a className="laisuatvay">
                    {settings.interestRate.toFixed()}%
                  </a>{" "}
                  <a className="laisuatvays">mỗi tháng</a>
                </p>
              </div>

              <div className="contract-terms">
                <p>
                  Hợp đồng nêu rõ các bên đã đạt được thỏa thuận vay sau khi
                  thương lượng và trên cơ sở bình đẳng, tự nguyện và nhất trí.
                  Tất cả các bên cần đọc kỹ tất cả các điều khoản trong thỏa
                  thuận này, sau khi ký vào thỏa thuận này coi như các bên đã
                  hiểu đầy đủ và đồng ý hoàn toàn với tất cả các điều khoản và
                  nội dung trong thỏa thuận này.
                </p>

                <ol>
                  <li>
                    Phù hợp với các nguyên tắc bình đẳng, tự nguyện, trung thực
                    và uy tín, hai bên thống nhất ký kết hợp đồng vay sau khi
                    thương lượng và cùng cam kết thực hiện.
                  </li>
                  <li>
                    Bên B cung cấp tài liệu đính kèm của hợp đồng vay và có hiệu
                    lực pháp lý như hợp đồng vay này.
                  </li>
                  <li>
                    Bên B sẽ tạo lệnh tính tiền gốc và lãi dựa trên số tiền vay
                    từ ví ứng dụng do bên A cung cấp.
                  </li>
                  <li>
                    Điều khoản đảm bảo.
                    <ul>
                      <li>
                        Bên vay không được sử dụng tiền vay để thực hiện các
                        hoạt động bất hợp pháp. Nếu không, bên A có quyền yêu
                        cầu bên B hoàn trả ngay tiền gốc và lãi, bên B phải chịu
                        các trách nhiệm pháp lý phát sinh từ đó.
                      </li>
                      <li>
                        Bên vay phải trả nợ gốc và lãi trong thời gian quy định
                        hợp đồng. Đối với phần quá hạn, người cho vay có quyền
                        thu hồi nợ trong thời hạn và thu (lãi quá hạn) % trên
                        tổng số tiền vay trong ngày.
                      </li>
                      <li>
                        Gốc và lãi của mỗi lần trả nợ sẽ được hệ thống tự động
                        chuyển từ tài khoản ngân hàng do bên B bảo lưu sang tài
                        khoản ngân hàng của bên A. Bên B phải đảm bảo có đủ tiền
                        trong tài khoản ngân hàng trước ngày trả nợ hàng tháng.
                      </li>
                    </ul>
                  </li>
                  <li>
                    Chịu trách nhiệm do vi phạm hợp đồng
                    <ul>
                      <li>
                        Nếu bên B không trả được khoản vay theo quy định trong
                        hợp đồng. Bên B phải chịu các khoản bồi thường thiệt hại
                        đã thanh lý và phí luật sư, phí kiện tụng, chi phí đi
                        lại và các chi phí khác phát sinh do kiện tụng.
                      </li>
                      <li>
                        Khi bên A cho rằng bên B đã hoặc có thể xảy ra tình
                        huống ảnh hưởng đến khoản vay thì bên A có quyền yêu cầu
                        bên B phải trả lại kịp thời trước thời hạn.
                      </li>
                      <li>
                        Người vay và người bảo lãnh không được vi phạm điều lệ
                        hợp đồng vì bất kỳ lý do gì
                      </li>
                    </ul>
                  </li>
                  <li>
                    Phương thức giải quyết tranh chấp hợp đồng.
                    <p>
                      Tranh chấp phát sinh trong quá trình thực hiện hợp đồng
                      này sẽ được giải quyết thông qua thương lượng thân thiện
                      giữa các bên hoặc có thể nhờ bên thứ ba làm trung gian hòa
                      giải. Nếu thương lượng hoặc hòa giải không thành, có thể
                      khởi kiện ra tòa án nhân dân nơi bên A có trụ sở.
                    </p>
                  </li>
                  <li>
                    Khi người vay trong quá trình xét duyệt khoản vay không
                    thành công do nhiều yếu tố khác nhau như chứng minh thư sai,
                    thẻ ngân hàng sai, danh bạ sai. Việc thông tin sai lệch này
                    sẽ khiến hệ thống phát hiện nghi ngờ gian lận hoặc giả mạo
                    khoản vay và bên vay phải chủ động hợp tác với bên A để xử
                    lý.
                  </li>
                  <li>
                    Nếu không hợp tác. Bên A có quyền khởi kiện ra Tòa án nhân
                    dân và trình báo lên Trung tâm Báo cáo tín dụng của Ngân
                    hàng nhà nước Việt Nam, hồ sơ nợ xấu sẽ được phản ánh trong
                    báo cáo tín dụng, ảnh hưởng đến tín dụng sau này của người
                    vay, vay vốn ngân hàng và hạn chế tiêu dùng của người thân,
                    con cái người vay...
                  </li>
                </ol>
              </div>

              <div className="contract-signatures">
                <div className="signature-columns">
                  <div className="signature-column">
                    <h3>Bên vay</h3>
                    <div className="signature-placeholder"></div>
                  </div>
                  <div className="signature-column">
                    <h3>Bên cho vay</h3>
                    <div className="signature-bank">
                      <div className="bank-signature">
                        <img
                          src={bankSignatureImage}
                          alt="Bank Signature"
                          className="bank-stamp"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="contract-modal-footer">
              <button className="ok-button" onClick={handleCloseContract}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanConfirmation;
