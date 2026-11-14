// Colombo bus routes, as supplied by the project owner: route number, the two terminals and the stops in running order.
// Stop names are looked up in places.json (written by scripts/geocode-places.js) to get coordinates.
// These are PROVISIONAL: the pilot route (138) is replaced with the stops the owner notes while riding it, and the other
// routes are for a realistic map and route list, not for ETA evaluation.

// Where a place name is too ambiguous to search as-is, this says what to search for instead.
const SEARCH_AS = {
  Fort: 'Colombo Fort railway station',
  Pettah: 'Pettah market, Colombo',
  'Dharmapala Mawatha': 'Dharmapala Mawatha, Colombo 07',
  'Lake House': 'Lake House, Colombo',
  'Town Hall': 'Colombo Town Hall',
  'Galle Face': 'Galle Face Green',
  'Slave Island': 'Slave Island, Colombo',
  Kollupitiya: 'Kollupitiya, Colombo',
  Bambalapitiya: 'Bambalapitiya, Colombo',
  Wellawatta: 'Wellawatta, Colombo',
  Borella: 'Borella, Colombo',
  'Punchi Borella': 'Punchi Borella, Colombo',
  Maradana: 'Maradana, Colombo',
  'Technical College Junction': 'Technical Junction, Maradana',
  'Kanatta Junction': 'Kanatte Junction, Borella',
  Narahenpita: 'Narahenpita, Colombo',
  Kotahena: 'Kotahena, Colombo',
  Kochchikade: 'Kochchikade, Colombo',
  'Jubilee Post': 'Jubilee Post, Nugegoda',
  'Ratmalana Airport': 'Ratmalana Airport',
  'Katunayake Airport': 'Bandaranaike International Airport',
  'Makumbura Multimodal Centre': 'Makumbura Multimodal Transport Hub',
  'Apeksha Hospital': 'Apeksha Hospital, Maharagama',
  'Kelaniya Campus': 'University of Kelaniya',
  'Dehiwala Main Bus Stop': 'Dehiwala Junction',
  Welikada: 'Welikada, Rajagiriya',
  Wattala: 'Wattala, Gampaha',
  'New Kelani Bridge': 'New Kelani Bridge',
};

const ROUTES = [
  { number: '100', start: 'Panadura', end: 'Pettah', stops: ['Panadura', 'Walana', 'Keselwatta', 'Moratuwa', 'Ratmalana', 'Mount Lavinia', 'Dehiwala', 'Wellawatta', 'Bambalapitiya', 'Kollupitiya', 'Galle Face', 'Fort', 'Pettah'] },
  { number: '101', start: 'Moratuwa', end: 'Pettah', stops: ['Moratuwa', 'Ratmalana', 'Mount Lavinia', 'Dehiwala', 'Wellawatta', 'Bambalapitiya', 'Kollupitiya', 'Slave Island', 'Lake House', 'Fort', 'Pettah'] },
  { number: '102', start: 'Moratuwa', end: 'Kotahena', stops: ['Moratuwa', 'Ratmalana', 'Mount Lavinia', 'Dehiwala', 'Wellawatta', 'Bambalapitiya', 'Kollupitiya', 'Galle Face', 'Fort', 'Kochchikade', 'Kotahena'] },
  { number: '103', start: 'Narahenpita', end: 'Pettah', stops: ['Narahenpita', 'Kanatta Junction', 'Borella', 'Punchi Borella', 'Maradana', 'Technical College Junction', 'Fort', 'Pettah'] },
  { number: '104', start: 'Ja-Ela', end: 'Bambalapitiya', stops: ['Ja-Ela', 'Wattala', 'Peliyagoda', 'New Kelani Bridge', 'Orugodawatta', 'Dematagoda', 'Borella', 'Kanatta Junction', 'Bauddhaloka Mawatha', 'Thummulla', 'Bambalapitiya'] },
  { number: '107', start: 'Elakanda', end: 'Pettah', stops: ['Elakanda', 'Wattala', 'Peliyagoda', 'Bloemendhal', 'Pettah', 'Fort'] },
  { number: '112', start: 'Maharagama', end: 'Kotahena', stops: ['Maharagama', 'Navinna', 'Delkanda', 'Nugegoda', 'Kirillapone', 'Havelock Town', 'Dickmans Road', 'Bambalapitiya', 'Kollupitiya', 'Galle Face', 'Fort', 'Kotahena'] },
  { number: '117', start: 'Ratmalana Airport', end: 'Beddagana', stops: ['Ratmalana Airport', 'Karagampitiya', 'Dehiwala', 'Kalubowila', 'Kohuwala', 'Nugegoda', 'Jubilee Post', 'Pitakotte', 'Beddagana'] },
  { number: '119', start: 'Dehiwala', end: 'Maharagama', stops: ['Dehiwala Main Bus Stop', 'Karagampitiya', 'Nedimala', 'Bellanvila', 'Boralesgamuwa', 'Maharagama'] },
  { number: '120', start: 'Pettah', end: 'Kesbewa', stops: ['Pettah', 'Fort', 'Town Hall', 'Ibbanwala', 'Darley Road', 'Lake House', 'Havelock Town', 'Kirillapone', 'Nugegoda', 'Delkanda', 'Boralesgamuwa', 'Piliyandala', 'Kesbewa'] },
  { number: '122', start: 'Pettah', end: 'Avissawella', stops: ['Pettah', 'Fort', 'Nugegoda', 'Maharagama', 'Pannipitiya', 'Kottawa', 'Makumbura', 'Homagama', 'Meepe', 'Kosgama', 'Avissawella'] },
  { number: '125', start: 'Pettah', end: 'Ingiriya', stops: ['Pettah', 'Fort', 'Thimbirigasyaya', 'Nugegoda', 'Maharagama', 'Pannipitiya', 'Kottawa', 'Homagama', 'Godagama', 'Meegoda', 'Padukka', 'Ingiriya'] },
  { number: '135', start: 'Kelaniya', end: 'Kohuwala', stops: ['Kelaniya', 'Peliyagoda', 'New Kelani Bridge', 'Orugodawatta', 'Dematagoda', 'Borella', 'Narahenpita', 'Thimbirigasyaya', 'Havelock Town', 'Pamankada', 'Kohuwala'] },
  // The pilot route. The owner's list gave it as Pettah to Maharagama/Homagama with a muddled stop list; this is the
  // High Level Road corridor to Homagama. Replace the stops with the ones noted on the real ride.
  { number: '138', start: 'Pettah', end: 'Homagama', stops: ['Pettah', 'Fort', 'Town Hall', 'Borella', 'Narahenpita', 'Nugegoda', 'Maharagama', 'Pannipitiya', 'Kottawa', 'Homagama'] },
  { number: '140', start: 'Kollupitiya', end: 'Wellampitiya', stops: ['Kollupitiya', 'Dharmapala Mawatha', 'Town Hall', 'Norris Canal Road', 'Maradana', 'Dematagoda', 'Kolonnawa', 'Wellampitiya'] },
  { number: '141', start: 'Wellawatta', end: 'Narahenpita', stops: ['Wellawatta', 'W. A. Silva Mawatha', 'Pamankada', 'Kirillapone', 'Baseline Road', 'Narahenpita'] },
  { number: '143', start: 'Kotahena', end: 'Nugegoda', stops: ['Kotahena', 'Fort', 'Slave Island', 'Ward Place', 'Borella', 'Rajagiriya', 'Etul Kotte', 'Pita Kotte', 'Nugegoda'] },
  { number: '152', start: 'Fort', end: 'Angoda', stops: ['Fort', 'Pettah', 'Maradana', 'Borella', 'Baseline Road', 'Welikada', 'Rajagiriya', 'Angoda'] },
  { number: '154', start: 'Angulana', end: 'Kiribathgoda', stops: ['Angulana', 'Mount Lavinia', 'Dehiwala', 'Wellawatta', 'Bambalapitiya', 'Borella', 'Dematagoda', 'Peliyagoda', 'Kelaniya', 'Kiribathgoda'] },
  { number: '177', start: 'Kollupitiya', end: 'Kaduwela', stops: ['Kollupitiya', 'Town Hall', 'Borella', 'Rajagiriya', 'Battaramulla', 'Malabe', 'Kaduwela'] },
  { number: '187', start: 'Fort', end: 'Katunayake Airport', stops: ['Fort', 'Pettah', 'Peliyagoda', 'Wattala', 'Ja-Ela', 'Katunayake Airport'] },
  { number: '190', start: 'Fort', end: 'Meegoda', stops: ['Fort', 'Pettah', 'Town Hall', 'Borella', 'Rajagiriya', 'Battaramulla', 'Malabe', 'Athurugiriya', 'Godagama', 'Meegoda'] },
  { number: '260', start: 'Pettah', end: 'Hendala', stops: ['Pettah', 'Fort', 'Kochchikade', 'Mattakkuliya', 'Peliyagoda', 'Wattala', 'Elakanda', 'Hendala'] },
  { number: 'CM01', start: 'Makumbura', end: 'Pettah', stops: ['Makumbura Multimodal Centre', 'Kottawa', 'Battaramulla', 'Borella', 'Town Hall', 'Pettah'] },
  { number: 'CM03', start: 'Makumbura', end: 'Kadawatha', stops: ['Makumbura Multimodal Centre', 'Apeksha Hospital', 'Navinna', 'Narahenpita', 'Kelaniya Campus', 'Kadawatha'] },
];

// Points the map search could not find, set by hand (approximate, to be checked on the ride or against a map).
// Left out of the routes because no reliable point could be found: Bellanthota (119), Old Kelani Bridge (107), Ayurveda Junction (143, 177).
const MANUAL = {
  'Kanatta Junction': { lat: 6.912, lng: 79.8795, found: 'manual, approximate' },
  'Technical College Junction': { lat: 6.93235, lng: 79.85952, found: 'Maradana Technical College (nearest searchable point)' },
  Thummulla: { lat: 6.898, lng: 79.865, found: 'Thummulla Junction, manual, approximate' },
  'Dickmans Road': { lat: 6.88794, lng: 79.86374, found: 'Dr. Lester James Peiris Mawatha, Havelock Town' },
  'Makumbura Multimodal Centre': { lat: 6.83936, lng: 79.97285, found: 'taken from Makumbura, approximate' },
};

module.exports = { ROUTES, SEARCH_AS, MANUAL };
