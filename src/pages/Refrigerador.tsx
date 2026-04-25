import { useEffect, useState } from "react";
import Formulario from "../components/Formulario";
interface Producto {
  nombre: string;
  cantidad: number;
  categoria: string;
  fecha: string;
}
function Refrigerador() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [nombreEdit, setNombreEdit] = useState("");
  const [fechaEdit, setFechaEdit] = useState("");
  const [categoriaEdit, setCategoriaEdit] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productos, setProductos] = useState<Producto[]>(() => {
    const datos = localStorage.getItem("productos_refrigerador");
    return datos ? JSON.parse(datos) : [];
  });
  useEffect(() => {
    localStorage.setItem("productos_refrigerador", JSON.stringify(productos));
  }, [productos]);
  const aumentar = () => {
    setProductos(
      productos.map((p) =>
        p.nombre === productoSeleccionado?.nombre
          ? { ...p, cantidad: p.cantidad + 1 }
          : p,
      ),
    );
    setProductoSeleccionado((prev) =>
      prev ? { ...prev, cantidad: prev.cantidad + 1 } : prev,
    );
  };
  const disminuir = () => {
    setProductos(
      productos.map((p) =>
        p.nombre === productoSeleccionado?.nombre
          ? { ...p, cantidad: p.cantidad - 1 }
          : p,
      ),
    );
    setProductoSeleccionado((prev) =>
      prev ? { ...prev, cantidad: prev.cantidad - 1 } : prev,
    );
  };
  const guardarEdicion = () => {
    setProductos(
      productos.map((p) =>
        p.nombre === productoSeleccionado?.nombre
          ? {
              ...p,
              nombre: nombreEdit,
              fecha: fechaEdit,
              categoria: categoriaEdit,
            }
          : p,
      ),
    );
    setProductoSeleccionado((prev) =>
      prev
        ? {
            ...prev,
            nombre: nombreEdit,
            fecha: fechaEdit,
            categoria: categoriaEdit,
          }
        : prev,
    );
    setEditando(false);
  };

  return (
    <div className="flex flex-col px-8 py-6 gap-6 bg-gray-100 min-h-screen ">
      <h1 className=" text-2xl text-neutral-800 font-medium">Refrigerador</h1>
      <div className="flex gap-2 items-center ">
        <div className="flex flex-row gap-2 ">
          <button className="  bg-white text-neutral-600 rounded-lg px-4 py-2 text-sm font-medium">
            Despensa
          </button>
          <button className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium border border-neutral-200">
            Refrigerador
          </button>
          <button className="bg-white text-neutral-600 rounded-lg px-4 py-2 text-sm font-medium border border-neutral-200">
            Congelador
          </button>
        </div>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors"
        >
          Agregar Producto
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 font-medium">
        {productos.map((producto) => (
          <div
            key={producto.nombre}
            onClick={() => {
              setProductoSeleccionado(producto);
              setModalAbierto(true);
            }}
            className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm flex flex-col gap-2"
          >
            <p className="font-semibold">{producto.nombre}</p>
            <div className=" flex items-center gap-2 ">
              <div className="flex-1 bg-neutral-200 rounded-full h-2">
                <div
                  className=" bg-green-500 h-2 rounded-full"
                  style={{ width: `${producto.cantidad}%` }}
                ></div>
              </div>
              <p className="text-sm text-neutral-500">{producto.cantidad}%</p>
            </div>
            <p>{producto.categoria}</p>
            <p>{producto.fecha}</p>
          </div>
        ))}
      </div>
      {modalAbierto && productoSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 flex flex-col gap-4 font-medium items-center justify-center">
            {editando ? (
              <>
                <input
                  value={nombreEdit}
                  onChange={(e) => setNombreEdit(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={fechaEdit}
                  onChange={(e) => setFechaEdit(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                />
                <select
                  value={categoriaEdit}
                  onChange={(e) => setCategoriaEdit(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="Despensa">Despensa</option>
                  <option value="Refrigerador">Refrigerador</option>
                  <option value="Congelador">Congelador</option>
                </select>

                <button
                  onClick={guardarEdicion}
                  className="w-full bg-green-600 text-white rounded-lg py-2 text-sm"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEditando(false)}
                  className="w-full border border-neutral-200 rounded-lg py-2 text-sm"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setNombreEdit(productoSeleccionado.nombre);
                    setFechaEdit(productoSeleccionado.fecha);
                    setCategoriaEdit(productoSeleccionado.categoria);
                    setEditando(true);
                  }}
                  className="w-full border border-neutral-200 rounded-lg py-2 text-sm hover:bg-gray-100"
                >
                  Editar
                </button>
                <p className="text-xl">{productoSeleccionado.nombre}</p>
                <div className="flex items-center gap-4 justify-center">
                  <button
                    onClick={disminuir}
                    className="w-8 h-8 rounded-full border border-neutral-200 font-bold hover:bg-gray-100"
                  >
                    -
                  </button>
                  <p className="text-xl font-semibold">
                    {productoSeleccionado.cantidad}
                  </p>
                  <button
                    onClick={aumentar}
                    className="w-8 h-8 rounded-full bg-green-600 text-white font-bold hover:bg-green-700"
                  >
                    +
                  </button>
                </div>
                <p>{productoSeleccionado.fecha}</p>
                <button
                  className="w-full border border-neutral-200 rounded-lg py-2 text-sm hover:bg-gray-100"
                  onClick={() => {
                    setModalAbierto(false);
                  }}
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {mostrarFormulario && (
        <Formulario
          productos={productos}
          setProductos={setProductos}
          setMostrarFormulario={setMostrarFormulario}
        />
      )}
    </div>
  );
}
export default Refrigerador;
