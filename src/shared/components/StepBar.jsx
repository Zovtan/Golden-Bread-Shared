
export default function StepBar({ step }) {
  return (
    <div className="order-stepbar">
      {["Pilih Produk", "Data Pengiriman", "Konfirmasi"].map((label, i) =>
      <div key={i} className={`order-step${step === i + 1 ? " active" : step > i + 1 ? " done" : ""}`}>
          <div className="order-step-circle">{i + 1}</div>
          <div className="order-step-label">{label}</div>
          {i < 2 && <div className="order-step-line" />}
        </div>
      )}
    </div>);

}