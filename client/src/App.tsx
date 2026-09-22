import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { useAuth } from "@/hooks/use-auth";
import { useShopifyAnalytics } from "@/hooks/use-shopify-analytics";
import { LanguageProvider } from "@/lib/language";
import { lazy, Suspense } from "react";
import Home from "@/pages/Home";

const CartDrawer = lazy(() => import("@/components/cart/CartDrawer").then(m => ({ default: m.CartDrawer })));
const ProfileCompletionModal = lazy(() => import("@/components/auth/ProfileCompletionModal").then(m => ({ default: m.ProfileCompletionModal })));

const CollectionPage = lazy(() => import("@/pages/Collection"));
const ProductPage = lazy(() => import("@/pages/Product"));
const Page = lazy(() => import("@/pages/Page"));
const FitmentCalculator = lazy(() => import("@/pages/FitmentCalculator"));
const WheelSpecCalculator = lazy(() => import("@/pages/WheelSpecCalculator"));
const MyAccount = lazy(() => import("@/pages/MyAccount"));
const Powdercoating = lazy(() => import("@/pages/Powdercoating"));
const WheelRebuilding = lazy(() => import("@/pages/WheelRebuilding"));
const FitmentCalculation = lazy(() => import("@/pages/FitmentCalculation"));
const FenderRolling = lazy(() => import("@/pages/FenderRolling"));
const Login = lazy(() => import("@/pages/Login"));
const Authenticity = lazy(() => import("@/pages/Authenticity"));
const Knowledge = lazy(() => import("@/pages/Knowledge"));
const About = lazy(() => import("@/pages/About"));
const VehicleFitment = lazy(() => import("@/pages/VehicleFitment"));
const MyGarage = lazy(() => import("@/pages/MyGarage"));
const Sale = lazy(() => import("@/pages/Sale"));
const PreOrder = lazy(() => import("@/pages/PreOrder"));
const Parts = lazy(() => import("@/pages/Parts"));
const PartsConfigurator = lazy(() => import("@/pages/PartsConfigurator"));
const StanceParts = lazy(() => import("@/pages/StanceParts"));
const BcRacing = lazy(() => import("@/pages/BcRacing"));
const SearchResults = lazy(() => import("@/pages/SearchResults"));
const WheelVisualizerPage = lazy(() => import("@/pages/WheelVisualizerPage"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  useShopifyAnalytics();
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/collections/:handle" component={CollectionPage} />
          <Route path="/products/:handle" component={ProductPage} />
          <Route path="/pages/:handle" component={Page} />
          <Route path="/fitment-calculator" component={FitmentCalculator} />
          <Route path="/wheel-spec-calculator" component={WheelSpecCalculator} />
          <Route path="/my-account" component={MyAccount} />
          <Route path="/powdercoating" component={Powdercoating} />
          <Route path="/wheel-rebuilding" component={WheelRebuilding} />
          <Route path="/fitment-calculation" component={FitmentCalculation} />
          <Route path="/fender-rolling" component={FenderRolling} />
          <Route path="/login" component={Login} />
          <Route path="/authenticity" component={Authenticity} />
          <Route path="/knowledge" component={Knowledge} />
          <Route path="/about" component={About} />
          <Route path="/vehicle-fitment" component={VehicleFitment} />
          <Route path="/my-garage" component={MyGarage} />
          <Route path="/sale" component={Sale} />
          <Route path="/pre-order" component={PreOrder} />
          <Route path="/parts" component={Parts} />
          <Route path="/parts-configurator" component={PartsConfigurator} />
          <Route path="/stanceparts" component={StanceParts} />
          <Route path="/bc-racing" component={BcRacing} />
          <Route path="/search" component={SearchResults} />
          <Route path="/wheel-visualizer" component={WheelVisualizerPage} />

          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function AuthGuard() {
  const { isAuthenticated, profileComplete, isLoading } = useAuth();
  const showModal = isAuthenticated && !profileComplete && !isLoading;

  if (!showModal) return null;

  return (
    <Suspense fallback={null}>
      <ProfileCompletionModal
        open={showModal}
        onComplete={() => {}}
      />
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
          <AuthGuard />
          <WhatsAppButton />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
