import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { useDynamicTitle } from "@/hooks/useDynamicTitle";
import Home from "@/pages/Home";
import Legal from "@/pages/Legal";
import Compare from "@/pages/Compare";
import Pricing from "@/pages/Pricing";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import PublicBio from "@/pages/PublicBio";

function AnimatedRoutes() {
  const location = useLocation();
  useDynamicTitle();
  const rootKey = location.pathname.startsWith("/dashboard") ? "/dashboard" : location.pathname;
  return (
    <div key={rootKey} className="slide-in">
      <Routes location={location}>
        <Route path="/" element={<SiteRoot />} />
        <Route path="/s" element={<Navigate to="/s/home" replace />} />
        <Route path="/s/home" element={<Home />} />
        <Route path="/s/legal" element={<Legal />} />
        <Route path="/s/compare" element={<Compare />} />
        <Route path="/s/pricing" element={<Pricing />} />
        <Route path="/s/auth" element={<Auth />} />
        <Route path="/legal" element={<Navigate to="/s/legal" replace />} />
        <Route path="/compare" element={<Navigate to="/s/compare" replace />} />
        <Route path="/pricing" element={<Navigate to="/s/pricing" replace />} />
        <Route path="/auth" element={<Navigate to="/s/auth" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/:section" element={<Dashboard />} />
        <Route path="/dashboard/:section/:sub" element={<Dashboard />} />
        <Route path="/:username" element={<PublicBio />} />
      </Routes>
    </div>
  );
}

function SiteRoot() {
  const hostname = window.location.hostname.toLowerCase();
  const subdomain = hostname.endsWith(".swats.bio") ? hostname.slice(0, -".swats.bio".length) : "";
  if (subdomain && subdomain !== "www" && subdomain !== "api") return <PublicBio />;
  return <Navigate to="/s/home" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
      <Toaster position="top-center" theme="dark" richColors closeButton />
    </AuthProvider>
  );
}

export default App;

