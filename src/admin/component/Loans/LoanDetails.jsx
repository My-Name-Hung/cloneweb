import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import bankSignature from "../../../assets/xacminh/chuky.jpg";
import { useAdmin } from "../../../context/AdminContext";
import "../../styles/LoanDetails.css";
import { loansApi } from "../../utils/apiService";

const LoanDetails = () => {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLoan, setEditedLoan] = useState({});
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const { refreshSession } = useAdmin();

  const sigCanvas = useRef({});
  const abortController = useRef(new AbortController());

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Memoize the getFullImageUrl function
  const getFullImageUrl = useMemo(
    () => (url) => {
      if (!url) return null;
      if (url.startsWith("http")) return url;
      if (url.startsWith("data:image")) return url;
      const normalizedPath = url.startsWith("/") ? url : `/${url}`;
      return `${API_URL}${normalizedPath}`;
    },
    [API_URL]
  );

  // Memoize loan data processing
  const processedLoan = useMemo(() => {
    if (!loan) return null;
    return {
      ...loan,
      signatureUrl: getFullImageUrl(loan.signatureUrl || loan.signatureImage),
    };
  }, [loan, getFullImageUrl]);

  const fetchLoan = useCallback(async () => {
    try {
      setLoading(true);
      await refreshSession();

      const response = await loansApi.getLoanById(loanId, {
        signal: abortController.current.signal,
      });

      if (response.success) {
        setLoan(response.loan);
        setEditedLoan({
          status: response.loan.status || "pending",
          bankName: response.loan.bankName || "",
          loanAmount: response.loan.loanAmount || "",
          loanTerm: response.loan.loanTerm || "",
          contractContent: response.loan.contractContent || "",
        });
      } else {
        setError(response.message || "Không thể tải thông tin hợp đồng vay");
      }
    } catch (error) {
      if (error.name === "AbortError") return;

      console.error("Loan details fetch error:", error);
      setError(
        error.response?.data?.message || "Lỗi tải thông tin hợp đồng vay"
      );
    } finally {
      setLoading(false);
    }
  }, [loanId, refreshSession]);

  useEffect(() => {
    fetchLoan();
    return () => {
      abortController.current.abort();
    };
  }, [fetchLoan]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditedLoan((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSaveChanges = useCallback(async () => {
    try {
      setLoading(true);
      await refreshSession();

      const response = await loansApi.updateLoanStatus(
        loanId,
        editedLoan.status,
        editedLoan
      );

      if (response.success) {
        setLoan(response.loan);
        setIsEditing(false);
        setStatusMessage("Đã cập nhật thông tin hợp đồng thành công!");
        setTimeout(() => setStatusMessage(""), 3000);
      } else {
        setError(response.message || "Không thể cập nhật hợp đồng vay");
      }
    } catch (error) {
      console.error("Loan update error:", error);
      setError(error.response?.data?.message || "Lỗi cập nhật hợp đồng vay");
    } finally {
      setLoading(false);
    }
  }, [loanId, editedLoan, refreshSession]);

  const handleApproveLoan = async () => {
    try {
      setLoading(true);
      await refreshSession();

      const response = await loansApi.approveLoan(loanId);

      if (response.success) {
        // Cập nhật trạng thái khoản vay
        setLoan({
          ...loan,
          status: "approved",
        });
        setEditedLoan({
          ...editedLoan,
          status: "approved",
        });

        // Xử lý số tiền vay thành số
        const loanAmount = parseFloat(loan.loanAmount.replace(/[^\d]/g, ""));

        // Gửi thông báo cho người dùng
        try {
          // Gửi thông báo
          const notificationResponse = await fetch(
            `${API_URL}/api/notifications`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: loan.userId._id,
                title: "Khoản vay được phê duyệt",
                message: `Khoản vay của bạn đã được phê duyệt với số tiền ${loanAmount.toLocaleString(
                  "vi-VN"
                )} VNĐ`,
                type: "loan_approved",
              }),
            }
          );

          if (!notificationResponse.ok) {
            throw new Error("Không thể gửi thông báo");
          }
        } catch (error) {
          console.error("Error in approval process:", error);
          setError("Có lỗi xảy ra trong quá trình phê duyệt: " + error.message);
          return;
        }

        setStatusMessage("Hợp đồng vay đã được phê duyệt thành công!");
        setTimeout(() => setStatusMessage(""), 3000);
      } else {
        setError(response.message || "Không thể phê duyệt hợp đồng vay");
      }
    } catch (error) {
      console.error("Loan approval error:", error);
      setError(error.response?.data?.message || "Lỗi phê duyệt hợp đồng vay");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectLoan = async () => {
    try {
      setLoading(true);
      await refreshSession();

      const response = await loansApi.rejectLoan(loanId);

      if (response.success) {
        // Cập nhật trạng thái khoản vay
        setLoan({
          ...loan,
          status: "rejected",
        });
        setEditedLoan({
          ...editedLoan,
          status: "rejected",
        });

        // Gửi thông báo cho người dùng
        try {
          await fetch(`${API_URL}/api/notifications`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: loan.userId._id,
              title: "Khoản vay bị từ chối",
              message:
                "Khoản vay của bạn đã bị từ chối. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.",
              type: "loan_rejected",
            }),
          });

          // Cập nhật số dư ví về 0 khi bị từ chối
          await fetch(`${API_URL}/api/wallet/update-balance`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: loan.userId._id,
              amount: 0,
              type: "LOAN_REJECTED",
              description: `Khoản vay #${loan.contractId} bị từ chối`,
            }),
          });

          // Thêm giao dịch vào lịch sử
          await fetch(`${API_URL}/api/wallet/transactions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: loan.userId._id,
              type: "reject",
              amount: 0,
              description: `Khoản vay #${loan.contractId} bị từ chối`,
              status: "completed",
            }),
          });
        } catch (error) {
          console.error("Error in rejection process:", error);
          setError("Có lỗi xảy ra trong quá trình từ chối: " + error.message);
          return;
        }

        setStatusMessage("Hợp đồng vay đã bị từ chối!");
        setTimeout(() => setStatusMessage(""), 3000);
      } else {
        setError(response.message || "Không thể từ chối hợp đồng vay");
      }
    } catch (error) {
      console.error("Loan rejection error:", error);
      setError(error.response?.data?.message || "Lỗi từ chối hợp đồng vay");
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureSave = useCallback(async () => {
    if (sigCanvas.current.isEmpty()) {
      alert("Vui lòng ký tên trước khi lưu");
      return;
    }

    try {
      setLoading(true);
      await refreshSession();

      const signatureImage = sigCanvas.current.toDataURL("image/png");
      const response = await loansApi.updateSignature(loanId, signatureImage);

      if (response.success) {
        setLoan((prev) => ({
          ...prev,
          signatureUrl: getFullImageUrl(
            response.signatureUrl || response.signature
          ),
        }));

        setShowSignaturePad(false);
        setStatusMessage("Đã lưu chữ ký thành công!");
        setTimeout(() => setStatusMessage(""), 3000);
      } else {
        setError(response.message || "Không thể cập nhật chữ ký");
      }
    } catch (error) {
      console.error("Signature update error:", error);
      setError(error.response?.data?.message || "Lỗi cập nhật chữ ký");
    } finally {
      setLoading(false);
    }
  }, [loanId, refreshSession, getFullImageUrl]);

  // Memoize status text mapping
  const statusTextMap = useMemo(
    () => ({
      pending: "Đang chờ xét duyệt",
      approved: "Đã phê duyệt",
      rejected: "Đã từ chối",
      cancelled: "Đã hủy",
      completed: "Hoàn thành",
    }),
    []
  );

  const clearSignature = () => {
    sigCanvas.current.clear();
  };

  // Helper to display images with error handling
  const renderImage = (src, alt, className, fallbackText) => {
    if (!src)
      return <div className="signature-placeholder">{fallbackText}</div>;

    const fullUrl = getFullImageUrl(src);
    return (
      <img
        src={fullUrl}
        alt={alt}
        className={className}
        onError={(e) => {
          console.error(`Error loading image ${alt}:`, e.target.src);
          e.target.onerror = null;
          e.target.style.display = "none";
          e.target.parentNode.innerHTML = `<div class="signature-placeholder">${fallbackText}</div>`;
        }}
      />
    );
  };

  if (loading && !processedLoan) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Đang tải thông tin hợp đồng vay...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h2>Lỗi</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/admin/loans")}>
          Quay lại danh sách hợp đồng
        </button>
      </div>
    );
  }

  if (!processedLoan) {
    return (
      <div className="admin-error">
        <h2>Không tìm thấy hợp đồng vay</h2>
        <button onClick={() => navigate("/admin/loans")}>
          Quay lại danh sách hợp đồng
        </button>
      </div>
    );
  }

  return (
    <div className="loan-details-container">
      <div className="admin-page-header">
        <div className="header-left">
          <button
            className="action-button back-button"
            onClick={() => navigate("/admin/loans")}
          >
            <i className="fas fa-arrow-left"></i>
            <span>Quay lại</span>
          </button>
          <h1>Chi tiết hợp đồng vay</h1>
        </div>

        <div className="header-actions">
          {processedLoan.status === "pending" && (
            <div className="loan-approval-actions">
              <button
                className="action-button approve"
                onClick={handleApproveLoan}
                disabled={loading}
              >
                <i className="fas fa-check"></i>
                <span>Phê duyệt khoản vay</span>
              </button>
              <button
                className="action-button reject"
                onClick={handleRejectLoan}
                disabled={loading}
              >
                <i className="fas fa-times"></i>
                <span>Từ chối khoản vay</span>
              </button>
            </div>
          )}

          {isEditing ? (
            <div className="edit-actions">
              <button
                className="action-button save"
                onClick={handleSaveChanges}
              >
                <i className="fas fa-save"></i>
                <span>Lưu thay đổi</span>
              </button>
              <button
                className="action-button cancel"
                onClick={() => setIsEditing(false)}
              >
                <i className="fas fa-times"></i>
                <span>Hủy bỏ</span>
              </button>
            </div>
          ) : (
            <button
              className="action-button edit"
              onClick={() => setIsEditing(true)}
            >
              <i className="fas fa-edit"></i>
              <span>Chỉnh sửa</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="status-message success">{statusMessage}</div>
      )}

      <div className="loan-details-grid">
        <div className="loan-info-section">
          <h2>Thông tin hợp đồng vay</h2>

          <div className="detail-item">
            <span className="detail-label">Mã hợp đồng:</span>
            <span className="detail-value">{processedLoan.contractId}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Số tiền vay:</span>
            {isEditing ? (
              <input
                type="text"
                name="loanAmount"
                value={editedLoan.loanAmount}
                onChange={handleInputChange}
                className="edit-input"
                placeholder="Nhập số tiền vay"
              />
            ) : (
              <span className="detail-value">
                {typeof processedLoan.loanAmount === "string"
                  ? processedLoan.loanAmount
                  : processedLoan.loanAmount?.toLocaleString("vi-VN")}{" "}
                VNĐ
              </span>
            )}
          </div>

          <div className="detail-item">
            <span className="detail-label">Kỳ hạn vay:</span>
            {isEditing ? (
              <input
                type="text"
                name="loanTerm"
                value={editedLoan.loanTerm}
                onChange={handleInputChange}
                className="edit-input"
                placeholder="Nhập kỳ hạn vay"
              />
            ) : (
              <span className="detail-value">
                {processedLoan.loanTerm} tháng
              </span>
            )}
          </div>

          <div className="detail-item">
            <span className="detail-label">Ngân hàng:</span>
            {isEditing ? (
              <input
                type="text"
                name="bankName"
                value={editedLoan.bankName}
                onChange={handleInputChange}
                className="edit-input"
                placeholder="Nhập tên ngân hàng"
              />
            ) : (
              <span className="detail-value">
                {processedLoan.bankName || "Chưa xác định"}
              </span>
            )}
          </div>

          <div className="detail-item">
            <span className="detail-label">Ngày tạo:</span>
            <span className="detail-value">
              {new Date(processedLoan.createdDate).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Trạng thái:</span>
            {isEditing ? (
              <select
                name="status"
                value={editedLoan.status}
                onChange={handleInputChange}
                className="edit-input"
              >
                <option value="pending">Đang chờ xét duyệt</option>
                <option value="approved">Đã phê duyệt</option>
                <option value="rejected">Đã từ chối</option>
                <option value="cancelled">Đã hủy</option>
                <option value="completed">Hoàn thành</option>
              </select>
            ) : (
              <span className={`status-badge status-${processedLoan.status}`}>
                {statusTextMap[processedLoan.status] || "Chưa xác định"}
              </span>
            )}
          </div>

          {/* Signature display and management */}
          <div className="detail-item">
            <span className="detail-label">Chữ ký:</span>
            <div className="signature-section">
              <div className="signature-image-container">
                {renderImage(
                  processedLoan.signatureUrl,
                  "Chữ ký",
                  "signature-image",
                  "Chưa có chữ ký"
                )}
              </div>
              <button
                className="action-button"
                onClick={() => setShowSignaturePad(true)}
              >
                <i className="fas fa-signature"></i>
                {processedLoan.signatureUrl ? "Cập nhật chữ ký" : "Thêm chữ ký"}
              </button>
            </div>
          </div>
        </div>

        {/* Signature pad popup */}
        {showSignaturePad && (
          <div className="signature-popup">
            <div className="signature-popup-content">
              <h3>Ký tên vào đây</h3>
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{
                  width: 500,
                  height: 200,
                  className: "signature-canvas",
                }}
              />
              <div className="signature-actions">
                <button className="action-button" onClick={clearSignature}>
                  <i className="fas fa-eraser"></i>
                  Xóa
                </button>
                <button
                  className="action-button save"
                  onClick={handleSignatureSave}
                >
                  <i className="fas fa-save"></i>
                  Lưu chữ ký
                </button>
                <button
                  className="action-button cancel"
                  onClick={() => setShowSignaturePad(false)}
                >
                  <i className="fas fa-times"></i>
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User information section */}
        <div className="borrower-info-section">
          <h2>Thông tin người vay</h2>

          <div className="detail-item">
            <span className="detail-label">Tên người dùng:</span>
            <span className="detail-value">
              {processedLoan.userId?.fullName ||
                processedLoan.userName ||
                "Chưa cập nhật"}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Số điện thoại:</span>
            <span className="detail-value">
              {processedLoan.userId?.phone ||
                processedLoan.userPhone ||
                "Chưa cập nhật"}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Email:</span>
            <span className="detail-value">
              {processedLoan.userEmail || "Chưa cập nhật"}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">CMND/CCCD:</span>
            <span className="detail-value">
              {processedLoan.userId?.personalInfo?.idNumber ||
                processedLoan.userIdNumber ||
                "Chưa cập nhật"}
            </span>
          </div>

          {processedLoan.userId && (
            <button
              className="action-button"
              onClick={() =>
                navigate(
                  `/admin/users/${
                    processedLoan.userId._id || processedLoan.userId
                  }`
                )
              }
            >
              <i className="fas fa-user"></i>
              Xem thông tin chi tiết người dùng
            </button>
          )}
        </div>

        {/* Contract View Section */}
        <div className="contract-view-section">
          <h2>Xem hợp đồng</h2>
          <div className="contract-preview">
            <div className="contract-title">
              <h2>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
              <p>ĐỘC LẬP - TỰ DO - HẠNH PHÚC</p>
            </div>

            <h1 className="contract-main-title">HỢP ĐỒNG VAY TIỀN</h1>

            <div className="contract-parties">
              <p>
                <span className="title">Bên A (Bên cho vay):</span>{" "}
                {processedLoan.bankName || "Ngân hàng MB Quân đội"}
              </p>
              <p>
                <span className="title">Bên B (Bên vay) Ông / Bà :</span>
                {processedLoan.userId?.fullName ||
                  processedLoan.userName ||
                  "Chưa cập nhật"}
              </p>
              <p>
                <span className="title">Số CMT / CCCD :</span>
                {processedLoan.userId?.personalInfo?.idNumber ||
                  processedLoan.userIdNumber ||
                  "Chưa cập nhật"}
              </p>
              <p>
                <span className="title">Ngày ký : </span>
                {processedLoan.createdDate || "Chưa cập nhật"}
              </p>
              <p>
                <span className="title">Số tiền khoản vay : </span>
                {typeof processedLoan.loanAmount === "string"
                  ? processedLoan.loanAmount
                  : processedLoan.loanAmount?.toLocaleString("vi-VN")}{" "}
                VNĐ
              </p>
              <p>
                <span className="title">Mã hợp đồng : </span>
                {processedLoan.contractId || "Chưa cập nhật"}
              </p>
              <p>
                <span className="title">Thời gian vay : </span>
                {processedLoan.loanTerm || "Chưa cập nhật"} tháng
              </p>
              <p>
                <span className="title">Lãi suất vay : </span>
                <span className="laisuatvay">1%</span>{" "}
                <span className="laisuatvays">mỗi tháng</span>
              </p>
            </div>

            {/* Signature section */}
            <div className="contract-signatures">
              <div className="signature-columns">
                <div className="signature-column">
                  <h3>Bên vay</h3>
                  <div className="signature-placeholder">
                    {processedLoan.signatureUrl ? (
                      <img
                        src={processedLoan.signatureUrl}
                        alt="Chữ ký người vay"
                        className="user-signature"
                        onError={(e) => {
                          console.error(
                            "Error loading signature image:",
                            e.target.src
                          );
                          e.target.onerror = null;
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML =
                            "Không thể tải chữ ký";
                        }}
                      />
                    ) : (
                      <div className="no-signature">Chưa có chữ ký</div>
                    )}
                  </div>
                  <p className="signer-name">
                    {processedLoan.userId?.fullName || "Chưa có thông tin"}
                  </p>
                </div>
                <div className="signature-column">
                  <h3>Bên cho vay</h3>
                  <div className="bank-signature">
                    <img
                      src={bankSignature}
                      alt="Chữ ký ngân hàng"
                      className="bank-stamp"
                      onError={(e) => {
                        console.error("Error loading bank signature:", e);
                        e.target.onerror = null;
                        e.target.src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjUwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjEwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5Ij5DaMawzKMga3nMgSBuZ8OibiBow6BuZzwvdGV4dD48L3N2Zz4=";
                      }}
                    />
                  </div>
                  <p className="signer-name">Ngân hàng Quân đội</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LoanDetails);

<style>
  {`
    .admin-page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background-color: #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .header-left h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #333;
    }

    .header-actions {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-button i {
      font-size: 16px;
    }

    .action-button.back-button {
      background-color: #f0f0f0;
      color: #666;
    }

    .action-button.back-button:hover {
      background-color: #e0e0e0;
    }

    .action-button.edit {
      background-color: gray;
    }

    .action-button.edit:hover {
      background-color: #1565c0;
    }

    .action-button.save {
      background-color: #2e7d32;
      color: white;
    }

    .action-button.save:hover {
      background-color: #1b5e20;
    }

    .action-button.cancel {
      background-color: #f44336;
      color: white;
    }

    .action-button.cancel:hover {
      background-color: #d32f2f;
    }

    .edit-actions {
      display: flex;
      gap: 8px;
    }

    .loan-approval-actions {
      display: flex;
      gap: 8px;
    }

    .action-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .action-button span {
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .admin-page-header {
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }

      .header-left {
        width: 100%;
        justify-content: space-between;
      }

      .header-actions {
        width: 100%;
        flex-wrap: wrap;
      }

      .action-button {
        flex: 1;
        justify-content: center;
      }
    }
  `}
</style>;
