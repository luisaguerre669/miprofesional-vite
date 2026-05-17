const Slider = ({ className = '', min = 0, max = 100, step = 1, value = [50], onValueChange, ...props }) => {
  const handleChange = (e) => {
    if (onValueChange) onValueChange([parseInt(e.target.value)]);
  };
  return (
    <div className={`relative w-full ${className}`}>
      <input type="range" min={min} max={max} step={step} value={value[0]} onChange={handleChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600" {...props} />
    </div>
  );
};
export { Slider };