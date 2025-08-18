import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "./components/auth/AuthProvider";
import AuthPage from "./components/auth/AuthPage";
import Index from "./pages/Index";
import Communities from "./pages/Communities";
import Messages from "./pages/Messages";
import Wellness from "./pages/Wellness";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";
import Verify from "./pages/Verify";
import Events from "./pages/Events";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import CommunityDetail from "./pages/CommunityDetail";
import ResetPasswordPage from "./pages/ResetPasswordPage";

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg font-medium">Loading PrideSphere...</p>
        </div>
      </div>
    );
  }

  // Allow access to reset password page even when not logged in
  if (window.location.pathname === '/reset-password') {
    return <ResetPasswordPage />;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/communities" element={<Communities />} />
      <Route path="/communities/:id" element={<CommunityDetail />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/wellness" element={<Wellness />} />
      <Route path="/wellness/meditation" element={<div>Meditation Coming Soon</div>} />
      <Route path="/wellness/self-love" element={<div>Self-Love Exercise Coming Soon</div>} />
      <Route path="/support/chat" element={<div>Live Chat Coming Soon</div>} />
      <Route path="/events" element={<Events />} />
      <Route path="/events/create" element={<div>Create Event Coming Soon</div>} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/edit" element={<EditProfile />} />
      <Route path="/profile/setup" element={<EditProfile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/verify" element={<Verify />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
