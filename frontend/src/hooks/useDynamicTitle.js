import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useDynamicTitle() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let label = "Home";

    const shortPath = path.startsWith("/s/") ? path.replace(/^\/s\//, "/") : path;

    if (path === "/" || path === "" || shortPath === "/home" || path === "/s") {
      label = "Home";
    } else if (path.startsWith("/dashboard")) {
      label = "Dashboard";
    } else if (shortPath === "/auth") {
      label = "Auth";
    } else if (shortPath === "/pricing") {
      label = "Pricing";
    } else if (shortPath === "/legal") {
      label = "Legal";
    } else if (shortPath === "/compare") {
      label = "Compare";
    } else {
      const clean = path.replace(/^\/+/, "").split("/")[0];
      label = clean && clean !== "s" ? `@${clean}` : "Profile";
    }

    document.title = `Swats | ${label}`;
  }, [location.pathname]);
}
