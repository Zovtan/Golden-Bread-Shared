
export default function ReadField({ label, value, type = "text" }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      <input type={type} value={value ?? "-"} readOnly className="bg-gray-50 cursor-default" />
    </div>);

}