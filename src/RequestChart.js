import React, { useState, useMemo, useEffect } from "react";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { Chart as ChartJS, TimeScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Tooltip, Legend, annotationPlugin);

const RequestChart = () => {
  const initialData = [
    { endpoint: "/home", time: "2023-10-08T02:18:17.735Z", requests: 2364, special: true },
    { endpoint: "/home", time: "2023-10-07T02:23:17.735Z", requests: 1132 },
    { endpoint: "/home", time: "2023-10-06T02:03:17.735Z", requests: 3433, special: true },
    { endpoint: "/product", time: "2023-10-07T02:13:17.735Z", requests: 1563 },
    { endpoint: "/product", time: "2023-10-06T02:12:17.735Z", requests: 1563 },
    { endpoint: "/contact", time: "2023-10-07T02:13:17.735Z", requests: 2298, special: true },
    { endpoint: "/product", time: "2023-10-08T02:17:17.735Z", requests: 3198, special: true },
    { endpoint: "/contact", time: "2023-10-08T02:13:17.735Z", requests: 1950, special: true },
    { endpoint: "/contact", time: "2023-10-06T02:01:17.735Z", requests: 2800 },
  ];

  const [data, setData] = useState(initialData);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEndpoints, setSelectedEndpoints] = useState([]);
  const [minRequests, setMinRequests] = useState(0);
  const [loading, setLoading] = useState(false);
  const [colorScheme, setColorScheme] = useState({ default: "blue", special: "green" });
  const [currentPage, setCurrentPage] = useState(1);
  const dataPerPage = 10;

  useEffect(() => {
    const interval = setInterval(() => {
      const newData = {
        endpoint: "/home",
        time: new Date().toISOString(),
        requests: Math.floor(Math.random() * 3000),
        special: Math.random() < 0.2,
      };
      setData((prevData) => [...prevData, newData]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleExport = () => {
    const csvData = filteredData.map(({ endpoint, time, requests }) => ({
      endpoint,
      time: new Date(time).toISOString(),
      requests,
    }));
    const csvString = [
      ["Endpoint", "Time", "Requests"],
      ...csvData.map((item) => [item.endpoint, item.time, item.requests]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvString], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "request-data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEndpointChange = (e) => {
    const { value, checked } = e.target;
    setSelectedEndpoints((prev) =>
      checked ? [...prev, value] : prev.filter((endpoint) => endpoint !== value)
    );
  };

  const handleColorChange = (colorType, newColor) => {
    setColorScheme((prevScheme) => ({
      ...prevScheme,
      [colorType]: newColor,
    }));
  };

  const filteredData = useMemo(() => {
    setLoading(true);
    const filtered = data.filter((d) => {
      const time = new Date(d.time).getTime();
      const startTime = startDate ? new Date(startDate).getTime() : -Infinity;
      const endTime = endDate ? new Date(endDate).getTime() : Infinity;
      return (
        time >= startTime &&
        time <= endTime &&
        d.requests >= minRequests &&
        (!selectedEndpoints.length || selectedEndpoints.includes(d.endpoint))
      );
    });
    setLoading(false);
    return filtered;
  }, [data, startDate, endDate, minRequests, selectedEndpoints]);

  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * dataPerPage;
    const endIdx = startIdx + dataPerPage;
    return filteredData.slice(startIdx, endIdx);
  }, [filteredData, currentPage]);

  const groupedData = useMemo(() => {
    return paginatedData.reduce((acc, cur) => {
      const color = cur.special ? colorScheme.special : colorScheme.default;
      if (!acc[cur.endpoint]) {
        acc[cur.endpoint] = { label: cur.endpoint, data: [], borderColor: color, fill: false };
      }
      acc[cur.endpoint].data.push({ x: new Date(cur.time), y: cur.requests });
      return acc;
    }, {});
  }, [paginatedData, colorScheme]);

  const chartData = {
    datasets: Object.values(groupedData),
  };

  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        type: "time",
        time: {
          unit: "day",
        },
        title: {
          display: true,
          text: "Date/Time",
        },
      },
      y: {
        title: {
          display: true,
          text: "Number of Requests",
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (tooltipItem) => `Endpoint: ${tooltipItem.dataset.label}, Time: ${tooltipItem.label}, Requests: ${tooltipItem.raw.y}`,
        },
      },
      annotation: {
        annotations: [
          {
            type: "line",
            mode: "vertical",
            scaleID: "x",
            value: "2023-10-08",
            borderColor: "red",
            borderWidth: 2,
            label: {
              content: "Spike Event",
              enabled: true,
              position: "top",
            },
          },
        ],
      },
    },
  };

  return (
    <div>
      <div id="filters" style={{ display: "flex", justifyContent: "space-around", marginBottom: "20px" }}>
        <div>
          <label htmlFor="start">Start Date: </label>
          <input type="datetime-local" id="start" onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label htmlFor="end">End Date: </label>
          <input type="datetime-local" id="end" onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div>
          <label htmlFor="endpoint">Endpoint: </label>
          <div>
            <input type="checkbox" value="/home" onChange={handleEndpointChange} /> /home
            <input type="checkbox" value="/product" onChange={handleEndpointChange} /> /product
            <input type="checkbox" value="/contact" onChange={handleEndpointChange} /> /contact
          </div>
        </div>
        <div>
          <label htmlFor="minRequests">Min Requests: </label>
          <input
            type="number"
            id="minRequests"
            value={minRequests}
            onChange={(e) => setMinRequests(parseInt(e.target.value))}
          />
        </div>
        <div>
          <label>Default Color: </label>
          <input
            type="color"
            value={colorScheme.default}
            onChange={(e) => handleColorChange("default", e.target.value)}
          />
        </div>
        <div>
          <label>Special Color: </label>
          <input
            type="color"
            value={colorScheme.special}
            onChange={(e) => handleColorChange("special", e.target.value)}
          />
        </div>
        <div>
          <button onClick={handleExport}>Export as CSV</button>
        </div>
      </div>

      {loading ? <p>Loading...</p> : <Line data={chartData} options={chartOptions} />}

      <div>
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>Previous</button>
        <button onClick={() => setCurrentPage((prev) => prev + 1)}>Next</button>
      </div>
    </div>
  );
};

export default RequestChart;
