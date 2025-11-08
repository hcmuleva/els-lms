import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';



import { AuthProvider } from "./AuthContext";

import App from "./App";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
