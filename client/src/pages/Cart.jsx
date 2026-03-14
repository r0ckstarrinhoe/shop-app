import { Link } from "react-router-dom"
import { useCart } from "../context/CartContext"

export default function Cart(){

  const {
    cart,
    increaseQuantity,
    decreaseQuantity
  } = useCart()

  const total = cart.reduce(
    (sum,p)=>sum+p.price*p.quantity,
    0
  )

  return(

    <div style={{maxWidth:"1200px",margin:"0 auto",padding:"20px"}}>

      <h1>Koszyk</h1>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",
        gap:"30px"
      }}>

        {/* PRODUKTY */}

        <div>

          {cart.map(product=>{

            const img = product.images?.[0]?.filename

            return(

              <Link
                key={product.id}
                to={`/product/${product.id}`}
                style={{textDecoration:"none",color:"black"}}
              >

                <div style={{
                  border:"1px solid #ddd",
                  borderRadius:"10px",
                  padding:"16px",
                  marginBottom:"10px",
                  display:"grid",
                  gridTemplateColumns:"100px 1fr",
                  gap:"10px"
                }}>

                  <img
                    src={`http://localhost:3000/uploads/${img}`}
                    style={{
                      width:"100px",
                      height:"100px",
                      objectFit:"cover"
                    }}
                  />

                  <div>

                    <h3>{product.name}</h3>

                    <p>{product.price} zł</p>

                    <div style={{display:"flex",gap:"10px"}}>

                      <button onClick={(e)=>{
                        e.preventDefault()
                        decreaseQuantity(product.id)
                      }}>-</button>

                      <span>{product.quantity}</span>

                      <button onClick={(e)=>{
                        e.preventDefault()
                        increaseQuantity(product.id)
                      }}>+</button>

                    </div>

                  </div>

                </div>

              </Link>

            )

          })}

        </div>

        {/* PODSUMOWANIE */}

        <div style={{
          border:"1px solid #ddd",
          borderRadius:"10px",
          padding:"20px",
          height:"fit-content"
        }}>

          <h2>Podsumowanie</h2>

          <p style={{fontSize:"20px"}}>
            {total.toFixed(2)} zł
          </p>

        </div>

      </div>

    </div>

  )

}
