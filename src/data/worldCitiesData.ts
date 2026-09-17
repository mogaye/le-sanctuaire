import { CityData } from '../types';
import { Coordinates, CalculationMethod, PrayerTimes, Qibla } from 'adhan';

export const WORLD_REGIONS = [
  'Tous',
  'Afrique',
  'Moyen-Orient',
  'Europe',
  'Asie',
  'Amériques',
  'Océanie',
] as const;

export type WorldRegion = (typeof WORLD_REGIONS)[number];

export const WORLD_CITIES: CityData[] = [
  {
    "id": "dakar",
    "name": "Dakar",
    "country": "Sénégal",
    "region": "Afrique",
    "timezone": "Africa/Dakar",
    "utcOffset": "UTC+0",
    "latitude": 14.6928,
    "longitude": -17.4467,
    "qiblaAngle": 74,
    "prayers": {
      "F": "05:47",
      "D": "13:05",
      "A": "16:23",
      "M": "19:10",
      "I": "20:17"
    }
  },
  {
    "id": "touba",
    "name": "Touba",
    "country": "Sénégal",
    "region": "Afrique",
    "timezone": "Africa/Dakar",
    "utcOffset": "UTC+0",
    "latitude": 14.8631,
    "longitude": -15.8756,
    "qiblaAngle": 74,
    "prayers": {
      "F": "05:41",
      "D": "12:59",
      "A": "16:17",
      "M": "19:03",
      "I": "20:11"
    }
  },
  {
    "id": "saint-louis-sn",
    "name": "Saint-Louis",
    "country": "Sénégal",
    "region": "Afrique",
    "timezone": "Africa/Dakar",
    "utcOffset": "UTC+0",
    "latitude": 16.0326,
    "longitude": -16.4818,
    "qiblaAngle": 75,
    "prayers": {
      "F": "05:43",
      "D": "13:01",
      "A": "16:20",
      "M": "19:06",
      "I": "20:14"
    }
  },
  {
    "id": "thies",
    "name": "Thiès",
    "country": "Sénégal",
    "region": "Afrique",
    "timezone": "Africa/Dakar",
    "utcOffset": "UTC+0",
    "latitude": 14.791,
    "longitude": -16.9359,
    "qiblaAngle": 74,
    "prayers": {
      "F": "05:45",
      "D": "13:03",
      "A": "16:21",
      "M": "19:08",
      "I": "20:15"
    }
  },
  {
    "id": "ziguinchor",
    "name": "Ziguinchor",
    "country": "Sénégal",
    "region": "Afrique",
    "timezone": "Africa/Dakar",
    "utcOffset": "UTC+0",
    "latitude": 12.5833,
    "longitude": -16.2719,
    "qiblaAngle": 73,
    "prayers": {
      "F": "05:44",
      "D": "13:01",
      "A": "16:16",
      "M": "19:05",
      "I": "20:11"
    }
  },
  {
    "id": "bamako",
    "name": "Bamako",
    "country": "Mali",
    "region": "Afrique",
    "timezone": "Africa/Bamako",
    "utcOffset": "UTC+0",
    "latitude": 12.6392,
    "longitude": -8.0029,
    "qiblaAngle": 72,
    "prayers": {
      "F": "05:11",
      "D": "12:27",
      "A": "15:43",
      "M": "18:32",
      "I": "19:38"
    }
  },
  {
    "id": "tombouctou",
    "name": "Tombouctou",
    "country": "Mali",
    "region": "Afrique",
    "timezone": "Africa/Bamako",
    "utcOffset": "UTC+0",
    "latitude": 16.7666,
    "longitude": -3.0026,
    "qiblaAngle": 76,
    "prayers": {
      "F": "04:48",
      "D": "12:08",
      "A": "15:27",
      "M": "18:12",
      "I": "19:20"
    }
  },
  {
    "id": "abidjan",
    "name": "Abidjan",
    "country": "Côte d'Ivoire",
    "region": "Afrique",
    "timezone": "Africa/Abidjan",
    "utcOffset": "UTC+0",
    "latitude": 5.36,
    "longitude": -4.0083,
    "qiblaAngle": 65,
    "prayers": {
      "F": "04:57",
      "D": "12:12",
      "A": "15:16",
      "M": "18:15",
      "I": "19:20"
    }
  },
  {
    "id": "yamoussoukro",
    "name": "Yamoussoukro",
    "country": "Côte d'Ivoire",
    "region": "Afrique",
    "timezone": "Africa/Abidjan",
    "utcOffset": "UTC+0",
    "latitude": 6.8276,
    "longitude": -5.2893,
    "qiblaAngle": 67,
    "prayers": {
      "F": "05:02",
      "D": "12:17",
      "A": "15:24",
      "M": "18:20",
      "I": "19:25"
    }
  },
  {
    "id": "conakry",
    "name": "Conakry",
    "country": "Guinée",
    "region": "Afrique",
    "timezone": "Africa/Conakry",
    "utcOffset": "UTC+0",
    "latitude": 9.6412,
    "longitude": -13.5784,
    "qiblaAngle": 70,
    "prayers": {
      "F": "05:34",
      "D": "12:50",
      "A": "16:01",
      "M": "18:53",
      "I": "19:59"
    }
  },
  {
    "id": "nouakchott",
    "name": "Nouakchott",
    "country": "Mauritanie",
    "region": "Afrique",
    "timezone": "Africa/Nouakchott",
    "utcOffset": "UTC+0",
    "latitude": 18.0735,
    "longitude": -15.9582,
    "qiblaAngle": 76,
    "prayers": {
      "F": "05:39",
      "D": "12:59",
      "A": "16:20",
      "M": "19:04",
      "I": "20:13"
    }
  },
  {
    "id": "nouadhibou",
    "name": "Nouadhibou",
    "country": "Mauritanie",
    "region": "Afrique",
    "timezone": "Africa/Nouakchott",
    "utcOffset": "UTC+0",
    "latitude": 20.9412,
    "longitude": -17.0347,
    "qiblaAngle": 78,
    "prayers": {
      "F": "05:42",
      "D": "13:04",
      "A": "16:27",
      "M": "19:09",
      "I": "20:19"
    }
  },
  {
    "id": "niamey",
    "name": "Niamey",
    "country": "Niger",
    "region": "Afrique",
    "timezone": "Africa/Niamey",
    "utcOffset": "UTC+1",
    "latitude": 13.5116,
    "longitude": 2.1254,
    "qiblaAngle": 72,
    "prayers": {
      "F": "05:30",
      "D": "12:47",
      "A": "16:03",
      "M": "18:51",
      "I": "19:58"
    }
  },
  {
    "id": "ouagadougou",
    "name": "Ouagadougou",
    "country": "Burkina Faso",
    "region": "Afrique",
    "timezone": "Africa/Ouagadougou",
    "utcOffset": "UTC+0",
    "latitude": 12.3714,
    "longitude": -1.5197,
    "qiblaAngle": 71,
    "prayers": {
      "F": "04:45",
      "D": "12:02",
      "A": "15:17",
      "M": "18:06",
      "I": "19:12"
    }
  },
  {
    "id": "banjul",
    "name": "Banjul",
    "country": "Gambie",
    "region": "Afrique",
    "timezone": "Africa/Banjul",
    "utcOffset": "UTC+0",
    "latitude": 13.4549,
    "longitude": -16.579,
    "qiblaAngle": 73,
    "prayers": {
      "F": "05:44",
      "D": "13:02",
      "A": "16:18",
      "M": "19:06",
      "I": "20:13"
    }
  },
  {
    "id": "bissau",
    "name": "Bissau",
    "country": "Guinée-Bissau",
    "region": "Afrique",
    "timezone": "Africa/Bissau",
    "utcOffset": "UTC+0",
    "latitude": 11.8636,
    "longitude": -15.5977,
    "qiblaAngle": 72,
    "prayers": {
      "F": "05:41",
      "D": "12:58",
      "A": "16:12",
      "M": "19:02",
      "I": "20:08"
    }
  },
  {
    "id": "freetown",
    "name": "Freetown",
    "country": "Sierra Leone",
    "region": "Afrique",
    "timezone": "Africa/Freetown",
    "utcOffset": "UTC+0",
    "latitude": 8.484,
    "longitude": -13.2299,
    "qiblaAngle": 69,
    "prayers": {
      "F": "05:33",
      "D": "12:48",
      "A": "15:58",
      "M": "18:52",
      "I": "19:57"
    }
  },
  {
    "id": "monrovia",
    "name": "Monrovia",
    "country": "Liberia",
    "region": "Afrique",
    "timezone": "Africa/Monrovia",
    "utcOffset": "UTC+0",
    "latitude": 6.3156,
    "longitude": -10.8074,
    "qiblaAngle": 68,
    "prayers": {
      "F": "05:24",
      "D": "12:39",
      "A": "15:45",
      "M": "18:42",
      "I": "19:47"
    }
  },
  {
    "id": "lome",
    "name": "Lomé",
    "country": "Togo",
    "region": "Afrique",
    "timezone": "Africa/Lome",
    "utcOffset": "UTC+0",
    "latitude": 6.1375,
    "longitude": 1.2123,
    "qiblaAngle": 64,
    "prayers": {
      "F": "04:36",
      "D": "11:51",
      "A": "14:57",
      "M": "17:54",
      "I": "18:59"
    }
  },
  {
    "id": "cotonou",
    "name": "Cotonou",
    "country": "Bénin",
    "region": "Afrique",
    "timezone": "Africa/Porto-Novo",
    "utcOffset": "UTC+1",
    "latitude": 6.3703,
    "longitude": 2.3912,
    "qiblaAngle": 64,
    "prayers": {
      "F": "05:31",
      "D": "12:46",
      "A": "15:52",
      "M": "18:49",
      "I": "19:54"
    }
  },
  {
    "id": "porto-novo",
    "name": "Porto-Novo",
    "country": "Bénin",
    "region": "Afrique",
    "timezone": "Africa/Porto-Novo",
    "utcOffset": "UTC+1",
    "latitude": 6.4969,
    "longitude": 2.6289,
    "qiblaAngle": 64,
    "prayers": {
      "F": "05:30",
      "D": "12:45",
      "A": "15:52",
      "M": "18:48",
      "I": "19:53"
    }
  },
  {
    "id": "lagos",
    "name": "Lagos",
    "country": "Nigéria",
    "region": "Afrique",
    "timezone": "Africa/Lagos",
    "utcOffset": "UTC+1",
    "latitude": 6.5244,
    "longitude": 3.3792,
    "qiblaAngle": 63,
    "prayers": {
      "F": "05:27",
      "D": "12:42",
      "A": "15:49",
      "M": "18:45",
      "I": "19:50"
    }
  },
  {
    "id": "abuja",
    "name": "Abuja",
    "country": "Nigéria",
    "region": "Afrique",
    "timezone": "Africa/Lagos",
    "utcOffset": "UTC+1",
    "latitude": 9.0765,
    "longitude": 7.3986,
    "qiblaAngle": 65,
    "prayers": {
      "F": "05:10",
      "D": "12:26",
      "A": "15:37",
      "M": "18:30",
      "I": "19:35"
    }
  },
  {
    "id": "kano",
    "name": "Kano",
    "country": "Nigéria",
    "region": "Afrique",
    "timezone": "Africa/Lagos",
    "utcOffset": "UTC+1",
    "latitude": 12.0022,
    "longitude": 8.592,
    "qiblaAngle": 68,
    "prayers": {
      "F": "05:04",
      "D": "12:21",
      "A": "15:36",
      "M": "18:25",
      "I": "19:31"
    }
  },
  {
    "id": "accra",
    "name": "Accra",
    "country": "Ghana",
    "region": "Afrique",
    "timezone": "Africa/Accra",
    "utcOffset": "UTC+0",
    "latitude": 5.6037,
    "longitude": -0.187,
    "qiblaAngle": 64,
    "prayers": {
      "F": "04:42",
      "D": "11:56",
      "A": "15:01",
      "M": "17:59",
      "I": "19:04"
    }
  },
  {
    "id": "yaounde",
    "name": "Yaoundé",
    "country": "Cameroun",
    "region": "Afrique",
    "timezone": "Africa/Douala",
    "utcOffset": "UTC+1",
    "latitude": 3.848,
    "longitude": 11.5021,
    "qiblaAngle": 55,
    "prayers": {
      "F": "04:56",
      "D": "12:09",
      "A": "15:11",
      "M": "18:12",
      "I": "19:17"
    }
  },
  {
    "id": "douala",
    "name": "Douala",
    "country": "Cameroun",
    "region": "Afrique",
    "timezone": "Africa/Douala",
    "utcOffset": "UTC+1",
    "latitude": 4.0511,
    "longitude": 9.7679,
    "qiblaAngle": 57,
    "prayers": {
      "F": "05:03",
      "D": "12:16",
      "A": "15:19",
      "M": "18:19",
      "I": "19:24"
    }
  },
  {
    "id": "ndjamena",
    "name": "N'Djamena",
    "country": "Tchad",
    "region": "Afrique",
    "timezone": "Africa/Ndjamena",
    "utcOffset": "UTC+1",
    "latitude": 12.1348,
    "longitude": 15.0557,
    "qiblaAngle": 65,
    "prayers": {
      "F": "04:39",
      "D": "11:55",
      "A": "15:10",
      "M": "17:59",
      "I": "19:06"
    }
  },
  {
    "id": "libreville",
    "name": "Libreville",
    "country": "Gabon",
    "region": "Afrique",
    "timezone": "Africa/Libreville",
    "utcOffset": "UTC+1",
    "latitude": 0.4162,
    "longitude": 9.4673,
    "qiblaAngle": 53,
    "prayers": {
      "F": "05:05",
      "D": "12:18",
      "A": "15:20",
      "M": "18:20",
      "I": "19:25"
    }
  },
  {
    "id": "brazzaville",
    "name": "Brazzaville",
    "country": "Congo",
    "region": "Afrique",
    "timezone": "Africa/Brazzaville",
    "utcOffset": "UTC+1",
    "latitude": -4.2634,
    "longitude": 15.2429,
    "qiblaAngle": 42,
    "prayers": {
      "F": "04:42",
      "D": "11:55",
      "A": "15:04",
      "M": "17:56",
      "I": "19:01"
    }
  },
  {
    "id": "kinshasa",
    "name": "Kinshasa",
    "country": "RD Congo",
    "region": "Afrique",
    "timezone": "Africa/Kinshasa",
    "utcOffset": "UTC+1",
    "latitude": -4.4419,
    "longitude": 15.2663,
    "qiblaAngle": 42,
    "prayers": {
      "F": "04:42",
      "D": "11:54",
      "A": "15:05",
      "M": "17:56",
      "I": "19:01"
    }
  },
  {
    "id": "bangui",
    "name": "Bangui",
    "country": "Centrafrique",
    "region": "Afrique",
    "timezone": "Africa/Bangui",
    "utcOffset": "UTC+1",
    "latitude": 4.3947,
    "longitude": 18.5582,
    "qiblaAngle": 49,
    "prayers": {
      "F": "04:27",
      "D": "11:41",
      "A": "14:44",
      "M": "17:44",
      "I": "18:49"
    }
  },
  {
    "id": "casablanca",
    "name": "Casablanca",
    "country": "Maroc",
    "region": "Afrique",
    "timezone": "Africa/Casablanca",
    "utcOffset": "UTC+1",
    "latitude": 33.5731,
    "longitude": -7.5898,
    "qiblaAngle": 94,
    "prayers": {
      "F": "05:51",
      "D": "13:26",
      "A": "16:54",
      "M": "19:34",
      "I": "20:53"
    }
  },
  {
    "id": "rabat",
    "name": "Rabat",
    "country": "Maroc",
    "region": "Afrique",
    "timezone": "Africa/Casablanca",
    "utcOffset": "UTC+1",
    "latitude": 34.0209,
    "longitude": -6.8416,
    "qiblaAngle": 95,
    "prayers": {
      "F": "05:48",
      "D": "13:23",
      "A": "16:51",
      "M": "19:31",
      "I": "20:50"
    }
  },
  {
    "id": "marrakech",
    "name": "Marrakech",
    "country": "Maroc",
    "region": "Afrique",
    "timezone": "Africa/Casablanca",
    "utcOffset": "UTC+1",
    "latitude": 31.6295,
    "longitude": -7.9811,
    "qiblaAngle": 91,
    "prayers": {
      "F": "05:55",
      "D": "13:27",
      "A": "16:55",
      "M": "19:35",
      "I": "20:52"
    }
  },
  {
    "id": "fes",
    "name": "Fès",
    "country": "Maroc",
    "region": "Afrique",
    "timezone": "Africa/Casablanca",
    "utcOffset": "UTC+1",
    "latitude": 34.0181,
    "longitude": -5.0078,
    "qiblaAngle": 96,
    "prayers": {
      "F": "05:40",
      "D": "13:16",
      "A": "16:44",
      "M": "19:24",
      "I": "20:43"
    }
  },
  {
    "id": "tanger",
    "name": "Tanger",
    "country": "Maroc",
    "region": "Afrique",
    "timezone": "Africa/Casablanca",
    "utcOffset": "UTC+1",
    "latitude": 35.7595,
    "longitude": -5.834,
    "qiblaAngle": 97,
    "prayers": {
      "F": "05:41",
      "D": "13:19",
      "A": "16:47",
      "M": "19:28",
      "I": "20:48"
    }
  },
  {
    "id": "alger",
    "name": "Alger",
    "country": "Algérie",
    "region": "Afrique",
    "timezone": "Africa/Algiers",
    "utcOffset": "UTC+1",
    "latitude": 36.7538,
    "longitude": 3.0588,
    "qiblaAngle": 105,
    "prayers": {
      "F": "05:04",
      "D": "12:43",
      "A": "16:12",
      "M": "18:52",
      "I": "20:14"
    }
  },
  {
    "id": "oran",
    "name": "Oran",
    "country": "Algérie",
    "region": "Afrique",
    "timezone": "Africa/Algiers",
    "utcOffset": "UTC+1",
    "latitude": 35.6987,
    "longitude": -0.6349,
    "qiblaAngle": 101,
    "prayers": {
      "F": "05:21",
      "D": "12:58",
      "A": "16:26",
      "M": "19:07",
      "I": "20:28"
    }
  },
  {
    "id": "constantine",
    "name": "Constantine",
    "country": "Algérie",
    "region": "Afrique",
    "timezone": "Africa/Algiers",
    "utcOffset": "UTC+1",
    "latitude": 36.365,
    "longitude": 6.6147,
    "qiblaAngle": 108,
    "prayers": {
      "F": "04:51",
      "D": "12:29",
      "A": "15:57",
      "M": "18:38",
      "I": "20:00"
    }
  },
  {
    "id": "annaba",
    "name": "Annaba",
    "country": "Algérie",
    "region": "Afrique",
    "timezone": "Africa/Algiers",
    "utcOffset": "UTC+1",
    "latitude": 36.9,
    "longitude": 7.7667,
    "qiblaAngle": 110,
    "prayers": {
      "F": "04:45",
      "D": "12:24",
      "A": "15:53",
      "M": "18:34",
      "I": "19:56"
    }
  },
  {
    "id": "tunis",
    "name": "Tunis",
    "country": "Tunisie",
    "region": "Afrique",
    "timezone": "Africa/Tunis",
    "utcOffset": "UTC+1",
    "latitude": 36.8065,
    "longitude": 10.1815,
    "qiblaAngle": 113,
    "prayers": {
      "F": "04:36",
      "D": "12:15",
      "A": "15:43",
      "M": "18:24",
      "I": "19:46"
    }
  },
  {
    "id": "sfax",
    "name": "Sfax",
    "country": "Tunisie",
    "region": "Afrique",
    "timezone": "Africa/Tunis",
    "utcOffset": "UTC+1",
    "latitude": 34.7406,
    "longitude": 10.7603,
    "qiblaAngle": 110,
    "prayers": {
      "F": "04:36",
      "D": "12:12",
      "A": "15:41",
      "M": "18:21",
      "I": "19:41"
    }
  },
  {
    "id": "sousse",
    "name": "Sousse",
    "country": "Tunisie",
    "region": "Afrique",
    "timezone": "Africa/Tunis",
    "utcOffset": "UTC+1",
    "latitude": 35.8256,
    "longitude": 10.6369,
    "qiblaAngle": 112,
    "prayers": {
      "F": "04:35",
      "D": "12:13",
      "A": "15:41",
      "M": "18:22",
      "I": "19:43"
    }
  },
  {
    "id": "tripoli",
    "name": "Tripoli",
    "country": "Libye",
    "region": "Afrique",
    "timezone": "Africa/Tripoli",
    "utcOffset": "UTC+2",
    "latitude": 32.8872,
    "longitude": 13.1913,
    "qiblaAngle": 109,
    "prayers": {
      "F": "05:29",
      "D": "13:03",
      "A": "16:31",
      "M": "19:11",
      "I": "20:29"
    }
  },
  {
    "id": "benghazi",
    "name": "Benghazi",
    "country": "Libye",
    "region": "Afrique",
    "timezone": "Africa/Tripoli",
    "utcOffset": "UTC+2",
    "latitude": 32.1167,
    "longitude": 20.0667,
    "qiblaAngle": 116,
    "prayers": {
      "F": "05:03",
      "D": "12:35",
      "A": "16:03",
      "M": "18:43",
      "I": "20:00"
    }
  },
  {
    "id": "le-caire",
    "name": "Le Caire",
    "country": "Égypte",
    "region": "Afrique",
    "timezone": "Africa/Cairo",
    "utcOffset": "UTC+3",
    "latitude": 30.0444,
    "longitude": 31.2357,
    "qiblaAngle": 136,
    "prayers": {
      "F": "05:13",
      "D": "12:51",
      "A": "16:18",
      "M": "18:58",
      "I": "20:16"
    }
  },
  {
    "id": "alexandrie",
    "name": "Alexandrie",
    "country": "Égypte",
    "region": "Afrique",
    "timezone": "Africa/Cairo",
    "utcOffset": "UTC+3",
    "latitude": 31.2001,
    "longitude": 29.9187,
    "qiblaAngle": 135,
    "prayers": {
      "F": "05:17",
      "D": "12:56",
      "A": "16:24",
      "M": "19:04",
      "I": "20:22"
    }
  },
  {
    "id": "assouan",
    "name": "Assouan",
    "country": "Égypte",
    "region": "Afrique",
    "timezone": "Africa/Cairo",
    "utcOffset": "UTC+3",
    "latitude": 24.0889,
    "longitude": 32.8998,
    "qiblaAngle": 111,
    "prayers": {
      "F": "05:13",
      "D": "12:44",
      "A": "16:09",
      "M": "18:50",
      "I": "20:04"
    }
  },
  {
    "id": "khartoum",
    "name": "Khartoum",
    "country": "Soudan",
    "region": "Afrique",
    "timezone": "Africa/Khartoum",
    "utcOffset": "UTC+2",
    "latitude": 15.5007,
    "longitude": 32.5599,
    "qiblaAngle": 48,
    "prayers": {
      "F": "04:27",
      "D": "11:45",
      "A": "15:04",
      "M": "17:50",
      "I": "18:57"
    }
  },
  {
    "id": "djibouti",
    "name": "Djibouti",
    "country": "Djibouti",
    "region": "Afrique",
    "timezone": "Africa/Djibouti",
    "utcOffset": "UTC+3",
    "latitude": 11.5721,
    "longitude": 43.1456,
    "qiblaAngle": 343,
    "prayers": {
      "F": "04:46",
      "D": "12:03",
      "A": "15:17",
      "M": "18:07",
      "I": "19:13"
    }
  },
  {
    "id": "mogadiscio",
    "name": "Mogadiscio",
    "country": "Somalie",
    "region": "Afrique",
    "timezone": "Africa/Mogadishu",
    "utcOffset": "UTC+3",
    "latitude": 2.0469,
    "longitude": 45.3182,
    "qiblaAngle": 345,
    "prayers": {
      "F": "04:41",
      "D": "11:54",
      "A": "14:54",
      "M": "17:57",
      "I": "19:02"
    }
  },
  {
    "id": "hargeisa",
    "name": "Hargeisa",
    "country": "Somalie",
    "region": "Afrique",
    "timezone": "Africa/Mogadishu",
    "utcOffset": "UTC+3",
    "latitude": 9.56,
    "longitude": 44.065,
    "qiblaAngle": 342,
    "prayers": {
      "F": "04:44",
      "D": "11:59",
      "A": "15:11",
      "M": "18:03",
      "I": "19:09"
    }
  },
  {
    "id": "addis-abeba",
    "name": "Addis-Abeba",
    "country": "Éthiopie",
    "region": "Afrique",
    "timezone": "Africa/Addis_Ababa",
    "utcOffset": "UTC+3",
    "latitude": 9.032,
    "longitude": 38.7482,
    "qiblaAngle": 5,
    "prayers": {
      "F": "05:05",
      "D": "12:21",
      "A": "15:31",
      "M": "18:24",
      "I": "19:30"
    }
  },
  {
    "id": "nairobi",
    "name": "Nairobi",
    "country": "Kenya",
    "region": "Afrique",
    "timezone": "Africa/Nairobi",
    "utcOffset": "UTC+3",
    "latitude": -1.2921,
    "longitude": 36.8219,
    "qiblaAngle": 7,
    "prayers": {
      "F": "05:15",
      "D": "12:28",
      "A": "15:34",
      "M": "18:30",
      "I": "19:35"
    }
  },
  {
    "id": "mombasa",
    "name": "Mombasa",
    "country": "Kenya",
    "region": "Afrique",
    "timezone": "Africa/Nairobi",
    "utcOffset": "UTC+3",
    "latitude": -4.0435,
    "longitude": 39.6682,
    "qiblaAngle": 0,
    "prayers": {
      "F": "05:04",
      "D": "12:17",
      "A": "15:26",
      "M": "18:19",
      "I": "19:23"
    }
  },
  {
    "id": "dar-es-salaam",
    "name": "Dar es Salaam",
    "country": "Tanzanie",
    "region": "Afrique",
    "timezone": "Africa/Dar_es_Salaam",
    "utcOffset": "UTC+3",
    "latitude": -6.7924,
    "longitude": 39.2083,
    "qiblaAngle": 1,
    "prayers": {
      "F": "05:06",
      "D": "12:19",
      "A": "15:32",
      "M": "18:20",
      "I": "19:25"
    }
  },
  {
    "id": "zanzibar",
    "name": "Zanzibar",
    "country": "Tanzanie",
    "region": "Afrique",
    "timezone": "Africa/Dar_es_Salaam",
    "utcOffset": "UTC+3",
    "latitude": -6.1659,
    "longitude": 39.2026,
    "qiblaAngle": 1,
    "prayers": {
      "F": "05:06",
      "D": "12:19",
      "A": "15:31",
      "M": "18:20",
      "I": "19:25"
    }
  },
  {
    "id": "kampala",
    "name": "Kampala",
    "country": "Ouganda",
    "region": "Afrique",
    "timezone": "Africa/Kampala",
    "utcOffset": "UTC+3",
    "latitude": 0.3476,
    "longitude": 32.5825,
    "qiblaAngle": 18,
    "prayers": {
      "F": "05:32",
      "D": "12:45",
      "A": "15:48",
      "M": "18:47",
      "I": "19:52"
    }
  },
  {
    "id": "kigali",
    "name": "Kigali",
    "country": "Rwanda",
    "region": "Afrique",
    "timezone": "Africa/Kigali",
    "utcOffset": "UTC+2",
    "latitude": -1.9706,
    "longitude": 30.1044,
    "qiblaAngle": 22,
    "prayers": {
      "F": "04:42",
      "D": "11:55",
      "A": "15:02",
      "M": "17:57",
      "I": "19:02"
    }
  },
  {
    "id": "moroni",
    "name": "Moroni",
    "country": "Comores",
    "region": "Afrique",
    "timezone": "Indian/Comoro",
    "utcOffset": "UTC+3",
    "latitude": -11.7172,
    "longitude": 43.2473,
    "qiblaAngle": 354,
    "prayers": {
      "F": "04:50",
      "D": "12:03",
      "A": "15:21",
      "M": "18:03",
      "I": "19:09"
    }
  },
  {
    "id": "mamoudzou",
    "name": "Mamoudzou",
    "country": "Mayotte",
    "region": "Afrique",
    "timezone": "Indian/Mayotte",
    "utcOffset": "UTC+3",
    "latitude": -12.7806,
    "longitude": 45.2278,
    "qiblaAngle": 351,
    "prayers": {
      "F": "04:42",
      "D": "11:55",
      "A": "15:13",
      "M": "17:55",
      "I": "19:01"
    }
  },
  {
    "id": "antananarivo",
    "name": "Antananarivo",
    "country": "Madagascar",
    "region": "Afrique",
    "timezone": "Indian/Antananarivo",
    "utcOffset": "UTC+3",
    "latitude": -18.8792,
    "longitude": 47.5079,
    "qiblaAngle": 349,
    "prayers": {
      "F": "04:32",
      "D": "11:46",
      "A": "15:08",
      "M": "17:45",
      "I": "18:53"
    }
  },
  {
    "id": "port-louis",
    "name": "Port-Louis",
    "country": "Maurice",
    "region": "Afrique",
    "timezone": "Indian/Mauritius",
    "utcOffset": "UTC+4",
    "latitude": -20.1609,
    "longitude": 57.5012,
    "qiblaAngle": 336,
    "prayers": {
      "F": "04:51",
      "D": "12:06",
      "A": "15:29",
      "M": "18:05",
      "I": "19:14"
    }
  },
  {
    "id": "saint-denis-re",
    "name": "Saint-Denis",
    "country": "La Réunion",
    "region": "Afrique",
    "timezone": "Indian/Reunion",
    "utcOffset": "UTC+4",
    "latitude": -20.8821,
    "longitude": 55.4507,
    "qiblaAngle": 339,
    "prayers": {
      "F": "04:59",
      "D": "12:14",
      "A": "15:37",
      "M": "18:13",
      "I": "19:22"
    }
  },
  {
    "id": "johannesburg",
    "name": "Johannesburg",
    "country": "Afrique du Sud",
    "region": "Afrique",
    "timezone": "Africa/Johannesburg",
    "utcOffset": "UTC+2",
    "latitude": -26.2041,
    "longitude": 28.0473,
    "qiblaAngle": 15,
    "prayers": {
      "F": "04:47",
      "D": "12:03",
      "A": "15:28",
      "M": "18:02",
      "I": "19:14"
    }
  },
  {
    "id": "le-cap",
    "name": "Le Cap",
    "country": "Afrique du Sud",
    "region": "Afrique",
    "timezone": "Africa/Johannesburg",
    "utcOffset": "UTC+2",
    "latitude": -33.9249,
    "longitude": 18.4241,
    "qiblaAngle": 23,
    "prayers": {
      "F": "05:20",
      "D": "12:42",
      "A": "16:05",
      "M": "18:39",
      "I": "19:57"
    }
  },
  {
    "id": "durban",
    "name": "Durban",
    "country": "Afrique du Sud",
    "region": "Afrique",
    "timezone": "Africa/Johannesburg",
    "utcOffset": "UTC+2",
    "latitude": -29.8587,
    "longitude": 31.0218,
    "qiblaAngle": 10,
    "prayers": {
      "F": "04:33",
      "D": "11:51",
      "A": "15:16",
      "M": "17:49",
      "I": "19:04"
    }
  },
  {
    "id": "luanda",
    "name": "Luanda",
    "country": "Angola",
    "region": "Afrique",
    "timezone": "Africa/Luanda",
    "utcOffset": "UTC+1",
    "latitude": -8.839,
    "longitude": 13.2894,
    "qiblaAngle": 40,
    "prayers": {
      "F": "04:50",
      "D": "12:02",
      "A": "15:18",
      "M": "18:03",
      "I": "19:09"
    }
  },
  {
    "id": "maputo",
    "name": "Maputo",
    "country": "Mozambique",
    "region": "Afrique",
    "timezone": "Africa/Maputo",
    "utcOffset": "UTC+2",
    "latitude": -25.9692,
    "longitude": 32.5732,
    "qiblaAngle": 9,
    "prayers": {
      "F": "04:29",
      "D": "11:45",
      "A": "15:10",
      "M": "17:44",
      "I": "18:56"
    }
  },
  {
    "id": "makkah",
    "name": "Makkah",
    "country": "Arabie Saoudite",
    "region": "Moyen-Orient",
    "timezone": "Asia/Riyadh",
    "utcOffset": "UTC+3",
    "latitude": 21.4225,
    "longitude": 39.8262,
    "qiblaAngle": 325,
    "prayers": {
      "F": "04:52",
      "D": "12:15",
      "A": "15:40",
      "M": "18:22",
      "I": "19:52"
    }
  },
  {
    "id": "medina",
    "name": "Médine",
    "country": "Arabie Saoudite",
    "region": "Moyen-Orient",
    "timezone": "Asia/Riyadh",
    "utcOffset": "UTC+3",
    "latitude": 24.5247,
    "longitude": 39.5692,
    "qiblaAngle": 176,
    "prayers": {
      "F": "04:50",
      "D": "12:16",
      "A": "15:43",
      "M": "18:24",
      "I": "19:54"
    }
  },
  {
    "id": "riyad",
    "name": "Riyad",
    "country": "Arabie Saoudite",
    "region": "Moyen-Orient",
    "timezone": "Asia/Riyadh",
    "utcOffset": "UTC+3",
    "latitude": 24.7136,
    "longitude": 46.6753,
    "qiblaAngle": 244,
    "prayers": {
      "F": "04:22",
      "D": "11:48",
      "A": "15:15",
      "M": "17:55",
      "I": "19:25"
    }
  },
  {
    "id": "djeddah",
    "name": "Djeddah",
    "country": "Arabie Saoudite",
    "region": "Moyen-Orient",
    "timezone": "Asia/Riyadh",
    "utcOffset": "UTC+3",
    "latitude": 21.4858,
    "longitude": 39.1925,
    "qiblaAngle": 96,
    "prayers": {
      "F": "04:54",
      "D": "12:18",
      "A": "15:42",
      "M": "18:25",
      "I": "19:55"
    }
  },
  {
    "id": "dammam",
    "name": "Dammam",
    "country": "Arabie Saoudite",
    "region": "Moyen-Orient",
    "timezone": "Asia/Riyadh",
    "utcOffset": "UTC+3",
    "latitude": 26.4207,
    "longitude": 50.0888,
    "qiblaAngle": 244,
    "prayers": {
      "F": "04:06",
      "D": "11:34",
      "A": "15:02",
      "M": "17:42",
      "I": "19:12"
    }
  },
  {
    "id": "dubai",
    "name": "Dubaï",
    "country": "Émirats Arabes Unis",
    "region": "Moyen-Orient",
    "timezone": "Asia/Dubai",
    "utcOffset": "UTC+4",
    "latitude": 25.2048,
    "longitude": 55.2708,
    "qiblaAngle": 258,
    "prayers": {
      "F": "04:49",
      "D": "12:14",
      "A": "15:40",
      "M": "18:21",
      "I": "19:33"
    }
  },
  {
    "id": "abou-dhabi",
    "name": "Abou Dhabi",
    "country": "Émirats Arabes Unis",
    "region": "Moyen-Orient",
    "timezone": "Asia/Dubai",
    "utcOffset": "UTC+4",
    "latitude": 24.4539,
    "longitude": 54.3773,
    "qiblaAngle": 260,
    "prayers": {
      "F": "04:53",
      "D": "12:18",
      "A": "15:44",
      "M": "18:24",
      "I": "19:36"
    }
  },
  {
    "id": "sharjah",
    "name": "Sharjah",
    "country": "Émirats Arabes Unis",
    "region": "Moyen-Orient",
    "timezone": "Asia/Dubai",
    "utcOffset": "UTC+4",
    "latitude": 25.3463,
    "longitude": 55.4209,
    "qiblaAngle": 258,
    "prayers": {
      "F": "04:48",
      "D": "12:14",
      "A": "15:40",
      "M": "18:20",
      "I": "19:32"
    }
  },
  {
    "id": "doha",
    "name": "Doha",
    "country": "Qatar",
    "region": "Moyen-Orient",
    "timezone": "Asia/Qatar",
    "utcOffset": "UTC+3",
    "latitude": 25.2854,
    "longitude": 51.531,
    "qiblaAngle": 253,
    "prayers": {
      "F": "04:04",
      "D": "11:29",
      "A": "14:55",
      "M": "17:36",
      "I": "18:48"
    }
  },
  {
    "id": "koweit",
    "name": "Koweït",
    "country": "Koweït",
    "region": "Moyen-Orient",
    "timezone": "Asia/Kuwait",
    "utcOffset": "UTC+3",
    "latitude": 29.3759,
    "longitude": 47.9774,
    "qiblaAngle": 225,
    "prayers": {
      "F": "04:14",
      "D": "11:44",
      "A": "15:11",
      "M": "17:51",
      "I": "19:06"
    }
  },
  {
    "id": "manama",
    "name": "Manama",
    "country": "Bahreïn",
    "region": "Moyen-Orient",
    "timezone": "Asia/Bahrain",
    "utcOffset": "UTC+3",
    "latitude": 26.2285,
    "longitude": 50.586,
    "qiblaAngle": 246,
    "prayers": {
      "F": "04:07",
      "D": "11:33",
      "A": "15:00",
      "M": "17:40",
      "I": "18:53"
    }
  },
  {
    "id": "mascate",
    "name": "Mascate",
    "country": "Oman",
    "region": "Moyen-Orient",
    "timezone": "Asia/Muscat",
    "utcOffset": "UTC+4",
    "latitude": 23.588,
    "longitude": 58.3829,
    "qiblaAngle": 266,
    "prayers": {
      "F": "04:38",
      "D": "12:02",
      "A": "15:27",
      "M": "18:08",
      "I": "19:19"
    }
  },
  {
    "id": "salalah",
    "name": "Salalah",
    "country": "Oman",
    "region": "Moyen-Orient",
    "timezone": "Asia/Muscat",
    "utcOffset": "UTC+4",
    "latitude": 17.0151,
    "longitude": 54.0924,
    "qiblaAngle": 290,
    "prayers": {
      "F": "05:00",
      "D": "12:19",
      "A": "15:39",
      "M": "18:24",
      "I": "19:32"
    }
  },
  {
    "id": "sanaa",
    "name": "Sanaa",
    "country": "Yémen",
    "region": "Moyen-Orient",
    "timezone": "Asia/Aden",
    "utcOffset": "UTC+3",
    "latitude": 15.3694,
    "longitude": 44.191,
    "qiblaAngle": 326,
    "prayers": {
      "F": "04:40",
      "D": "11:59",
      "A": "15:17",
      "M": "18:03",
      "I": "19:11"
    }
  },
  {
    "id": "aden",
    "name": "Aden",
    "country": "Yémen",
    "region": "Moyen-Orient",
    "timezone": "Asia/Aden",
    "utcOffset": "UTC+3",
    "latitude": 12.7855,
    "longitude": 45.0187,
    "qiblaAngle": 331,
    "prayers": {
      "F": "04:38",
      "D": "11:55",
      "A": "15:11",
      "M": "18:00",
      "I": "19:06"
    }
  },
  {
    "id": "amman",
    "name": "Amman",
    "country": "Jordanie",
    "region": "Moyen-Orient",
    "timezone": "Asia/Amman",
    "utcOffset": "UTC+3",
    "latitude": 31.9454,
    "longitude": 35.9284,
    "qiblaAngle": 161,
    "prayers": {
      "F": "04:59",
      "D": "12:32",
      "A": "16:00",
      "M": "18:40",
      "I": "19:57"
    }
  },
  {
    "id": "jerusalem",
    "name": "Jérusalem (Al-Qods)",
    "country": "Palestine",
    "region": "Moyen-Orient",
    "timezone": "Asia/Jerusalem",
    "utcOffset": "UTC+3",
    "latitude": 31.7683,
    "longitude": 35.2137,
    "qiblaAngle": 157,
    "prayers": {
      "F": "05:02",
      "D": "12:35",
      "A": "16:03",
      "M": "18:43",
      "I": "19:59"
    }
  },
  {
    "id": "gaza",
    "name": "Gaza",
    "country": "Palestine",
    "region": "Moyen-Orient",
    "timezone": "Asia/Gaza",
    "utcOffset": "UTC+3",
    "latitude": 31.5017,
    "longitude": 34.4668,
    "qiblaAngle": 153,
    "prayers": {
      "F": "05:06",
      "D": "12:38",
      "A": "16:06",
      "M": "18:46",
      "I": "20:02"
    }
  },
  {
    "id": "ramallah",
    "name": "Ramallah",
    "country": "Palestine",
    "region": "Moyen-Orient",
    "timezone": "Asia/Hebron",
    "utcOffset": "UTC+3",
    "latitude": 31.9038,
    "longitude": 35.2034,
    "qiblaAngle": 157,
    "prayers": {
      "F": "05:02",
      "D": "12:35",
      "A": "16:03",
      "M": "18:43",
      "I": "20:00"
    }
  },
  {
    "id": "beyrouth",
    "name": "Beyrouth",
    "country": "Liban",
    "region": "Moyen-Orient",
    "timezone": "Asia/Beirut",
    "utcOffset": "UTC+3",
    "latitude": 33.8938,
    "longitude": 35.5018,
    "qiblaAngle": 162,
    "prayers": {
      "F": "04:58",
      "D": "12:34",
      "A": "16:02",
      "M": "18:42",
      "I": "20:01"
    }
  },
  {
    "id": "damas",
    "name": "Damas",
    "country": "Syrie",
    "region": "Moyen-Orient",
    "timezone": "Asia/Damascus",
    "utcOffset": "UTC+3",
    "latitude": 33.5138,
    "longitude": 36.2765,
    "qiblaAngle": 165,
    "prayers": {
      "F": "04:56",
      "D": "12:30",
      "A": "15:59",
      "M": "18:39",
      "I": "19:57"
    }
  },
  {
    "id": "alep",
    "name": "Alep",
    "country": "Syrie",
    "region": "Moyen-Orient",
    "timezone": "Asia/Damascus",
    "utcOffset": "UTC+3",
    "latitude": 36.2021,
    "longitude": 37.1343,
    "qiblaAngle": 170,
    "prayers": {
      "F": "04:49",
      "D": "12:27",
      "A": "15:56",
      "M": "18:36",
      "I": "19:57"
    }
  },
  {
    "id": "bagdad",
    "name": "Bagdad",
    "country": "Irak",
    "region": "Moyen-Orient",
    "timezone": "Asia/Baghdad",
    "utcOffset": "UTC+3",
    "latitude": 33.3152,
    "longitude": 44.3661,
    "qiblaAngle": 200,
    "prayers": {
      "F": "04:24",
      "D": "11:58",
      "A": "15:26",
      "M": "18:06",
      "I": "19:25"
    }
  },
  {
    "id": "bassorah",
    "name": "Bassorah",
    "country": "Irak",
    "region": "Moyen-Orient",
    "timezone": "Asia/Baghdad",
    "utcOffset": "UTC+3",
    "latitude": 30.5081,
    "longitude": 47.7835,
    "qiblaAngle": 220,
    "prayers": {
      "F": "04:14",
      "D": "11:44",
      "A": "15:12",
      "M": "17:52",
      "I": "19:08"
    }
  },
  {
    "id": "erbil",
    "name": "Erbil",
    "country": "Irak",
    "region": "Moyen-Orient",
    "timezone": "Asia/Baghdad",
    "utcOffset": "UTC+3",
    "latitude": 36.1901,
    "longitude": 43.993,
    "qiblaAngle": 195,
    "prayers": {
      "F": "04:21",
      "D": "12:00",
      "A": "15:28",
      "M": "18:09",
      "I": "19:30"
    }
  },
  {
    "id": "teheran",
    "name": "Téhéran",
    "country": "Iran",
    "region": "Moyen-Orient",
    "timezone": "Asia/Tehran",
    "utcOffset": "UTC+3:30",
    "latitude": 35.6892,
    "longitude": 51.389,
    "qiblaAngle": 218,
    "prayers": {
      "F": "04:22",
      "D": "12:00",
      "A": "15:29",
      "M": "18:09",
      "I": "19:30"
    }
  },
  {
    "id": "mashhad",
    "name": "Mashhad",
    "country": "Iran",
    "region": "Moyen-Orient",
    "timezone": "Asia/Tehran",
    "utcOffset": "UTC+3:30",
    "latitude": 36.2605,
    "longitude": 59.6168,
    "qiblaAngle": 235,
    "prayers": {
      "F": "03:49",
      "D": "11:27",
      "A": "14:56",
      "M": "17:36",
      "I": "18:58"
    }
  },
  {
    "id": "ispahan",
    "name": "Ispahan",
    "country": "Iran",
    "region": "Moyen-Orient",
    "timezone": "Asia/Tehran",
    "utcOffset": "UTC+3:30",
    "latitude": 32.6546,
    "longitude": 51.668,
    "qiblaAngle": 226,
    "prayers": {
      "F": "04:25",
      "D": "11:59",
      "A": "15:27",
      "M": "18:07",
      "I": "19:25"
    }
  },
  {
    "id": "paris",
    "name": "Paris",
    "country": "France",
    "region": "Europe",
    "timezone": "Europe/Paris",
    "utcOffset": "UTC+2",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "qiblaAngle": 119,
    "prayers": {
      "F": "06:20",
      "D": "13:45",
      "A": "17:10",
      "M": "19:59",
      "I": "21:08"
    }
  },
  {
    "id": "marseille",
    "name": "Marseille",
    "country": "France",
    "region": "Europe",
    "timezone": "Europe/Paris",
    "utcOffset": "UTC+2",
    "latitude": 43.2965,
    "longitude": 5.3698,
    "qiblaAngle": 116,
    "prayers": {
      "F": "06:18",
      "D": "13:33",
      "A": "17:01",
      "M": "19:45",
      "I": "20:47"
    }
  },
  {
    "id": "lyon",
    "name": "Lyon",
    "country": "France",
    "region": "Europe",
    "timezone": "Europe/Paris",
    "utcOffset": "UTC+2",
    "latitude": 45.764,
    "longitude": 4.8357,
    "qiblaAngle": 119,
    "prayers": {
      "F": "06:16",
      "D": "13:35",
      "A": "17:02",
      "M": "19:48",
      "I": "20:53"
    }
  },
  {
    "id": "lille",
    "name": "Lille",
    "country": "France",
    "region": "Europe",
    "timezone": "Europe/Paris",
    "utcOffset": "UTC+2",
    "latitude": 50.6292,
    "longitude": 3.0573,
    "qiblaAngle": 122,
    "prayers": {
      "F": "06:14",
      "D": "13:42",
      "A": "17:06",
      "M": "19:57",
      "I": "21:09"
    }
  },
  {
    "id": "toulouse",
    "name": "Toulouse",
    "country": "France",
    "region": "Europe",
    "timezone": "Europe/Paris",
    "utcOffset": "UTC+2",
    "latitude": 43.6047,
    "longitude": 1.4442,
    "qiblaAngle": 112,
    "prayers": {
      "F": "06:33",
      "D": "13:49",
      "A": "17:17",
      "M": "20:01",
      "I": "21:03"
    }
  },
  {
    "id": "nice",
    "name": "Nice",
    "country": "France",
    "region": "Europe",
    "timezone": "Europe/Paris",
    "utcOffset": "UTC+2",
    "latitude": 43.7102,
    "longitude": 7.262,
    "qiblaAngle": 119,
    "prayers": {
      "F": "06:10",
      "D": "13:25",
      "A": "16:53",
      "M": "19:38",
      "I": "20:40"
    }
  },
  {
    "id": "strasbourg",
    "name": "Strasbourg",
    "country": "France",
    "region": "Europe",
    "timezone": "Europe/Paris",
    "utcOffset": "UTC+2",
    "latitude": 48.5734,
    "longitude": 7.7521,
    "qiblaAngle": 125,
    "prayers": {
      "F": "05:59",
      "D": "13:23",
      "A": "16:49",
      "M": "19:38",
      "I": "20:46"
    }
  },
  {
    "id": "bordeaux",
    "name": "Bordeaux",
    "country": "France",
    "region": "Europe",
    "timezone": "Europe/Paris",
    "utcOffset": "UTC+2",
    "latitude": 44.8378,
    "longitude": -0.5792,
    "qiblaAngle": 112,
    "prayers": {
      "F": "06:39",
      "D": "13:57",
      "A": "17:24",
      "M": "20:10",
      "I": "21:13"
    }
  },
  {
    "id": "nantes",
    "name": "Nantes",
    "country": "France",
    "region": "Europe",
    "timezone": "Europe/Paris",
    "utcOffset": "UTC+2",
    "latitude": 47.2184,
    "longitude": -1.5536,
    "qiblaAngle": 113,
    "prayers": {
      "F": "06:39",
      "D": "14:01",
      "A": "17:27",
      "M": "20:14",
      "I": "21:21"
    }
  },
  {
    "id": "bruxelles",
    "name": "Bruxelles",
    "country": "Belgique",
    "region": "Europe",
    "timezone": "Europe/Brussels",
    "utcOffset": "UTC+2",
    "latitude": 50.8503,
    "longitude": 4.3517,
    "qiblaAngle": 123,
    "prayers": {
      "F": "05:27",
      "D": "13:38",
      "A": "17:01",
      "M": "19:52",
      "I": "21:39"
    }
  },
  {
    "id": "anvers",
    "name": "Anvers",
    "country": "Belgique",
    "region": "Europe",
    "timezone": "Europe/Brussels",
    "utcOffset": "UTC+2",
    "latitude": 51.2194,
    "longitude": 4.4025,
    "qiblaAngle": 124,
    "prayers": {
      "F": "05:25",
      "D": "13:38",
      "A": "17:01",
      "M": "19:52",
      "I": "21:40"
    }
  },
  {
    "id": "liege",
    "name": "Liège",
    "country": "Belgique",
    "region": "Europe",
    "timezone": "Europe/Brussels",
    "utcOffset": "UTC+2",
    "latitude": 50.6326,
    "longitude": 5.5797,
    "qiblaAngle": 125,
    "prayers": {
      "F": "05:23",
      "D": "13:33",
      "A": "16:56",
      "M": "19:47",
      "I": "21:33"
    }
  },
  {
    "id": "geneve",
    "name": "Genève",
    "country": "Suisse",
    "region": "Europe",
    "timezone": "Europe/Zurich",
    "utcOffset": "UTC+2",
    "latitude": 46.2044,
    "longitude": 6.1432,
    "qiblaAngle": 121,
    "prayers": {
      "F": "05:33",
      "D": "13:31",
      "A": "16:57",
      "M": "19:43",
      "I": "21:19"
    }
  },
  {
    "id": "zurich",
    "name": "Zurich",
    "country": "Suisse",
    "region": "Europe",
    "timezone": "Europe/Zurich",
    "utcOffset": "UTC+2",
    "latitude": 47.3769,
    "longitude": 8.5417,
    "qiblaAngle": 125,
    "prayers": {
      "F": "05:20",
      "D": "13:21",
      "A": "16:47",
      "M": "19:34",
      "I": "21:12"
    }
  },
  {
    "id": "londres",
    "name": "Londres",
    "country": "Royaume-Uni",
    "region": "Europe",
    "timezone": "Europe/London",
    "utcOffset": "UTC+1",
    "latitude": 51.5074,
    "longitude": -0.1278,
    "qiblaAngle": 119,
    "prayers": {
      "F": "04:43",
      "D": "12:56",
      "A": "16:18",
      "M": "19:11",
      "I": "20:59"
    }
  },
  {
    "id": "birmingham",
    "name": "Birmingham",
    "country": "Royaume-Uni",
    "region": "Europe",
    "timezone": "Europe/London",
    "utcOffset": "UTC+1",
    "latitude": 52.4862,
    "longitude": -1.8904,
    "qiblaAngle": 118,
    "prayers": {
      "F": "04:46",
      "D": "13:03",
      "A": "16:25",
      "M": "19:18",
      "I": "21:09"
    }
  },
  {
    "id": "manchester",
    "name": "Manchester",
    "country": "Royaume-Uni",
    "region": "Europe",
    "timezone": "Europe/London",
    "utcOffset": "UTC+1",
    "latitude": 53.4808,
    "longitude": -2.2426,
    "qiblaAngle": 118,
    "prayers": {
      "F": "04:44",
      "D": "13:04",
      "A": "16:25",
      "M": "19:20",
      "I": "21:14"
    }
  },
  {
    "id": "berlin",
    "name": "Berlin",
    "country": "Allemagne",
    "region": "Europe",
    "timezone": "Europe/Berlin",
    "utcOffset": "UTC+2",
    "latitude": 52.52,
    "longitude": 13.405,
    "qiblaAngle": 137,
    "prayers": {
      "F": "04:45",
      "D": "13:02",
      "A": "16:24",
      "M": "19:17",
      "I": "21:08"
    }
  },
  {
    "id": "francfort",
    "name": "Francfort",
    "country": "Allemagne",
    "region": "Europe",
    "timezone": "Europe/Berlin",
    "utcOffset": "UTC+2",
    "latitude": 50.1109,
    "longitude": 8.6821,
    "qiblaAngle": 128,
    "prayers": {
      "F": "05:12",
      "D": "13:21",
      "A": "16:44",
      "M": "19:35",
      "I": "21:19"
    }
  },
  {
    "id": "munich",
    "name": "Munich",
    "country": "Allemagne",
    "region": "Europe",
    "timezone": "Europe/Berlin",
    "utcOffset": "UTC+2",
    "latitude": 48.1351,
    "longitude": 11.582,
    "qiblaAngle": 130,
    "prayers": {
      "F": "05:06",
      "D": "13:09",
      "A": "16:34",
      "M": "19:22",
      "I": "21:02"
    }
  },
  {
    "id": "cologne",
    "name": "Cologne",
    "country": "Allemagne",
    "region": "Europe",
    "timezone": "Europe/Berlin",
    "utcOffset": "UTC+2",
    "latitude": 50.9375,
    "longitude": 6.9603,
    "qiblaAngle": 127,
    "prayers": {
      "F": "05:16",
      "D": "13:28",
      "A": "16:51",
      "M": "19:42",
      "I": "21:28"
    }
  },
  {
    "id": "madrid",
    "name": "Madrid",
    "country": "Espagne",
    "region": "Europe",
    "timezone": "Europe/Madrid",
    "utcOffset": "UTC+2",
    "latitude": 40.4168,
    "longitude": -3.7038,
    "qiblaAngle": 104,
    "prayers": {
      "F": "06:25",
      "D": "14:10",
      "A": "17:38",
      "M": "20:21",
      "I": "21:47"
    }
  },
  {
    "id": "barcelone",
    "name": "Barcelone",
    "country": "Espagne",
    "region": "Europe",
    "timezone": "Europe/Madrid",
    "utcOffset": "UTC+2",
    "latitude": 41.3851,
    "longitude": 2.1734,
    "qiblaAngle": 111,
    "prayers": {
      "F": "06:00",
      "D": "13:47",
      "A": "17:14",
      "M": "19:57",
      "I": "21:25"
    }
  },
  {
    "id": "grenade",
    "name": "Grenade",
    "country": "Espagne",
    "region": "Europe",
    "timezone": "Europe/Madrid",
    "utcOffset": "UTC+2",
    "latitude": 37.1773,
    "longitude": -3.5986,
    "qiblaAngle": 100,
    "prayers": {
      "F": "06:30",
      "D": "14:10",
      "A": "17:38",
      "M": "20:19",
      "I": "21:41"
    }
  },
  {
    "id": "seville",
    "name": "Séville",
    "country": "Espagne",
    "region": "Europe",
    "timezone": "Europe/Madrid",
    "utcOffset": "UTC+2",
    "latitude": 37.3891,
    "longitude": -5.9845,
    "qiblaAngle": 99,
    "prayers": {
      "F": "06:39",
      "D": "14:19",
      "A": "17:48",
      "M": "20:29",
      "I": "21:51"
    }
  },
  {
    "id": "rome",
    "name": "Rome",
    "country": "Italie",
    "region": "Europe",
    "timezone": "Europe/Rome",
    "utcOffset": "UTC+2",
    "latitude": 41.9028,
    "longitude": 12.4964,
    "qiblaAngle": 123,
    "prayers": {
      "F": "05:17",
      "D": "13:06",
      "A": "16:33",
      "M": "19:16",
      "I": "20:45"
    }
  },
  {
    "id": "milan",
    "name": "Milan",
    "country": "Italie",
    "region": "Europe",
    "timezone": "Europe/Rome",
    "utcOffset": "UTC+2",
    "latitude": 45.4642,
    "longitude": 9.19,
    "qiblaAngle": 124,
    "prayers": {
      "F": "05:23",
      "D": "13:19",
      "A": "16:45",
      "M": "19:31",
      "I": "21:05"
    }
  },
  {
    "id": "amsterdam",
    "name": "Amsterdam",
    "country": "Pays-Bas",
    "region": "Europe",
    "timezone": "Europe/Amsterdam",
    "utcOffset": "UTC+2",
    "latitude": 52.3676,
    "longitude": 4.9041,
    "qiblaAngle": 126,
    "prayers": {
      "F": "05:19",
      "D": "13:36",
      "A": "16:58",
      "M": "19:51",
      "I": "21:41"
    }
  },
  {
    "id": "rotterdam",
    "name": "Rotterdam",
    "country": "Pays-Bas",
    "region": "Europe",
    "timezone": "Europe/Amsterdam",
    "utcOffset": "UTC+2",
    "latitude": 51.9244,
    "longitude": 4.4777,
    "qiblaAngle": 125,
    "prayers": {
      "F": "05:23",
      "D": "13:38",
      "A": "17:00",
      "M": "19:52",
      "I": "21:41"
    }
  },
  {
    "id": "vienne",
    "name": "Vienne",
    "country": "Autriche",
    "region": "Europe",
    "timezone": "Europe/Vienna",
    "utcOffset": "UTC+2",
    "latitude": 48.2082,
    "longitude": 16.3738,
    "qiblaAngle": 137,
    "prayers": {
      "F": "04:47",
      "D": "12:50",
      "A": "16:15",
      "M": "19:03",
      "I": "20:43"
    }
  },
  {
    "id": "stockholm",
    "name": "Stockholm",
    "country": "Suède",
    "region": "Europe",
    "timezone": "Europe/Stockholm",
    "utcOffset": "UTC+2",
    "latitude": 59.3293,
    "longitude": 18.0686,
    "qiblaAngle": 148,
    "prayers": {
      "F": "03:53",
      "D": "12:43",
      "A": "15:58",
      "M": "19:03",
      "I": "21:19"
    }
  },
  {
    "id": "oslo",
    "name": "Oslo",
    "country": "Norvège",
    "region": "Europe",
    "timezone": "Europe/Oslo",
    "utcOffset": "UTC+2",
    "latitude": 59.9139,
    "longitude": 10.7522,
    "qiblaAngle": 139,
    "prayers": {
      "F": "04:18",
      "D": "13:12",
      "A": "16:26",
      "M": "19:32",
      "I": "21:52"
    }
  },
  {
    "id": "copenhague",
    "name": "Copenhague",
    "country": "Danemark",
    "region": "Europe",
    "timezone": "Europe/Copenhagen",
    "utcOffset": "UTC+2",
    "latitude": 55.6761,
    "longitude": 12.5683,
    "qiblaAngle": 138,
    "prayers": {
      "F": "04:35",
      "D": "13:05",
      "A": "16:24",
      "M": "19:22",
      "I": "21:23"
    }
  },
  {
    "id": "helsinki",
    "name": "Helsinki",
    "country": "Finlande",
    "region": "Europe",
    "timezone": "Europe/Helsinki",
    "utcOffset": "UTC+3",
    "latitude": 60.1699,
    "longitude": 24.9384,
    "qiblaAngle": 158,
    "prayers": {
      "F": "04:20",
      "D": "13:16",
      "A": "16:29",
      "M": "19:36",
      "I": "21:57"
    }
  },
  {
    "id": "dublin",
    "name": "Dublin",
    "country": "Irlande",
    "region": "Europe",
    "timezone": "Europe/Dublin",
    "utcOffset": "UTC+1",
    "latitude": 53.3498,
    "longitude": -6.2603,
    "qiblaAngle": 114,
    "prayers": {
      "F": "05:00",
      "D": "13:21",
      "A": "16:41",
      "M": "19:36",
      "I": "21:29"
    }
  },
  {
    "id": "lisbonne",
    "name": "Lisbonne",
    "country": "Portugal",
    "region": "Europe",
    "timezone": "Europe/Lisbon",
    "utcOffset": "UTC+1",
    "latitude": 38.7223,
    "longitude": -9.1393,
    "qiblaAngle": 98,
    "prayers": {
      "F": "05:50",
      "D": "13:32",
      "A": "17:00",
      "M": "19:42",
      "I": "21:06"
    }
  },
  {
    "id": "athenes",
    "name": "Athènes",
    "country": "Grèce",
    "region": "Europe",
    "timezone": "Europe/Athens",
    "utcOffset": "UTC+3",
    "latitude": 37.9838,
    "longitude": 23.7275,
    "qiblaAngle": 135,
    "prayers": {
      "F": "05:39",
      "D": "13:21",
      "A": "16:49",
      "M": "19:30",
      "I": "20:54"
    }
  },
  {
    "id": "sarajevo",
    "name": "Sarajevo",
    "country": "Bosnie-Herzégovine",
    "region": "Europe",
    "timezone": "Europe/Sarajevo",
    "utcOffset": "UTC+2",
    "latitude": 43.8563,
    "longitude": 18.4131,
    "qiblaAngle": 135,
    "prayers": {
      "F": "04:50",
      "D": "12:42",
      "A": "16:09",
      "M": "18:53",
      "I": "20:25"
    }
  },
  {
    "id": "pristina",
    "name": "Pristina",
    "country": "Kosovo",
    "region": "Europe",
    "timezone": "Europe/Belgrade",
    "utcOffset": "UTC+2",
    "latitude": 42.6629,
    "longitude": 21.1655,
    "qiblaAngle": 138,
    "prayers": {
      "F": "04:41",
      "D": "12:31",
      "A": "15:58",
      "M": "18:42",
      "I": "20:12"
    }
  },
  {
    "id": "tirana",
    "name": "Tirana",
    "country": "Albanie",
    "region": "Europe",
    "timezone": "Europe/Tirane",
    "utcOffset": "UTC+2",
    "latitude": 41.3275,
    "longitude": 19.8187,
    "qiblaAngle": 134,
    "prayers": {
      "F": "04:49",
      "D": "12:36",
      "A": "16:04",
      "M": "18:47",
      "I": "20:15"
    }
  },
  {
    "id": "skopje",
    "name": "Skopje",
    "country": "Macédoine du Nord",
    "region": "Europe",
    "timezone": "Europe/Skopje",
    "utcOffset": "UTC+2",
    "latitude": 41.9981,
    "longitude": 21.4254,
    "qiblaAngle": 137,
    "prayers": {
      "F": "04:41",
      "D": "12:30",
      "A": "15:57",
      "M": "18:41",
      "I": "20:09"
    }
  },
  {
    "id": "varsovie",
    "name": "Varsovie",
    "country": "Pologne",
    "region": "Europe",
    "timezone": "Europe/Warsaw",
    "utcOffset": "UTC+2",
    "latitude": 52.2297,
    "longitude": 21.0122,
    "qiblaAngle": 148,
    "prayers": {
      "F": "04:15",
      "D": "12:31",
      "A": "15:54",
      "M": "18:46",
      "I": "20:36"
    }
  },
  {
    "id": "prague",
    "name": "Prague",
    "country": "République Tchèque",
    "region": "Europe",
    "timezone": "Europe/Prague",
    "utcOffset": "UTC+2",
    "latitude": 50.0755,
    "longitude": 14.4378,
    "qiblaAngle": 136,
    "prayers": {
      "F": "04:49",
      "D": "12:58",
      "A": "16:21",
      "M": "19:12",
      "I": "20:56"
    }
  },
  {
    "id": "budapest",
    "name": "Budapest",
    "country": "Hongrie",
    "region": "Europe",
    "timezone": "Europe/Budapest",
    "utcOffset": "UTC+2",
    "latitude": 47.4979,
    "longitude": 19.0402,
    "qiblaAngle": 140,
    "prayers": {
      "F": "04:38",
      "D": "12:39",
      "A": "16:05",
      "M": "18:52",
      "I": "20:31"
    }
  },
  {
    "id": "bucarest",
    "name": "Bucarest",
    "country": "Roumanie",
    "region": "Europe",
    "timezone": "Europe/Bucharest",
    "utcOffset": "UTC+3",
    "latitude": 44.4268,
    "longitude": 26.1025,
    "qiblaAngle": 149,
    "prayers": {
      "F": "05:17",
      "D": "13:11",
      "A": "16:38",
      "M": "19:23",
      "I": "20:56"
    }
  },
  {
    "id": "moscou",
    "name": "Moscou",
    "country": "Russie",
    "region": "Europe",
    "timezone": "Europe/Moscow",
    "utcOffset": "UTC+3",
    "latitude": 55.7558,
    "longitude": 37.6173,
    "qiblaAngle": 176,
    "prayers": {
      "F": "03:54",
      "D": "12:25",
      "A": "15:44",
      "M": "18:42",
      "I": "20:43"
    }
  },
  {
    "id": "kazan",
    "name": "Kazan",
    "country": "Russie",
    "region": "Europe",
    "timezone": "Europe/Moscow",
    "utcOffset": "UTC+3",
    "latitude": 55.7887,
    "longitude": 49.1221,
    "qiblaAngle": 195,
    "prayers": {
      "F": "03:08",
      "D": "11:39",
      "A": "14:58",
      "M": "17:56",
      "I": "19:58"
    }
  },
  {
    "id": "grozny",
    "name": "Grozny",
    "country": "Russie",
    "region": "Europe",
    "timezone": "Europe/Moscow",
    "utcOffset": "UTC+3",
    "latitude": 43.3169,
    "longitude": 45.6985,
    "qiblaAngle": 194,
    "prayers": {
      "F": "04:01",
      "D": "11:53",
      "A": "15:20",
      "M": "18:04",
      "I": "19:35"
    }
  },
  {
    "id": "kiev",
    "name": "Kiev",
    "country": "Ukraine",
    "region": "Europe",
    "timezone": "Europe/Kyiv",
    "utcOffset": "UTC+3",
    "latitude": 50.4501,
    "longitude": 30.5234,
    "qiblaAngle": 162,
    "prayers": {
      "F": "04:43",
      "D": "12:53",
      "A": "16:17",
      "M": "19:08",
      "I": "20:53"
    }
  },
  {
    "id": "istanbul",
    "name": "Istanbul",
    "country": "Turquie",
    "region": "Asie",
    "timezone": "Europe/Istanbul",
    "utcOffset": "UTC+3",
    "latitude": 41.0082,
    "longitude": 28.9784,
    "qiblaAngle": 152,
    "prayers": {
      "F": "05:13",
      "D": "13:00",
      "A": "16:28",
      "M": "19:10",
      "I": "20:37"
    }
  },
  {
    "id": "ankara",
    "name": "Ankara",
    "country": "Turquie",
    "region": "Asie",
    "timezone": "Europe/Istanbul",
    "utcOffset": "UTC+3",
    "latitude": 39.9334,
    "longitude": 32.8597,
    "qiblaAngle": 160,
    "prayers": {
      "F": "05:00",
      "D": "12:44",
      "A": "16:12",
      "M": "18:54",
      "I": "20:20"
    }
  },
  {
    "id": "konya",
    "name": "Konya",
    "country": "Turquie",
    "region": "Asie",
    "timezone": "Europe/Istanbul",
    "utcOffset": "UTC+3",
    "latitude": 37.8746,
    "longitude": 32.4932,
    "qiblaAngle": 157,
    "prayers": {
      "F": "05:05",
      "D": "12:46",
      "A": "16:14",
      "M": "18:55",
      "I": "20:18"
    }
  },
  {
    "id": "bursa",
    "name": "Bursa",
    "country": "Turquie",
    "region": "Asie",
    "timezone": "Europe/Istanbul",
    "utcOffset": "UTC+3",
    "latitude": 40.1885,
    "longitude": 29.061,
    "qiblaAngle": 151,
    "prayers": {
      "F": "05:14",
      "D": "12:59",
      "A": "16:27",
      "M": "19:10",
      "I": "20:36"
    }
  },
  {
    "id": "izmir",
    "name": "Izmir",
    "country": "Turquie",
    "region": "Asie",
    "timezone": "Europe/Istanbul",
    "utcOffset": "UTC+3",
    "latitude": 38.4237,
    "longitude": 27.1428,
    "qiblaAngle": 144,
    "prayers": {
      "F": "05:25",
      "D": "13:07",
      "A": "16:35",
      "M": "19:17",
      "I": "20:41"
    }
  },
  {
    "id": "bakou",
    "name": "Bakou",
    "country": "Azerbaïdjan",
    "region": "Asie",
    "timezone": "Asia/Baku",
    "utcOffset": "UTC+4",
    "latitude": 40.4093,
    "longitude": 49.8671,
    "qiblaAngle": 207,
    "prayers": {
      "F": "04:51",
      "D": "12:36",
      "A": "16:04",
      "M": "18:46",
      "I": "20:13"
    }
  },
  {
    "id": "tbilissi",
    "name": "Tbilissi",
    "country": "Géorgie",
    "region": "Asie",
    "timezone": "Asia/Tbilisi",
    "utcOffset": "UTC+4",
    "latitude": 41.7151,
    "longitude": 44.8271,
    "qiblaAngle": 193,
    "prayers": {
      "F": "05:08",
      "D": "12:56",
      "A": "16:24",
      "M": "19:07",
      "I": "20:35"
    }
  },
  {
    "id": "tachkent",
    "name": "Tachkent",
    "country": "Ouzbékistan",
    "region": "Asie",
    "timezone": "Asia/Tashkent",
    "utcOffset": "UTC+5",
    "latitude": 41.2995,
    "longitude": 69.2401,
    "qiblaAngle": 240,
    "prayers": {
      "F": "04:31",
      "D": "12:19",
      "A": "15:47",
      "M": "18:29",
      "I": "19:57"
    }
  },
  {
    "id": "samarcande",
    "name": "Samarcande",
    "country": "Ouzbékistan",
    "region": "Asie",
    "timezone": "Asia/Samarkand",
    "utcOffset": "UTC+5",
    "latitude": 39.6542,
    "longitude": 66.9597,
    "qiblaAngle": 240,
    "prayers": {
      "F": "04:44",
      "D": "12:28",
      "A": "15:56",
      "M": "18:38",
      "I": "20:03"
    }
  },
  {
    "id": "boukhara",
    "name": "Boukhara",
    "country": "Ouzbékistan",
    "region": "Asie",
    "timezone": "Asia/Samarkand",
    "utcOffset": "UTC+5",
    "latitude": 39.7747,
    "longitude": 64.4286,
    "qiblaAngle": 236,
    "prayers": {
      "F": "04:53",
      "D": "12:38",
      "A": "16:06",
      "M": "18:48",
      "I": "20:14"
    }
  },
  {
    "id": "almaty",
    "name": "Almaty",
    "country": "Kazakhstan",
    "region": "Asie",
    "timezone": "Asia/Almaty",
    "utcOffset": "UTC+5",
    "latitude": 43.222,
    "longitude": 76.8512,
    "qiblaAngle": 247,
    "prayers": {
      "F": "03:57",
      "D": "11:48",
      "A": "15:16",
      "M": "18:00",
      "I": "19:30"
    }
  },
  {
    "id": "astana",
    "name": "Astana",
    "country": "Kazakhstan",
    "region": "Asie",
    "timezone": "Asia/Almaty",
    "utcOffset": "UTC+5",
    "latitude": 51.1694,
    "longitude": 71.4491,
    "qiblaAngle": 231,
    "prayers": {
      "F": "03:57",
      "D": "12:10",
      "A": "15:33",
      "M": "18:25",
      "I": "20:12"
    }
  },
  {
    "id": "bichkek",
    "name": "Bichkek",
    "country": "Kirghizistan",
    "region": "Asie",
    "timezone": "Asia/Bishkek",
    "utcOffset": "UTC+6",
    "latitude": 42.8746,
    "longitude": 74.5698,
    "qiblaAngle": 245,
    "prayers": {
      "F": "05:07",
      "D": "12:57",
      "A": "16:25",
      "M": "19:09",
      "I": "20:39"
    }
  },
  {
    "id": "douchanbe",
    "name": "Douchanbé",
    "country": "Tadjikistan",
    "region": "Asie",
    "timezone": "Asia/Dushanbe",
    "utcOffset": "UTC+5",
    "latitude": 38.5598,
    "longitude": 68.787,
    "qiblaAngle": 244,
    "prayers": {
      "F": "04:38",
      "D": "12:20",
      "A": "15:49",
      "M": "18:30",
      "I": "19:54"
    }
  },
  {
    "id": "achgabat",
    "name": "Achgabat",
    "country": "Turkménistan",
    "region": "Asie",
    "timezone": "Asia/Ashgabat",
    "utcOffset": "UTC+5",
    "latitude": 37.9601,
    "longitude": 58.3261,
    "qiblaAngle": 229,
    "prayers": {
      "F": "05:21",
      "D": "13:02",
      "A": "16:31",
      "M": "19:12",
      "I": "20:35"
    }
  },
  {
    "id": "islamabad",
    "name": "Islamabad",
    "country": "Pakistan",
    "region": "Asie",
    "timezone": "Asia/Karachi",
    "utcOffset": "UTC+5",
    "latitude": 33.6844,
    "longitude": 73.0479,
    "qiblaAngle": 256,
    "prayers": {
      "F": "04:28",
      "D": "12:03",
      "A": "15:32",
      "M": "18:12",
      "I": "19:31"
    }
  },
  {
    "id": "karachi",
    "name": "Karachi",
    "country": "Pakistan",
    "region": "Asie",
    "timezone": "Asia/Karachi",
    "utcOffset": "UTC+5",
    "latitude": 24.8607,
    "longitude": 67.0011,
    "qiblaAngle": 268,
    "prayers": {
      "F": "05:02",
      "D": "12:28",
      "A": "15:53",
      "M": "18:34",
      "I": "19:46"
    }
  },
  {
    "id": "lahore",
    "name": "Lahore",
    "country": "Pakistan",
    "region": "Asie",
    "timezone": "Asia/Karachi",
    "utcOffset": "UTC+5",
    "latitude": 31.5204,
    "longitude": 74.3587,
    "qiblaAngle": 260,
    "prayers": {
      "F": "04:26",
      "D": "11:58",
      "A": "15:26",
      "M": "18:06",
      "I": "19:23"
    }
  },
  {
    "id": "peshawar",
    "name": "Peshawar",
    "country": "Pakistan",
    "region": "Asie",
    "timezone": "Asia/Karachi",
    "utcOffset": "UTC+5",
    "latitude": 34.0151,
    "longitude": 71.5249,
    "qiblaAngle": 254,
    "prayers": {
      "F": "04:34",
      "D": "12:09",
      "A": "15:38",
      "M": "18:18",
      "I": "19:37"
    }
  },
  {
    "id": "kaboul",
    "name": "Kaboul",
    "country": "Afghanistan",
    "region": "Asie",
    "timezone": "Asia/Kabul",
    "utcOffset": "UTC+4:30",
    "latitude": 34.5553,
    "longitude": 69.2075,
    "qiblaAngle": 251,
    "prayers": {
      "F": "04:13",
      "D": "11:49",
      "A": "15:17",
      "M": "17:58",
      "I": "19:17"
    }
  },
  {
    "id": "new-delhi",
    "name": "New Delhi",
    "country": "Inde",
    "region": "Asie",
    "timezone": "Asia/Kolkata",
    "utcOffset": "UTC+5:30",
    "latitude": 28.6139,
    "longitude": 77.209,
    "qiblaAngle": 267,
    "prayers": {
      "F": "04:48",
      "D": "12:17",
      "A": "15:44",
      "M": "18:24",
      "I": "19:38"
    }
  },
  {
    "id": "mumbai",
    "name": "Mumbai",
    "country": "Inde",
    "region": "Asie",
    "timezone": "Asia/Kolkata",
    "utcOffset": "UTC+5:30",
    "latitude": 19.076,
    "longitude": 72.8777,
    "qiblaAngle": 280,
    "prayers": {
      "F": "05:13",
      "D": "12:34",
      "A": "15:56",
      "M": "18:39",
      "I": "19:48"
    }
  },
  {
    "id": "bangalore",
    "name": "Bangalore",
    "country": "Inde",
    "region": "Asie",
    "timezone": "Asia/Kolkata",
    "utcOffset": "UTC+5:30",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "qiblaAngle": 288,
    "prayers": {
      "F": "04:58",
      "D": "12:15",
      "A": "15:31",
      "M": "18:19",
      "I": "19:26"
    }
  },
  {
    "id": "hyderabad-in",
    "name": "Hyderabad",
    "country": "Inde",
    "region": "Asie",
    "timezone": "Asia/Kolkata",
    "utcOffset": "UTC+5:30",
    "latitude": 17.385,
    "longitude": 78.4867,
    "qiblaAngle": 283,
    "prayers": {
      "F": "04:52",
      "D": "12:12",
      "A": "15:32",
      "M": "18:17",
      "I": "19:25"
    }
  },
  {
    "id": "kolkata",
    "name": "Kolkata",
    "country": "Inde",
    "region": "Asie",
    "timezone": "Asia/Kolkata",
    "utcOffset": "UTC+5:30",
    "latitude": 22.5726,
    "longitude": 88.3639,
    "qiblaAngle": 278,
    "prayers": {
      "F": "04:09",
      "D": "11:32",
      "A": "14:57",
      "M": "17:38",
      "I": "18:49"
    }
  },
  {
    "id": "dhaka",
    "name": "Dhaka",
    "country": "Bangladesh",
    "region": "Asie",
    "timezone": "Asia/Dhaka",
    "utcOffset": "UTC+6",
    "latitude": 23.8103,
    "longitude": 90.4125,
    "qiblaAngle": 278,
    "prayers": {
      "F": "04:30",
      "D": "11:54",
      "A": "15:19",
      "M": "18:00",
      "I": "19:11"
    }
  },
  {
    "id": "chittagong",
    "name": "Chittagong",
    "country": "Bangladesh",
    "region": "Asie",
    "timezone": "Asia/Dhaka",
    "utcOffset": "UTC+6",
    "latitude": 22.3569,
    "longitude": 91.7832,
    "qiblaAngle": 279,
    "prayers": {
      "F": "04:25",
      "D": "11:48",
      "A": "15:13",
      "M": "17:54",
      "I": "19:05"
    }
  },
  {
    "id": "colombo",
    "name": "Colombo",
    "country": "Sri Lanka",
    "region": "Asie",
    "timezone": "Asia/Colombo",
    "utcOffset": "UTC+5:30",
    "latitude": 6.9271,
    "longitude": 79.8612,
    "qiblaAngle": 295,
    "prayers": {
      "F": "04:51",
      "D": "12:06",
      "A": "15:14",
      "M": "18:09",
      "I": "19:15"
    }
  },
  {
    "id": "male",
    "name": "Malé",
    "country": "Maldives",
    "region": "Asie",
    "timezone": "Indian/Maldives",
    "utcOffset": "UTC+5",
    "latitude": 4.1755,
    "longitude": 73.5093,
    "qiblaAngle": 301,
    "prayers": {
      "F": "04:48",
      "D": "12:02",
      "A": "15:04",
      "M": "18:04",
      "I": "19:09"
    }
  },
  {
    "id": "jakarta",
    "name": "Jakarta",
    "country": "Indonésie",
    "region": "Asie",
    "timezone": "Asia/Jakarta",
    "utcOffset": "UTC+7",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "qiblaAngle": 295,
    "prayers": {
      "F": "04:36",
      "D": "11:48",
      "A": "15:01",
      "M": "17:50",
      "I": "18:55"
    }
  },
  {
    "id": "surabaya",
    "name": "Surabaya",
    "country": "Indonésie",
    "region": "Asie",
    "timezone": "Asia/Jakarta",
    "utcOffset": "UTC+7",
    "latitude": -7.2575,
    "longitude": 112.7521,
    "qiblaAngle": 294,
    "prayers": {
      "F": "04:12",
      "D": "11:25",
      "A": "14:38",
      "M": "17:26",
      "I": "18:31"
    }
  },
  {
    "id": "bandung",
    "name": "Bandung",
    "country": "Indonésie",
    "region": "Asie",
    "timezone": "Asia/Jakarta",
    "utcOffset": "UTC+7",
    "latitude": -6.9175,
    "longitude": 107.6191,
    "qiblaAngle": 295,
    "prayers": {
      "F": "04:33",
      "D": "11:45",
      "A": "14:58",
      "M": "17:46",
      "I": "18:51"
    }
  },
  {
    "id": "medan",
    "name": "Medan",
    "country": "Indonésie",
    "region": "Asie",
    "timezone": "Asia/Jakarta",
    "utcOffset": "UTC+7",
    "latitude": 3.5952,
    "longitude": 98.6722,
    "qiblaAngle": 293,
    "prayers": {
      "F": "05:07",
      "D": "12:21",
      "A": "15:22",
      "M": "18:24",
      "I": "19:29"
    }
  },
  {
    "id": "kuala-lumpur",
    "name": "Kuala Lumpur",
    "country": "Malaisie",
    "region": "Asie",
    "timezone": "Asia/Kuala_Lumpur",
    "utcOffset": "UTC+8",
    "latitude": 3.139,
    "longitude": 101.6869,
    "qiblaAngle": 293,
    "prayers": {
      "F": "05:55",
      "D": "13:09",
      "A": "16:10",
      "M": "19:12",
      "I": "20:16"
    }
  },
  {
    "id": "singapour",
    "name": "Singapour",
    "country": "Singapour",
    "region": "Asie",
    "timezone": "Asia/Singapore",
    "utcOffset": "UTC+8",
    "latitude": 1.3521,
    "longitude": 103.8198,
    "qiblaAngle": 293,
    "prayers": {
      "F": "05:47",
      "D": "13:00",
      "A": "16:01",
      "M": "19:03",
      "I": "20:07"
    }
  },
  {
    "id": "bandar-seri-begawan",
    "name": "Bandar Seri Begawan",
    "country": "Brunei",
    "region": "Asie",
    "timezone": "Asia/Brunei",
    "utcOffset": "UTC+8",
    "latitude": 4.9031,
    "longitude": 114.9398,
    "qiblaAngle": 291,
    "prayers": {
      "F": "05:02",
      "D": "12:16",
      "A": "15:20",
      "M": "18:19",
      "I": "19:24"
    }
  },
  {
    "id": "bangkok",
    "name": "Bangkok",
    "country": "Thaïlande",
    "region": "Asie",
    "timezone": "Asia/Bangkok",
    "utcOffset": "UTC+7",
    "latitude": 13.7563,
    "longitude": 100.5018,
    "qiblaAngle": 287,
    "prayers": {
      "F": "04:56",
      "D": "12:14",
      "A": "15:30",
      "M": "18:18",
      "I": "19:25"
    }
  },
  {
    "id": "manille",
    "name": "Manille",
    "country": "Philippines",
    "region": "Asie",
    "timezone": "Asia/Manila",
    "utcOffset": "UTC+8",
    "latitude": 14.5995,
    "longitude": 120.9842,
    "qiblaAngle": 289,
    "prayers": {
      "F": "04:34",
      "D": "11:52",
      "A": "15:09",
      "M": "17:56",
      "I": "19:03"
    }
  },
  {
    "id": "pekin",
    "name": "Pékin",
    "country": "Chine",
    "region": "Asie",
    "timezone": "Asia/Shanghai",
    "utcOffset": "UTC+8",
    "latitude": 39.9042,
    "longitude": 116.4074,
    "qiblaAngle": 279,
    "prayers": {
      "F": "04:25",
      "D": "12:10",
      "A": "15:39",
      "M": "18:20",
      "I": "19:46"
    }
  },
  {
    "id": "shanghai",
    "name": "Shanghai",
    "country": "Chine",
    "region": "Asie",
    "timezone": "Asia/Shanghai",
    "utcOffset": "UTC+8",
    "latitude": 31.2304,
    "longitude": 121.4737,
    "qiblaAngle": 285,
    "prayers": {
      "F": "04:18",
      "D": "11:50",
      "A": "15:18",
      "M": "17:58",
      "I": "19:14"
    }
  },
  {
    "id": "guangzhou",
    "name": "Guangzhou",
    "country": "Chine",
    "region": "Asie",
    "timezone": "Asia/Shanghai",
    "utcOffset": "UTC+8",
    "latitude": 23.1291,
    "longitude": 113.2644,
    "qiblaAngle": 285,
    "prayers": {
      "F": "04:59",
      "D": "12:23",
      "A": "15:48",
      "M": "18:29",
      "I": "19:39"
    }
  },
  {
    "id": "urumqi",
    "name": "Ürümqi",
    "country": "Chine",
    "region": "Asie",
    "timezone": "Asia/Urumqi",
    "utcOffset": "UTC+6",
    "latitude": 43.8256,
    "longitude": 87.6168,
    "qiblaAngle": 256,
    "prayers": {
      "F": "04:13",
      "D": "12:05",
      "A": "15:33",
      "M": "18:17",
      "I": "19:49"
    }
  },
  {
    "id": "tokyo",
    "name": "Tokyo",
    "country": "Japon",
    "region": "Asie",
    "timezone": "Asia/Tokyo",
    "utcOffset": "UTC+9",
    "latitude": 35.6762,
    "longitude": 139.6503,
    "qiblaAngle": 293,
    "prayers": {
      "F": "03:59",
      "D": "11:37",
      "A": "15:06",
      "M": "17:46",
      "I": "19:07"
    }
  },
  {
    "id": "seoul",
    "name": "Séoul",
    "country": "Corée du Sud",
    "region": "Asie",
    "timezone": "Asia/Seoul",
    "utcOffset": "UTC+9",
    "latitude": 37.5665,
    "longitude": 126.978,
    "qiblaAngle": 286,
    "prayers": {
      "F": "04:47",
      "D": "12:28",
      "A": "15:57",
      "M": "18:38",
      "I": "20:00"
    }
  },
  {
    "id": "hanoi",
    "name": "Hanoï",
    "country": "Vietnam",
    "region": "Asie",
    "timezone": "Asia/Ho_Chi_Minh",
    "utcOffset": "UTC+7",
    "latitude": 21.0285,
    "longitude": 105.8542,
    "qiblaAngle": 284,
    "prayers": {
      "F": "04:30",
      "D": "11:52",
      "A": "15:16",
      "M": "17:58",
      "I": "19:08"
    }
  },
  {
    "id": "montreal",
    "name": "Montréal",
    "country": "Canada",
    "region": "Amériques",
    "timezone": "America/Toronto",
    "utcOffset": "UTC-4",
    "latitude": 45.5017,
    "longitude": -73.5673,
    "qiblaAngle": 59,
    "prayers": {
      "F": "05:12",
      "D": "12:50",
      "A": "16:15",
      "M": "19:01",
      "I": "20:24"
    }
  },
  {
    "id": "toronto",
    "name": "Toronto",
    "country": "Canada",
    "region": "Amériques",
    "timezone": "America/Toronto",
    "utcOffset": "UTC-4",
    "latitude": 43.6532,
    "longitude": -79.3832,
    "qiblaAngle": 55,
    "prayers": {
      "F": "05:39",
      "D": "13:13",
      "A": "16:39",
      "M": "19:24",
      "I": "20:44"
    }
  },
  {
    "id": "vancouver",
    "name": "Vancouver",
    "country": "Canada",
    "region": "Amériques",
    "timezone": "America/Vancouver",
    "utcOffset": "UTC-7",
    "latitude": 49.2827,
    "longitude": -123.1207,
    "qiblaAngle": 17,
    "prayers": {
      "F": "05:23",
      "D": "13:08",
      "A": "16:31",
      "M": "19:21",
      "I": "20:50"
    }
  },
  {
    "id": "ottawa",
    "name": "Ottawa",
    "country": "Canada",
    "region": "Amériques",
    "timezone": "America/Toronto",
    "utcOffset": "UTC-4",
    "latitude": 45.4215,
    "longitude": -75.6972,
    "qiblaAngle": 57,
    "prayers": {
      "F": "05:21",
      "D": "12:58",
      "A": "16:24",
      "M": "19:10",
      "I": "20:32"
    }
  },
  {
    "id": "quebec",
    "name": "Québec",
    "country": "Canada",
    "region": "Amériques",
    "timezone": "America/Toronto",
    "utcOffset": "UTC-4",
    "latitude": 46.8139,
    "longitude": -71.208,
    "qiblaAngle": 60,
    "prayers": {
      "F": "05:00",
      "D": "12:40",
      "A": "16:05",
      "M": "18:52",
      "I": "20:17"
    }
  },
  {
    "id": "new-york",
    "name": "New York",
    "country": "États-Unis",
    "region": "Amériques",
    "timezone": "America/New_York",
    "utcOffset": "UTC-4",
    "latitude": 40.7128,
    "longitude": -74.006,
    "qiblaAngle": 58,
    "prayers": {
      "F": "05:23",
      "D": "12:51",
      "A": "16:19",
      "M": "19:02",
      "I": "20:17"
    }
  },
  {
    "id": "los-angeles",
    "name": "Los Angeles",
    "country": "États-Unis",
    "region": "Amériques",
    "timezone": "America/Los_Angeles",
    "utcOffset": "UTC-7",
    "latitude": 34.0522,
    "longitude": -118.2437,
    "qiblaAngle": 24,
    "prayers": {
      "F": "05:29",
      "D": "12:48",
      "A": "16:16",
      "M": "18:56",
      "I": "20:05"
    }
  },
  {
    "id": "chicago",
    "name": "Chicago",
    "country": "États-Unis",
    "region": "Amériques",
    "timezone": "America/Chicago",
    "utcOffset": "UTC-5",
    "latitude": 41.8781,
    "longitude": -87.6298,
    "qiblaAngle": 49,
    "prayers": {
      "F": "05:15",
      "D": "12:46",
      "A": "16:13",
      "M": "18:56",
      "I": "20:14"
    }
  },
  {
    "id": "houston",
    "name": "Houston",
    "country": "États-Unis",
    "region": "Amériques",
    "timezone": "America/Chicago",
    "utcOffset": "UTC-5",
    "latitude": 29.7604,
    "longitude": -95.3698,
    "qiblaAngle": 45,
    "prayers": {
      "F": "06:01",
      "D": "13:17",
      "A": "16:44",
      "M": "19:24",
      "I": "20:30"
    }
  },
  {
    "id": "miami",
    "name": "Miami",
    "country": "États-Unis",
    "region": "Amériques",
    "timezone": "America/New_York",
    "utcOffset": "UTC-4",
    "latitude": 25.7617,
    "longitude": -80.1918,
    "qiblaAngle": 57,
    "prayers": {
      "F": "06:04",
      "D": "13:16",
      "A": "16:42",
      "M": "19:23",
      "I": "20:26"
    }
  },
  {
    "id": "san-francisco",
    "name": "San Francisco",
    "country": "États-Unis",
    "region": "Amériques",
    "timezone": "America/Los_Angeles",
    "utcOffset": "UTC-7",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "qiblaAngle": 19,
    "prayers": {
      "F": "05:41",
      "D": "13:05",
      "A": "16:33",
      "M": "19:14",
      "I": "20:27"
    }
  },
  {
    "id": "washington",
    "name": "Washington D.C.",
    "country": "États-Unis",
    "region": "Amériques",
    "timezone": "America/New_York",
    "utcOffset": "UTC-4",
    "latitude": 38.9072,
    "longitude": -77.0369,
    "qiblaAngle": 57,
    "prayers": {
      "F": "05:37",
      "D": "13:04",
      "A": "16:31",
      "M": "19:13",
      "I": "20:27"
    }
  },
  {
    "id": "detroit",
    "name": "Détroit",
    "country": "États-Unis",
    "region": "Amériques",
    "timezone": "America/Detroit",
    "utcOffset": "UTC-4",
    "latitude": 42.3314,
    "longitude": -83.0458,
    "qiblaAngle": 52,
    "prayers": {
      "F": "05:56",
      "D": "13:28",
      "A": "16:55",
      "M": "19:38",
      "I": "20:56"
    }
  },
  {
    "id": "dallas",
    "name": "Dallas",
    "country": "États-Unis",
    "region": "Amériques",
    "timezone": "America/Chicago",
    "utcOffset": "UTC-5",
    "latitude": 32.7767,
    "longitude": -96.797,
    "qiblaAngle": 44,
    "prayers": {
      "F": "06:04",
      "D": "13:23",
      "A": "16:50",
      "M": "19:30",
      "I": "20:38"
    }
  },
  {
    "id": "mexico",
    "name": "Mexico",
    "country": "Mexique",
    "region": "Amériques",
    "timezone": "America/Mexico_City",
    "utcOffset": "UTC-6",
    "latitude": 19.4326,
    "longitude": -99.1332,
    "qiblaAngle": 47,
    "prayers": {
      "F": "05:11",
      "D": "12:32",
      "A": "15:54",
      "M": "18:37",
      "I": "19:46"
    }
  },
  {
    "id": "la-havane",
    "name": "La Havane",
    "country": "Cuba",
    "region": "Amériques",
    "timezone": "America/Havana",
    "utcOffset": "UTC-4",
    "latitude": 23.1136,
    "longitude": -82.3666,
    "qiblaAngle": 56,
    "prayers": {
      "F": "06:01",
      "D": "13:25",
      "A": "16:49",
      "M": "19:31",
      "I": "20:41"
    }
  },
  {
    "id": "panama",
    "name": "Panama",
    "country": "Panama",
    "region": "Amériques",
    "timezone": "America/Panama",
    "utcOffset": "UTC-5",
    "latitude": 8.9824,
    "longitude": -79.5199,
    "qiblaAngle": 62,
    "prayers": {
      "F": "04:58",
      "D": "12:13",
      "A": "15:24",
      "M": "18:17",
      "I": "19:23"
    }
  },
  {
    "id": "bogota",
    "name": "Bogota",
    "country": "Colombie",
    "region": "Amériques",
    "timezone": "America/Bogota",
    "utcOffset": "UTC-5",
    "latitude": 4.711,
    "longitude": -74.0721,
    "qiblaAngle": 65,
    "prayers": {
      "F": "04:38",
      "D": "11:52",
      "A": "14:55",
      "M": "17:55",
      "I": "19:00"
    }
  },
  {
    "id": "caracas",
    "name": "Caracas",
    "country": "Venezuela",
    "region": "Amériques",
    "timezone": "America/Caracas",
    "utcOffset": "UTC-4",
    "latitude": 10.4806,
    "longitude": -66.9036,
    "qiblaAngle": 65,
    "prayers": {
      "F": "05:07",
      "D": "12:23",
      "A": "15:36",
      "M": "18:27",
      "I": "19:33"
    }
  },
  {
    "id": "lima",
    "name": "Lima",
    "country": "Pérou",
    "region": "Amériques",
    "timezone": "America/Lima",
    "utcOffset": "UTC-5",
    "latitude": -12.0464,
    "longitude": -77.0428,
    "qiblaAngle": 72,
    "prayers": {
      "F": "04:51",
      "D": "12:04",
      "A": "15:22",
      "M": "18:04",
      "I": "19:10"
    }
  },
  {
    "id": "sao-paulo",
    "name": "São Paulo",
    "country": "Brésil",
    "region": "Amériques",
    "timezone": "America/Sao_Paulo",
    "utcOffset": "UTC-3",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "qiblaAngle": 69,
    "prayers": {
      "F": "04:46",
      "D": "12:02",
      "A": "15:26",
      "M": "18:01",
      "I": "19:12"
    }
  },
  {
    "id": "rio-de-janeiro",
    "name": "Rio de Janeiro",
    "country": "Brésil",
    "region": "Amériques",
    "timezone": "America/Sao_Paulo",
    "utcOffset": "UTC-3",
    "latitude": -22.9068,
    "longitude": -43.1729,
    "qiblaAngle": 68,
    "prayers": {
      "F": "04:33",
      "D": "11:48",
      "A": "15:12",
      "M": "17:47",
      "I": "18:58"
    }
  },
  {
    "id": "buenos-aires",
    "name": "Buenos Aires",
    "country": "Argentine",
    "region": "Amériques",
    "timezone": "America/Argentina/Buenos_Aires",
    "utcOffset": "UTC-3",
    "latitude": -34.6037,
    "longitude": -58.3816,
    "qiblaAngle": 76,
    "prayers": {
      "F": "05:26",
      "D": "12:49",
      "A": "16:13",
      "M": "18:46",
      "I": "20:05"
    }
  },
  {
    "id": "santiago",
    "name": "Santiago",
    "country": "Chili",
    "region": "Amériques",
    "timezone": "America/Santiago",
    "utcOffset": "UTC-3",
    "latitude": -33.4489,
    "longitude": -70.6693,
    "qiblaAngle": 82,
    "prayers": {
      "F": "06:16",
      "D": "13:38",
      "A": "17:02",
      "M": "19:36",
      "I": "20:54"
    }
  },
  {
    "id": "cayenne",
    "name": "Cayenne",
    "country": "Guyane française",
    "region": "Amériques",
    "timezone": "America/Cayenne",
    "utcOffset": "UTC-3",
    "latitude": 4.9372,
    "longitude": -52.326,
    "qiblaAngle": 68,
    "prayers": {
      "F": "05:11",
      "D": "12:25",
      "A": "15:29",
      "M": "18:28",
      "I": "19:33"
    }
  },
  {
    "id": "sydney",
    "name": "Sydney",
    "country": "Australie",
    "region": "Océanie",
    "timezone": "Australia/Sydney",
    "utcOffset": "UTC+10",
    "latitude": -33.8688,
    "longitude": 151.2093,
    "qiblaAngle": 277,
    "prayers": {
      "F": "04:29",
      "D": "11:51",
      "A": "15:14",
      "M": "17:48",
      "I": "19:06"
    }
  },
  {
    "id": "melbourne",
    "name": "Melbourne",
    "country": "Australie",
    "region": "Océanie",
    "timezone": "Australia/Melbourne",
    "utcOffset": "UTC+10",
    "latitude": -37.8136,
    "longitude": 144.9631,
    "qiblaAngle": 279,
    "prayers": {
      "F": "04:51",
      "D": "12:16",
      "A": "15:37",
      "M": "18:12",
      "I": "19:34"
    }
  },
  {
    "id": "brisbane",
    "name": "Brisbane",
    "country": "Australie",
    "region": "Océanie",
    "timezone": "Australia/Brisbane",
    "utcOffset": "UTC+10",
    "latitude": -27.4698,
    "longitude": 153.0251,
    "qiblaAngle": 280,
    "prayers": {
      "F": "04:26",
      "D": "11:44",
      "A": "15:08",
      "M": "17:42",
      "I": "18:55"
    }
  },
  {
    "id": "perth",
    "name": "Perth",
    "country": "Australie",
    "region": "Océanie",
    "timezone": "Australia/Perth",
    "utcOffset": "UTC+8",
    "latitude": -31.9505,
    "longitude": 115.8605,
    "qiblaAngle": 295,
    "prayers": {
      "F": "04:52",
      "D": "12:12",
      "A": "15:36",
      "M": "18:10",
      "I": "19:26"
    }
  },
  {
    "id": "auckland",
    "name": "Auckland",
    "country": "Nouvelle-Zélande",
    "region": "Océanie",
    "timezone": "Pacific/Auckland",
    "utcOffset": "UTC+12",
    "latitude": -36.8485,
    "longitude": 174.7633,
    "qiblaAngle": 261,
    "prayers": {
      "F": "04:53",
      "D": "12:17",
      "A": "15:38",
      "M": "18:13",
      "I": "19:34"
    }
  },
  {
    "id": "wellington",
    "name": "Wellington",
    "country": "Nouvelle-Zélande",
    "region": "Océanie",
    "timezone": "Pacific/Auckland",
    "utcOffset": "UTC+12",
    "latitude": -41.2865,
    "longitude": 174.7762,
    "qiblaAngle": 256,
    "prayers": {
      "F": "04:48",
      "D": "12:17",
      "A": "15:36",
      "M": "18:12",
      "I": "19:39"
    }
  },
  {
    "id": "suva",
    "name": "Suva",
    "country": "Fidji",
    "region": "Océanie",
    "timezone": "Pacific/Fiji",
    "utcOffset": "UTC+12",
    "latitude": -18.1416,
    "longitude": 178.4419,
    "qiblaAngle": 282,
    "prayers": {
      "F": "04:48",
      "D": "12:02",
      "A": "15:24",
      "M": "18:01",
      "I": "19:09"
    }
  },
  {
    "id": "noumea",
    "name": "Nouméa",
    "country": "Nouvelle-Calédonie",
    "region": "Océanie",
    "timezone": "Pacific/Noumea",
    "utcOffset": "UTC+11",
    "latitude": -22.2711,
    "longitude": 166.4416,
    "qiblaAngle": 280,
    "prayers": {
      "F": "04:35",
      "D": "11:50",
      "A": "15:13",
      "M": "17:49",
      "I": "18:59"
    }
  },
  {
    "id": "papeete",
    "name": "Papeete",
    "country": "Polynésie française",
    "region": "Océanie",
    "timezone": "Pacific/Tahiti",
    "utcOffset": "UTC-10",
    "latitude": -17.5516,
    "longitude": -149.5584,
    "qiblaAngle": 295,
    "prayers": {
      "F": "04:40",
      "D": "11:54",
      "A": "15:16",
      "M": "17:54",
      "I": "19:01"
    }
  }
];

/**
 * Dynamically computes accurate Islamic prayer times for any city based on date and method
 */
export function computeDynamicCityPrayers(
  city: CityData,
  date: Date = new Date(),
  methodId: string = 'muslim'
): Record<'F' | 'D' | 'A' | 'M' | 'I', string> {
  if (!city.latitude || !city.longitude) {
    return city.prayers;
  }

  try {
    const coords = new Coordinates(city.latitude, city.longitude);
    let params = CalculationMethod.MuslimWorldLeague();

    if (methodId === 'umm_al_qura' || city.country === 'Arabie Saoudite') {
      params = CalculationMethod.UmmAlQura();
    } else if (methodId === 'egypt' || city.country === 'Égypte') {
      params = CalculationMethod.Egyptian();
    } else if (methodId === 'isna' || city.country === 'États-Unis' || city.country === 'Canada') {
      params = CalculationMethod.NorthAmerica();
    } else if (methodId === 'uoif' || city.country === 'France') {
      params = CalculationMethod.Other();
      params.fajrAngle = 12;
      params.ishaAngle = 12;
    }

    const pt = new PrayerTimes(coords, date, params);
    const formatTime = (d: Date) => {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: city.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(d);
    };

    return {
      F: formatTime(pt.fajr),
      D: formatTime(pt.dhuhr),
      A: formatTime(pt.asr),
      M: formatTime(pt.maghrib),
      I: formatTime(pt.isha),
    };
  } catch (err) {
    return city.prayers;
  }
}

/**
 * Searches and filters cities across all countries and continents
 */
export function filterWorldCities(
  query: string,
  regionFilter: WorldRegion = 'Tous'
): CityData[] {
  const cleanQuery = query.trim().toLowerCase();
  return WORLD_CITIES.filter((city) => {
    const matchesRegion =
      regionFilter === 'Tous' || city.region === regionFilter;
    if (!matchesRegion) return false;
    if (!cleanQuery) return true;

    return (
      city.name.toLowerCase().includes(cleanQuery) ||
      city.country.toLowerCase().includes(cleanQuery) ||
      (city.utcOffset && city.utcOffset.toLowerCase().includes(cleanQuery)) ||
      (city.timezone && city.timezone.toLowerCase().includes(cleanQuery))
    );
  });
}
