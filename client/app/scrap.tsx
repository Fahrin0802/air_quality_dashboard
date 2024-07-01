// {/* <div className="flex flex-col md:flex-row justify-between gap-4">
//           {/* GEOMET API STATIONS */}
//           <div className="flex-1 bg-white rounded-lg shadow m-1 p-4 overflow-x-auto">
//             <h4 className="block text-med font-medium text-gray-700 text-center">Closest Continuous Air Quality Monitoring Stations</h4>
//             <h4 className="block text-med font-medium text-gray-700 text-center">Environment and Climate Change Canada</h4>
//             <table className="min-w-full">
//               <thead>
//                 <tr>
//                   <th className="px-4 py-2 text-center border-b border-gray-300">Station</th>
//                   <th className="px-4 py-2 text-center border-b border-gray-300">National AQHI</th>
//                   <th className="px-4 py-2 text-center border-b border-gray-300">Distance (km)</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {nearest_stations.map((station, index) => (
//                   <tr key={index}>
//                     <td className="px-4 py-2 text-center">{station.location_name}</td>
//                     <td className="px-4 py-2 text-center">{Math.round(station.aqhi)}</td>
//                     <td className="px-4 py-2 text-center">{station.distance.toFixed(2)}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
          
//           {/*ACA STATIONS */}
//           <div className="flex-1 bg-white rounded-lg shadow m-1 p-4 overflow-x-auto">
//             <h4 className="block text-med font-medium text-gray-700 text-center">Closest Continuous Air Quality Monitoring Stations</h4>
//             <h4 className="block text-med font-medium text-gray-700 text-center">Alberta Capital Airshed</h4>
//             <table className="min-w-full">
//               <thead>
//                 <tr>
//                   <th className="px-4 py-2 text-center border-b border-gray-300">Station</th>
//                   <th className="px-4 py-2 text-center border-b border-gray-300">AQHI</th>
//                   <th className="px-4 py-2 text-center border-b border-gray-300">Distance (km)</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {nearest_stations.map((station, index) => (
//                   <tr key={index}>
//                     <td className="px-4 py-2 text-center">{station.location_name}</td>
//                     <td className="px-4 py-2 text-center">{Math.round(station.aqhi)}</td>
//                     <td className="px-4 py-2 text-center">{station.distance.toFixed(2)}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         <div className="flex flex-col md:flex-row justify-between gap-4">
//           {/* PURPLE AIR MONITORS  */}
//           <div className="flex-1 bg-white rounded-lg shadow-md m-1 p-4 overflow-x-auto">
//             <h4 className="block text-med font-medium text-gray-700 text-center">Closest Purple Air Sensors</h4>
//             <table className="min-w-full">
//               <thead>
//                 <tr>
//                   <th className="px-4 py-2 text-center border-b border-gray-300">Sensor ID</th>
//                   <th className="px-4 py-2 text-center border-b border-gray-300">PM2.5</th>
//                   <th className="px-4 py-2 text-center border-b border-gray-300">Distance (km)</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {nearest_sensors.map((sensor, index) => (
//                   <tr key={index}>
//                     <td className="px-4 py-2 text-center">{sensor.name}</td>
//                     <td className="px-4 py-2 text-center">{sensor.aqhi_plus}</td>
//                     <td className="px-4 py-2 text-center">{sensor.distance.toFixed(2)}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
          
//           {/**FEM MONITORS */}
//           <div className="flex-1 bg-white rounded-lg shadow-md m-1 p-4 overflow-x-auto">
//             <h4 className="block text-med font-medium text-gray-700 text-center">Closest Agency (FEM) Monitors</h4>
//             <table className="min-w-full">
//               <thead>
//                 <tr>
//                   <th className="px-4 py-2 text-center border-b border-gray-300 text-white">Sensor ID</th>
//                   <th className="px-4 py-2 text-center border-b border-gray-300">PM2.5</th>
//                   <th className="px-4 py-2 text-center border-b border-gray-300">Distance (km)</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {nearest_FEM_Monitors.map((sensor, index) => (
//                   <tr key={index}>
//                     <td className="px-4 py-2 text-center">{}</td>
//                     <td className="px-4 py-2 text-center">{sensor.AQI}</td>
//                     <td className="px-4 py-2 text-center">{sensor.Latitude.toFixed(2)}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div> */}