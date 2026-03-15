import { useEffect, useState } from "react"
import ProductCard from "../components/ProductCard"
import {
  getProducts,
  getCategories,
  getProductsByCategory
} from "../services/api"

export default function Shop(){

  const [products,setProducts] = useState([])
  const [categories,setCategories] = useState([])
  const [selectedCategory,setSelectedCategory] = useState("all")

  useEffect(()=>{

    async function load(){

      try{

        const productsData = await getProducts()
        const categoriesData = await getCategories()

        setProducts(
          Array.isArray(productsData)
            ? productsData.filter(p=>p && p.id)
            : []
        )

        setCategories(
          Array.isArray(categoriesData)
            ? categoriesData
            : []
        )

      }catch(e){
        console.error("Shop load error",e)
        setProducts([])
        setCategories([])
      }

    }

    load()

  },[])

  async function selectCategory(id){

    setSelectedCategory(id)

    try{

      if(id==="all"){
        const data = await getProducts()
        setProducts(data.filter(p=>p && p.id))
      }else{
        const data = await getProductsByCategory(id)
        setProducts(data.filter(p=>p && p.id))
      }

    }catch(e){
      console.error("Category error",e)
      setProducts([])
    }

  }

  return(

    <div style={{maxWidth:"1300px",margin:"0 auto",padding:"20px"}}>

      <h1 style={{marginBottom:"20px"}}>Sklep</h1>

      <div style={{
        display:"grid",
        gridTemplateColumns:"260px 1fr",
        gap:"30px"
      }}>

        <div style={{
          border:"1px solid #ddd",
          borderRadius:"10px",
          padding:"16px",
          height:"fit-content"
        }}>

          <h3 style={{marginBottom:"10px"}}>
            Kategorie
          </h3>

          <button
            onClick={()=>selectCategory("all")}
            style={{display:"block",marginBottom:"8px"}}
          >
            Wszystkie
          </button>

          {categories.map(cat=>(
            <button
              key={cat.id}
              onClick={()=>selectCategory(cat.id)}
              style={{display:"block",marginBottom:"8px"}}
            >
              {cat.name}
            </button>
          ))}

        </div>

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

    </div>

  )

}