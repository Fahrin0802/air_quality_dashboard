// This component covers Functional Requirements 11, 12, 13
import React, { useEffect, useRef, useState } from 'react';
import type { loader } from "~/root";
import { getColorRGB } from './leaflet-utils';
import { useRouteLoaderData } from "@remix-run/react";
import * as d3 from 'd3';

// Used to retrive the hidden API keys
declare var process : {
    env: {
        Apim_Key: string,
        Maps_key: string,
        PurpleAir_Key: string
    }
}

// Declares what the plot component should recieve as input
interface PlotProps {
    show: boolean;
    sensorId: number | null;
    onClose: () => void;
}

const Plot: React.FC<PlotProps> = ({ show, sensorId, onClose }) => {
    const d3Container = useRef(null);
    const [plotData, setPlotData] = useState([]);
    const [timeRange, setTimeRange] = useState('week');

    // Loading the environment variable holding the keys 
    const data = useRouteLoaderData<typeof loader>("root")!;
    const env = data?.env;

    // Used to track mouse movement
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ left: 10, bottom: 50 });
    const dragItem = useRef();
    const dragStart = useRef();
    const minLeft = 10; 
    const maxLeft = window.innerWidth - 540; 
    const minBottom = 50; 
    const maxBottom = window.innerHeight - 625;

    // Tracks when the user clicks on the title
    const onMouseDown = (e) => {
        setIsDragging(true);
        dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            left: position.left,
            bottom: position.bottom,
        };
        dragItem.current = e.currentTarget.parentElement;
        e.preventDefault();
    };

    // Tracks when the user moves the mouse 
    const onMouseMove = (e) => {
        if (isDragging && dragItem.current) {
            const currentX = e.clientX;
            const currentY = e.clientY;
            const dx = currentX - dragStart.current.x;
            const dy = currentY - dragStart.current.y;

            // Checking if constraints are violated
            const newLeft = Math.min(Math.max(dragStart.current.left + dx, minLeft), maxLeft);
            const newBottom = Math.min(Math.max(dragStart.current.bottom - dy, minBottom), maxBottom);

            setPosition({
                left: newLeft,
                bottom: newBottom,
            });
        }
    };

    // Tracks when the user lets go of the mouse button
    const onMouseUp = () => {
        setIsDragging(false);
    };

    // Adding listeners to track mouse movements once the dragging is detected
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        } else {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging]);

    /* FR13 - Update.Senor.Plot - The system shall be able to update the plot to match the new time frame selected by the user. */
    useEffect(() => {
        // Defining the start and end dates of the data
        const endDate = new Date();
        const startDate = new Date();
        let average = 10;
        switch(timeRange) {
            case 'hour':
                startDate.setHours(endDate.getHours() - 1);
                break;
            case 'day':
                startDate.setDate(endDate.getDate() - 1);
                average = 30;
                break;
            case 'week':
                startDate.setDate(endDate.getDate() - 7);
                average = 60;
                break;
            case 'month':
                startDate.setMonth(endDate.getMonth() - 1);
                average = 360;
                break;
        }
        const start_timestamp = Math.floor(startDate.getTime() / 1000);
        const end_timestamp = Math.floor(endDate.getTime() / 1000);

        /* FR11 - Fetch.Past.Sensor.Data- The system shall retrieve the past data for a sensor using the PurpleAir API 
            when the user chooses to visualize PM2.5 readings of a specific sensor over a specified time interval */
        const fetchData = async (sensorId) => {
            const apiKey = env.PurpleAir_Key;
            const url = `https://api.purpleair.com/v1/sensors/${sensorId}/history?average=${average}&fields=pm2.5_atm&start_timestamp=${start_timestamp}&end_timestamp=${end_timestamp}`;

            try {
                const response = await fetch(url, {
                    headers: new Headers({ 'X-API-Key': apiKey })
                });
                if (response.ok) {
                    const json = await response.json();
                    setPlotData(json.data); 
                    console.log(plotData)
                } else {
                    console.error('API call failed:', response);
                }
            } catch (error) {
                console.error('Fetch error:', error);
            }
        };

        if (show && sensorId !== null) {
            fetchData(sensorId);
        }
    }, [show, sensorId, timeRange]);

    /* FR12 - Display.Sensor.Plot - The system shall be able to display a plot using D3.js to visualize PM2.5 readings of a specific sensor over a specified time interval. */
    useEffect(() => {
        if (show && d3Container.current) {
            // Set the dimensions and margins of the graph
            const margin = { top: 10, right: 30, bottom: 30, left: 60 },
                width = 400 - margin.left - margin.right,
                height = 250 - margin.top - margin.bottom;

            // Remove any existing svg
            d3.select(d3Container.current).select('*').remove();

            // Append the svg object to the plot container
            const svg = d3.select(d3Container.current)
                .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            // Parse the time and set the ranges
            const x = d3.scaleTime().range([0, width]);
            const y = d3.scaleLinear().range([height, 0]);

            // Format the purpleair API data
            const data = plotData.map(d => ({
                date: new Date(d[0] * 1000), 
                value: d[1]
            })).sort((a, b) => a.date - b.date);

            // Scale the range of the data
            x.domain(d3.extent(data, d => d.date)) 
            y.domain([0, d3.max(data, d => d.value)])

            // Add the scatterplot points with their respective color
            svg.selectAll("dot")
                .data(data)
                .enter().append("circle")
                .attr("r", 3.5)
                .attr("cx", d => x(d.date))
                .attr("cy", d => y(d.value))
                .style("fill", d => getColorRGB(Math.ceil(d.value / 10)));

            svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "black")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                  .x(function(d) { return x(d.date) })
                  .y(function(d) { return y(d.value) })
                  )

            // Add X axis, modiying the range based on the chosen time interval
            switch(timeRange) {
                case 'week':
                    const pastWeek = d3.timeDays(d3.timeDay.offset(new Date(), -7), new Date());
                    svg.append('g')
                        .attr('transform', `translate(0,${height})`)
                        .call(d3.axisBottom(x).tickValues(pastWeek).tickFormat(d3.timeFormat("%b %d")));
                    break;
                case 'month':
                    const pastMonth = d3.timeDays(d3.timeDay.offset(new Date(), -30), new Date()).filter(d => d.getDate() % 4 === 0);
                    svg.append('g')
                        .attr('transform', `translate(0,${height})`)
                        .call(d3.axisBottom(x).tickValues(pastMonth).tickFormat(d3.timeFormat("%b %d")));
                    break;
                default:
                    svg.append('g')
                        .attr('transform', `translate(0,${height})`)
                        .call(d3.axisBottom(x));
            }

            // Add Y axis
            svg.append('g')
                .call(d3.axisLeft(y));

            // Add Y axis label
            svg.append('text')
                .attr('text-anchor', 'end')
                .attr('transform', 'rotate(-90)')
                .attr('y', -38)
                .attr('x', -10)
                .html('<tspan font-size="15px">PM<tspan baseline-shift="sub" font-size="10px">2.5</tspan> Concentration (μgm<tspan baseline-shift="super" font-size="10px">-3</tspan>)</tspan>')
      }
    }, [show, d3Container.current, plotData]);

    // Hide the plot if the user clicks X
    if (!show) {
        return null;
    }

    return (
        <div className="leaflet-touch leaflet-bar leaflet-control" 
            style={{
                width: '390px',
                height: '315px',
                backgroundColor: 'white',
                border: '1px solid #D1D5DB',
                position: 'absolute',
                bottom: `${position.bottom}px`,
                left: `${position.left}px`,
                zIndex: 1000,
            }}>

            {/* The Time Interval Selection */}
            <div style={{ 
                    width: '100%', 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    zIndex: 10, 
                    margin: '3px', 
                    textAlign: 'center' 
                }}>
                <label>
                    Time range:
                    <select style={{ 
                                padding: '2px 4px', 
                                margin: '0px 0px 0px 3px', 
                                width: '85px', 
                                height: '26px', 
                                fontSize: '16px' 
                            }} 
                            value={timeRange} 
                            onChange={e => setTimeRange(e.target.value)}>
                    <option value="hour">Hour</option>
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    </select>
                </label>
            </div>

            {/* The Close button */}
            <button 
                onClick={onClose}
                style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: '#ffcccb',
                border: 'none',
                cursor: 'pointer',
                padding: '0px 5px',
            }}>
                X
            </button>

            {/* The plot title */}
            {sensorId !== null && (
                <div onMouseDown={onMouseDown}
                    style={{
                        cursor: 'grab',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                }}>
                Concentration of Sensor {sensorId}
                </div>
            )}

            {/* The plot */}
            <div ref={d3Container} />
        </div>
    );
};

export default Plot;