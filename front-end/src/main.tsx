import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
// import './styles/global.css'

// imports components
import App from './App.tsx'
import { Header } from "./components/header/Header";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Header></Header>
    <App />
  </StrictMode>,
);
