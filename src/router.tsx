import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import B2BSignup from "./pages/B2BSignup";
import AccountOrders from "./pages/AccountOrders";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminQuotesPage from "./pages/admin/AdminQuotesPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminPaymentMethodsPage from "./pages/admin/AdminPaymentMethodsPage";
import RequestQuote from "./pages/RequestQuote";
import BestSellers from "./pages/BestSellers";
import ReturnRefundPolicy from "./pages/ReturnRefundPolicy";
import NotFound from "./pages/NotFound";

export const routers = [
  {
    path: "/",
    name: "home",
    element: <Index />,
  },
  {
    path: "/shop",
    name: "shop",
    element: <Shop />,
  },
  {
    path: "/product/:slug",
    name: "product-detail",
    element: <ProductDetail />,
  },
  {
    path: "/cart",
    name: "cart",
    element: <Cart />,
  },
  {
    path: "/checkout",
    name: "checkout",
    element: <Checkout />,
  },
  {
    path: "/order-confirmation",
    name: "order-confirmation",
    element: <OrderConfirmation />,
  },
  {
    path: "/login",
    name: "login",
    element: <Login />,
  },
  {
    path: "/signup",
    name: "signup",
    element: <Signup />,
  },
  {
    path: "/b2b/signup",
    name: "b2b-signup",
    element: <B2BSignup />,
  },
  {
    path: "/account/orders",
    name: "account-orders",
    element: <AccountOrders />,
  },
  {
    path: "/admin-login",
    name: "admin-login",
    element: <AdminLogin />,
  },
  {
    path: "/admin",
    name: "admin-dashboard",
    element: <AdminDashboard />,
  },
  {
    path: "/admin/orders",
    name: "admin-orders",
    element: <AdminOrdersPage />,
  },
  {
    path: "/admin/quotes",
    name: "admin-quotes",
    element: <AdminQuotesPage />,
  },
  {
    path: "/admin/products",
    name: "admin-products",
    element: <AdminProductsPage />,
  },
  {
    path: "/admin/categories",
    name: "admin-categories",
    element: <AdminCategoriesPage />,
  },
  {
    path: "/admin/payment-methods",
    name: "admin-payment-methods",
    element: <AdminPaymentMethodsPage />,
  },
  {
    path: "/request-quote",
    name: "request-quote",
    element: <RequestQuote />,
  },
  {
    path: "/best-sellers",
    name: "best-sellers",
    element: <BestSellers />,
  },
  {
    path: "/return-refund-policy",
    name: "return-refund-policy",
    element: <ReturnRefundPolicy />,
  },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  {
    path: "*",
    name: "404",
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
