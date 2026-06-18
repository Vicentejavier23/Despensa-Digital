import { useState,useEffect } from "react";

interface Producto{
  nombre:string
  cantidad:number
  categoria: string
  fecha : string
}

function Home() {
  const [todosProductos ,setTodosProductos] = useState<Producto[]>([])
  useEffect(()=>{
  const despensa = JSON.parse(localStorage.getItem('productos_despensa')||'[]')
  const refrigerador = JSON.parse(localStorage.getItem('productos_refrigerador')||'[]')
  const congelador = JSON.parse(localStorage.getItem('productos_congelador')||'[]')
  setTodosProductos([...despensa,...refrigerador,...congelador])
},[])
  const alertasStock = todosProductos.filter(p => p.cantidad < 2)
  const alertasVencimientos = todosProductos.filter( p =>{
    const hoy = new Date()
    const diasRestantes = Math.ceil(
      (new Date(p.fecha).getTime()  - hoy.getTime()) /(1000 * 60 *60 *24)
    )
    return diasRestantes <= 5 && diasRestantes >=0
  })

  return (
    <>
      <div className="flex flex-col  font-bold text-xl py-6 px-8 gap-8 bg-gray-100 h-screen">
        <h1 className="text-lg font-semibold text-neutral-700 mb-2">
          Ultimas Alertas
        </h1>
        <div className="flex flex-row gap-4 ">
          <div className="flex flex-row gap-4">
            {alertasStock.map(p =>(
            <div key={p.nombre} className="border-4 rounded-xl gap-4 p-6">
              <p className="font-medium">{p.nombre}</p>
              <p className="text-sm text-neutral-500">Stock bajo</p>
            </div>
            ))}
            {alertasVencimientos.map(p =>(
            <div key={p.nombre} className="border-4 rounded-xl gap-4 p-6">
              <p className="font-medium">{p.nombre}</p>
              <p className="text-sm text-neutral-500">Proximo a vencer</p>
            </div>
            ))}
          </div>
        </div>
        <h1 className="text-lg font-semibold text-neutral-700 mb-2">
          Productos faltantes
        </h1>
        <div className="flex flex-row gap-4 ">
          <div className="flex flex-row gap-4">
            {alertasStock.map(p => (
            <div key={p.nombre} className="border-4 rounded-4xl gap-4 p-6">
              <p className="font-medium">{p.nombre}</p>
              <p className="text-sm text-neutral-500">{p.categoria}</p>
            </div>
            ))}
          </div>
        </div>
        <h1 className="text-lg font-semibold text-neutral-700 mb-2">
          Resumen
        </h1>
        <div className="flex flex-row gap-4 ">
          <div className="flex flex-row gap-4">
            <div className="border-4 rounded-4xl gap-4 p-6">
              <p className="text-3xl">{alertasVencimientos.length + alertasStock.length}</p>
              <p className="text-sm text-neutral-500">Alertas</p>
            </div>
            <div className="border-4 rounded-4xl gap-4 p-6">
              <p className="text-3xl">{alertasStock.length}</p>
              <p className="text-sm text-neutral-500">Productos</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default Home;
