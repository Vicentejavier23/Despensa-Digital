import { useState } from 'react'

interface Producto{
    nombre : string
    cantidad: number
    categoria : string
    fecha: string
}
interface Props{
    productos: Producto[]
    setProductos: React.Dispatch<React.SetStateAction<Producto[]>>
    setMostrarFormulario: (valor: boolean) => void
    
}

function Formulario({setProductos,setMostrarFormulario}:Props){
    const [nombre , setNombre]=useState("")
    const [cantidad , setCantidad]=useState("")
    const [fecha , setFecha] = useState("")
    const [categoria , setCategoria] = useState('Despensa')
    const handleAgregar = () =>{
        if(!nombre || !cantidad || !fecha){
            alert("Todos los campos deben estar completos")
            return
        }
        const nuevoProducto ={
            nombre : nombre,
            cantidad : Number(cantidad),
            categoria: categoria,
            fecha: fecha ,
            
        }
    setProductos((prev) => [... prev,nuevoProducto])
    setNombre('')
    setCantidad('')
    setFecha('')
    setCategoria('Despensa')
    setMostrarFormulario(false)
    }
    return(
        <div className="bg-white rounded-xl p-6 border-neutral-200 shadow-sm max-w-md">
            <div className="flex flex-col  font-semibold">
                <h1>Agregar Producto</h1>
                <div className="flex flex-col ">
                    <label className="text-sm text-neutral-700 mt-2 block ">Nombre del Producto</label>
                    <input placeholder="Ingresa producto" className="w-full border border-neutral-200 rounded-lg px-3 py-2
                    text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-green-500" value={nombre} onChange={(e)=>setNombre(e.target.value)}></input>
                </div>
                <div className="m-2 flex flex-col">
                    <label className="text-sm text-neutral-700 mb-1 block"></label>
                        Categoria
                        <select className="flex mt-2 bg-neutral-200 text-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"value={categoria} onChange={(e)=>setCategoria(e.target.value)}>
                            <option value="Despensa">Despensa</option>
                            <option value="Refrigerador">Refrigerador</option>
                            <option value="Congelador">Congelador</option>
                        </select>
                </div>
                <div>
                    <label className="text-sm text-neutral-700 mb-1 block">Cantidad</label>
                    <input placeholder="Stock"className="w-full border border-neutral-200 rounded-lg px-3 py-2
                    text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-green-500" value={cantidad} onChange={(e)=>setCantidad(e.target.value)}></input>
                </div>
                <div className="mt-2 ">
                    <label>Fecha de Vencimiento</label>
                    <input placeholder="Ingrese Fecha" type="date" className="w-full border border-neutral-200 rounded-lg px-3 py-2
                    text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-green-500"value={fecha} onChange={(e)=>setFecha(e.target.value)}></input>
                </div>
                <button onClick={handleAgregar} className=" mt-4 w-full bg-green-600 text-white rounded-lg py-2 font-medium hover:bg-green-700 transition-colors">Agregar Producto</button>
                <button onClick={()=>setMostrarFormulario(false)} className='mt-3 bg-gray-300 rounded-lg py-2 font-medium hover:bg-gray-400 transition-colors'>Cerrar</button>
            </div>
        </div>
    )
}
export default Formulario
