import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { loansApi } from "../../utils/apiService";
import "./MyContract.css";

const MyContract = () => {
  const { user } = useAuth();
  const [loanData, setLoanData] = useState({
    loanDate: "",
    loanAmount: "",
    loanTerm: "",
    contractId: "",
  });
  const [settings, setSettings] = useState({
    interestRate: 0,
  });

  useEffect(() => {
    const fetchLoanData = async () => {
      try {
        const response = await loansApi.getUserLoans();
        if (response.success && response.loans.length > 0) {
          const latestLoan = response.loans[0];
          setLoanData({
            loanDate: new Date(latestLoan.createdAt).toLocaleDateString(
              "vi-VN"
            ),
            loanAmount: latestLoan.loanAmount.toLocaleString("vi-VN") + " VNĐ",
            loanTerm: latestLoan.term,
            contractId: latestLoan._id.substring(0, 8),
          });
        }
      } catch (error) {
        console.error("Error fetching loan data:", error);
      }
    };

    const fetchSettings = async () => {
      try {
        const response = await loansApi.getSettings();
        if (response.success) {
          setSettings({
            interestRate: response.settings.interestRate,
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchLoanData();
    fetchSettings();
  }, []);

  return (
    <div className="contract-container">
      <div className="contract-header">
        <h1>HỢP ĐỒNG VAY VỐN</h1>
      </div>
      <div className="contract-content">
        <div className="contract-parties">
          <p key="party-a">
            <a className="title">Bên A (Bên cho vay):</a> Ngân hàng MB Quân đội
          </p>
          <p key="party-b">
            <a className="title">Bên B (Bên vay) Ông / Bà :</a>
            {user?.fullName}
          </p>
          <p key="id-number">
            <a className="title">Số CMT / CCCD :</a>
            {user?.personalInfo?.idNumber}
          </p>
          <p key="sign-date">
            <a className="title">Ngày ký : </a>
            {loanData.loanDate}
          </p>
          <p key="loan-amount">
            <a className="title">Số tiền khoản vay : </a>
            {loanData.loanAmount}
          </p>
          <p key="contract-id">
            <a className="title">Mã hợp đồng : </a>
            {loanData.contractId}
          </p>
          <p key="loan-term">
            <a className="title">Thời gian vay : </a>
            {loanData.loanTerm} tháng
          </p>
          <p key="interest-rate">
            <a className="title">Lãi suất vay : </a>
            <a className="laisuatvay">
              {(settings.interestRate).toFixed(0)}%
            </a>{" "}
            <a className="laisuatvays">mỗi tháng</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyContract;
