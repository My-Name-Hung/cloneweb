import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import thongbaoIcon from "../../assets/Home/thongbao.png";
import bankSignatureImage from "../../assets/xacminh/chuky.jpg";
import { useAuth } from "../../context/AuthContext";
import "./MyContract.css";

const MyContract = () => {
  const navigate = useNavigate();
  const { user, getUserContracts } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [_currentPaymentContract, _setCurrentPaymentContract] = useState(null);
  const [_paymentSchedule, _setPaymentSchedule] = useState([]);
  const modalRef = useRef(null);
  const overlayRef = useRef(null);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    interestRate: 0.02,
    maxLoanAmount: 500000000,
    maxLoanTerm: 36,
  });

  // Define the API_BASE_URL from environment variables or use fallback
  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "https://cloneweb-uhw9.onrender.com";

  // Helper function to get full image URL
  const getFullImageUrl = (url) => {
    if (!url) return null;

    // If already a full URL, return as is
    if (url.startsWith("http")) {
      return url;
    }

    // Ensure proper path formatting
    const normalizedPath = url.startsWith("/") ? url : `/${url}`;

    // Combine with API URL
    return `${API_BASE_URL}${normalizedPath}`;
  };

  useEffect(() => {
    const fetchContracts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use getUserContracts from AuthContext
        const response = await getUserContracts();
        console.log("Contract fetch result:", response);

        if (response && response.success && response.contracts) {
          // Ensure full URLs for signature images
          const contractsWithFormattedUrls = response.contracts.map(
            (contract) => ({
              ...contract,
              signatureUrl: getFullImageUrl(contract.signatureUrl),
              // Không cần xử lý thời gian tại đây, sử dụng thời gian từ server
            })
          );

          console.log(
            "Processed contracts with full URLs:",
            contractsWithFormattedUrls
          );
          setContracts(contractsWithFormattedUrls);
        } else {
          console.error("Error fetching contracts:", response);
          setError("Could not load contract list. Please try again later.");
        }
      } catch (error) {
        console.error("Error fetching contracts:", error);
        setError(
          "An error occurred while loading contracts. Please try again later."
        );
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch when user is available
    if (user && user.id) {
      fetchContracts();
    } else {
      setIsLoading(false);
    }
  }, [user, getUserContracts]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const response = await axios.get(`${API_URL}/api/settings`);
        if (response.data.success) {
          console.log("Settings fetched:", response.data.settings);
          setSettings({
            interestRate: response.data.settings.interestRate || 0.01,
            maxLoanAmount: response.data.settings.maxLoanAmount || 500000000,
            maxLoanTerm: response.data.settings.maxLoanTerm || 36,
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleRegisterClick = () => {
    navigate("/loan");
  };

  const handleShowDetails = async (contract) => {
    console.log("Showing loan repayment details for contract:", contract);

    if (!contract || !contract.loanAmount || !contract.loanTerm) {
      console.error("Invalid contract data for payment details", contract);
      return;
    }

    // Generate payment schedule
    const schedule = generatePaymentSchedule(contract);
    _setPaymentSchedule(schedule);
    setSelectedContract(contract);

    // Slight delay to ensure state is updated
    setTimeout(() => {
      setShowPaymentModal(true);
    }, 100);
  };

  const handleShowContract = async (contract) => {
    console.log("Showing contract details:", contract);

    if (!contract) return;

    try {
      // Process contract with corrected signature URL
      const processedContract = {
        ...contract,
        signatureUrl: getFullImageUrl(contract.signatureUrl),
      };

      console.log("Processed contract with signature URL:", processedContract);
      setSelectedContract(processedContract);
      setShowContractModal(true);
    } catch (error) {
      console.error("Error processing contract for display:", error);
    }
  };

  const handleCloseContract = () => {
    setShowContractModal(false);
  };

  const _openPaymentModal = () => {
    setIsModalClosing(false);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setShowPaymentModal(false);
      setIsModalClosing(false);
    }, 300);
  };

  const generatePaymentSchedule = (contract) => {
    if (!contract) return [];

    const payments = [];
    const amount = parseFloat(
      contract.loanAmount.replace(/\./g, "").replace(/,/g, "")
    );
    const termMonths = parseInt(contract.loanTerm);
    const monthlyInterestRate = settings.interestRate;

    // Tính ngày bắt đầu trả nợ
    let startDate = new Date();
    if (contract.createdDate) {
      const dateParts = contract.createdDate.split("/");
      if (dateParts.length === 3) {
        startDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
      }
    }

    for (let i = 1; i <= termMonths; i++) {
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + i);
      const monthDisplay =
        paymentDate.getDate() + "/" + (paymentDate.getMonth() + 1);

      const remainingPrincipal = amount - (amount / termMonths) * (i - 1);
      const interestPayment = remainingPrincipal * monthlyInterestRate;
      const principalPayment = amount / termMonths;
      const totalPayment = principalPayment + interestPayment;

      payments.push({
        ki: `Kì thứ ${i}`,
        amount: Math.round(totalPayment),
        date: monthDisplay,
        principal: Math.round(principalPayment),
        interest: Math.round(interestPayment),
      });
    }

    return payments;
  };

  // Hàm định dạng số tiền vay
  const formatCurrency = (amount) => {
    if (!amount) return "0 VND";

    // Xử lý trường hợp amount đã có dấu chấm/phẩy
    const cleanAmount = amount.toString().replace(/\./g, "").replace(/,/g, "");

    try {
      // Định dạng số tiền theo format tiền Việt Nam
      return cleanAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    } catch (e) {
      console.error("Error formatting currency:", e);
      return amount;
    }
  };

  // Memoized status text getter
  const getStatusText = (status) => {
    const statusMap = {
      pending: "Đang chờ duyệt",
      approved: "Đã duyệt",
      rejected: "Từ chối",
    };
    return statusMap[status] || status;
  };

  // Get status class
  const getStatusClass = (status) => {
    const statusClassMap = {
      pending: "status-pending",
      approved: "status-approved",
      rejected: "status-rejected",
    };
    return statusClassMap[status] || "";
  };

  if (isLoading) {
    return (
      <div className="contract-loading">
        <div className="loading-spinner"></div>
        <p>{error || "Đang tải..."}</p>
      </div>
    );
  }

  const _formattedDate = new Date().toLocaleDateString("vi-VN");

  return (
    <div className="contract-container">
      {/* Header */}
      <div className="contract-header">
        <a href="/">
          <button className="back-button">
            <svg
              viewBox="64 64 896 896"
              focusable="false"
              data-icon="left"
              width="1em"
              height="1em"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"></path>
            </svg>
          </button>
        </a>
        <h1 className="header-title">Khoản vay</h1>
      </div>

      {/* Content */}
      {contracts.length === 0 ? (
        <div className="empty-contract">
          <div className="empty-icon">
            <img
              src={thongbaoIcon}
              alt="Không có khoản vay"
              width="120"
              height="120"
            />
          </div>
          <p className="empty-text">Bạn chưa có khoản vay nào</p>
          <button className="register-button" onClick={handleRegisterClick}>
            Đăng ký ngay
          </button>
        </div>
      ) : (
        <div className="contract-content">
          <h2 className="contract-subtitle">Thông tin hợp đồng của bạn</h2>

          {contracts.map((contract, index) => (
            <div key={index} className="loan-detail-card">
              <div className="loan-detail-row">
                <span className="loan-detail-label">Mã hợp đồng :</span>
                <span className="loan-detail-value">{contract.contractId}</span>
              </div>
              <div className="loan-detail-row">
                <span className="loan-detail-label">Số tiền vay :</span>
                <span className="loan-detail-value">
                  {formatCurrency(contract.loanAmount)} VND
                </span>
              </div>
              <div className="loan-detail-row">
                <span className="loan-detail-label">Hạn thanh toán :</span>
                <span className="loan-detail-value">
                  {contract.loanTerm} tháng
                </span>
              </div>
              <div className="loan-detail-row">
                <span className="loan-detail-label">Khởi tạo lúc :</span>
                <span className="loan-detail-value">
                  {contract.createdTime}, {contract.createdDate}
                </span>
              </div>
              {/* <div className="loan-detail-row">
                <span className="loan-detail-label">Trạng thái :</span>
                <span
                  className={`loan-status ${getStatusClass(contract.status)}`}
                >
                  {getStatusText(contract.status)}
                </span>
              </div> */}
              <div className="loan-details-link">
                <a onClick={() => handleShowDetails(contract)}>
                  Chi tiết trả nợ
                </a>
              </div>
              <div className="view-contract-button-container">
                <button
                  className="view-contract-button"
                  onClick={() => handleShowContract(contract)}
                >
                  Xem hợp đồng
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showContractModal && selectedContract && (
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
                  <a className="title">Bên A (Bên cho vay):</a>
                  Ngân hàng MB Quân đội
                </p>
                <p>
                  <a className="title">Bên B (Bên vay) Ông / Bà :</a>
                  {user?.fullName || "Cập nhật khi hoàn thành"}
                </p>
                <p>
                  <a className="title">Số CMT / CCCD :</a>
                  {user?.personalInfo?.idNumber || "Cập nhật khi hoàn thành"}
                </p>
                <p>
                  <a className="title">Ngày ký : </a>
                  {selectedContract.createdDate}
                </p>
                <p>
                  <a className="title">Số tiền khoản vay : </a>
                  {formatCurrency(selectedContract.loanAmount)}
                </p>
                <p>
                  <a className="title">Mã hợp đồng : </a>
                  {selectedContract.contractId}
                </p>
                <p>
                  <a className="title">Thời gian vay : </a>
                  {selectedContract.loanTerm} tháng
                </p>
                <p>
                  <span className="title">Lãi suất vay : </span>
                  <span className="laisuatvay">
                    {settings.interestRate.toFixed(0)}%
                  </span>{" "}
                  <span className="laisuatvays">mỗi tháng</span>
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
                    <div className="signature-placeholder">
                      {selectedContract.signatureUrl && (
                        <img
                          src={getFullImageUrl(selectedContract.signatureUrl)}
                          alt="Chữ ký người vay"
                          className="user-signature"
                          onError={(e) => {
                            console.error("Error loading signature image:", e);
                            e.target.onerror = null;
                            e.target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjUwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjEwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5Ij5DaMawzKMga3nMgSBraMO0bmcgbMOibMK/xJjDonUyPC90ZXh0Pjwvc3ZnPg==";
                          }}
                        />
                      )}
                    </div>
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

      {/* Payment details modal */}
      {showPaymentModal && selectedContract && (
        <div
          ref={overlayRef}
          className={`payment-modal-overlay ${isModalClosing ? "closing" : ""}`}
          onClick={closePaymentModal}
        >
          <div
            ref={modalRef}
            className={`payment-modal ${isModalClosing ? "closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="payment-modal-content">
              <div className="payment-table-header">
                <div className="header-cell">Kỳ</div>
                <div className="header-cell">Số tiền</div>
                <div className="header-cell">Ngày đóng</div>
              </div>

              <div className="payment-table-body">
                {_paymentSchedule.map((payment) => (
                  <div
                    className="payment-table-row"
                    key={payment.paymentNumber}
                  >
                    <div className="col1">{payment.ki}</div>
                    <div className="table-cell">
                      <div className="payment-amount">
                        {formatCurrency(payment.amount.toString())}
                      </div>
                    </div>
                    <div className="table-cell">{payment.date}</div>
                  </div>
                ))}
              </div>

              <div className="payment-modal-footer">
                <button className="ok-button" onClick={closePaymentModal}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyContract;
