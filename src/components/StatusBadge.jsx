function StatusBadge({ status }) {

  const colors = {
    Pending: "bg-yellow-100 text-yellow-700",
    Ready: "bg-blue-100 text-blue-700",
    Served: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[status]}`}
    >
      {status}
    </span>
  );
}

export default StatusBadge;