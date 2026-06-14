export function formatCurrency(amount = 0) {
  return `Rs.${Number(amount || 0).toLocaleString("en-IN")}`;
}

export function formatDate(value) {
  if (!value) return "—";

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function paymentStatusLabel(status = "") {
  const labels = {
    created: "Created",
    otp_pending: "OTP Pending",
    paid: "Paid",
    failed: "Failed",
    otp_failed: "OTP Failed",
  };

  return labels[status] || status || "Unknown";
}
