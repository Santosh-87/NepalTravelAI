import os
import urllib.request
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from trips.models import TripTemplate


TRIP_DATA = [
    {
        "title": "Everest Base Camp Trek",
        "slug": "everest-base-camp-trek",
        "category": "trekking",
        "difficulty": "strenuous",
        "duration_days": 14,
        "best_season": "March-May, September-November",
        "max_altitude": 5364,
        "starting_price": 1400,
        "description": (
            "The Everest Base Camp Trek is the ultimate Himalayan adventure, taking you through the heart of the "
            "Khumbu region to the foot of the world's highest peak. This iconic journey follows the footsteps of "
            "legendary mountaineers Edmund Hillary and Tenzing Norgay through Sherpa villages, ancient monasteries, "
            "and breathtaking mountain scenery.\n\n"
            "Starting with a thrilling flight to Lukla, the trail winds through rhododendron forests, crosses "
            "suspension bridges over roaring rivers, and ascends through increasingly dramatic landscapes. Along "
            "the way, you'll experience the warm hospitality of the Sherpa people, visit the famous Tengboche "
            "Monastery, and witness sunrise over the Himalayas from Kala Patthar (5,545m).\n\n"
            "The trek offers unparalleled views of Everest, Lhotse, Nuptse, Ama Dablam, and dozens of other "
            "peaks exceeding 6,000 meters. Proper acclimatization days are built into the itinerary to ensure "
            "a safe and enjoyable experience."
        ),
        "highlights": [
            "Stand at Everest Base Camp (5,364m) beneath the Khumbu Icefall",
            "Sunrise panorama from Kala Patthar with views of Everest summit",
            "Visit Tengboche Monastery, the largest in the Khumbu region",
            "Scenic flight to and from Lukla airport",
            "Experience authentic Sherpa culture and hospitality",
            "Cross dramatic suspension bridges over deep gorges",
            "Explore Namche Bazaar, the gateway to Everest",
            "Walk through Sagarmatha National Park (UNESCO World Heritage Site)"
        ],
        "itinerary_days": [
            {"day": 1, "title": "Arrival in Kathmandu", "description": "Arrive at Tribhuvan International Airport. Transfer to hotel in Thamel. Trek briefing and gear check.", "altitude": "1,400m"},
            {"day": 2, "title": "Fly to Lukla, Trek to Phakding", "description": "Early morning scenic flight to Lukla (2,840m). Begin trek through Cheplung to Phakding along the Dudh Koshi river.", "altitude": "2,610m"},
            {"day": 3, "title": "Phakding to Namche Bazaar", "description": "Trek through pine forests, cross suspension bridges, and climb steeply to the Sherpa capital of Namche Bazaar.", "altitude": "3,440m"},
            {"day": 4, "title": "Acclimatization Day in Namche", "description": "Rest day for acclimatization. Optional hike to Everest View Hotel for first Everest views. Explore Namche market and Sherpa museum.", "altitude": "3,440m"},
            {"day": 5, "title": "Namche to Tengboche", "description": "Trek with stunning views of Everest, Lhotse, and Ama Dablam. Descend to Phunki Tenga and climb to Tengboche Monastery.", "altitude": "3,860m"},
            {"day": 6, "title": "Tengboche to Dingboche", "description": "Descend through rhododendron forest to Debuche, then continue to Pangboche and on to Dingboche in the Imja Khola valley.", "altitude": "4,410m"},
            {"day": 7, "title": "Acclimatization Day in Dingboche", "description": "Rest day with optional hike to Nagarjun Hill (5,100m) for panoramic views of Makalu, Lhotse, and Island Peak.", "altitude": "4,410m"},
            {"day": 8, "title": "Dingboche to Lobuche", "description": "Trek past Dughla and the memorials to fallen climbers. Continue along the lateral moraine of the Khumbu Glacier to Lobuche.", "altitude": "4,940m"},
            {"day": 9, "title": "Lobuche to Gorak Shep, Visit EBC", "description": "Trek to Gorak Shep, drop bags, and continue to Everest Base Camp. Stand beneath the mighty Khumbu Icefall.", "altitude": "5,364m"},
            {"day": 10, "title": "Gorak Shep to Kala Patthar, Descend to Pheriche", "description": "Pre-dawn hike to Kala Patthar (5,545m) for sunrise over Everest. Descend to Pheriche for the night.", "altitude": "4,280m"},
            {"day": 11, "title": "Pheriche to Namche Bazaar", "description": "Long descent retracing steps through Tengboche to Namche. Celebrate at a local lodge.", "altitude": "3,440m"},
            {"day": 12, "title": "Namche to Lukla", "description": "Final day of trekking. Descend through forests and villages back to Lukla. Farewell dinner.", "altitude": "2,840m"},
            {"day": 13, "title": "Fly Lukla to Kathmandu", "description": "Morning flight back to Kathmandu. Free afternoon for shopping or sightseeing. Farewell dinner.", "altitude": "1,400m"},
            {"day": 14, "title": "Departure from Kathmandu", "description": "Transfer to airport for departure or extend your stay to explore Kathmandu Valley.", "altitude": "1,400m"}
        ],
        "included_services": [
            "Airport transfers in Kathmandu",
            "3 nights hotel in Kathmandu with breakfast",
            "Domestic flights: Kathmandu-Lukla-Kathmandu",
            "Experienced English-speaking trekking guide",
            "Porter service (1 porter per 2 trekkers)",
            "All lodge accommodation during trek",
            "Three meals per day during trek",
            "Sagarmatha National Park permit",
            "TIMS (Trekkers Information Management System) card",
            "First aid medical kit"
        ],
        "excluded_services": [
            "International airfare",
            "Nepal visa fees",
            "Travel insurance (mandatory)",
            "Personal trekking gear and equipment",
            "Tips for guide and porters",
            "Alcoholic and cold beverages during trek"
        ],
        "image_url": "https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?w=800&q=80"
    },
    {
        "title": "Annapurna Circuit Trek",
        "slug": "annapurna-circuit-trek",
        "category": "trekking",
        "difficulty": "challenging",
        "duration_days": 18,
        "best_season": "March-May, October-November",
        "max_altitude": 5416,
        "starting_price": 1200,
        "description": (
            "The Annapurna Circuit is widely regarded as one of the greatest long-distance treks in the world. "
            "This epic journey circumnavigates the entire Annapurna massif, crossing the legendary Thorong La Pass "
            "at 5,416 meters — one of the highest trekking passes on Earth.\n\n"
            "The trek showcases Nepal's extraordinary diversity, from subtropical lowlands and terraced rice paddies "
            "to alpine meadows, arid high-altitude deserts, and towering ice-capped peaks. You'll pass through "
            "villages of distinct ethnic groups including Gurung, Manangi, and Thakali communities, each with "
            "unique traditions, architecture, and cuisine.\n\n"
            "Highlights include the natural hot springs at Tatopani, the stunning turquoise waters of Tilicho Lake, "
            "the medieval town of Manang, and the sacred temple at Muktinath. The circuit offers an unmatched "
            "combination of natural beauty, cultural richness, and physical challenge."
        ),
        "highlights": [
            "Cross Thorong La Pass (5,416m), one of the world's highest trekking passes",
            "Diverse landscapes from subtropical forests to high-altitude desert",
            "Visit the sacred Muktinath Temple (3,800m)",
            "Soak in natural hot springs at Tatopani",
            "Experience Gurung, Manangi, and Thakali cultures",
            "Panoramic views of Annapurna, Dhaulagiri, and Manaslu ranges",
            "Optional side trip to Tilicho Lake (4,919m)"
        ],
        "itinerary_days": [
            {"day": 1, "title": "Kathmandu to Besisahar", "description": "Drive from Kathmandu to Besisahar, the starting point of the Annapurna Circuit. Scenic drive through the middle hills.", "altitude": "760m"},
            {"day": 2, "title": "Besisahar to Chame", "description": "Drive and trek through Tal, Dharapani to Chame, the district headquarters of Manang. Views of Annapurna II and Lamjung Himal.", "altitude": "2,670m"},
            {"day": 3, "title": "Chame to Upper Pisang", "description": "Trek through dense pine and fir forests with dramatic rock faces. First views of the Annapurna range emerge.", "altitude": "3,300m"},
            {"day": 4, "title": "Upper Pisang to Manang", "description": "Trek the high route through Ghyaru and Ngawal with stunning views. Descend to medieval Manang town.", "altitude": "3,540m"},
            {"day": 5, "title": "Acclimatization in Manang", "description": "Rest day with optional hike to Gangapurna Lake or Ice Lake (4,600m). Attend the Himalayan Rescue Association talk.", "altitude": "3,540m"},
            {"day": 6, "title": "Manang to Yak Kharka", "description": "Gradual ascent along the Marshyangdi valley. Vegetation thins out as altitude increases.", "altitude": "4,018m"},
            {"day": 7, "title": "Yak Kharka to Thorong Phedi", "description": "Short but steep climb to the base camp for Thorong La Pass crossing. Early rest for pre-dawn start.", "altitude": "4,525m"},
            {"day": 8, "title": "Cross Thorong La to Muktinath", "description": "Pre-dawn start for the pass crossing. Steep climb to Thorong La (5,416m) then long descent to sacred Muktinath.", "altitude": "3,800m"},
            {"day": 9, "title": "Muktinath to Jomsom", "description": "Visit Muktinath Temple. Descend through Kagbeni and the Kali Gandaki gorge, the world's deepest, to Jomsom.", "altitude": "2,720m"},
            {"day": 10, "title": "Jomsom to Tatopani", "description": "Continue down the Kali Gandaki valley through apple orchards of Marpha and Tukuche to Tatopani hot springs.", "altitude": "1,190m"},
            {"day": 11, "title": "Tatopani to Ghorepani", "description": "Steep ascent through terraced fields and rhododendron forests to the ridge village of Ghorepani.", "altitude": "2,860m"},
            {"day": 12, "title": "Poon Hill Sunrise, Trek to Tadapani", "description": "Pre-dawn hike to Poon Hill (3,210m) for panoramic sunrise views. Continue through forests to Tadapani.", "altitude": "2,630m"},
            {"day": 13, "title": "Tadapani to Ghandruk", "description": "Descend through beautiful rhododendron and oak forests to the traditional Gurung village of Ghandruk.", "altitude": "1,940m"},
            {"day": 14, "title": "Ghandruk to Nayapul, Drive to Pokhara", "description": "Final descent to Nayapul and drive to the lakeside city of Pokhara. Celebrate at a lakeside restaurant.", "altitude": "820m"},
            {"day": 15, "title": "Free Day in Pokhara", "description": "Explore Pokhara: visit World Peace Pagoda, Davis Falls, Phewa Lake boating, and the International Mountain Museum.", "altitude": "820m"},
            {"day": 16, "title": "Pokhara to Kathmandu", "description": "Scenic drive or flight back to Kathmandu. Free afternoon for last-minute shopping.", "altitude": "1,400m"},
            {"day": 17, "title": "Kathmandu Sightseeing", "description": "Full-day tour: Swayambhunath (Monkey Temple), Boudhanath Stupa, Pashupatinath Temple, Kathmandu Durbar Square.", "altitude": "1,400m"},
            {"day": 18, "title": "Departure", "description": "Transfer to Tribhuvan International Airport for departure.", "altitude": "1,400m"}
        ],
        "included_services": [
            "Airport transfers",
            "Hotel accommodation in Kathmandu and Pokhara",
            "Ground transportation as per itinerary",
            "Experienced licensed trekking guide",
            "Porter service",
            "Lodge accommodation during trek",
            "Three meals per day on trek",
            "Annapurna Conservation Area permit",
            "TIMS card",
            "Kathmandu sightseeing tour with guide"
        ],
        "excluded_services": [
            "International flights",
            "Nepal visa",
            "Travel insurance",
            "Personal gear",
            "Tips and gratuities",
            "Extra meals in Kathmandu and Pokhara"
        ],
        "image_url": "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=800&q=80"
    },
    {
        "title": "Kathmandu Valley Cultural Tour",
        "slug": "kathmandu-valley-cultural-tour",
        "category": "cultural",
        "difficulty": "easy",
        "duration_days": 4,
        "best_season": "Year-round (best October-April)",
        "max_altitude": 1400,
        "starting_price": 350,
        "description": (
            "Immerse yourself in the living heritage of the Kathmandu Valley, home to seven UNESCO World Heritage "
            "Sites and centuries of Newar civilization. This cultural tour reveals the artistic and spiritual "
            "treasures of three ancient kingdoms — Kathmandu, Patan, and Bhaktapur.\n\n"
            "Explore intricately carved wooden temples, golden-roofed pagodas, and bustling bazaars where "
            "traditions dating back over a thousand years continue to thrive. Watch master craftsmen create "
            "bronze statues using lost-wax techniques, and witness elaborate Hindu and Buddhist rituals at "
            "sacred sites.\n\n"
            "From the all-seeing eyes of Boudhanath Stupa to the cremation ghats of Pashupatinath, from the "
            "medieval streets of Bhaktapur to the artistic splendor of Patan, this tour offers an unforgettable "
            "journey through Nepal's rich cultural tapestry."
        ),
        "highlights": [
            "Visit seven UNESCO World Heritage Sites in the Kathmandu Valley",
            "Explore the medieval city of Bhaktapur with its pottery squares",
            "Witness evening aarti ceremony at Pashupatinath Temple",
            "Walk the ancient streets of Patan Durbar Square",
            "Experience the spiritual ambiance of Boudhanath Stupa",
            "Enjoy traditional Newari cuisine"
        ],
        "itinerary_days": [
            {"day": 1, "title": "Kathmandu Heritage Sites", "description": "Visit Kathmandu Durbar Square, Swayambhunath (Monkey Temple), and Thamel bazaar. Evening welcome dinner with cultural show.", "altitude": "1,400m"},
            {"day": 2, "title": "Patan and Boudhanath", "description": "Morning exploration of Patan Durbar Square and Golden Temple. Afternoon at Boudhanath Stupa. Visit a Thangka painting school.", "altitude": "1,400m"},
            {"day": 3, "title": "Bhaktapur Full Day", "description": "Full day in Bhaktapur: 55-Window Palace, Nyatapola Temple, Pottery Square, Peacock Window. Try local juju dhau (king of yogurt).", "altitude": "1,400m"},
            {"day": 4, "title": "Pashupatinath and Departure", "description": "Morning visit to Pashupatinath Temple and cremation ghats. Budhanilkantha Temple. Transfer to airport.", "altitude": "1,400m"}
        ],
        "included_services": [
            "Airport transfers",
            "3 nights hotel accommodation with breakfast",
            "Professional cultural guide",
            "Private vehicle for all sightseeing",
            "All monument entrance fees",
            "Welcome and farewell dinners",
            "Traditional cultural show",
            "Thangka painting school visit"
        ],
        "excluded_services": [
            "International flights",
            "Nepal visa",
            "Travel insurance",
            "Lunch and other meals",
            "Tips and gratuities",
            "Personal expenses and shopping"
        ],
        "image_url": "https://images.unsplash.com/photo-1558799401-1dcba79834c2?w=800&q=80"
    },
    {
        "title": "Pokhara Adventure Package",
        "slug": "pokhara-adventure-package",
        "category": "adventure",
        "difficulty": "moderate",
        "duration_days": 5,
        "best_season": "October-May",
        "max_altitude": 1400,
        "starting_price": 450,
        "description": (
            "Pokhara, the adventure capital of Nepal, offers an incredible array of adrenaline-pumping activities "
            "set against the stunning backdrop of the Annapurna range and the serene Phewa Lake. This action-packed "
            "package combines the best adventure sports with natural beauty.\n\n"
            "Experience the thrill of paragliding over Phewa Lake with Himalayan peaks as your backdrop, navigate "
            "white-water rapids on the Seti River, and zip-line across one of the world's most dramatic gorges. "
            "For those seeking a gentler pace, kayaking on the lake, hiking to the World Peace Pagoda, and "
            "exploring the mysterious Bat Cave provide equally memorable experiences.\n\n"
            "Pokhara's laid-back lakeside atmosphere, vibrant cafes, and stunning sunsets make it the perfect "
            "base for adventure and relaxation in equal measure."
        ),
        "highlights": [
            "Paragliding over Phewa Lake with Annapurna views",
            "White-water rafting on the Seti River",
            "World's steepest zip-line experience",
            "Sunrise view of the Himalayas from Sarangkot",
            "Boating and kayaking on Phewa Lake",
            "Visit Davis Falls and Gupteshwor Cave"
        ],
        "itinerary_days": [
            {"day": 1, "title": "Arrival in Pokhara", "description": "Fly or drive from Kathmandu to Pokhara. Check in at lakeside hotel. Evening boat ride on Phewa Lake with Machhapuchhre reflection.", "altitude": "820m"},
            {"day": 2, "title": "Paragliding and Zip-line", "description": "Morning tandem paragliding from Sarangkot (30-min flight). Afternoon zip-line experience across the gorge. Evening lakeside dinner.", "altitude": "820m"},
            {"day": 3, "title": "White-water Rafting", "description": "Full-day white-water rafting on the upper Seti River (Grade III-IV rapids). Riverside lunch. Return to hotel for rest.", "altitude": "820m"},
            {"day": 4, "title": "Sarangkot Sunrise and Exploration", "description": "Pre-dawn drive to Sarangkot for sunrise over Annapurna and Dhaulagiri. Visit Davis Falls, Gupteshwor Cave, International Mountain Museum.", "altitude": "820m"},
            {"day": 5, "title": "Departure", "description": "Morning kayaking session on Phewa Lake. Afternoon transfer to airport or bus station for return journey.", "altitude": "820m"}
        ],
        "included_services": [
            "Kathmandu-Pokhara transportation (flight or tourist bus)",
            "4 nights lakeside hotel with breakfast",
            "Tandem paragliding (30-minute flight with video)",
            "Zip-line experience",
            "Full-day white-water rafting with lunch",
            "Kayaking session",
            "Sarangkot sunrise trip",
            "All entrance fees",
            "Experienced activity guides"
        ],
        "excluded_services": [
            "International flights",
            "Nepal visa",
            "Travel insurance (mandatory for activities)",
            "Lunch and dinner (except rafting day)",
            "Tips and gratuities",
            "Personal expenses"
        ],
        "image_url": "https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=800&q=80"
    },
    {
        "title": "Chitwan National Park Safari",
        "slug": "chitwan-national-park-safari",
        "category": "wildlife",
        "difficulty": "easy",
        "duration_days": 3,
        "best_season": "October-March",
        "max_altitude": 150,
        "starting_price": 280,
        "description": (
            "Chitwan National Park, a UNESCO World Heritage Site, is one of the finest wildlife reserves in Asia. "
            "Nestled in the subtropical lowlands of southern Nepal, this 932 sq km park is home to endangered one-horned "
            "rhinoceros, Royal Bengal tigers, gharial crocodiles, and over 500 species of birds.\n\n"
            "This safari package immerses you in the jungle experience with jeep safaris, canoe rides along "
            "the Rapti River, guided nature walks, and visits to elephant breeding centers. The Tharu indigenous "
            "community adds a rich cultural dimension with their traditional stick dance performances and "
            "unique village life.\n\n"
            "Whether you're spotting rhinos from the back of a jeep, watching crocodiles bask on riverbanks "
            "from a dugout canoe, or listening to the jungle come alive at dawn, Chitwan offers an unforgettable "
            "wildlife experience."
        ),
        "highlights": [
            "Spot endangered one-horned rhinoceros in their natural habitat",
            "Jeep safari through dense sal forests and grasslands",
            "Canoe ride on the Rapti River spotting gharial crocodiles",
            "Guided jungle walk with expert naturalist",
            "Tharu cultural dance performance",
            "Bird watching with 500+ species including hornbills and eagles"
        ],
        "itinerary_days": [
            {"day": 1, "title": "Arrival in Chitwan", "description": "Drive from Kathmandu or Pokhara to Chitwan (5-6 hrs). Check into jungle lodge. Afternoon Tharu village walk and cultural dance show.", "altitude": "150m"},
            {"day": 2, "title": "Full Day Safari", "description": "Early morning bird watching walk. Breakfast then full jeep safari in the park core zone. Afternoon canoe ride on Rapti River. Visit elephant breeding center.", "altitude": "150m"},
            {"day": 3, "title": "Nature Walk and Departure", "description": "Guided nature walk along the river. Brunch at the lodge. Transfer back to Kathmandu or onward destination.", "altitude": "150m"}
        ],
        "included_services": [
            "Round-trip transportation from Kathmandu or Pokhara",
            "2 nights jungle lodge accommodation (full board)",
            "All meals during the stay",
            "Full-day jeep safari",
            "Canoe ride",
            "Guided nature walks",
            "Elephant breeding center visit",
            "Tharu cultural program",
            "National park entry fees",
            "Experienced naturalist guide"
        ],
        "excluded_services": [
            "International flights",
            "Nepal visa",
            "Travel insurance",
            "Alcoholic beverages",
            "Tips and gratuities",
            "Personal expenses"
        ],
        "image_url": "https://images.unsplash.com/photo-1585510183190-3569c3e3e36b?w=800&q=80"
    },
    {
        "title": "Langtang Valley Trek",
        "slug": "langtang-valley-trek",
        "category": "trekking",
        "difficulty": "moderate",
        "duration_days": 10,
        "best_season": "March-May, October-November",
        "max_altitude": 4984,
        "starting_price": 800,
        "description": (
            "The Langtang Valley Trek, often called the 'Valley of Glaciers,' offers a rewarding trekking experience "
            "just north of Kathmandu. Devastated by the 2015 earthquake and rebuilt with extraordinary resilience, "
            "this trek showcases the enduring spirit of the Tamang people and some of Nepal's most spectacular "
            "mountain scenery.\n\n"
            "The trail passes through lush rhododendron and bamboo forests, past cascading waterfalls, and into "
            "a wide glacial valley surrounded by snow-capped peaks including Langtang Lirung (7,227m). The "
            "region's proximity to Tibet is evident in the Tamang Buddhist culture, prayer flags, and yak pastures.\n\n"
            "Less crowded than the Everest and Annapurna regions, Langtang offers a more intimate trekking "
            "experience with excellent mountain views, rich biodiversity, and genuine cultural encounters. "
            "The famous Langtang cheese, made from yak milk, is a delicious local specialty."
        ),
        "highlights": [
            "Trek through the 'Valley of Glaciers' beneath Langtang Lirung (7,227m)",
            "Experience Tamang Buddhist culture and hospitality",
            "Panoramic views from Kyanjin Ri (4,773m)",
            "Visit the historic Kyanjin Gompa monastery",
            "Sample famous Langtang yak cheese",
            "Walk through diverse forest zones with red pandas habitat",
            "Witness the resilience of communities rebuilt after 2015 earthquake"
        ],
        "itinerary_days": [
            {"day": 1, "title": "Kathmandu to Syabrubesi", "description": "Scenic drive through terraced hills and valleys to Syabrubesi, the gateway to Langtang. Pass through Tamang villages.", "altitude": "1,550m"},
            {"day": 2, "title": "Syabrubesi to Lama Hotel", "description": "Trek through oak, maple and rhododendron forests along the Langtang Khola river valley.", "altitude": "2,380m"},
            {"day": 3, "title": "Lama Hotel to Langtang Village", "description": "Continue through forests into more open terrain. Arrive at the rebuilt Langtang Village with mountain views.", "altitude": "3,430m"},
            {"day": 4, "title": "Langtang Village to Kyanjin Gompa", "description": "Gentle trek through yak pastures to Kyanjin Gompa. Visit the monastery and cheese factory.", "altitude": "3,870m"},
            {"day": 5, "title": "Kyanjin Ri Hike and Exploration", "description": "Morning hike to Kyanjin Ri (4,773m) or Tserko Ri (4,984m) for stunning 360-degree mountain views. Afternoon rest.", "altitude": "4,984m"},
            {"day": 6, "title": "Kyanjin Gompa to Lama Hotel", "description": "Retrace steps down the valley. Descend from high alpine zone back into forested areas.", "altitude": "2,380m"},
            {"day": 7, "title": "Lama Hotel to Thulo Syabru", "description": "Continue descent with a detour to the Tamang heritage village of Thulo Syabru.", "altitude": "2,210m"},
            {"day": 8, "title": "Thulo Syabru to Dhunche", "description": "Trek to the district headquarters of Dhunche through rhododendron forests and rural villages.", "altitude": "1,960m"},
            {"day": 9, "title": "Dhunche to Kathmandu", "description": "Drive back to Kathmandu through scenic hill country. Arrive by afternoon. Farewell dinner.", "altitude": "1,400m"},
            {"day": 10, "title": "Departure", "description": "Transfer to airport for departure or continue exploring Kathmandu.", "altitude": "1,400m"}
        ],
        "included_services": [
            "Airport transfers in Kathmandu",
            "2 nights hotel in Kathmandu with breakfast",
            "Kathmandu-Syabrubesi-Kathmandu transportation",
            "Licensed trekking guide",
            "Porter service",
            "Lodge accommodation during trek",
            "Three meals daily on trek",
            "Langtang National Park permit",
            "TIMS card"
        ],
        "excluded_services": [
            "International flights",
            "Nepal visa fees",
            "Travel insurance",
            "Personal trekking gear",
            "Tips for guide and porters",
            "Extra meals in Kathmandu"
        ],
        "image_url": "https://images.unsplash.com/photo-1574950578143-858c6fc78d8c?w=800&q=80"
    },
    {
        "title": "Upper Mustang Expedition",
        "slug": "upper-mustang-expedition",
        "category": "cultural",
        "difficulty": "challenging",
        "duration_days": 14,
        "best_season": "March-November",
        "max_altitude": 3810,
        "starting_price": 1800,
        "description": (
            "Upper Mustang, the 'Last Forbidden Kingdom,' remained closed to outsiders until 1992 and still "
            "retains an air of mystery and timelessness. This remote region of Nepal, bordering Tibet, preserves "
            "a medieval Tibetan Buddhist culture that has vanished from Tibet itself.\n\n"
            "The trek through Upper Mustang is a journey into a surreal landscape of eroded sandstone cliffs "
            "painted in shades of ochre, crimson, and cream, punctuated by whitewashed monasteries and crumbling "
            "cave dwellings. The walled capital of Lo Manthang, with its royal palace and ancient gompas, feels "
            "like stepping back centuries in time.\n\n"
            "This restricted area trek requires a special permit, which helps preserve the region's unique "
            "cultural heritage. The arid rain-shadow landscape, cave monasteries with ancient frescoes, and "
            "the warm hospitality of the Loba people make this one of Nepal's most extraordinary journeys."
        ),
        "highlights": [
            "Explore the walled city of Lo Manthang, the ancient capital",
            "Visit cliff-side cave monasteries with centuries-old murals",
            "Trek through dramatic eroded canyon landscapes",
            "Experience preserved Tibetan Buddhist culture",
            "Visit Choser Cave complex and sky caves",
            "Walk the deepest gorge in the world (Kali Gandaki)",
            "Discover the unique Loba people and their traditions"
        ],
        "itinerary_days": [
            {"day": 1, "title": "Kathmandu to Pokhara", "description": "Fly or drive to Pokhara. Afternoon free to explore lakeside. Trip briefing.", "altitude": "820m"},
            {"day": 2, "title": "Fly to Jomsom, Trek to Kagbeni", "description": "Scenic flight to Jomsom along the Kali Gandaki. Trek to the medieval gateway village of Kagbeni.", "altitude": "2,810m"},
            {"day": 3, "title": "Kagbeni to Chele", "description": "Enter the restricted Upper Mustang zone. Trek through the Kali Gandaki gorge to the village of Chele.", "altitude": "3,050m"},
            {"day": 4, "title": "Chele to Syangboche", "description": "Cross two high passes with dramatic landscape changes. Colorful eroded cliffs surround the trail.", "altitude": "3,475m"},
            {"day": 5, "title": "Syangboche to Ghami", "description": "Trek past the longest mani wall in Nepal. Descend into the valley and climb to the large village of Ghami.", "altitude": "3,520m"},
            {"day": 6, "title": "Ghami to Tsarang", "description": "Cross a high pass and descend to Tsarang, with its impressive dzong (fort) and red gompa with ancient murals.", "altitude": "3,620m"},
            {"day": 7, "title": "Tsarang to Lo Manthang", "description": "Final approach to the walled capital. Cross the Lo La pass for first views of Lo Manthang against the Himalayan backdrop.", "altitude": "3,810m"},
            {"day": 8, "title": "Explore Lo Manthang", "description": "Full day exploring: Royal Palace, Thubchen Gompa (15th century), Jampa Gompa, Choeda Gompa. Audience with the former king if available.", "altitude": "3,810m"},
            {"day": 9, "title": "Lo Manthang to Dhi Village", "description": "Take alternate return route via Ghar Gompa cave monastery. Descend to the oasis village of Dhi.", "altitude": "3,400m"},
            {"day": 10, "title": "Dhi to Yara and Luri Cave", "description": "Visit the stunning Luri Cave monastery with its 13th-century Buddhist paintings. Continue to Yara.", "altitude": "3,650m"},
            {"day": 11, "title": "Yara to Ghami", "description": "Rejoin the main trail. Trek through the dramatic painted desert landscape back to Ghami.", "altitude": "3,520m"},
            {"day": 12, "title": "Ghami to Kagbeni", "description": "Long descent day retracing the outward route back to Kagbeni. Celebrate return at a local lodge.", "altitude": "2,810m"},
            {"day": 13, "title": "Kagbeni to Jomsom, Fly to Pokhara", "description": "Morning trek to Jomsom. Afternoon flight to Pokhara. Lakeside farewell dinner.", "altitude": "820m"},
            {"day": 14, "title": "Pokhara to Kathmandu, Departure", "description": "Return to Kathmandu. Transfer to international airport for departure.", "altitude": "1,400m"}
        ],
        "included_services": [
            "Airport transfers",
            "Hotel in Kathmandu and Pokhara",
            "Domestic flights: Ktm-Pokhara, Pokhara-Jomsom-Pokhara",
            "Upper Mustang restricted area permit ($500 value)",
            "Annapurna Conservation Area permit",
            "Licensed trekking guide",
            "Porter/pack animal service",
            "Lodge accommodation during trek",
            "Three meals daily on trek",
            "Farewell dinner"
        ],
        "excluded_services": [
            "International flights",
            "Nepal visa",
            "Travel insurance",
            "Personal gear",
            "Tips and gratuities",
            "Beverages during trek"
        ],
        "image_url": "https://images.unsplash.com/photo-1571401835393-8c5f35328320?w=800&q=80"
    },
    {
        "title": "Lumbini Pilgrimage Tour",
        "slug": "lumbini-pilgrimage-tour",
        "category": "pilgrimage",
        "difficulty": "easy",
        "duration_days": 3,
        "best_season": "October-March",
        "max_altitude": 150,
        "starting_price": 250,
        "description": (
            "Lumbini, the birthplace of Lord Buddha, is one of the most sacred pilgrimage sites in the world "
            "and a UNESCO World Heritage Site. This peaceful journey takes you to the very spot where Siddhartha "
            "Gautama was born in 623 BC, and explores the monastic zone where Buddhist nations from around the "
            "world have built stunning temples in their unique architectural styles.\n\n"
            "The sacred garden contains the Mayadevi Temple marking the exact birth spot, the Ashoka Pillar "
            "erected by Emperor Ashoka in 249 BC, the sacred Puskarni Pond where Queen Mayadevi bathed before "
            "giving birth, and the Bodhi Tree. The wider complex spans over 4.7 sq km of monasteries, meditation "
            "centers, and sacred ruins.\n\n"
            "This tour combines spiritual significance with architectural wonder, as you explore monasteries "
            "built by Thailand, Myanmar, China, Japan, Germany, France, and many other nations, each reflecting "
            "their unique Buddhist traditions and artistic styles."
        ),
        "highlights": [
            "Visit the exact birthplace of Lord Buddha (UNESCO World Heritage Site)",
            "See the Ashoka Pillar (249 BC) — oldest stone inscription in Nepal",
            "Explore Mayadevi Temple and sacred garden",
            "Tour international monasteries from 25+ countries",
            "Meditate at the eternal peace flame",
            "Witness the sacred Puskarni Pond"
        ],
        "itinerary_days": [
            {"day": 1, "title": "Kathmandu to Lumbini", "description": "Early morning flight to Bhairahawa (30 min) or scenic drive (8 hrs). Transfer to hotel in Lumbini. Evening visit to the eternal peace flame.", "altitude": "150m"},
            {"day": 2, "title": "Full Day Lumbini Exploration", "description": "Visit Mayadevi Temple, Ashoka Pillar, sacred garden. Afternoon tour of international monasteries: Chinese, Thai, Myanmar, Japanese, Korean temples. Sunset meditation session.", "altitude": "150m"},
            {"day": 3, "title": "Lumbini Museum and Departure", "description": "Visit Lumbini Museum and Lumbini International Research Institute. Optional visit to Tilaurakot (ancient Kapilvastu palace ruins). Transfer to airport.", "altitude": "150m"}
        ],
        "included_services": [
            "Kathmandu-Bhairahawa-Kathmandu flights (or private vehicle)",
            "2 nights hotel accommodation with breakfast",
            "Professional English-speaking guide",
            "Private vehicle for all sightseeing",
            "All entrance fees and permits",
            "Guided meditation session",
            "Lumbini Museum entry"
        ],
        "excluded_services": [
            "International flights",
            "Nepal visa",
            "Travel insurance",
            "Lunch and dinner",
            "Tips and gratuities",
            "Personal expenses and donations"
        ],
        "image_url": "https://images.unsplash.com/photo-1609920658906-8223bd289001?w=800&q=80"
    },
    {
        "title": "Manaslu Circuit Trek",
        "slug": "manaslu-circuit-trek",
        "category": "trekking",
        "difficulty": "strenuous",
        "duration_days": 16,
        "best_season": "March-May, September-November",
        "max_altitude": 5106,
        "starting_price": 1350,
        "description": (
            "The Manaslu Circuit Trek is a stunning alternative to the crowded Annapurna Circuit, offering a "
            "wilder, more remote trekking experience around the world's eighth highest peak, Manaslu (8,163m). "
            "This restricted-area trek rewards adventurous trekkers with pristine landscapes, authentic village "
            "life, and dramatic Himalayan scenery.\n\n"
            "The trail circles Mount Manaslu through the Budhi Gandaki gorge, one of Nepal's most spectacular "
            "river valleys, crossing the Larkya La pass at 5,106 meters. The route passes through remote villages "
            "of Gurung, Tibetan, and Nubri communities, offering genuine cultural experiences rarely found on "
            "more popular trekking routes.\n\n"
            "With restricted-area permits limiting visitor numbers, the Manaslu Circuit maintains an uncrowded, "
            "expedition-like atmosphere. The combination of challenging terrain, cultural diversity, and "
            "spectacular mountain scenery makes it a favorite among experienced trekkers."
        ),
        "highlights": [
            "Circle the world's 8th highest peak, Manaslu (8,163m)",
            "Cross Larkya La Pass (5,106m) with panoramic mountain views",
            "Trek through the dramatic Budhi Gandaki gorge",
            "Experience remote Nubri and Tsum valley cultures",
            "Visit ancient Tibetan Buddhist monasteries",
            "Far fewer trekkers than Annapurna or Everest regions",
            "Diverse landscapes from subtropical to arctic alpine"
        ],
        "itinerary_days": [
            {"day": 1, "title": "Kathmandu to Soti Khola", "description": "Long drive through the hills to Soti Khola, the trek starting point on the Budhi Gandaki river.", "altitude": "700m"},
            {"day": 2, "title": "Soti Khola to Machha Khola", "description": "Trek through subtropical forests and rice terraces along the narrow Budhi Gandaki gorge.", "altitude": "930m"},
            {"day": 3, "title": "Machha Khola to Jagat", "description": "Continue along the gorge, crossing suspension bridges and passing waterfalls. Hot springs en route.", "altitude": "1,340m"},
            {"day": 4, "title": "Jagat to Deng", "description": "Enter the restricted Manaslu Conservation Area. Dramatic gorge scenery with towering cliffs.", "altitude": "1,860m"},
            {"day": 5, "title": "Deng to Namrung", "description": "Cross to the west bank of the Budhi Gandaki. Enter Tibetan-influenced cultural zone with prayer flags and mani walls.", "altitude": "2,660m"},
            {"day": 6, "title": "Namrung to Samagaon", "description": "Trek through forest with views of Manaslu. Arrive at the largest village, Samagaon, below Manaslu.", "altitude": "3,530m"},
            {"day": 7, "title": "Acclimatization in Samagaon", "description": "Rest day. Optional hike to Manaslu Base Camp viewpoint or Birendra Lake. Visit the Pungyen Gompa.", "altitude": "3,530m"},
            {"day": 8, "title": "Samagaon to Samdo", "description": "Trek through Tibetan-style villages with yak herds. Samdo is the last settlement before Larkya La.", "altitude": "3,860m"},
            {"day": 9, "title": "Acclimatization in Samdo", "description": "Rest day. Optional walk toward the Tibetan border or explore the surrounding moraines and glacial features.", "altitude": "3,860m"},
            {"day": 10, "title": "Samdo to Dharamsala (Larkya BC)", "description": "Short but important acclimatization trek to Dharamsala, the base camp for the Larkya La crossing.", "altitude": "4,460m"},
            {"day": 11, "title": "Cross Larkya La to Bimthang", "description": "Pre-dawn start for the big pass day. Cross Larkya La (5,106m) with stunning Manaslu and Himalchuli views. Long descent to Bimthang.", "altitude": "3,720m"},
            {"day": 12, "title": "Bimthang to Tilije", "description": "Descend through forests and pastures into the Marshyangdi valley. Enter the Annapurna Circuit route area.", "altitude": "2,300m"},
            {"day": 13, "title": "Tilije to Tal", "description": "Continue down the Marshyangdi valley through beautiful villages and rice terraces to the lakeside village of Tal.", "altitude": "1,700m"},
            {"day": 14, "title": "Tal to Dharapani to Besisahar", "description": "Trek to Dharapani then drive to Besisahar. Long day ending the trekking portion.", "altitude": "760m"},
            {"day": 15, "title": "Besisahar to Kathmandu", "description": "Drive back to Kathmandu. Arrive by afternoon. Farewell dinner and celebration.", "altitude": "1,400m"},
            {"day": 16, "title": "Departure", "description": "Transfer to airport for departure. Option to extend stay in Kathmandu.", "altitude": "1,400m"}
        ],
        "included_services": [
            "Airport transfers",
            "2 nights hotel in Kathmandu",
            "Ground transportation as per itinerary",
            "Licensed trekking guide",
            "Porter service",
            "Lodge accommodation during trek",
            "Three meals daily on trek",
            "Manaslu restricted area permit",
            "Manaslu Conservation Area permit",
            "TIMS card",
            "Farewell dinner"
        ],
        "excluded_services": [
            "International flights",
            "Nepal visa",
            "Travel insurance (mandatory)",
            "Personal trekking gear",
            "Tips for guide and porters",
            "Extra meals in Kathmandu",
            "Emergency evacuation costs"
        ],
        "image_url": "https://images.unsplash.com/photo-1486911278844-a81c5267e227?w=800&q=80"
    },
    {
        "title": "Rara Lake Adventure",
        "slug": "rara-lake-adventure",
        "category": "adventure",
        "difficulty": "moderate",
        "duration_days": 9,
        "best_season": "April-June, September-November",
        "max_altitude": 2990,
        "starting_price": 950,
        "description": (
            "Rara Lake, Nepal's largest and most pristine lake, lies hidden in the remote northwest region of "
            "the country at 2,990 meters. Often called the 'Queen of Lakes,' its crystal-clear turquoise waters "
            "reflect the surrounding snow-dusted peaks and dense pine forests — a scene of otherworldly beauty "
            "that few travelers ever witness.\n\n"
            "This off-the-beaten-path adventure takes you to one of Nepal's most untouched regions, through "
            "traditional Khas and Thakuri villages, pristine conifer forests, and rolling meadows that burst "
            "with wildflowers in spring. Rara National Park, Nepal's smallest yet most scenic national park, "
            "protects the lake and its surrounding ecosystem of Himalayan black bears, red pandas, and "
            "musk deer.\n\n"
            "With virtually no tourist infrastructure and limited access, Rara Lake offers a genuinely remote "
            "and adventurous experience. The journey itself — whether by flight to Jumla followed by trekking, "
            "or overland through western Nepal — is an adventure through Nepal's most unexplored landscapes."
        ),
        "highlights": [
            "Visit Nepal's largest lake at 2,990m — pristine and virtually untouched",
            "Trek through Rara National Park's ancient conifer forests",
            "Experience the remote culture of far-western Nepal",
            "Spot Himalayan wildlife: red pandas, musk deer, black bears",
            "Camp beside the turquoise lake under star-filled skies",
            "Walk through wildflower meadows (spring season)",
            "One of Nepal's most untouched and least-visited destinations"
        ],
        "itinerary_days": [
            {"day": 1, "title": "Kathmandu to Nepalgunj", "description": "Fly to Nepalgunj in the western Terai. Afternoon rest. Evening briefing about the remote trek ahead.", "altitude": "150m"},
            {"day": 2, "title": "Nepalgunj to Jumla", "description": "Scenic mountain flight to Jumla, the gateway to far-western Nepal. Explore the historic bazaar town.", "altitude": "2,370m"},
            {"day": 3, "title": "Jumla to Danphe Lagna", "description": "Begin trekking through terraced fields and pine forests. Cross the Danphe Lagna ridge with mountain views.", "altitude": "3,000m"},
            {"day": 4, "title": "Danphe Lagna to Rara Lake", "description": "Descend through beautiful forests into Rara National Park. First stunning views of the turquoise lake.", "altitude": "2,990m"},
            {"day": 5, "title": "Rara Lake Exploration", "description": "Full day around the lake. Circumnavigate Rara Lake on foot (3-4 hours). Visit the temple on the north shore. Wildlife spotting.", "altitude": "2,990m"},
            {"day": 6, "title": "Rara Lake to Ghorosingha", "description": "Second morning at the lake. Afternoon trek to Ghorosingha through meadows and forest.", "altitude": "2,810m"},
            {"day": 7, "title": "Ghorosingha to Sinja Valley", "description": "Trek to the historic Sinja Valley, the ancient capital of the Khas Malla kingdom and birthplace of the Nepali language.", "altitude": "2,440m"},
            {"day": 8, "title": "Sinja to Jumla, Fly to Nepalgunj", "description": "Return trek to Jumla. Afternoon flight to Nepalgunj.", "altitude": "150m"},
            {"day": 9, "title": "Nepalgunj to Kathmandu", "description": "Morning flight to Kathmandu. Transfer to hotel. Free afternoon and farewell dinner.", "altitude": "1,400m"}
        ],
        "included_services": [
            "All domestic flights (Ktm-Nepalgunj-Jumla-Nepalgunj-Ktm)",
            "Airport transfers",
            "2 nights hotel in Kathmandu",
            "1 night hotel in Nepalgunj",
            "Licensed trekking guide",
            "Porter service",
            "Camping equipment (tents, sleeping bags, mats)",
            "All meals during trek (cook included)",
            "Rara National Park entry permit",
            "TIMS card"
        ],
        "excluded_services": [
            "International flights",
            "Nepal visa",
            "Travel insurance",
            "Personal trekking gear",
            "Tips and gratuities",
            "Meals in Kathmandu and Nepalgunj",
            "Emergency evacuation"
        ],
        "image_url": "https://images.unsplash.com/photo-1503220317266-8af87b5f4648?w=800&q=80"
    }
]


class Command(BaseCommand):
    help = 'Seed database with 10 Nepal trip templates and download cover images'

    def handle(self, *args, **options):
        import django
        from django.conf import settings

        media_trips_dir = os.path.join(settings.MEDIA_ROOT, 'trips')
        os.makedirs(media_trips_dir, exist_ok=True)

        created_count = 0
        updated_count = 0

        for data in TRIP_DATA:
            image_url = data.pop('image_url')
            trip, created = TripTemplate.objects.get_or_create(
                slug=data['slug'],
                defaults=data
            )

            if created:
                created_count += 1
                # Try to download cover image
                image_filename = f"{data['slug']}.jpg"
                image_path = os.path.join(media_trips_dir, image_filename)

                if not os.path.exists(image_path):
                    try:
                        self.stdout.write(f"  Downloading image for {data['title']}...")
                        req = urllib.request.Request(image_url, headers={'User-Agent': 'Mozilla/5.0'})
                        with urllib.request.urlopen(req, timeout=15) as response:
                            image_data = response.read()
                            with open(image_path, 'wb') as f:
                                f.write(image_data)
                        trip.cover_image = f'trips/{image_filename}'
                        trip.save()
                        self.stdout.write(self.style.SUCCESS("  [OK] Image saved"))
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f"  [SKIP] Could not download image: {e}"))
                else:
                    trip.cover_image = f'trips/{image_filename}'
                    trip.save()

                self.stdout.write(self.style.SUCCESS(f"  Created: {trip.title}"))
            else:
                updated_count += 1
                self.stdout.write(f"  Already exists: {trip.title}")

        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Created: {created_count}, Already existed: {updated_count}"
        ))
