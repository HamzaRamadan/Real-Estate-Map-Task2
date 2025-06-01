// import { useState } from "react";
// import ParcelMap from "./components/ParcelMap";
// import ParcelTable from "./components/ParcelTable";
// import ParcelContainer from "./components/ParcelContainer";

// export default function App() {
//   const [selectedParcelId, setSelectedParcelId] = useState<number | null>(null);

//   return (
//     <div style={{ display: "flex", height: "100vh" }}>
//       <div style={{ flex: 2 }}>
        
//                 <h2>🗺️ Real Estate Dashboard</h2>
//                   {/* <h1>الخريطة</h1> */}
//                   <ParcelContainer />
//         <ParcelMap
//           selectedId={selectedParcelId}
//           onSelectFromMap={setSelectedParcelId}
//         />
//       </div>
//       <div style={{ flex: 1, borderLeft: "1px solid #ccc", padding: 10 }}>
//         <ParcelTable
//           selectedId={selectedParcelId}
//           onSelectParcel={setSelectedParcelId}
//         />
//       </div>
//     </div>
//   );
// }
import ParcelContainer from "./components/ParcelContainer"; // عدل المسار حسب مشروعك

function App() {
  
  return(
   <div className="">
     <h2>🗺️ Real Estate Dashboard</h2>
        <ParcelContainer />
   </div>
  )
}

export default App;

