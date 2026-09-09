function QRScanner() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 h-[400px] flex flex-col items-center justify-center">
      <div className="w-32 h-32 border-4 border-dashed border-green-600 rounded-xl flex items-center justify-center">
        QR
      </div>

      <h2 className="text-2xl font-bold mt-6">
        Scan Receipt
      </h2>

      <p className="text-gray-500 mt-2">
        QR Scanner Integration Coming Soon
      </p>

      <button className="mt-6 px-6 py-3 bg-green-700 text-white rounded-lg">
        Simulate Scan
      </button>
    </div>
  );
}

export default QRScanner;