import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import ProductCard from "../components/ProductCard"
import { getTrendingProducts } from "../services/api"

export default function Home() {

  const [products,setProducts] = useState([])
  const [loading,setLoading] = useState(true)

  useEffect(()=>{

    async function load(){
      const data = await getTrendingProducts()
      setProducts(data)
      setLoading(false)
    }

    load()

  },[])

  return(

    <div style={{maxWidth:"1300px",margin:"0 auto",padding:"20px"}}>

      {/* BANNER */}

      <div style={{
        background:"#eee",
        borderRadius:"12px",
        padding:"40px",
        textAlign:"center",
        marginBottom:"40px"
      }}>

        <h1 style={{marginBottom:"10px"}}>
          Witaj w sklepie
        </h1>

        <p style={{marginBottom:"20px"}}>
          Sprawdź najnowsze produkty
        </p>

        <Link to="/shop">
          <button style={{
            padding:"14px 22px",
            border:"none",
            borderRadius:"8px",
            background:"#000",
            color:"#fff",
            cursor:"pointer"
          }}>
            Przejdź do sklepu
          </button>
        </Link>

      </div>

      {/* TRENDING */}

      <h2 style={{marginBottom:"20px"}}>
        Trendujące produkty
      </h2>

      {loading && <p>Ładowanie...</p>}

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",
        gap:"20px"
      }}>

        {products.map(product=>(
          <ProductCard key={product.id} product={product}/>
        ))}

      </div>

    </div>

  )

}
