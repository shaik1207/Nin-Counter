import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import QRScanner from "../components/QRScanner";

function ScanReceipt() {
  const [order, setOrder] = useState(null);

  const handleScan = (data) => {
    console.log(data);

    setOrder({
      id: "#ORD001",
      customer: "Sameer",
      amount: "₹180",
      status: "Ready",
      items: ["Veg Biryani", "Coffee"],
    });
  };

  return (
    <>
      <Navbar />

      <div className="flex">
        <Sidebar />

        <div className="flex-1 p-6 bg-gray-100 min-h-screen">

          <h1 className="text-3xl font-bold mb-6">
            Scan Receipt
          </h1>

          <div className="grid md:grid-cols-2 gap-6">

            <QRScanner onScan={handleScan} />

            <div className="bg-white rounded-xl shadow p-6">

              <h2 className="text-xl font-bold mb-4">
                Order Details
              </h2>

              {order ? (
                <>
                  <p><strong>Order:</strong> {order.id}</p>
                  <p><strong>Customer:</strong> {order.customer}</p>
                  <p><strong>Amount:</strong> {order.amount}</p>
                  <p><strong>Status:</strong> {order.status}</p>

                  <div className="mt-4">
                    <h3 className="font-semibold">
                      Items
                    </h3>

                    <ul className="list-disc ml-5 mt-2">
                      {order.items.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <button className="w-full mt-6 bg-green-700 text-white p-3 rounded-lg">
                    Mark As Served
                  </button>
                </>
              ) : (
                <p className="text-gray-500">
                  Scan a receipt to view details.
                </p>
              )}

            </div>

          </div>

        </div>
      </div>
    </>
  );
}

export default ScanReceipt;