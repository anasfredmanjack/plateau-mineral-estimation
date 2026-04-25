# ARUM ALPHA - AI Mineral Estimation System

AI-powered mineral estimation and distribution modeling for tin (cassiterite) mineralization in Bukuru, Jos Plateau, Nigeria.

## Overview

ARUM ALPHA is a machine learning-based predictive system that uses radiometric data (K, Th, U) to estimate ore grade and mineral distribution in the Jos Plateau Younger Granite province.

### Key Features

- 🤖 **AI-Powered Estimation**: Uses Groq API with Llama 3.3 70B for intelligent mineral potential analysis
- 🗺️ **Interactive Mapping**: Leaflet-based maps with heatmap visualization of mineral distribution
- 📊 **Radiometric Analysis**: Processes Potassium, Thorium, and Uranium grid data
- 📈 **Model Metrics**: Real-time RMSE, MAE, R², and MAPE tracking
- 💾 **Data Export**: Export estimation results as JSON
- 🌍 **Multi-layer Maps**: Satellite, terrain, and street view options

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Maps | Leaflet + React-Leaflet |
| AI API | Groq API (Llama 3.3 70B) |
| Charts | Recharts |
| Icons | Lucide React |

## Quick Start

### Prerequisites

- Node.js 18+ 
- Groq API key (free tier available)

### Installation

1. **Clone and navigate to the project:**
```bash
cd arum-alpha
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
copy env.example .env.local
```

Edit `.env.local` and add your Groq API key:
```
GROQ_API_KEY=your_groq_api_key_here
```

Get a free API key at: https://console.groq.com/

4. **Add radiometric data (optional):**

Copy your GRD files to the `data/` folder:
- `Sheet168_Naraguta_Potassium.grd`
- `Sheet168_Naraguta_Th.grd`
- `Sheet168_Naraguta_U.grd`

If no data files are present, the system will generate synthetic data for demonstration.

5. **Run development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

### Getting Estimations

1. **Click on the map** to select a location, or
2. **Enter coordinates** manually in the left panel
3. Click **"Estimate Mineral Potential"**
4. View AI-generated analysis and recommendations

### Understanding Results

- **Predicted Grade**: Estimated tin (SnO₂) percentage
- **Confidence**: Model confidence score (0-100%)
- **Risk Level**: Low/Medium/High exploration risk
- **Radiometric Data**: K%, Th ppm, U ppm values
- **AI Analysis**: Geological interpretation
- **Recommendations**: Actionable next steps

## Study Area

**Location**: Bukuru, Jos Plateau, Nigeria (Sheet 168 Naraguta)
**Coordinates**: 8.50°E - 9.00°E, 9.50°N - 10.00°N
**Projection**: UTM Zone 32N (WGS84)

## Groq API Model

The system uses **Llama 3.3 70B Versatile** for mineral estimation:

- **Free Tier Limits**: 1,000 requests/min, 20 requests/sec
- **Context Window**: 128K tokens
- **Strengths**: Excellent for geospatial reasoning and complex analysis

Alternative models available on Groq:
- `llama-3.1-8b-instant` - Faster, lower cost
- `gemma2-9b-it` - Google's efficient model
- `mixtral-8x7b-32768` - Good for reasoning tasks

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Connect to Vercel: https://vercel.com/new
3. Add environment variable `GROQ_API_KEY`
4. Deploy!

### Build for Production

```bash
npm run build
```

Static files will be generated in the `dist/` folder.

## Project Structure

```
arum-alpha/
├── app/
│   ├── api/
│   │   ├── estimate/route.ts    # AI estimation API
│   │   └── data/route.ts        # Radiometric data API
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main dashboard
├── components/
│   ├── Dashboard.tsx            # Main UI
│   ├── MapView.tsx              # Interactive map
│   └── PredictionPanel.tsx      # Results display
├── lib/
│   ├── grdParser.ts            # GRD file parser
│   └── groq.ts                 # Groq API integration
├── types/
│   └── index.ts                # TypeScript types
├── data/                        # Radiometric GRD files
├── env.example                  # Environment template
└── README.md                    # This file
```

## API Endpoints

### POST /api/estimate

Get mineral estimation for a location.

**Request:**
```json
{
  "lat": 9.75,
  "lng": 8.75,
  "includeSurrounding": true,
  "radius": 2
}
```

**Response:**
```json
{
  "prediction": {
    "lat": 9.75,
    "lng": 8.75,
    "predictedGrade": 0.32,
    "confidence": 0.78,
    "riskLevel": "low",
    ...
  },
  "analysis": "Thorium value of 24.5 ppm exceeds typical background...",
  "recommendations": ["Priority target: conduct detailed sampling", ...]
}
```

### GET /api/data

Get all radiometric data points.

## Methodology

The estimation combines:

1. **Radiometric Signatures**: Thorium anomalies indicate hydrothermal activity
2. **Geochemical Ratios**: K/(Th+U) and Th/U ratios for alteration zones
3. **Geological Context**: Jos Plateau Younger Granite province knowledge
4. **Machine Learning**: Groq AI for pattern recognition and reasoning

## Future Enhancements

- [ ] Integration with Google Earth Engine
- [ ] Historical mining data overlay
- [ ] Drill hole optimization suggestions
- [ ] 3D visualization of subsurface geology
- [ ] Batch processing for large areas

## License

This project is for educational and research purposes.

## Acknowledgments

- Geosoft Oasis Montaj for GRD format
- Groq for AI API access
- OpenStreetMap contributors for base maps
- Nigeria Geological Survey Agency for radiometric data

## Contact

For questions or support regarding this project, please refer to the project documentation or contact the development team.
