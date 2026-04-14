import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import SecurityOverlay from "@/components/SecurityOverlay";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreateVault from "./pages/CreateVault";
import CreateMessage from "./pages/CreateMessage";
import ViewVault from "./pages/ViewVault";
import ViewMessage from "./pages/ViewMessage";
import MyVaults from "./pages/MyVaults";
import MyMessages from "./pages/MyMessages";
import Admin from "./pages/Admin";
import Pricing from "./pages/Pricing";
import Billing from "./pages/Billing";
import CustomPlanOrder from "./pages/CustomPlanOrder";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <SecurityOverlay />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/custom-plan" element={<ProtectedRoute><CustomPlanOrder /></ProtectedRoute>} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/v/:vaultId" element={<ViewVault />} />
            <Route path="/m/:messageId" element={<ViewMessage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/create-vault" element={<ProtectedRoute><CreateVault /></ProtectedRoute>} />
            <Route path="/create-message" element={<ProtectedRoute><CreateMessage /></ProtectedRoute>} />
            <Route path="/my-vaults" element={<ProtectedRoute><MyVaults /></ProtectedRoute>} />
            <Route path="/my-messages" element={<ProtectedRoute><MyMessages /></ProtectedRoute>} />
            <Route path="/sxt-tahir" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;