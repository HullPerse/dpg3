import { Slide, toast } from "react-toastify";

export default function Toast(
  message: string,
  type: "info" | "success" | "warning" | "error" | "default",
) {
  return toast(message, {
    position: "bottom-right",
    style: {
      backgroundColor: "var(--color-background)",
      color: "var(--color-primary)",
      border: "1px solid var(--color-primary)",
    },
    type: type,
    closeButton: false,
    icon: false,
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: false,
    theme: "dark",
    transition: Slide,
  });
}
