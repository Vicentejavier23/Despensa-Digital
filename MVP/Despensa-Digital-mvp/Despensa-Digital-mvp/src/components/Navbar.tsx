import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6  py-2 gap-20 border-b border-neutral-200 font-bold bg-white shadow-sm">
      <h1 className="font-bold">Despensa Digital</h1>
      <div className="flex items-center gap-3 text-xl">
        <Link to="/" className="hover:text-green-600 transition-colors text-sm">Home</Link>
        <Link to="/despensa" className="hover:text-green-600 transition-colors text-sm">Despensa</Link>
        <Link to="/refrigerador" className="hover:text-green-600 transition-colors text-sm">Refrigerador</Link>
        <Link to="/congelador" className="hover:text-green-600 transition-colors text-sm">Congelador</Link>
        <h1 className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm cursor-pointer">V</h1>
      </div>
    </nav>
  );
}

export default Navbar;
