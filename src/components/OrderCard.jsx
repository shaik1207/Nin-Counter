import StatusBadge from "./StatusBadge";

function OrderCard({ order }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">

      <div className="flex justify-between">
        <h2 className="font-bold">
          {order.id}
        </h2>

        <StatusBadge status={order.status} />
      </div>

      <p className="mt-3">
        {order.customer}
      </p>

      <p className="text-green-700 font-bold mt-2">
        ₹{order.amount}
      </p>

    </div>
  );
}

export default OrderCard;