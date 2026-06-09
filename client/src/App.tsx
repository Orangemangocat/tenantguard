import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import GetStarted from "./pages/GetStarted";
import AdLanding from "./pages/AdLanding";
import PaymentSuccess from "./pages/PaymentSuccess";
import DemoLaunch from "./pages/DemoLaunch";
import {
  AttorneyDashboard,
  AttorneyCases,
  AttorneyCaseDetail,
  AttorneyBids,
  AttorneyBilling,
} from "./pages/AttorneyPortal";
import {
  ClientDashboard,
  ClientCaseDetail,
  ClientBids,
  ClientConsultations,
} from "./pages/ClientPortal";

function Router() {
  return (
    <Switch>
      {/* Public marketing site */}
      <Route path="/" component={Home} />
      <Route path="/get-started" component={GetStarted} />
      <Route path="/tenant" component={GetStarted} />
      <Route path="/demo" component={DemoLaunch} />

      {/* Standalone social ad landing page */}
      <Route path="/offer" component={AdLanding} />

      {/* Payment return */}
      <Route path="/payment/success" component={PaymentSuccess} />

      {/* Attorney portal */}
      <Route path="/attorney" component={AttorneyDashboard} />
      <Route path="/attorney/cases" component={AttorneyCases} />
      <Route path="/attorney/bids" component={AttorneyBids} />
      <Route path="/attorney/billing" component={AttorneyBilling} />
      <Route path="/attorney/case/:id" component={AttorneyCaseDetail} />

      {/* Client portal */}
      <Route path="/client" component={ClientDashboard} />
      <Route path="/client/bids" component={ClientBids} />
      <Route path="/client/consultations" component={ClientConsultations} />
      <Route path="/client/case/:id" component={ClientCaseDetail} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
