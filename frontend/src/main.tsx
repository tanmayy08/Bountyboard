import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { BountyDetailPage } from "./pages/BountyDetailPage";
import { BountiesPage } from "./pages/BountiesPage";
import { PostBountyPage } from "./pages/PostBountyPage";
import { ProfilePage } from "./pages/ProfilePage";
import "./styles.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <BountiesPage />,
      },
      {
        path: "bounty/:id",
        element: <BountyDetailPage />,
      },
      {
        path: "post",
        element: <PostBountyPage />,
      },
      {
        path: "profile/:address",
        element: <ProfilePage />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
