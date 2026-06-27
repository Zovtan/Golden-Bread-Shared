





export default function SearchBar({ value, onChange, placeholder = "Cari…" }) {
  return (
    <div className="db-search-bar">
      <input
        type="search"
        name="db-search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        data-lpignore="true"
        data-form-type="other"
        data-1p-ignore="true"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)} />
      
    </div>);

}