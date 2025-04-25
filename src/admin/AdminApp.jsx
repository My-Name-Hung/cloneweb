import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminLogin from "./component/AdminLogin";
import Dashboard from "./component/Dashboard";
import Layout from "./component/Layout";
import LoanDetails from "./component/Loans/LoanDetails";
import LoansList from "./component/Loans/LoansList";
import RequireAdmin from "./component/RequireAdmin";
import Settings from "./component/Settings";
import UserDetails from "./component/Users/UserDetails";
import UserForm from "./component/Users/UserForm";
import UsersList from "./component/Users/UsersList";
import "./styles/AdminStyles.css";

const AdminApp = () => {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />

      <Route
        element={
          <RequireAdmin>
            <Layout />
          </RequireAdmin>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UsersList />} />
        <Route path="users/new" element={<UserForm />} />
        <Route path="users/:userId" element={<UserDetails />} />
        <Route path="users/:userId/edit" element={<UserForm />} />
        <Route path="loans" element={<LoansList />} />
        <Route path="loans/:loanId" element={<LoanDetails />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
};

export default AdminApp;
