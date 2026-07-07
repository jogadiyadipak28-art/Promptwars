const STADIUMS = [
  {
    id: 'metlife',
    name: 'MetLife Stadium',
    city: 'East Rutherford, NJ',
    country: 'USA',
    capacity: 82500,
    gates: ['A', 'B', 'C', 'D', 'E', 'F'],
    facilities: {
      medicalStations: ['Gate A Level 1', 'Gate C Level 2', 'Gate E Level 1'],
      familyZones: ['Section 101', 'Section 220'],
      accessibleEntrances: ['Gate A', 'Gate D'],
      concessions: 48,
      restrooms: 36,
      prayerRooms: ['Level 2 East', 'Level 3 West'],
      firstAid: ['Northeast Corner', 'Southwest Corner']
    },
    transportation: {
      subway: ['NJ Transit Meadowlands Line – Direct Service'],
      bus: ['Routes 351, 355, 190 from Port Authority'],
      parking: ['Lots A-F', 'Remote Lot P (shuttle)'],
      rideshare: 'Rideshare drop-off: Yellow Lot'
    },
    sections: { lower: '100s', club: '200s', upper: '300s' }
  },
  {
    id: 'atandt',
    name: 'AT&T Stadium',
    city: 'Arlington, TX',
    country: 'USA',
    capacity: 80000,
    gates: ['A', 'B', 'C', 'D'],
    facilities: {
      medicalStations: ['Gate A', 'Gate C'],
      familyZones: ['Section 108', 'Section 210'],
      accessibleEntrances: ['Gate B', 'Gate D'],
      concessions: 52,
      restrooms: 40,
      prayerRooms: ['Level 1 South'],
      firstAid: ['North End Zone', 'South End Zone']
    },
    transportation: {
      subway: ['Trinity Railway Express – CentrePort/DFW Station'],
      bus: ['Arlington trolley from downtown'],
      parking: ['Lots 1-8', 'Remote Lot R (shuttle)'],
      rideshare: 'Rideshare drop-off: Lot 7'
    },
    sections: { lower: '100s', club: '200s', upper: '300s' }
  },
  {
    id: 'sofi',
    name: 'SoFi Stadium',
    city: 'Inglewood, CA',
    country: 'USA',
    capacity: 70240,
    gates: ['North', 'South', 'East', 'West'],
    facilities: {
      medicalStations: ['North Gate', 'South Gate'],
      familyZones: ['Section 121', 'Section 215'],
      accessibleEntrances: ['North Gate', 'West Gate'],
      concessions: 55,
      restrooms: 38,
      prayerRooms: ['Level 2 West'],
      firstAid: ['North Plaza', 'South Plaza']
    },
    transportation: {
      subway: ['Metro C Line – Hawthorne/Lennox Station + shuttle'],
      bus: ['LAX Shuttle connecting routes'],
      parking: ['Lots A-L', 'Remote Lot M (shuttle)'],
      rideshare: 'Rideshare drop-off: Lot C'
    },
    sections: { lower: '100s', club: '200s', upper: '300s' }
  },
  {
    id: 'azteca',
    name: 'Estadio Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    capacity: 87523,
    gates: ['Norte', 'Sur', 'Este', 'Oeste'],
    facilities: {
      medicalStations: ['Puerta Norte', 'Puerta Sur'],
      familyZones: ['Sección 102', 'Sección 205'],
      accessibleEntrances: ['Puerta Norte', 'Puerta Oeste'],
      concessions: 60,
      restrooms: 44,
      prayerRooms: ['Nivel 2 Este'],
      firstAid: ['Plaza Norte', 'Plaza Sur']
    },
    transportation: {
      subway: ['Metro Línea 2 – Tasqueña + autobús', 'Metro Línea 8 – Estadio Azteca (directo)'],
      bus: ['Metrobús Línea 4'],
      parking: ['Estacionamiento A-F'],
      rideshare: 'Zona de rideshare: Puerta Sur'
    },
    sections: { lower: 'Numerado Inferior', club: 'Palcos', upper: 'Numerado Superior' }
  },
  {
    id: 'bcplace',
    name: 'BC Place',
    city: 'Vancouver',
    country: 'Canada',
    capacity: 54500,
    gates: ['Gate A', 'Gate B', 'Gate C', 'Gate D'],
    facilities: {
      medicalStations: ['Gate A Level 1', 'Gate C Level 2'],
      familyZones: ['Section 215', 'Section 305'],
      accessibleEntrances: ['Gate A', 'Gate B'],
      concessions: 35,
      restrooms: 28,
      prayerRooms: ['Level 3 North'],
      firstAid: ['East Plaza', 'West Plaza']
    },
    transportation: {
      subway: ['SkyTrain – Stadium-Chinatown Station (2 min walk)'],
      bus: ['Multiple downtown routes'],
      parking: ['Impark Lot 88', 'Pacific Centre Parkade'],
      rideshare: 'Rideshare drop-off: Beatty Street'
    },
    sections: { lower: '200s', club: 'Suite Level', upper: '300s' }
  }
];

const CROWD_DATA = {
  metlife: { currentOccupancy: 67800, capacity: 82500, hotspots: ['Gate C', 'Section 112', 'Main Concourse East'], waitTimes: { 'Gate A': 8, 'Gate B': 12, 'Gate C': 22, 'Gate D': 6, 'Gate E': 15, 'Gate F': 9 } },
  atandt: { currentOccupancy: 71200, capacity: 80000, hotspots: ['Gate B', 'Section 108', 'Plaza Level West'], waitTimes: { 'Gate A': 5, 'Gate B': 18, 'Gate C': 11, 'Gate D': 14 } },
  sofi: { currentOccupancy: 58900, capacity: 70240, hotspots: ['South Gate', 'Section 121'], waitTimes: { 'North': 7, 'South': 20, 'East': 9, 'West': 6 } },
  azteca: { currentOccupancy: 81000, capacity: 87523, hotspots: ['Puerta Sur', 'Sección 115'], waitTimes: { 'Norte': 10, 'Sur': 25, 'Este': 12, 'Oeste': 8 } },
  bcplace: { currentOccupancy: 49000, capacity: 54500, hotspots: ['Gate B', 'Section 220'], waitTimes: { 'Gate A': 9, 'Gate B': 16, 'Gate C': 7, 'Gate D': 11 } }
};

const MATCHES = [
  { id: 'm1', stadium: 'metlife', home: 'Brazil', away: 'Argentina', date: '2026-06-14', time: '20:00', group: 'Group C', matchday: 1 },
  { id: 'm2', stadium: 'atandt', home: 'France', away: 'Germany', date: '2026-06-15', time: '17:00', group: 'Group D', matchday: 1 },
  { id: 'm3', stadium: 'sofi', home: 'Spain', away: 'Portugal', date: '2026-06-16', time: '20:00', group: 'Group E', matchday: 1 },
  { id: 'm4', stadium: 'azteca', home: 'Mexico', away: 'USA', date: '2026-06-17', time: '19:00', group: 'Group B', matchday: 1 },
  { id: 'm5', stadium: 'bcplace', home: 'Canada', away: 'Morocco', date: '2026-06-18', time: '16:00', group: 'Group F', matchday: 1 }
];

module.exports = { STADIUMS, CROWD_DATA, MATCHES };
