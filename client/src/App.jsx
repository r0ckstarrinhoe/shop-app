import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import { useCart } from "./context/CartContext";

function Navbar(){

  const { cart } = useCart();
  const count = cart.reduce((sum,p)=>sum+p.quantity,0);

  return(

    <nav style={{
      padding:"20px",
      borderBottom:"1px solid #ddd",
      display:"flex",
      justifyContent:"space-between"
    }}>

      <Link to="/">Strona główna</Link>

      <div>

        <Link to="/shop" style={{marginRight:"20px"}}>
          Sklep
        </Link>

        <Link to="/cart">
          Koszyk ({count})
        </Link>

      </div>

    </nav>
  );
}

export default function App(){

  return(

    <BrowserRouter>

      <Navbar/>

      <Routes>

        <Route path="/" element={<Home/>}/>
        <Route path="/shop" element={<Shop/>}/>
        <Route path="/product/:id" element={<Product/>}/>
        <Route path="/cart" element={<Cart/>}/>

      </Routes>

    </BrowserRouter>

  );
}