import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getProduct } from "../services/api"
import { useCart } from "../context/CartContext"

export default function Product(){

  const {id} = useParams()
  const {addToCart} = useCart()

  const [product,setProduct] = useState(null)
  const [imageIndex,setImageIndex] = useState(0)

  useEffect(()=>{

    async function load(){
      const data = await getProduct(id)
      setProduct(data)
    }

    load()

  },[id])

  if(!product) return <p>Ładowanie...</p>

  const image = product.images?.[imageIndex]?.filename

  function nextImage(){

    if(!product.images?.length) return

    setImageIndex(prev =>
      prev === product.images.length - 1 ? 0 : prev + 1
    )

  }

  function prevImage(){

    if(!product.images?.length) return

    setImageIndex(prev =>
      prev === 0 ? product.images.length - 1 : prev - 1
    )

  }

  return(

    <div style={{maxWidth:"1200px",margin:"0 auto",padding:"20px"}}>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",
        gap:"40px"
      }}>

        {/* GALERIA */}

        <div>

          <div style={{
            position:"relative",
            width:"100%",
            height:"500px",
            background:"#f3f3f3",
            borderRadius:"10px",
            overflow:"hidden",
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            padding:"10px"
          }}>

            {image && (

              <img
                src={`http://localhost:3000/uploads/${image}`}
                alt=""
                style={{
                  height:"100%",
                  width:"auto",
                  maxWidth:"100%",
                  objectFit:"contain"
                }}
              />

            )}

            {product.images?.length > 1 && (

              <>
                <button
                  onClick={prevImage}
                  style={{
                    position:"absolute",
                    top:"50%",
                    left:"10px",
                    transform:"translateY(-50%)",
                    width:"40px",
                    height:"40px",
                    borderRadius:"50%",
                    border:"none",
                    background:"rgba(0,0,0,0.6)",
                    color:"#fff",
                    fontSize:"20px",
                    cursor:"pointer"
                  }}
                >
                  ‹
                </button>

                <button
                  onClick={nextImage}
                  style={{
                    position:"absolute",
                    top:"50%",
                    right:"10px",
                    transform:"translateY(-50%)",
                    width:"40px",
                    height:"40px",
                    borderRadius:"50%",
                    border:"none",
                    background:"rgba(0,0,0,0.6)",
                    color:"#fff",
                    fontSize:"20px",
                    cursor:"pointer"
                  }}
                >
                  ›
                </button>
              </>

            )}

          </div>

          {/* MINIATURY */}

          <div style={{
            display:"flex",
            gap:"10px",
            marginTop:"10px",
            flexWrap:"wrap"
          }}>

            {product.images?.map((img,i)=>(
              <div
                key={img.id}
                onClick={()=>setImageIndex(i)}
                style={{
                  width:"70px",
                  height:"70px",
                  background:"#f3f3f3",
                  border:i===imageIndex?"2px solid black":"1px solid #ddd",
                  borderRadius:"6px",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  cursor:"pointer",
                  padding:"4px"
                }}
              >

                <img
                  src={`http://localhost:3000/uploads/${img.filename}`}
                  alt=""
                  style={{
                    height:"100%",
                    width:"auto",
                    maxWidth:"100%",
                    objectFit:"contain"
                  }}
                />

              </div>
            ))}

          </div>

        </div>

        {/* INFO */}

        <div>

          <h1>{product.name}</h1>

          <p style={{margin:"20px 0"}}>
            {product.description}
          </p>

          <h2>{product.price} zł</h2>

          <button
            onClick={()=>addToCart(product)}
            style={{
              marginTop:"20px",
              padding:"14px 22px",
              border:"none",
              borderRadius:"8px",
              background:"#000",
              color:"#fff",
              cursor:"pointer"
            }}
          >
            Dodaj do koszyka
          </button>

        </div>

      </div>

    </div>

  )

}