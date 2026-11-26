from typing import Optional
from fastapi import APIRouter, Query
from ..models.schemas import AirQualityResponse
from ..services.aqi_service import get_air_quality

router = APIRouter(prefix="/air-quality", tags=["Air Quality"])


@router.get("", response_model=AirQualityResponse)
async def fetch_air_quality(
    city: str = Query("Ludhiana", min_length=1, max_length=100, description="Target city name"),
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Optional custom latitude"),
    lon: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Optional custom longitude"),
) -> AirQualityResponse:
    """
    Returns real-time air quality telemetry from Open-Meteo with calculated
    Indian National AQI (CPCB Standard), US EPA AQI, pollutants breakdown,
    24-hour diurnal trend, 7-day forecast, and nearby monitoring stations.
    """
    return await get_air_quality(city=city, lat=lat, lon=lon)
